import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/integrations/firebase/client';
import { useAuth } from '@/lib/auth';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, getDoc, setDoc, orderBy, addDoc } from 'firebase/firestore';

export interface Report {
  id: string;
  user_id: string;
  description: string;
  photo_url: string | null;
  after_photo_url: string | null;
  latitude: number;
  longitude: number;
  severity: 'low' | 'high';
  status: 'pending' | 'claimed' | 'in_progress' | 'collected' | 'resolved';
  ward: string | null;
  volunteer_id: string | null;
  driver_id: string | null;
  driver_name?: string | null;
  collected_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useReports(filters?: { status?: Report['status']; severity?: Report['severity'] }) {
  return useQuery({
    queryKey: ['reports', filters],
    queryFn: async () => {
      const reportsQuery = query(collection(db, 'reports'), orderBy('created_at', 'desc'));
      
      // Because Firestore needs composite indexes for multiple where + orderBy, 
      // we'll fetch all ordered by created_at and filter locally for simplicity in this project.
      const querySnapshot = await getDocs(reportsQuery);
      let data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report));
      
      if (filters?.status) {
        data = data.filter(r => r.status === filters.status);
      }
      if (filters?.severity) {
        data = data.filter(r => r.severity === filters.severity);
      }

      return data;
    },
  });
}

export function useCreateReport() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (report: { description: string; latitude: number; longitude: number; severity: Report['severity']; photo_url?: string }) => {
      const docRef = await addDoc(collection(db, 'reports'), {
        description: report.description,
        latitude: report.latitude,
        longitude: report.longitude,
        severity: report.severity,
        photo_url: report.photo_url || null,
        user_id: user!.uid,
        status: 'pending',
        created_at: new Date().toISOString()
      });
      return { id: docRef.id };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reports'] }),
  });
}

export function useUpdateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Report> }) => {
      const docRef = doc(db, 'reports', id);
      await updateDoc(docRef, { ...updates, updated_at: new Date().toISOString() });
      return { id };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reports'] }),
  });
}

export function useDeleteReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await deleteDoc(doc(db, 'reports', id));
      return true;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reports'] })
  });
}

export function useClearReports() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const reportsRef = collection(db, 'reports');
      const querySnapshot = await getDocs(reportsRef);
      // Delete in batches or loops
      for (const docSnapshot of querySnapshot.docs) {
          await deleteDoc(doc(db, 'reports', docSnapshot.id));
      }
      return true;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reports'] })
  });
}
