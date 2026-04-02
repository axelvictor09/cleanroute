import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import ReportMap from '@/components/ReportMap';
import { useReports, useUpdateReport, Report } from '@/hooks/useReports';
import { useAuth } from '@/lib/auth';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Truck, AlertTriangle, MapPin, Navigation, Camera, Route, LogOut, LogIn, Hand } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useDriverShift, useMyProfile } from '@/hooks/useUsers';

export default function DriverDashboard() {
  const { data: reports = [], isLoading } = useReports();
  const updateReport = useUpdateReport();
  const { user } = useAuth();
  const { data: myProfile } = useMyProfile(user?.uid);
  const toggleShift = useDriverShift();
  const { toast } = useToast();

  const [selectedReports, setSelectedReports] = useState<Report[]>([]);

  const toggleSelection = (report: Report) => {
    setSelectedReports(prev => {
      if (prev.some(r => r.id === report.id)) {
        return prev.filter(r => r.id !== report.id);
      }
      return [...prev, report];
    });
  };

  // Proof of Collection Dialog
  const [collectReportId, setCollectReportId] = useState<string | null>(null);
  const [afterPhotoBase64, setAfterPhotoBase64] = useState<string | null>(null);

  // --- DYNAMIC LOCATION STATE ---
  const [driverLocation, setDriverLocation] = useState<[number, number] | null>(null);
  const [isManualLocation, setIsManualLocation] = useState(false);
  const isManualRef = useRef(false);

  const resetToLiveLocation = () => {
    setIsManualLocation(false);
    isManualRef.current = false;
    toast({ title: 'Live Location Restored', description: 'Now tracking your real-time GPS.' });
    navigator.geolocation.getCurrentPosition(
      (pos) => setDriverLocation([pos.coords.latitude, pos.coords.longitude]),
      () => toast({ title: "GPS Error", description: "Please enable location services." })
    );
  };

  // Get live GPS location
  useEffect(() => {
    if (!navigator.geolocation) {
      toast({ title: "GPS Error", description: "Geolocation is not supported by your browser." });
      return;
    }

    // This "watches" the position, so if the driver moves, the blue line moves!
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        if (!isManualRef.current) {
          setDriverLocation([pos.coords.latitude, pos.coords.longitude]);
        }
      },
      (err) => {
        console.error(err);
        toast({ title: "GPS Error", description: "Please enable location services." });
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const { role, isApproved, loading } = useAuth();

  if (!loading) {
    if (!role || role !== 'driver') {
      return <Navigate to="/dashboard" replace />;
    }
    if (!isApproved) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
          <div className="bg-destructive/10 p-4 rounded-full mb-4">
            <AlertTriangle className="w-12 h-12 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Access Revoked</h1>
          <p className="text-muted-foreground max-w-sm mb-6">
            Your driver access has been temporarily revoked by an administrator. Please contact support.
          </p>
          <Button onClick={() => window.location.href = '/dashboard'}>
            Return to Dashboard
          </Button>
        </div>
      );
    }
  }

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const p = 0.017453292519943295;
    const c = Math.cos;
    const a = 0.5 - c((lat2 - lat1) * p) / 2 + c(lat1 * p) * c(lat2 * p) * (1 - c((lon2 - lon1) * p)) / 2;
    return 12742 * Math.asin(Math.sqrt(a));
  };

  const pendingReports = reports
    .filter((r) => r.status === 'pending' || ((r.status === 'claimed' || r.status === 'in_progress') && r.driver_id === user?.uid))
    .sort((a, b) => {
      // Sort by distance if driver location is known, otherwise by severity
      if (driverLocation) {
        const distA = getDistance(driverLocation[0], driverLocation[1], a.latitude, a.longitude);
        const distB = getDistance(driverLocation[0], driverLocation[1], b.latitude, b.longitude);
        return distA - distB;
      }

      const order = { high: 0, medium: 1, low: 2 };
      return (order[a.severity as keyof typeof order] || 0) - (order[b.severity as keyof typeof order] || 0);
    });

  const collectedToday = reports.filter(
    (r) => r.status === 'collected' && r.driver_id === user?.uid && r.collected_at && new Date(r.collected_at).toDateString() === new Date().toDateString()
  ).length;

  const generateOptimalRoute = () => {
    if (!driverLocation || pendingReports.length === 0) return;
    const origin = `${driverLocation[0]},${driverLocation[1]}`;

    // Compute route targets based on Multi-selection OR all claimed pickups
    let routeTargets: Report[] = [];

    if (selectedReports.length > 0) {
      // If user hand-picked multiple items, route through ONLY those
      routeTargets = [...selectedReports];
    } else {
      // Otherwise, route through all the tools they claimed
      const myClaimedPickups = pendingReports.filter(r => r.driver_id === user?.uid && r.status === 'in_progress');
      routeTargets = myClaimedPickups.length > 0 ? myClaimedPickups : pendingReports;
    }

    // Nearest Neighbor naive sorting for the multi-stop Google Maps URL
    // so it doesn't zigzag randomly.
    const sortedTargets: Report[] = [];
    let currentLoc = driverLocation;
    const unvisited = [...routeTargets];

    while (unvisited.length > 0) {
      let closestIdx = 0;
      let minDistance = Infinity;
      for (let i = 0; i < unvisited.length; i++) {
        const d = getDistance(currentLoc[0], currentLoc[1], unvisited[i].latitude, unvisited[i].longitude);
        if (d < minDistance) {
          minDistance = d;
          closestIdx = i;
        }
      }
      sortedTargets.push(unvisited[closestIdx]);
      currentLoc = [unvisited[closestIdx].latitude, unvisited[closestIdx].longitude];
      unvisited.splice(closestIdx, 1);
    }

    if (sortedTargets.length === 0) return;

    const dest = `${sortedTargets[sortedTargets.length - 1].latitude},${sortedTargets[sortedTargets.length - 1].longitude}`;

    if (sortedTargets.length === 1) {
      window.open(`https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}&travelmode=driving`);
      return;
    }

    const waypoints = sortedTargets.slice(0, -1).map(r => `${r.latitude},${r.longitude}`).join('|');
    window.open(`https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}&waypoints=${waypoints}&travelmode=driving`);
  };

  const handleClaim = async (report: Report, e: any) => {
    e.stopPropagation();
    try {
      await updateReport.mutateAsync({
        id: report.id,
        updates: { status: 'in_progress', driver_id: user!.uid, driver_name: myProfile?.display_name || 'Unknown Driver' } as any,
      });
      toast({ title: 'Assigned', description: 'You have claimed this pickup.' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleCancelClaim = async (report: Report, e: any) => {
    e.stopPropagation();
    try {
      await updateReport.mutateAsync({
        id: report.id,
        // Set driver_id to null and status back to pending to release it
        updates: { status: 'pending', driver_id: null, driver_name: null } as any,
      });
      setSelectedReports(prev => prev.filter(r => r.id !== report.id));
      toast({ title: 'Cancelled', description: 'You have cancelled this pickup.' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const checkCollect = (report: Report, e: any) => {
    e.stopPropagation();
    setCollectReportId(report.id);
    setAfterPhotoBase64(null);
  }

  const handleCollectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectReportId) return;

    try {
      await updateReport.mutateAsync({
        id: collectReportId,
        updates: { status: 'collected', driver_id: user!.uid, driver_name: myProfile?.display_name || 'Unknown Driver', collected_at: new Date().toISOString(), after_photo_url: afterPhotoBase64 || undefined } as any,
      });
      setSelectedReports(prev => prev.filter(r => r.id !== collectReportId));
      setCollectReportId(null);
      toast({ title: 'Collected!', description: 'Report marked as collected.' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <DashboardLayout title="Driver Dashboard">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <Card className="relative overflow-hidden border-none shadow-lg bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/40 dark:to-rose-950/40">
          <div className="absolute top-0 right-0 p-4 opacity-10"><AlertTriangle className="w-24 h-24" /></div>
          <CardContent className="pt-6 relative z-10 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/50 flex flex-shrink-0 items-center justify-center text-red-600 dark:text-red-400 shadow-sm"><AlertTriangle className="w-6 h-6" /></div>
            <div><p className="text-sm font-semibold text-red-600/80 dark:text-red-400/80 tracking-tight uppercase mb-0.5">High Priority</p><p className="text-4xl font-display font-extrabold text-red-900 dark:text-red-100">{pendingReports.filter(r => r.severity === 'high').length}</p></div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-none shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40">
          <div className="absolute top-0 right-0 p-4 opacity-10"><Truck className="w-24 h-24" /></div>
          <CardContent className="pt-6 relative z-10 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex flex-shrink-0 items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm"><Truck className="w-6 h-6" /></div>
            <div><p className="text-sm font-semibold text-blue-600/80 dark:text-blue-400/80 tracking-tight uppercase mb-0.5">Pending Pickups</p><p className="text-4xl font-display font-extrabold text-blue-900 dark:text-blue-100">{pendingReports.length}</p></div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-none shadow-lg bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40">
          <div className="absolute top-0 right-0 p-4 opacity-10"><CheckCircle className="w-24 h-24" /></div>
          <CardContent className="pt-6 relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex flex-shrink-0 items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm"><CheckCircle className="w-6 h-6" /></div>
              <div><p className="text-sm font-semibold text-emerald-600/80 dark:text-emerald-400/80 tracking-tight uppercase mb-0.5">Collected Today</p><p className="text-4xl font-display font-extrabold text-emerald-900 dark:text-emerald-100">{collectedToday}</p></div>
            </div>
            <div>
              <Button
                variant={myProfile?.is_on_shift ? "destructive" : "default"}
                className={`shadow-md hover:shadow-lg transition-all ${myProfile?.is_on_shift ? "bg-red-600 hover:bg-red-700 font-bold" : "bg-emerald-600 hover:bg-emerald-700 font-bold"}`}
                onClick={() => toggleShift.mutate({ userId: user!.uid, isOnShift: !myProfile?.is_on_shift })}
                disabled={toggleShift.isPending}
              >
                {myProfile?.is_on_shift ? (
                  <><LogOut className="w-4 h-4 mr-2" /> Clock Out</>
                ) : (
                  <><LogIn className="w-4 h-4 mr-2" /> Clock In</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="overflow-hidden border-0 shadow-lg ring-1 ring-border/50">
            <CardHeader className="pb-3 flex flex-row items-center justify-between bg-muted/30">
              <CardTitle className="text-lg font-display flex items-center gap-2"><MapPin className="w-5 h-5 text-primary" /> Collection Map</CardTitle>
              {!driverLocation ? (
                <Badge variant="outline" className="animate-pulse">Locating Driver...</Badge>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground hidden sm:inline">Click map to set start location</span>
                  {isManualLocation && (
                    <Button variant="outline" size="sm" className="h-6 text-[10px] px-2 bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100" onClick={resetToLiveLocation}>
                      <MapPin className="w-3 h-3 mr-1" /> Use Live GPS
                    </Button>
                  )}
                </div>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[500px]">
                {/* Dynamically calculate the drawing path points */}
                {(() => {
                  let routePoints: [number, number][] = [];
                  if (driverLocation) {
                    // Start Nearest Neighbor sorting to draw continuous Path
                    let routeTargets: Report[] = [];
                    if (selectedReports.length > 0) {
                      routeTargets = [...selectedReports];
                    } else {
                      const myClaimedPickups = pendingReports.filter(r => r.driver_id === user?.uid && r.status === 'in_progress');
                      if (myClaimedPickups.length > 0) {
                        routeTargets = [...myClaimedPickups];
                      }
                    }

                    if (routeTargets.length > 0) {
                      const sortedTargets: [number, number][] = [driverLocation];
                      let currentLoc = driverLocation;
                      const unvisited = [...routeTargets];

                      while (unvisited.length > 0) {
                        let closestIdx = 0;
                        let minDistance = Infinity;
                        for (let i = 0; i < unvisited.length; i++) {
                          const d = getDistance(currentLoc[0], currentLoc[1], unvisited[i].latitude, unvisited[i].longitude);
                          if (d < minDistance) {
                            minDistance = d;
                            closestIdx = i;
                          }
                        }
                        const nextNode = unvisited[closestIdx];
                        sortedTargets.push([nextNode.latitude, nextNode.longitude]);
                        currentLoc = [nextNode.latitude, nextNode.longitude];
                        unvisited.splice(closestIdx, 1);
                      }

                      routePoints = sortedTargets;
                    }
                  }

                  return (
                    <ReportMap
                      reports={pendingReports}
                      center={driverLocation || [9.9816, 76.2999]}
                      zoom={14}
                      userLocation={driverLocation || undefined}
                      onMarkerClick={(report) => toggleSelection(report)}
                      onMapClick={(clickLat, clickLng) => {
                        setIsManualLocation(true);
                        isManualRef.current = true;
                        setDriverLocation([clickLat, clickLng]);
                        toast({ title: 'Location Updated', description: 'Start location set manually.' });
                      }}
                      routePoints={routePoints}
                    />
                  );
                })()}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="h-full border-0 shadow-lg ring-1 ring-border/50">
            <CardHeader className="pb-4 bg-muted/30 border-b border-border/50">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-display flex items-center gap-2"><Route className="w-5 h-5 text-primary" /> Priority Queue</CardTitle>
                  <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">{pendingReports.length} Pickups</Badge>
                </div>
                <Button
                  className="w-full text-xs h-8 gap-2 bg-blue-600 hover:bg-blue-700"
                  onClick={generateOptimalRoute}
                  disabled={!driverLocation || pendingReports.length === 0}
                >
                  <Route className="w-3 h-3" /> Generate Optimal Route
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[500px] overflow-y-auto">
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : pendingReports.length === 0 ? (
                <p className="text-sm text-muted-foreground">All clear!</p>
              ) : (
                pendingReports.map((r) => {
                  const distance = driverLocation ? getDistance(driverLocation[0], driverLocation[1], r.latitude, r.longitude) : null;
                  const isSelected = selectedReports.some(sr => sr.id === r.id);

                  return (
                    <div
                      key={r.id}
                      className={`p-4 rounded-xl border cursor-pointer transition-all hover:-translate-y-0.5 ${isSelected
                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10 ring-2 ring-blue-500 shadow-md'
                        : 'border-border/60 hover:shadow-md hover:border-primary/30 bg-card'
                        }`}
                      onClick={() => toggleSelection(r)}
                    >
                      <div className="flex flex-col gap-2 mb-1">
                        <div className="flex items-start justify-between">
                          <p className="text-sm font-medium text-foreground line-clamp-2 pr-2">{r.description}</p>
                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            <Badge variant="outline" className="text-[10px]">
                              {r.severity}
                            </Badge>
                            {distance !== null && (
                              <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded flex items-center whitespace-nowrap">
                                <Navigation className="w-2.5 h-2.5 mr-1" />
                                {distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          <span className="font-medium text-foreground">Reported:</span> {new Date(r.created_at).toLocaleString()}
                          {r.collected_at && (
                            <span> | <span className="font-medium text-green-600">Collected:</span> {new Date(r.collected_at).toLocaleString()}</span>
                          )}
                        </div>
                        {r.photo_url && (
                          <img src={r.photo_url} alt="Waste proof" className="w-full h-32 object-cover rounded-md mt-1" />
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-3">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-[10px] h-8"
                          disabled={!driverLocation}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (driverLocation) {
                              window.open(`https://www.google.com/maps/dir/?api=1&origin=${driverLocation[0]},${driverLocation[1]}&destination=${r.latitude},${r.longitude}&travelmode=driving`);
                            }
                          }}
                        >
                          <Navigation className="w-3 h-3 mr-1" /> Navigation
                        </Button>

                        {r.driver_id !== user?.uid ? (
                          <Button
                            size="sm"
                            className="text-[10px] h-8 bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={(e) => handleClaim(r, e)}
                          >
                            <Hand className="w-3 h-3 mr-1" /> Claim Pickup
                          </Button>
                        ) : (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="destructive"
                              className="text-[10px] h-8 flex-1 opacity-90 hover:opacity-100"
                              onClick={(e) => handleCancelClaim(r, e)}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              className="eco-gradient text-primary-foreground text-[10px] h-8 flex-1 shadow-sm px-0"
                              onClick={(e) => checkCollect(r, e)}
                            >
                              <Camera className="w-3 h-3 mr-1" /> Proof
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Camera Dialog for Proof of Collection */}
      <Dialog open={!!collectReportId} onOpenChange={(o) => (!o && setCollectReportId(null))}>
        <DialogContent>
          <DialogHeader><DialogTitle>Verify Collection</DialogTitle></DialogHeader>
          <form onSubmit={handleCollectSubmit} className="space-y-4">
            <p className="text-sm text-muted-foreground">Please upload a photo of the cleaned street as proof of collection.</p>
            <div>
              <Input
                type="file"
                accept="image/*"
                capture="environment" // Encourages taking a picture on mobile
                required
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => setAfterPhotoBase64(reader.result as string);
                    reader.readAsDataURL(file);
                  } else {
                    setAfterPhotoBase64(null);
                  }
                }}
              />
              {afterPhotoBase64 && <img src={afterPhotoBase64} alt="Proof" className="mt-4 h-40 w-auto rounded-md object-cover border" />}
            </div>
            <Button type="submit" className="w-full eco-gradient" disabled={!afterPhotoBase64 || updateReport.isPending}>
              <CheckCircle className="w-4 h-4 mr-2" /> Confirm Resolution
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}