import { useAuth } from '@/lib/auth';
import { Navigate } from 'react-router-dom';
import CitizenDashboard from './CitizenDashboard';
import DriverDashboard from './DriverDashboard';
import AdminDashboard from './AdminDashboard';

export default function Dashboard() {
  const { user, role, isApproved, loading } = useAuth();

  if (loading || role === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  if (role === ('deleted' as any)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
        <h1 className="text-2xl font-bold mb-2 text-red-600">Account Removed</h1>
        <p className="text-muted-foreground max-w-sm">
          Your account has been removed by an administrator. You no longer have access to the system.
        </p>
        
        <div className="flex flex-col gap-3 mt-6 items-center w-full max-w-sm">
          <button 
            onClick={() => window.location.href = '/auth'} 
            className="w-full px-4 py-2 border border-border text-foreground hover:bg-muted rounded-lg"
          >
            Return to Login
          </button>
          
          <div className="mt-6 w-full pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground mb-3">
              Want to use this email for a new account?
            </p>
            <button 
              onClick={async () => {
                if (window.confirm("This will permanently delete your leftover credentials, freeing up this email so you can sign up again. Continue?")) {
                  try {
                    if (user) {
                      const { deleteUser } = await import('firebase/auth');
                      await deleteUser(user);
                      window.location.href = '/auth?mode=signup';
                    }
                  } catch (err: any) {
                    if (err.code === 'auth/requires-recent-login') {
                      alert("For security reasons, please log in again first, then immediately click this button.");
                      window.location.href = '/auth';
                    } else {
                      alert(err.message);
                    }
                  }
                }
              }}
              className="w-full px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400 rounded-lg text-sm border border-red-200 dark:border-red-900"
            >
              Delete Leftover Credentials
            </button>
          </div>
        </div>
      </div>
    );
  }

  switch (role) {
    case 'driver':
      if (!isApproved) {
        return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
            <h1 className="text-2xl font-bold mb-2">Pending Local Admin Approval</h1>
            <p className="text-muted-foreground max-w-sm">
              Your driver account has been created but needs an admin to grant permissions before you can see pickups.
            </p>
            <button onClick={() => window.location.reload()} className="mt-6 px-4 py-2 bg-primary text-primary-foreground rounded-lg">
              Refresh Status
            </button>
          </div>
        );
      }
      return <Navigate to="/dashboard/driver" replace />;
    case 'admin':
      if (!isApproved) {
        return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
            <h1 className="text-2xl font-bold mb-2">Pending Head Admin Approval</h1>
            <p className="text-muted-foreground max-w-sm">
              Your admin account has been created but needs the Head Admin to grant permissions before you can access the system.
            </p>
            <button onClick={() => window.location.reload()} className="mt-6 px-4 py-2 bg-primary text-primary-foreground rounded-lg">
              Refresh Status
            </button>
          </div>
        );
      }
      return <Navigate to="/dashboard/admin" replace />;
    default:
      return <Navigate to="/dashboard/citizen" replace />;
  }
}
