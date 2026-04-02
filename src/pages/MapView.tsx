import DashboardLayout from '@/components/DashboardLayout';
import ReportMap from '@/components/ReportMap';
import { useReports } from '@/hooks/useReports';

export default function MapView() {
  const { data: reports = [] } = useReports();

  return (
    <DashboardLayout title="Map View">
      <div className="h-[calc(100vh-10rem)] rounded-xl overflow-hidden border border-border/50">
        <ReportMap reports={reports} zoom={5} />
      </div>
    </DashboardLayout>
  );
}
