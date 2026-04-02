import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db, auth } from '@/integrations/firebase/client';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, getDoc, setDoc, orderBy } from 'firebase/firestore';

export interface UserProfile {
    id: string; // Document ID (usually User ID)
    user_id: string;
    role: string;
    is_approved: boolean;
    is_on_shift?: boolean;
    last_clock_in?: string;
    display_name?: string;
    points?: number;
    created_at?: string;
}

export function useProfiles() {
    return useQuery({
        queryKey: ['profiles'],
        queryFn: async () => {
            const querySnapshot = await getDocs(collection(db, 'profiles'));
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        }
    });
}

export function useDrivers() {
    return useQuery({
        queryKey: ['drivers'],
        queryFn: async () => {
            const q = query(collection(db, 'user_roles'), where('role', '==', 'driver'));
            const rolesSnap = await getDocs(q);
            const profilesSnap = await getDocs(collection(db, 'profiles'));

            const roles = rolesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
            const profiles = profilesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

            return roles.map((r: any) => {
                const profile = profiles.find((p: any) => p.user_id === r.user_id);
                return {
                    ...r,
                    display_name: profile?.display_name || 'Unknown Driver',
                    is_on_shift: profile?.is_on_shift || false,
                    last_clock_in: profile?.last_clock_in,
                    created_at: profile?.created_at,
                };
            }) as UserProfile[];
        },
    });
}

export function useToggleDriverApprove() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ userRoleId, isApproved }: { userRoleId: string; isApproved: boolean }) => {
            const roleRef = doc(db, 'user_roles', userRoleId);
            await updateDoc(roleRef, { is_approved: isApproved });
            return true;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['drivers'] }),
    });
}

export function useDeleteDriver() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ roleId, userId }: { roleId: string; userId: string }) => {
            await deleteDoc(doc(db, 'user_roles', userId));
            await deleteDoc(doc(db, 'profiles', userId));
            await deleteDoc(doc(db, 'users', userId));
            return true;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['drivers'] })
    });
}

export function useAdmins() {
    return useQuery({
        queryKey: ['admins'],
        queryFn: async () => {
            const q = query(collection(db, 'user_roles'), where('role', '==', 'admin'));
            const rolesSnap = await getDocs(q);
            const profilesSnap = await getDocs(collection(db, 'profiles'));

            const roles = rolesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
            const profiles = profilesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

            return roles.map((a: any) => {
                const profile = profiles.find((p: any) => p.user_id === a.user_id);
                let display_name = profile?.display_name || 'Unknown Admin';
                if (display_name === 'Driver (Legacy)' && a.role === 'admin') {
                    display_name = 'Admin (Legacy)';
                }
                return {
                    ...a,
                    display_name,
                    created_at: profile?.created_at,
                };
            }) as UserProfile[];
        },
    });
}

export function useToggleAdminApprove() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ userRoleId, isApproved }: { userRoleId: string; isApproved: boolean }) => {
            const roleRef = doc(db, 'user_roles', userRoleId);
            await updateDoc(roleRef, { is_approved: isApproved });
            return true;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admins'] }),
    });
}

export function useDeleteAdmin() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ roleId, userId }: { roleId: string; userId: string }) => {
            await deleteDoc(doc(db, 'user_roles', userId));
            await deleteDoc(doc(db, 'profiles', userId));
            await deleteDoc(doc(db, 'users', userId));
            return true;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admins'] })
    });
}

export function useDriverShift() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ userId, isOnShift }: { userId: string, isOnShift: boolean }) => {
            const updates: any = { is_on_shift: isOnShift };
            if (isOnShift) {
                updates.last_clock_in = new Date().toISOString();
            }
            await updateDoc(doc(db, 'user_roles', userId), updates);
            await updateDoc(doc(db, 'profiles', userId), updates);
            return isOnShift;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['drivers'] });
            queryClient.invalidateQueries({ queryKey: ['profile'] });
        },
    });
}

export function useLeaderboard() {
    return useQuery({
        queryKey: ['leaderboard'],
        queryFn: async () => {
            const profilesSnap = await getDocs(collection(db, 'profiles'));
            const rolesSnap = await getDocs(collection(db, 'user_roles'));

            const profiles = profilesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
            const roles = rolesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

            const sorted = profiles.sort((a, b) => (b.points || 0) - (a.points || 0));

            return sorted.map((p: any) => {
                const userRole = roles.find((r: any) => r.user_id === p.user_id)?.role || 'citizen';
                return { ...p, points: p.points || 0, role: userRole };
            });
        }
    });
}

export function useAwardPoints() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ userId, pointsToAdd }: { userId: string, pointsToAdd: number }) => {
            const profileRef = doc(db, 'profiles', userId);
            const docSnap = await getDoc(profileRef);
            if (docSnap.exists()) {
                const currentPoints = docSnap.data().points || 0;
                await updateDoc(profileRef, { points: currentPoints + pointsToAdd });
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
            queryClient.invalidateQueries({ queryKey: ['profile'] });
        },
    })
}

export function useMyProfile(userId?: string) {
    return useQuery({
        queryKey: ['profile', userId],
        queryFn: async () => {
            if (!userId) return null;

            const profileRef = doc(db, 'profiles', userId);
            const docSnap = await getDoc(profileRef);

            let data;

            if (docSnap.exists()) {
                data = docSnap.data();
            } else {
                // Prevent race condition where auto-heal runs before signup finishes writing the profile
                const currentUser = auth.currentUser;
                if (currentUser && currentUser.uid === userId) {
                    const creationTime = new Date(currentUser.metadata.creationTime || '').getTime();
                    const isNewAccount = (Date.now() - creationTime) < 120000; // 2 minutes
                    if (isNewAccount) {
                        return {
                            user_id: userId,
                            display_name: 'Setting up...',
                            points: 0,
                            is_on_shift: false
                        };
                    }
                }

                // Auto-heal legacy accounts that don't have a profile
                const roleRef = doc(db, 'user_roles', userId);
                const roleSnap = await getDoc(roleRef);
                const role = roleSnap.exists() ? roleSnap.data().role : 'citizen';

                const defaultName = role === 'admin' ? 'Admin (Legacy)' : role === 'driver' ? 'Driver (Legacy)' : 'User (Legacy)';

                const newProfile = {
                    user_id: userId,
                    display_name: defaultName,
                    points: 0,
                    is_on_shift: false
                };

                await setDoc(profileRef, newProfile);
                data = newProfile;
            }

            return data ? { ...data, points: data.points || 0, is_on_shift: data.is_on_shift || false } : null;
        },
        enabled: !!userId
    })
}
