import { useState, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/lib/auth';
import { useReports } from '@/hooks/useReports';
import { useMyProfile, useDrivers, useAdmins, useProfiles } from '@/hooks/useUsers';
import { db } from '@/integrations/firebase/client';
import { doc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { User, Mail, Shield, Camera, Edit2, Check, Award, MapPin, Truck, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useQueryClient } from '@tanstack/react-query';

export default function Profile() {
  const { user, role } = useAuth();
  const { data: myProfile } = useMyProfile(user?.uid);
  const { data: reports = [] } = useReports();
  const { data: drivers = [] } = useDrivers();
  const { data: admins = [] } = useAdmins();
  const { data: profiles = [] } = useProfiles();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Sync state when profile loads
  if (myProfile && displayName === '' && !isEditing) {
    setDisplayName(myProfile.display_name || '');
  }

  // Calculate Stats
  const myReported = reports.filter(r => r.user_id === user?.uid).length;
  const myCollected = reports.filter(r => r.driver_id === user?.uid && r.status === 'collected').length;
  const pendingByMe = reports.filter(r => r.user_id === user?.uid && r.status === 'pending').length;

  const driverIds = new Set(drivers.map(d => d.user_id));
  const adminIds = new Set(admins.map(a => a.user_id));
  const totalCitizens = profiles.filter(p => !driverIds.has(p.user_id) && !adminIds.has(p.user_id)).length;
  const totalDrivers = drivers.length;
  const totalAdmins = admins.length;

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'profiles', user.uid), { display_name: displayName });
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast({ title: 'Profile Updated', description: 'Your display name has been saved successfully.' });
      setIsEditing(false);
    } catch (err: any) {
      toast({ title: 'Update Failed', description: err.message, variant: 'destructive' });
    }
    setIsSaving(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Convert logic (simulate instant upload via base64 for the mock client)
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        await updateDoc(doc(db, 'profiles', user.uid), { avatar_url: reader.result as string });
        await queryClient.invalidateQueries({ queryKey: ['profile'] });
        toast({ title: 'Avatar Updated', description: 'Looking good!' });
      } catch (err: any) {
        toast({ title: 'Upload Failed', description: err.message, variant: 'destructive' });
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <DashboardLayout title="Account Settings">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Left Column: ID Card */}
        <div className="md:col-span-1 space-y-6">
          <Card className="overflow-hidden border-2 border-primary/10">
            <div className="h-24 eco-gradient w-full relative">
              <Button
                variant="secondary" size="icon" className="absolute bottom-2 right-2 h-8 w-8 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-md text-white"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="w-4 h-4" />
              </Button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
            </div>

            <CardContent className="pt-0 relative px-6 pb-6">
              <div className="flex justify-between items-end mb-4">
                <div className="w-20 h-20 rounded-full border-4 border-background bg-secondary flex justify-center items-center shadow-md overflow-hidden -mt-10 relative z-10">
                  {myProfile?.avatar_url ? (
                    <img src={myProfile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-primary" />
                  )}
                </div>
                <Badge variant="outline" className="capitalize bg-primary/5 text-primary border-primary/20 mb-2">
                  {role} Level
                </Badge>
              </div>

              <div className="space-y-4">
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={displayName}
                      onChange={e => setDisplayName(e.target.value)}
                      className="h-8 font-medium"
                      placeholder="Display Name"
                      autoFocus
                    />
                    <Button size="sm" onClick={handleSaveProfile} disabled={isSaving} className="h-8 w-8 p-0 shrink-0">
                      <Check className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between group">
                    <div>
                      <h2 className="text-xl font-display font-bold text-foreground leading-none">{myProfile?.display_name || 'Citizen'}</h2>
                      <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5 break-all">
                        <Mail className="w-3.5 h-3.5" /> {user?.email}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)} className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8">
                      <Edit2 className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </div>
                )}

                <div className="pt-4 border-t border-border flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Shield className="w-4 h-4 shrink-0" />
                    <span>Account ID: <span className="font-mono text-xs">{user?.uid.split('-')[0]}...</span></span>
                  </div>
                  <div className="flex items-center justify-between mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-900">
                    <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-500 font-medium">
                      <Award className="w-5 h-5" />
                      Total Impact Points
                    </div>
                    <span className="text-xl font-bold text-yellow-700 dark:text-yellow-500">{myProfile?.points || 0}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Lifetime Stats & History (Visual) */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Impact Summary</CardTitle>
              <CardDescription>{role === 'admin' ? 'System-wide user statistics.' : 'Your lifetime contributions to a cleaner city.'}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                {role === 'admin' ? (
                  <>
                    <div className="flex-1 p-4 rounded-xl bg-muted/50 border border-border flex flex-col items-center justify-center text-center">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mb-2">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <p className="text-2xl font-bold text-foreground font-display">{totalCitizens}</p>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Total Citizens</p>
                    </div>
                    <div className="flex-1 p-4 rounded-xl bg-muted/50 border border-border flex flex-col items-center justify-center text-center">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mb-2">
                        <Truck className="w-5 h-5 text-green-600" />
                      </div>
                      <p className="text-2xl font-bold text-foreground font-display">{totalDrivers}</p>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Total Drivers</p>
                    </div>
                    <div className="flex-1 p-4 rounded-xl bg-muted/50 border border-border flex flex-col items-center justify-center text-center">
                      <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mb-2">
                        <Shield className="w-5 h-5 text-purple-600" />
                      </div>
                      <p className="text-2xl font-bold text-foreground font-display">{totalAdmins}</p>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Total Admins</p>
                    </div>
                  </>
                ) : (
                  <>
                    {role !== 'driver' && (
                      <div className="flex-1 p-4 rounded-xl bg-muted/50 border border-border flex flex-col items-center justify-center text-center">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mb-2">
                          <MapPin className="w-5 h-5 text-blue-600" />
                        </div>
                        <p className="text-2xl font-bold text-foreground font-display">{myReported}</p>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Reports Logged</p>
                      </div>
                    )}
                    {role !== 'citizen' && (
                      <div className="flex-1 p-4 rounded-xl bg-muted/50 border border-border flex flex-col items-center justify-center text-center">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mb-2">
                          <Truck className="w-5 h-5 text-green-600" />
                        </div>
                        <p className="text-2xl font-bold text-foreground font-display">{myCollected}</p>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Bags Collected</p>
                      </div>
                    )}
                    {role !== 'driver' && (
                      <div className="flex-1 p-4 rounded-xl bg-muted/50 border border-border flex flex-col items-center justify-center text-center">
                        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center mb-2">
                          <AlertTriangle className="w-5 h-5 text-orange-600" />
                        </div>
                        <p className="text-2xl font-bold text-foreground font-display">{pendingByMe}</p>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Awaiting Cleanup</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {role !== 'admin' && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {reports.filter(r => r.user_id === user?.uid || r.driver_id === user?.uid).length === 0 ? (
                  <div className="text-center p-8 text-muted-foreground border-2 border-dashed border-border rounded-lg">
                    No activity yet. Report your first piece of waste to get started!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reports
                      .filter(r => r.user_id === user?.uid || r.driver_id === user?.uid)
                      .slice(0, 5)
                      .map(r => (
                        <div key={r.id} className="flex gap-4 p-3 rounded-lg border border-border/50 bg-card hover:bg-muted/50 transition-colors">
                          <div className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center ${r.driver_id === user?.uid ? 'bg-green-100 text-green-600' : 'bg-primary/10 text-primary'
                            }`}>
                            {r.driver_id === user?.uid ? <Truck className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {r.driver_id === user?.uid ? 'You collected waste' : 'You reported waste'}
                            </p>
                            <p className="text-xs text-muted-foreground mb-1">"{r.description}"</p>
                            <div className="flex gap-2 text-[10px] items-center text-muted-foreground">
                              <Badge variant="outline" className={
                                r.status === 'collected' ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'
                              }>{r.status}</Badge>
                              <span>{new Date(r.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
