import { useAuth } from '@/lib/auth';
import { Navigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { useLeaderboard } from '@/hooks/useUsers';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trophy, Shield, User, Truck, Medal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Leaderboard() {
    const { user, loading } = useAuth();
    const { data: leaderboard = [], isLoading } = useLeaderboard();

    if (!loading && !user) {
        return <Navigate to="/auth" replace />;
    }

    const citizenLeaderboard = leaderboard.filter(p => p.role === 'citizen');
    const driverLeaderboard = leaderboard.filter(p => p.role === 'driver');

    return (
        <DashboardLayout title="Community Leaderboard">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-display font-bold text-foreground mb-3 flex items-center justify-center gap-3">
                        <Trophy className="w-8 h-8 text-yellow-500" />
                        Hall of Fame
                    </h2>
                    <p className="text-muted-foreground max-w-xl mx-auto">
                        Top contributors scoring points by reporting waste, volunteering, and collecting garbage.
                    </p>
                </div>

                <Tabs defaultValue="citizens" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8 h-12">
                        <TabsTrigger value="citizens" className="flex items-center gap-2 text-base h-full">
                            <User className="w-5 h-5" /> Citizens
                        </TabsTrigger>
                        <TabsTrigger value="drivers" className="flex items-center gap-2 text-base h-full">
                            <Truck className="w-5 h-5" /> Drivers
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="citizens" className="animate-fade-in">
                        <Card className="border-border/50 shadow-md">
                            <CardHeader className="pb-4 bg-muted/20 border-b border-border/50">
                                <CardTitle className="text-xl font-display flex items-center justify-between">
                                    <span className="flex items-center gap-2">
                                        <Medal className="w-6 h-6 text-yellow-500" />
                                        Citizen Rankings
                                    </span>
                                    <Badge variant="outline" className="font-normal text-muted-foreground">
                                        Based on reporting & volunteering
                                    </Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                {isLoading ? (
                                    <div className="p-8 text-center text-muted-foreground animate-pulse">Loading rankings...</div>
                                ) : citizenLeaderboard.length === 0 ? (
                                    <div className="p-8 text-center text-muted-foreground">No citizens found on the leaderboard.</div>
                                ) : (
                                    <div className="divide-y divide-border/50">
                                        {citizenLeaderboard.map((p, i) => (
                                            <div key={p.id} className={`flex items-center justify-between p-4 transition-colors hover:bg-muted/30 ${i < 3 ? 'bg-primary/5' : ''}`}>
                                                <div className="flex items-center gap-5">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-base font-bold shadow-sm ${i === 0 ? 'bg-yellow-400 text-yellow-900 ring-2 ring-yellow-200 ring-offset-2' :
                                                            i === 1 ? 'bg-slate-300 text-slate-800 ring-2 ring-slate-200 ring-offset-2' :
                                                                i === 2 ? 'bg-orange-300 text-orange-900 ring-2 ring-orange-200 ring-offset-2' :
                                                                    'bg-muted text-muted-foreground border border-border'
                                                        }`}>
                                                        {i + 1}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-foreground text-lg">{p.display_name}</p>
                                                        {i === 0 && <p className="text-xs text-yellow-600 font-semibold mt-0.5">Top Citizen</p>}
                                                    </div>
                                                </div>
                                                <Badge variant="outline" className={`px-4 py-1.5 font-bold text-sm ${i === 0 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                                        i === 1 ? 'bg-slate-50 text-slate-700 border-slate-200' :
                                                            i === 2 ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                                                'bg-background'
                                                    }`}>
                                                    {p.points} <span className="text-[10px] ml-1 opacity-70 font-normal uppercase">pts</span>
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="drivers" className="animate-fade-in">
                        <Card className="border-border/50 shadow-md">
                            <CardHeader className="pb-4 bg-muted/20 border-b border-border/50">
                                <CardTitle className="text-xl font-display flex items-center justify-between">
                                    <span className="flex items-center gap-2">
                                        <Medal className="w-6 h-6 text-blue-500" />
                                        Driver Rankings
                                    </span>
                                    <Badge variant="outline" className="font-normal text-muted-foreground">
                                        Based on collection efficiency
                                    </Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                {isLoading ? (
                                    <div className="p-8 text-center text-muted-foreground animate-pulse">Loading rankings...</div>
                                ) : driverLeaderboard.length === 0 ? (
                                    <div className="p-8 text-center text-muted-foreground">No drivers found on the leaderboard.</div>
                                ) : (
                                    <div className="divide-y divide-border/50">
                                        {driverLeaderboard.map((p, i) => (
                                            <div key={p.id} className={`flex items-center justify-between p-4 transition-colors hover:bg-muted/30 ${i < 3 ? 'bg-blue-50/50' : ''}`}>
                                                <div className="flex items-center gap-5">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-base font-bold shadow-sm ${i === 0 ? 'bg-yellow-400 text-yellow-900 ring-2 ring-yellow-200 ring-offset-2' :
                                                            i === 1 ? 'bg-slate-300 text-slate-800 ring-2 ring-slate-200 ring-offset-2' :
                                                                i === 2 ? 'bg-orange-300 text-orange-900 ring-2 ring-orange-200 ring-offset-2' :
                                                                    'bg-muted text-muted-foreground border border-border'
                                                        }`}>
                                                        {i + 1}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-foreground text-lg">{p.display_name}</p>
                                                        {i === 0 && <p className="text-xs text-blue-600 font-semibold mt-0.5">Top Driver</p>}
                                                    </div>
                                                </div>
                                                <Badge variant="outline" className={`px-4 py-1.5 font-bold text-sm ${i === 0 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                                        i === 1 ? 'bg-slate-50 text-slate-700 border-slate-200' :
                                                            i === 2 ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                                                'bg-background'
                                                    }`}>
                                                    {p.points} <span className="text-[10px] ml-1 opacity-70 font-normal uppercase">pts</span>
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
}
