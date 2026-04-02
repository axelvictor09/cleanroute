import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import ReportMap from '@/components/ReportMap';
import { useReports, useUpdateReport, Report, useDeleteReport, useClearReports } from '@/hooks/useReports';
import { useDrivers, useToggleDriverApprove, useDeleteDriver, useAdmins, useToggleAdminApprove, useDeleteAdmin, useProfiles } from '@/hooks/useUsers';
import { useAuth } from '@/lib/auth';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AlertTriangle, MapPin, Clock, CheckCircle, BarChart3, Flame, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function AdminDashboard() {
  const { data: reports = [], isLoading } = useReports();
  const { data: drivers = [] } = useDrivers();
  const { data: admins = [] } = useAdmins();
  const { data: profiles = [] } = useProfiles();
  const toggleApprove = useToggleDriverApprove();
  const deleteDriver = useDeleteDriver();
  const toggleAdminApprove = useToggleAdminApprove();
  const deleteAdmin = useDeleteAdmin();
  const updateReport = useUpdateReport();
  const deleteReport = useDeleteReport();
  const clearReports = useClearReports();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [heatmapEnabled, setHeatmapEnabled] = useState(true);

  const [adminLocation, setAdminLocation] = useState<[number, number]>([20.5937, 78.9629]);
  const [locating, setLocating] = useState(false);

  const detectLocation = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setAdminLocation([pos.coords.latitude, pos.coords.longitude]);
        setLocating(false);
      },
      () => {
        setLocating(false);
      }
    );
  };

  useEffect(() => {
    detectLocation();
  }, []);

  const { role, loading, user, isApproved } = useAuth();
  if (!loading && role && role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  if (!loading && role === 'admin' && !isApproved) {
    return <Navigate to="/dashboard" replace />;
  }

  // --- DATA CALCULATIONS FOR CHARTS ---
  const stats = {
    pending: reports.filter(r => r.status === 'pending').length,
    collected: reports.filter(r => r.status === 'collected').length,
    highPriority: reports.filter(r => r.severity === 'high' && r.status !== 'collected').length
  };

  const chartData = [
    { name: 'Low', count: reports.filter(r => r.severity === 'low').length, color: '#22c55e' },
    { name: 'High', count: reports.filter(r => r.severity === 'high').length, color: '#ef4444' },
  ];

  const filteredReports = statusFilter === 'all' ? reports : reports.filter((r) => r.status === statusFilter);

  const isEscalated = (r: Report) => {
    const hoursDiff = (Date.now() - new Date(r.created_at).getTime()) / (1000 * 60 * 60);
    return r.status === 'pending' && hoursDiff > 48;
  };

  return (
    <DashboardLayout title="System Administration">
      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="relative overflow-hidden border-none shadow-lg bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/40 dark:to-rose-950/40">
          <div className="absolute top-0 right-0 p-4 opacity-10"><AlertTriangle className="w-24 h-24" /></div>
          <CardContent className="pt-6 relative z-10 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/50 flex flex-shrink-0 items-center justify-center text-red-600 dark:text-red-400 shadow-sm"><AlertTriangle className="w-6 h-6" /></div>
            <div>
              <p className="text-sm font-semibold text-red-600/80 dark:text-red-400/80 tracking-tight uppercase mb-0.5">Critical Issues</p>
              <h3 className="text-4xl font-display font-extrabold text-red-900 dark:text-red-100">{stats.highPriority}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-none shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40">
          <div className="absolute top-0 right-0 p-4 opacity-10"><Clock className="w-24 h-24" /></div>
          <CardContent className="pt-6 relative z-10 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex flex-shrink-0 items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm"><Clock className="w-6 h-6" /></div>
            <div>
              <p className="text-sm font-semibold text-blue-600/80 dark:text-blue-400/80 tracking-tight uppercase mb-0.5">Pending Pickups</p>
              <h3 className="text-4xl font-display font-extrabold text-blue-900 dark:text-blue-100">{stats.pending}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-none shadow-lg bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40">
          <div className="absolute top-0 right-0 p-4 opacity-10"><CheckCircle className="w-24 h-24" /></div>
          <CardContent className="pt-6 relative z-10 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex flex-shrink-0 items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm"><CheckCircle className="w-6 h-6" /></div>
            <div>
              <p className="text-sm font-semibold text-emerald-600/80 dark:text-emerald-400/80 tracking-tight uppercase mb-0.5">Total Collected</p>
              <h3 className="text-4xl font-display font-extrabold text-emerald-900 dark:text-emerald-100">{stats.collected}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-none shadow-lg bg-gradient-to-br from-purple-50 to-fuchsia-50 dark:from-purple-950/40 dark:to-fuchsia-950/40">
          <div className="absolute top-0 right-0 p-4 opacity-10"><BarChart3 className="w-24 h-24" /></div>
          <CardContent className="pt-6 relative z-10 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/50 flex flex-shrink-0 items-center justify-center text-purple-600 dark:text-purple-400 shadow-sm"><BarChart3 className="w-6 h-6" /></div>
            <div>
              <p className="text-sm font-semibold text-purple-600/80 dark:text-purple-400/80 tracking-tight uppercase mb-0.5">Success Rate</p>
              <h3 className="text-4xl font-display font-extrabold text-purple-900 dark:text-purple-100">
                {reports.length ? Math.round((stats.collected / reports.length) * 100) : 0}%
              </h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Severity Analytics Chart */}
        <Card className="lg:col-span-1 border-0 shadow-lg ring-1 ring-border/50">
          <CardHeader className="bg-muted/30 border-b border-border/50"><CardTitle className="text-md font-display">Reports by Severity</CardTitle></CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Global Map View */}
        <Card className="lg:col-span-2 overflow-hidden border-0 shadow-lg ring-1 ring-border/50">
          <CardHeader className="pb-3 flex flex-row items-center justify-between bg-muted/30 border-b border-border/50">
            <div className="flex items-center gap-2">
              <CardTitle className="text-md font-display">City-wide Waste Distribution</CardTitle>
              <Button
                variant={heatmapEnabled ? "default" : "outline"}
                size="sm"
                className={`h-7 px-2 text-xs mr-2 ${heatmapEnabled ? "bg-red-500 hover:bg-red-600" : ""}`}
                onClick={() => setHeatmapEnabled(!heatmapEnabled)}
              >
                <Flame className="w-3 h-3 mr-1" /> {heatmapEnabled ? "Heatmap On" : "Heatmap Off"}
              </Button>
              <Button type="button" variant="outline" size="sm" className="h-7 text-xs px-2" onClick={detectLocation} disabled={locating}>
                <MapPin className="w-3 h-3 mr-1" /> {locating ? 'Locating...' : 'My Location'}
              </Button>
            </div>
            <Badge variant="outline">Live Reports</Badge>
          </CardHeader>
          <CardContent className="p-0 h-[300px]">
            <ReportMap reports={reports} center={adminLocation} zoom={13} showHeatmap={heatmapEnabled} userLocation={adminLocation} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Driver Permissions */}
        <Card className="overflow-hidden border-0 shadow-lg ring-1 ring-border/50">
          <CardHeader className="pb-3 flex flex-row items-center justify-between bg-muted/30 border-b border-border/50">
            <CardTitle className="text-md font-display">Driver Permissions</CardTitle>
            <Badge variant="secondary" className="bg-primary/10 text-primary">Access Control</Badge>
          </CardHeader>
          <CardContent className="p-0 h-[300px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Driver Name</TableHead>
                  <TableHead>Account Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {drivers.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.display_name}</TableCell>
                    <TableCell>
                      {d.is_approved ? (
                        <Badge className="bg-green-100 text-green-700">Approved</Badge>
                      ) : (
                        <Badge variant="destructive">Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {d.is_approved ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              try {
                                await toggleApprove.mutateAsync({ userRoleId: d.id, isApproved: false });
                                toast({ title: 'Access Revoked' });
                              } catch (err: any) {
                                toast({ title: 'Error revoking access', description: err.message, variant: 'destructive' });
                              }
                            }}
                            disabled={toggleApprove.isPending}
                            className="h-7 text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-50 mr-2"
                          >
                            Revoke Access
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              try {
                                await deleteDriver.mutateAsync({ roleId: d.id, userId: d.user_id });
                                toast({ title: 'Driver Removed' });
                              } catch (err: any) {
                                toast({ title: 'Error removing driver', description: err.message, variant: 'destructive' });
                              }
                            }}
                            disabled={deleteDriver.isPending}
                            className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            Remove
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            onClick={async () => {
                              try {
                                await toggleApprove.mutateAsync({ userRoleId: d.id, isApproved: true });
                                toast({ title: 'Driver Approved' });
                              } catch (err: any) {
                                toast({ title: 'Error approving driver', description: err.message, variant: 'destructive' });
                              }
                            }}
                            disabled={toggleApprove.isPending}
                            className="h-7 text-xs bg-primary hover:bg-primary/90 mr-2"
                          >
                            Approve Driver
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              try {
                                await deleteDriver.mutateAsync({ roleId: d.id, userId: d.user_id });
                                toast({ title: 'Driver Removed' });
                              } catch (err: any) {
                                toast({ title: 'Error removing driver', description: err.message, variant: 'destructive' });
                              }
                            }}
                            disabled={deleteDriver.isPending}
                            className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            Remove
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {drivers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground h-24">No drivers found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Driver Performance & Logs */}
        <Card className="overflow-hidden border-0 shadow-lg ring-1 ring-border/50">
          <CardHeader className="pb-3 flex flex-row items-center justify-between bg-muted/30 border-b border-border/50">
            <CardTitle className="text-md font-display">Driver Activity & Performance</CardTitle>
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">Metrics</Badge>
          </CardHeader>
          <CardContent className="p-0 h-[300px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Driver</TableHead>
                  <TableHead>Shift Logs</TableHead>
                  <TableHead className="text-right">Cleaned</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {drivers.filter(d => d.is_approved).map((d) => (
                  <TableRow key={`perf-${d.id}`}>
                    <TableCell className="font-medium">{d.display_name}</TableCell>
                    <TableCell>
                      {d.is_on_shift ? (
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-semibold text-green-600 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Clocked In</span>
                          {d.last_clock_in && <span className="text-[10px] text-muted-foreground whitespace-nowrap">Since: {new Date(d.last_clock_in).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>}
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-muted-foreground"></span> Off Duty</span>
                          {d.last_clock_in && <span className="text-[10px] text-muted-foreground whitespace-nowrap">Last: {new Date(d.last_clock_in).toLocaleDateString()} {new Date(d.last_clock_in).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                        {reports.filter(r => r.driver_id === d.user_id && r.status === 'collected').length} Cleaned
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {drivers.filter(d => d.is_approved).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground h-24">No approved drivers found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 mb-6">
        {/* Admin Permissions */}
        <Card className="overflow-hidden border-0 shadow-lg ring-1 ring-border/50">
          <CardHeader className="pb-3 flex flex-row items-center justify-between bg-muted/30 border-b border-border/50">
            <CardTitle className="text-md font-display">Admin Permissions</CardTitle>
            <Badge variant="secondary" className="bg-primary/10 text-primary">Access Control</Badge>
          </CardHeader>
          <CardContent className="p-0 h-[300px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Admin Name</TableHead>
                  <TableHead>Account Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((a) => {
                  // The parent admin is the very first admin created
                  const parentAdmin = admins.reduce((oldest, current) => {
                    if (!oldest?.created_at) return current;
                    if (!current?.created_at) return oldest;
                    return new Date(current.created_at) < new Date(oldest.created_at) ? current : oldest;
                  }, admins[0]);

                  const isParentAdmin = parentAdmin?.user_id === a.user_id;
                  const isCurrentUser = user?.uid === a.user_id;

                  return (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">
                        {a.display_name}
                        {isCurrentUser && <Badge className="ml-2 text-[10px] bg-blue-100 text-blue-700">You</Badge>}
                        {isParentAdmin && <Badge className="ml-2 text-[10px] bg-purple-100 text-purple-700 border-purple-200 shadow-sm">Head Admin</Badge>}
                      </TableCell>
                      <TableCell>
                        {a.is_approved ? (
                          <Badge className="bg-green-100 text-green-700">Approved</Badge>
                        ) : (
                          <Badge variant="destructive">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {/* Prevent users from voluntarily revoking or approving their own role */}
                        {isCurrentUser ? (
                          <span className="text-xs text-muted-foreground font-medium">Cannot edit own role</span>
                        ) : isParentAdmin ? (
                          <span className="text-xs text-purple-600/70 font-medium">Protected Role</span>
                        ) : a.is_approved ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                try {
                                  await toggleAdminApprove.mutateAsync({ userRoleId: a.id, isApproved: false });
                                  toast({ title: 'Access Revoked' });
                                } catch (err: any) {
                                  toast({ title: 'Error revoking access', description: err.message, variant: 'destructive' });
                                }
                              }}
                              disabled={toggleAdminApprove.isPending}
                              className="h-7 text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-50 mr-2"
                            >
                              Revoke Access
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                try {
                                  await deleteAdmin.mutateAsync({ roleId: a.id, userId: a.user_id });
                                  toast({ title: 'Admin Removed' });
                                } catch (err: any) {
                                  toast({ title: 'Error removing admin', description: err.message, variant: 'destructive' });
                                }
                              }}
                              disabled={deleteAdmin.isPending}
                              className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              Remove
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              onClick={async () => {
                                try {
                                  await toggleAdminApprove.mutateAsync({ userRoleId: a.id, isApproved: true });
                                  toast({ title: 'Admin Approved' });
                                } catch (err: any) {
                                  toast({ title: 'Error approving admin', description: err.message, variant: 'destructive' });
                                }
                              }}
                              disabled={toggleAdminApprove.isPending}
                              className="h-7 text-xs bg-primary hover:bg-primary/90 mr-2"
                            >
                              Approve Admin
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                try {
                                  await deleteAdmin.mutateAsync({ roleId: a.id, userId: a.user_id });
                                  toast({ title: 'Admin Removed' });
                                } catch (err: any) {
                                  toast({ title: 'Error removing admin', description: err.message, variant: 'destructive' });
                                }
                              }}
                              disabled={deleteAdmin.isPending}
                              className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              Remove
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {admins.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground h-24">No admins found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Reports Management Table */}
      <Card className="border-0 shadow-lg ring-1 ring-border/50">
        <CardHeader className="flex flex-row items-center justify-between bg-muted/30 border-b border-border/50">
          <div className="flex items-center gap-4">
            <CardTitle className="font-display">Master Incident Log</CardTitle>
            <Button
              variant="destructive"
              size="sm"
              onClick={async () => {
                if (confirm("Are you sure you want to clear all reports? This will remove pending, in-progress, and collected reports.")) {
                  try {
                    await clearReports.mutateAsync();
                    toast({ title: 'All reports cleared' });
                  } catch (err: any) {
                    toast({ title: 'Error clearing reports', description: err.message, variant: 'destructive' });
                  }
                }
              }}
              disabled={clearReports.isPending || reports.length === 0}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="collected">Collected</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Location</TableHead>
                <TableHead>Waste Details</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reported At</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReports.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <a href={`https://www.google.com/maps/search/?api=1&query=${r.latitude},${r.longitude}`} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-600 hover:underline">
                        <MapPin className="w-3 h-3 mr-1" />
                        View Map
                      </a>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm truncate max-w-[200px] mb-1" title={r.description}>{r.description}</div>
                    <div className="flex space-x-2">
                      {r.photo_url && <a href={r.photo_url} target="_blank" rel="noopener noreferrer"><img src={r.photo_url} alt="Before" className="h-10 w-10 object-cover rounded shadow" /></a>}
                      {r.after_photo_url && <a href={r.after_photo_url} target="_blank" rel="noopener noreferrer"><img src={r.after_photo_url} alt="After" className="h-10 w-10 object-cover rounded shadow border-2 border-green-500" /></a>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={
                      r.severity === 'high' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                    }>
                      {r.severity}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${r.status === 'collected' ? 'bg-green-500' : 'bg-orange-500'}`} />
                      {r.status}
                      {isEscalated(r) && <Badge variant="destructive" className="ml-2 animate-pulse">OVERDUE</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground space-y-1">
                    <div>
                      <span className="font-medium">Reported By:</span>{' '}
                      {profiles.find(p => p.user_id === r.user_id)?.display_name || 'Unknown Citizen'}
                    </div>
                    <div><span className="font-medium">Reported:</span> {new Date(r.created_at).toLocaleString()}</div>

                    {(r.status === 'in_progress' || r.status === 'collected') && (r.driver_id || r.driver_name) && (
                      <div className="text-blue-600 font-medium">
                        Driver: {drivers.find(d => d.user_id === r.driver_id)?.display_name || r.driver_name || 'Deleted Driver'}
                      </div>
                    )}

                    {r.collected_at && (
                      <div className="text-green-600 font-medium mt-0.5">
                        Collected: {new Date(r.collected_at).toLocaleString()}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10 disabled:opacity-30"
                      onClick={async () => {
                        if (confirm("Remove this report?")) {
                          try {
                            await deleteReport.mutateAsync(r.id);
                            toast({ title: 'Report removed' });
                          } catch (err: any) {
                            toast({ title: 'Error removing report', description: err.message, variant: 'destructive' });
                          }
                        }
                      }}
                      disabled={deleteReport.isPending}
                      title="Remove report"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}