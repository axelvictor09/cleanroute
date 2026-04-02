import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '@/integrations/firebase/client';

export type AppRole = 'citizen' | 'driver' | 'admin';

interface AuthContextType {
  user: FirebaseUser | null;
  role: AppRole | null;
  isApproved: boolean;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string, role: AppRole) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [isApproved, setIsApproved] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        // Fetch role
        const userRoleRef = doc(db, 'user_roles', firebaseUser.uid);

        let hasInitialized = false;

        // Listen to changes in approval status and role in real-time
        const roleUnsub = onSnapshot(userRoleRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setRole(data.role as AppRole);
            setIsApproved(data.is_approved !== false);
          } else {
            const creationTime = new Date(firebaseUser.metadata.creationTime || '').getTime();
            const isNewAccount = (Date.now() - creationTime) < 120000; // 2 minutes

            if (!isNewAccount) {
              setRole('deleted' as any);
            } else {
              // Default to citizen during the split second of signup before the doc is created
              setRole('citizen');
            }
            setIsApproved(true);
          }

          if (!hasInitialized) {
            hasInitialized = true;
            setLoading(false);
          }
        });

        // Store unsubscribe function to clean up when auth state changes
        return () => roleUnsub();
      } else {
        setRole(null);
        setIsApproved(true);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => setTimeout(() => reject(new Error("Database connection timed out. Please ensure you have enabled 'Firestore Database' in your Firebase console.")), ms))
    ]);
  };

  const signUp = async (email: string, password: string, displayName: string, selectedRole: AppRole) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;

      // Determine auto-approval
      let approved = selectedRole === 'citizen';
      if (selectedRole === 'admin') {
        // Check if it's the first admin
        const q = query(collection(db, 'user_roles'), where('role', '==', 'admin'));
        const querySnapshot = await withTimeout(getDocs(q), 10000);
        if (querySnapshot.empty) {
          approved = true;
        }
      }

      // Create user role document
      await withTimeout(setDoc(doc(db, 'user_roles', newUser.uid), {
        user_id: newUser.uid,
        role: selectedRole,
        is_approved: approved
      }), 10000);

      // Create profile document
      await withTimeout(setDoc(doc(db, 'profiles', newUser.uid), {
        user_id: newUser.uid,
        display_name: displayName,
        points: 0,
        is_on_shift: false,
        created_at: new Date().toISOString()
      }), 10000);

      // Also create a record in 'users' collection mapped by UID to keep the old structure somewhat intact
      await withTimeout(setDoc(doc(db, 'users', newUser.uid), {
        id: newUser.uid,
        email: email
      }), 10000);

      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, role, isApproved, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
