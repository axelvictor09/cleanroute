import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Leaf, Truck, Shield, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type AppRole = 'citizen' | 'driver' | 'admin';

const roles: { value: AppRole; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: 'citizen', label: 'Citizen', icon: <User className="w-5 h-5" />, desc: 'Report waste & volunteer' },
  { value: 'driver', label: 'Driver', icon: <Truck className="w-5 h-5" />, desc: 'Collect & manage routes' },
  { value: 'admin', label: 'Admin', icon: <Shield className="w-5 h-5" />, desc: 'Manage the system' },
];

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [selectedRole, setSelectedRole] = useState<AppRole>('citizen');
  const [submitting, setSubmitting] = useState(false);
  const { signUp, signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    if (searchParams.get('mode') === 'signup') {
      setIsSignUp(true);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, displayName, selectedRole);
        if (error) throw error;
        if (selectedRole === 'admin') {
          toast({ title: 'Verification Request Sent', description: 'Request sent to head admin (admin@gmail.com).' });
        } else {
          toast({ title: 'Account created!', description: 'Welcome to CleanRoute.' });
        }
        navigate('/dashboard');
      } else {
        const { error } = await signIn(email, password);
        if (error) throw error;
        navigate('/dashboard');
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl eco-gradient flex items-center justify-center">
              <Leaf className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-2xl font-display font-bold text-foreground">CleanRoute</span>
          </div>
          <p className="text-muted-foreground">Smart waste management for cleaner communities</p>
        </div>

        <Card className="border-border/50 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="font-display text-xl">{isSignUp ? 'Create Account' : 'Welcome'}</CardTitle>
            <CardDescription>{isSignUp ? 'Join the clean community' : 'Sign in to your dashboard'}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <>
                  <Input
                    placeholder="Display Name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                  />
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Select your role</label>
                    <div className="grid grid-cols-3 gap-2">
                      {roles.map((r) => (
                        <button
                          type="button"
                          key={r.value}
                          onClick={() => setSelectedRole(r.value)}
                          className={`p-3 rounded-lg border-2 text-center transition-all ${selectedRole === r.value
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/40'
                            }`}
                        >
                          <div className={`mx-auto mb-1 ${selectedRole === r.value ? 'text-primary' : 'text-muted-foreground'}`}>
                            {r.icon}
                          </div>
                          <div className="text-xs font-medium">{r.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              <Button type="submit" className="w-full eco-gradient text-primary-foreground hover:opacity-90" disabled={submitting}>
                {submitting ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
              </Button>
            </form>
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-primary hover:underline"
              >
                {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
