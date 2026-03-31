import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useSelectedProperty } from '../components/PropertySwitcher';

interface UpcomingSession {
  id: string;
  property_name: string;
  session_type: string;
  status: string;
  cleaner_name?: string;
  created_at: string;
}

export default function DashboardPage() {
  const { propertyId } = useSelectedProperty();

  const { data: sessions } = useQuery<UpcomingSession[]>({
    queryKey: ['sessions', propertyId],
    queryFn: async () => {
      const { data } = await api.get<UpcomingSession[]>(`/sessions?property_id=${propertyId}`);
      return data;
    },
    enabled: !!propertyId,
  });

  return (
    <div>
      <h1 style={{ margin: '0 0 8px', fontSize: 24 }}>Dashboard</h1>
      <p style={{ color: '#64748b', margin: '0 0 32px', fontSize: 14 }}>Property health overview</p>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 32 }}>
        <StatCard label="Pending Cleans" value={sessions?.filter(s => s.status === 'pending').length ?? 0} color="#3b82f6" />
        <StatCard label="In Progress" value={sessions?.filter(s => s.status === 'in_progress').length ?? 0} color="#f59e0b" />
        <StatCard label="Awaiting Review" value={sessions?.filter(s => s.status === 'submitted').length ?? 0} color="#8b5cf6" />
      </div>

      {/* Upcoming sessions */}
      <section>
        <h2 style={{ fontSize: 18, marginBottom: 16 }}>Upcoming Cleans</h2>
        {!sessions || sessions.length === 0 ? (
          <p style={{ color: '#94a3b8' }}>No pending sessions</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {sessions.map((s) => (
              <div key={s.id} style={cardStyle}>
                <div>
                  <div style={{ fontWeight: 600 }}>{s.property_name}</div>
                  <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
                    {s.session_type} · {s.cleaner_name ?? 'Unassigned'}
                  </div>
                </div>
                <span style={{ ...badgeStyle, background: statusColor(s.status) }}>
                  {s.status.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: 24, borderLeft: `4px solid ${color}`, boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
      <div style={{ fontSize: 32, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{label}</div>
    </div>
  );
}

function statusColor(s: string) {
  const map: Record<string, string> = { pending: '#f59e0b', in_progress: '#3b82f6', submitted: '#8b5cf6', approved: '#10b981', rejected: '#ef4444' };
  return map[s] ?? '#6b7280';
}

const cardStyle: React.CSSProperties = { background: '#fff', borderRadius: 10, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,.07)' };
const badgeStyle: React.CSSProperties = { color: '#fff', fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 12, textTransform: 'capitalize' };
