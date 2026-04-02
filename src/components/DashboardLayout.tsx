import { ReactNode } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { useMyProfile } from '@/hooks/useUsers';
import { Button } from '@/components/ui/button';
import { Leaf, LogOut, MapPin, LayoutDashboard, User, Trophy } from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
}

export default function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const { signOut, role, user } = useAuth();
  const { data: myProfile } = useMyProfile(user?.uid);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { path: '/dashboard/leaderboard', label: 'Leaderboard', icon: <Trophy className="w-4 h-4" /> },
    { path: '/dashboard/profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Top nav */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-b border-border/50">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg eco-gradient flex items-center justify-center">
                <Leaf className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-sm hidden sm:block">CleanRoute</span>
            </Link>
            <div className="h-5 w-px bg-border" />
            <nav className="flex items-center gap-1">
              {navItems.map((item) => (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant={location.pathname === item.path ? 'secondary' : 'ghost'}
                    size="sm"
                    className="text-xs gap-1.5"
                  >
                    {item.icon}
                    <span className="hidden sm:inline">{item.label}</span>
                  </Button>
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {myProfile?.display_name && (
              <span className="text-sm font-medium text-foreground hidden sm:inline-block truncate max-w-[150px]">
                {myProfile.display_name}
              </span>
            )}
            <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium capitalize">
              {role}
            </span>
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-xs gap-1.5">
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="pt-14">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-display font-bold text-foreground mb-6">{title}</h1>
          {children}
        </div>
      </main>
    </div>
  );
}
