import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useSelectedProperty } from '../components/PropertySwitcher';

interface SuperhostData {
  overall_rating: number;
  rating_count: number;
  response_rate: number;
  cancellation_rate: number | null;
  completed_stays: number;
  next_assessment_date: string;
  days_until_assessment: number;
  will_qualify: boolean;
}

export default function SuperhostPage() {
  const { propertyId } = useSelectedProperty();

  const { data, isLoading, isError } = useQuery<SuperhostData>({
    queryKey: ['superhost', propertyId],
    queryFn: async () => {
      const { data } = await api.get<SuperhostData>(`/admin/superhost/current?property_id=${propertyId}`);
      return data;
    },
    enabled: !!propertyId,
    retry: false,
  });

  if (!propertyId) return <p style={{ color: '#94a3b8', padding: 32 }}>Select a property to view Superhost data.</p>;
  if (isLoading) return <p style={{ color: '#94a3b8', padding: 32 }}>Loading Superhost data...</p>;
  if (isError || !data) return (
    <div style={{ padding: 32, textAlign: 'center' }}>
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>Superhost Tracker</h1>
      <p style={{ color: '#94a3b8', fontSize: 15 }}>No Superhost data available for this property. This feature is only applicable to short-term rental properties with guest ratings.</p>
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: 24 }}>Superhost Tracker</h1>
          <p style={{ color: '#64748b', margin: 0, fontSize: 14 }}>
            Next assessment: {data.next_assessment_date} ({data.days_until_assessment} days)
          </p>
        </div>
        <span style={{
          padding: '6px 16px', borderRadius: 20, fontWeight: 700, fontSize: 13,
          background: data.will_qualify ? '#dcfce7' : '#fef2f2',
          color: data.will_qualify ? '#166534' : '#991b1b',
        }}>
          {data.will_qualify ? 'On Track to Qualify' : 'At Risk'}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
        <GaugeCard label="Overall Rating" value={data.overall_rating} target={4.8} max={5}
          format={v => v.toFixed(2)} color={gaugeColor(data.overall_rating, 4.8, 4.5)}
          subtitle={`${data.rating_count} ratings`} />
        <GaugeCard label="Response Rate" value={data.response_rate} target={90} max={100}
          format={v => `${v}%`} color={gaugeColor(data.response_rate, 90, 80)}
          subtitle="Last 12 months" />
        <GaugeCard label="Cancellation Rate" value={0} target={1} max={5}
          format={() => 'Track manually'} color="#6b7280"
          subtitle="No booking management in MVP" />
        <GaugeCard label="Completed Stays" value={data.completed_stays} target={10} max={15}
          format={v => String(v)} color={gaugeColor(data.completed_stays, 10, 7)}
          subtitle={`Target: 10 stays`} />
      </div>
    </div>
  );
}

function gaugeColor(value: number, good: number, warn: number): string {
  if (value >= good) return '#10b981';
  if (value >= warn) return '#f59e0b';
  return '#ef4444';
}

function GaugeCard({ label, value, target, max, format, color, subtitle }: {
  label: string; value: number; target: number; max: number;
  format: (v: number) => string; color: string; subtitle: string;
}) {
  const pct = Math.min((value / max) * 100, 100);
  const targetPct = (target / max) * 100;

  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
      <div style={{ fontSize: 13, color: '#64748b', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 700, color, marginBottom: 12 }}>{format(value)}</div>

      {/* Progress bar with target line */}
      <div style={{ position: 'relative', height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'visible' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4, transition: 'width 0.5s' }} />
        <div style={{
          position: 'absolute', top: -4, left: `${targetPct}%`, width: 2, height: 16,
          background: '#1e293b', borderRadius: 1,
        }} />
      </div>
      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>{subtitle}</div>
    </div>
  );
}
