import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import ReportMap from '@/components/ReportMap';
import { useReports, useCreateReport, useUpdateReport, Report } from '@/hooks/useReports';
import { useAuth } from '@/lib/auth';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MapPin, Plus, Hand, AlertTriangle, CheckCircle, Trophy, IndianRupee } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMyProfile, useAwardPoints } from '@/hooks/useUsers';
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';

// Cache the model outside the component so it only loads once per session
let cachedModel: mobilenet.MobileNet | null = null;

export default function CitizenDashboard() {
  const { data: reports = [], isLoading } = useReports();
  const createReport = useCreateReport();
  const updateReport = useUpdateReport();
  const { user } = useAuth();
  const { data: myProfile } = useMyProfile(user?.uid);
  const awardPoints = useAwardPoints();
  const { toast } = useToast();
  const { role, loading } = useAuth();

  const [open, setOpen] = useState(false);
  const [reportViewOpen, setReportViewOpen] = useState<Report | null>(null);
  const [description, setDescription] = useState('');
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [lat, setLat] = useState(20.5937);
  const [lng, setLng] = useState(78.9629);
  const [locating, setLocating] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<'verified' | 'unverified' | 'error' | null>(null);

  const detectLocation = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setLocating(false);
      },
      () => {
        toast({ title: 'Location unavailable', description: 'Using default location', variant: 'destructive' });
        setLocating(false);
      }
    );
  };

  useEffect(() => {
    detectLocation();

    // Pre-load the AI model in the background so it's ready when the user uploads a photo
    const preloadModel = async () => {
      if (!cachedModel) {
        try {
          await tf.ready();
          cachedModel = await mobilenet.load();
          console.log("AI model preloaded in background");
        } catch (e) {
          console.error("Failed to preload AI model:", e);
        }
      }
    };
    preloadModel();
  }, []);

  if (!loading && role && role !== 'citizen') {
    return <Navigate to="/dashboard" replace />;
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setPhotoBase64(null);
      setScanResult(null);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setPhotoBase64(base64);
      setScanResult(null);
      setIsScanning(true);

      const img = new Image();
      img.src = base64;
      img.onload = async () => {
        try {
          if (!cachedModel) {
            await tf.ready();
            cachedModel = await mobilenet.load();
          }
          const predictions = await cachedModel.classify(img);
          console.log("Image predictions:", predictions);

          const trashKeywords = ['trash', 'garbage', 'waste', 'bin', 'plastic', 'litter', 'rubbish', 'can', 'bottle', 'paper', 'dump', 'dustbin', 'refuse', 'box', 'wrapper', 'cup', 'carton', 'bag'];

          const isTrash = predictions.some(p =>
            trashKeywords.some(keyword => p.className.toLowerCase().includes(keyword))
          );

          setScanResult(isTrash ? 'verified' : 'unverified');
        } catch (error) {
          console.error("Error scanning image:", error);
          setScanResult('error');
        } finally {
          setIsScanning(false);
        }
      };
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsScanning(true);
    let finalSeverity: Report['severity'] = 'low';
    let autoUpgraded = false;

    // AUTOMATIC PRIORITY DETECTION: Check for nearby schools or hospitals (within 500 meters)
    try {
      const overpassQuery = `
        [out:json];
        (
          node["amenity"~"hospital|school|clinic|kindergarten|college|university"](around:500,${lat},${lng});
          way["amenity"~"hospital|school|clinic|kindergarten|college|university"](around:500,${lat},${lng});
        );
        out count;
      `;
      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: overpassQuery
      });
      const data = await response.json();
      if (data && data.elements && data.elements.length > 0) {
        const counts = data.elements[0].tags;
        if ((parseInt(counts?.nodes || '0') > 0) || (parseInt(counts?.ways || '0') > 0)) {
          finalSeverity = 'high';
          autoUpgraded = true;
        }
      }
    } catch (error) {
      console.error("Failed to check nearby amenities:", error);
    } finally {
      setIsScanning(false);
    }

    try {
      if (!photoBase64) {
        toast({ title: 'Error', description: 'Photo proof is required to submit a report.', variant: 'destructive' });
        setIsScanning(false);
        return;
      }

      await createReport.mutateAsync({ description, latitude: lat, longitude: lng, severity: finalSeverity, photo_url: photoBase64 });
      if (user) await awardPoints.mutateAsync({ userId: user.uid, pointsToAdd: 10 });

      if (autoUpgraded) {
        toast({
          title: 'CRITICAL PRIORITY SET',
          description: `+10 Points! System detected a school/hospital nearby. Automatically marked as HIGH priority!`,
          duration: 6000
        });
      } else {
        toast({ title: 'Report submitted! +10 Points', description: 'Thank you for keeping the community clean.' });
      }

      setOpen(false);
      setDescription('');
      setPhotoBase64(null);
      setScanResult(null);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleVolunteer = async (report: Report) => {
    try {
      await updateReport.mutateAsync({ id: report.id, updates: { volunteer_id: user!.uid, status: 'claimed' } as any });
      if (user) await awardPoints.mutateAsync({ userId: user.uid, pointsToAdd: 50 });
      toast({ title: 'Volunteered! +50 Points', description: "You've claimed this report." });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const myReports = reports.filter((r) => r.user_id === user?.uid);
  const pendingCount = myReports.filter((r) => r.status === 'pending').length;
  const resolvedCount = myReports.filter((r) => r.status === 'collected' || r.status === 'resolved').length;

  return (
    <DashboardLayout title="Citizen Dashboard">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <Card className="relative overflow-hidden border-none shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40">
          <div className="absolute top-0 right-0 p-4 opacity-10"><AlertTriangle className="w-24 h-24" /></div>
          <CardContent className="pt-6 relative z-10 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm"><AlertTriangle className="w-6 h-6" /></div>
            <div>
              <p className="text-sm font-semibold text-blue-600/80 dark:text-blue-400/80 tracking-tight uppercase mb-0.5">My Reports</p>
              <p className="text-4xl font-display font-extrabold text-blue-900 dark:text-blue-100">{myReports.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-none shadow-lg bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40">
          <div className="absolute top-0 right-0 p-4 opacity-10"><CheckCircle className="w-24 h-24" /></div>
          <CardContent className="pt-6 relative z-10 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm"><CheckCircle className="w-6 h-6" /></div>
            <div>
              <p className="text-sm font-semibold text-emerald-600/80 dark:text-emerald-400/80 tracking-tight uppercase mb-0.5">Resolved</p>
              <p className="text-4xl font-display font-extrabold text-emerald-900 dark:text-emerald-100">{resolvedCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-none shadow-lg bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40">
          <div className="absolute top-0 right-0 p-4 opacity-10"><Trophy className="w-24 h-24" /></div>
          <CardContent className="pt-6 relative z-10 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-sm"><Trophy className="w-6 h-6" /></div>
            <div>
              <p className="text-sm font-semibold text-amber-600/80 dark:text-amber-400/80 tracking-tight uppercase mb-0.5">Total Points</p>
              <p className="text-4xl font-display font-extrabold text-amber-900 dark:text-amber-100">{myProfile?.points || 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Map + Report Button */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="overflow-hidden border-0 shadow-lg ring-1 ring-border/50">
            <CardHeader className="pb-3 flex flex-row items-center justify-between bg-muted/30">
              <CardTitle className="text-lg font-display flex items-center gap-2"><MapPin className="w-5 h-5 text-primary" /> Nearby Reports</CardTitle>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="eco-gradient text-primary-foreground font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all gap-1.5 rounded-full px-4">
                    <Plus className="w-4 h-4" /> Report Waste
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle className="font-display">Report Waste</DialogTitle></DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <Textarea placeholder="Describe the waste issue..." value={description} onChange={(e) => setDescription(e.target.value)} required />
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">Proof of Waste (Image)</label>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        required
                      />
                      {photoBase64 && <img src={photoBase64} alt="Preview" className="mt-2 h-20 w-auto rounded-md object-cover border" />}
                      {isScanning && <p className="text-xs text-blue-500 mt-1 animate-pulse">Scanning image for waste...</p>}
                      {scanResult === 'verified' && <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Waste verified by AI</p>}
                      {scanResult === 'unverified' && <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Image doesn't clearly show waste. Please upload a clearer photo to prevent fake reports.</p>}
                      {scanResult === 'error' && <p className="text-xs text-orange-600 mt-1">AI scan failed, but you can still submit.</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span className="text-sm text-muted-foreground">{lat.toFixed(4)}, {lng.toFixed(4)}</span>
                      <Button type="button" variant="outline" size="sm" onClick={detectLocation} disabled={locating}>
                        {locating ? 'Locating...' : 'Refresh GPS'}
                      </Button>
                    </div>
                    <Button type="submit" className="w-full eco-gradient text-primary-foreground hover:opacity-90" disabled={createReport.isPending || isScanning || scanResult === 'unverified' || !photoBase64}>
                      {createReport.isPending ? 'Submitting...' : isScanning ? 'Scanning Image...' : 'Submit Report'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
              <div className="text-xs text-muted-foreground mr-2 hidden sm:block">
                Click anywhere on the map to place a report
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[400px]">
                <ReportMap
                  reports={reports.filter(r => r.status !== 'collected' && r.status !== 'resolved')}
                  center={[lat, lng]}
                  zoom={13}
                  userLocation={[lat, lng]}
                  onMapClick={(clickLat, clickLng) => {
                    setLat(clickLat);
                    setLng(clickLng);
                    setOpen(true);
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent reports list */}
        <div>
          <Card className="border-0 shadow-lg ring-1 ring-border/50 h-full">
            <CardHeader className="pb-3 border-b border-border/50 bg-muted/30"><CardTitle className="text-lg font-display flex items-center gap-2"><CheckCircle className="w-5 h-5 text-primary" /> Recent Reports</CardTitle></CardHeader>
            <CardContent className="space-y-3 max-h-[400px] overflow-y-auto">
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : myReports.length === 0 ? (
                <p className="text-sm text-muted-foreground">No reports yet</p>
              ) : (
                myReports.slice(0, 20).map((r) => (
                  <div key={r.id} className="p-4 rounded-xl border border-border/60 hover:shadow-md hover:border-primary/30 bg-card transition-all hover:-translate-y-0.5">
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-sm font-semibold text-foreground line-clamp-1 flex-1">{r.description}</p>
                      <Badge variant="outline" className={`text-[10px] ml-2 font-bold px-2 py-0 border-0 ${r.severity === 'high' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {r.severity}
                      </Badge>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-2 space-y-1 bg-muted/30 p-2 rounded-lg">
                      <p className="flex justify-between"><span>Reported:</span> <span className="font-medium text-foreground">{new Date(r.created_at).toLocaleString()}</span></p>
                      {r.collected_at && (
                        <p className="flex justify-between text-emerald-600"><span>Collected:</span> <span className="font-medium">{new Date(r.collected_at).toLocaleString()}</span></p>
                      )}
                    </div>

                    <div className="mt-2 flex gap-2">
                      {r.user_id !== user?.uid && r.status === 'pending' && (
                        <Button size="sm" variant="outline" className="text-xs h-7 px-2" onClick={() => handleVolunteer(r)}>
                          <Hand className="w-3 h-3 mr-1" /> Cleanup (+50 pts)
                        </Button>
                      )}
                      <Button size="sm" variant="secondary" className="text-xs h-7 px-2" onClick={() => setReportViewOpen(r)}>
                        View Details
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>


        </div>
      </div>

      <Dialog open={!!reportViewOpen} onOpenChange={(o) => !o && setReportViewOpen(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Report Details</DialogTitle>
          </DialogHeader>
          {reportViewOpen && (
            <div className="space-y-4">
              <p className="text-sm">{reportViewOpen.description}</p>

              {reportViewOpen.status === 'collected' || reportViewOpen.status === 'resolved' ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-bold mb-1 text-muted-foreground">BEFORE (Reported)</p>
                    {reportViewOpen.photo_url ?
                      <img src={reportViewOpen.photo_url} alt="Before" className="w-full h-32 object-cover rounded shadow-sm border" />
                      : <div className="w-full h-32 bg-muted/50 rounded flex items-center justify-center text-xs text-muted-foreground">No Photo</div>
                    }
                  </div>
                  <div>
                    <p className="text-xs font-bold mb-1 text-green-600">AFTER (Cleaned)</p>
                    {reportViewOpen.after_photo_url ?
                      <img src={reportViewOpen.after_photo_url} alt="After" className="w-full h-32 object-cover rounded shadow-sm border" />
                      : <div className="w-full h-32 bg-green-50 rounded border border-green-200 flex items-center justify-center text-xs text-green-600 font-medium">Verified Clean</div>
                    }
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-xs font-bold mb-1 text-muted-foreground">EVIDENCE</p>
                  {reportViewOpen.photo_url ?
                    <img src={reportViewOpen.photo_url} alt="Evidence" className="w-full h-48 object-cover rounded shadow-sm border" />
                    : <div className="w-full h-48 bg-muted/50 rounded flex items-center justify-center text-xs text-muted-foreground">No Evidence Provided</div>
                  }
                </div>
              )}

              <div className="flex gap-2 items-center justify-between">
                <Badge>{reportViewOpen.status.toUpperCase()}</Badge>
                <div className="text-xs text-muted-foreground text-right space-y-0.5">
                  <p><span className="font-medium text-foreground">Reported:</span> {new Date(reportViewOpen.created_at).toLocaleString()}</p>
                  {reportViewOpen.collected_at && (
                    <p className="text-green-600"><span className="font-medium">Collected:</span> {new Date(reportViewOpen.collected_at).toLocaleString()}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
