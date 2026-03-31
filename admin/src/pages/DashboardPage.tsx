import { useQuery } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { api } from '../lib/api';
import { useSelectedProperty } from '../components/PropertySwitcher';

interface Session {
  id: string;
  property_name: string;
  session_type: string;
  status: string;
  cleaner_name?: string;
  created_at: string;
  scheduled_date?: string;
}

interface Reservation {
  id: string;
  checkin_date: string;
  checkout_date: string;
  summary: string;
  guest_name?: string;
  phone?: string;
  num_guests?: number;
  description?: string;
  is_blocked: boolean;
}

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function parseDate(s: string): Date {
  const [y,m,d] = s.slice(0,10).split('-').map(Number);
  return new Date(y, m-1, d);
}

export default function DashboardPage() {
  const { propertyId } = useSelectedProperty();
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const now = new Date();
  const viewMonth = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();

  const { data: sessions } = useQuery<Session[]>({
    queryKey: ['sessions', propertyId],
    queryFn: async () => {
      const { data } = await api.get<Session[]>(`/sessions?property_id=${propertyId}`);
      return data;
    },
    enabled: !!propertyId,
  });

  const { data: reservations } = useQuery<Reservation[]>({
    queryKey: ['reservations', propertyId],
    queryFn: async () => {
      const { data } = await api.get<Reservation[]>(`/ical/reservations/${propertyId}`);
      return data;
    },
    enabled: !!propertyId,
  });

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    while (days.length % 7 !== 0) days.push(null);
    return days;
  }, [year, month]);

  // Map dates to reservations and sessions
  const dateMap = useMemo(() => {
    const map: Record<string, { reservations: Reservation[]; sessions: Session[] }> = {};
    for (const r of (reservations ?? [])) {
      const start = parseDate(r.checkin_date);
      const end = parseDate(r.checkout_date);
      for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
        const key = toDateStr(d);
        if (!map[key]) map[key] = { reservations: [], sessions: [] };
        if (!map[key].reservations.find(x => x.id === r.id)) map[key].reservations.push(r);
      }
    }
    for (const s of (sessions ?? [])) {
      const key = (s.scheduled_date ?? s.created_at).slice(0, 10);
      if (!map[key]) map[key] = { reservations: [], sessions: [] };
      map[key].sessions.push(s);
    }
    return map;
  }, [reservations, sessions]);

  const todayStr = toDateStr(now);
  const pendingCount = sessions?.filter(s => s.status === 'pending').length ?? 0;
  const inProgressCount = sessions?.filter(s => s.status === 'in_progress').length ?? 0;
  const reviewCount = sessions?.filter(s => s.status === 'submitted').length ?? 0;
  const upcomingStays = (reservations ?? []).filter(r => !r.is_blocked && parseDate(r.checkin_date) >= now).length;

  const selectedInfo = selectedDate ? dateMap[selectedDate] : null;

  return (
    <div>
      <h1 style={{ margin: '0 0 8px', fontSize: 24 }}>Dashboard</h1>
      <p style={{ color: '#64748b', margin: '0 0 24px', fontSize: 14 }}>Property calendar and overview</p>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard label="Upcoming Stays" value={upcomingStays} color="#10b981" />
        <StatCard label="Pending Cleans" value={pendingCount} color="#3b82f6" />
        <StatCard label="In Progress" value={inProgressCount} color="#f59e0b" />
        <StatCard label="Awaiting Review" value={reviewCount} color="#8b5cf6" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedDate ? '1fr 320px' : '1fr', gap: 24 }}>
        {/* Calendar */}
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
          {/* Month nav */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <button onClick={() => setMonthOffset(o => o - 1)} style={navBtn}>&larr;</button>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{MONTH_NAMES[month]} {year}</div>
              {monthOffset !== 0 && (
                <button onClick={() => setMonthOffset(0)}
                  style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: 12, marginTop: 2 }}>
                  Today
                </button>
              )}
            </div>
            <button onClick={() => setMonthOffset(o => o + 1)} style={navBtn}>&rarr;</button>
          </div>

          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
            {DAY_NAMES.map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: 11, color: '#94a3b8', fontWeight: 600, padding: '4px 0' }}>{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
            {calendarDays.map((day, i) => {
              if (day === null) return <div key={`e${i}`} style={{ minHeight: 72 }} />;
              const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
              const info = dateMap[dateStr];
              const hasStay = info?.reservations.some(r => !r.is_blocked);
              const hasBlocked = info?.reservations.some(r => r.is_blocked);
              const hasSession = (info?.sessions.length ?? 0) > 0;
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDate;

              // Check if this is a check-in or check-out day
              const isCheckin = info?.reservations.some(r => r.checkin_date.slice(0,10) === dateStr && !r.is_blocked);
              const isCheckout = info?.reservations.some(r => r.checkout_date.slice(0,10) === dateStr && !r.is_blocked);

              return (
                <div key={dateStr} onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                  style={{
                    minHeight: 72, padding: '4px 6px', borderRadius: 8, cursor: 'pointer',
                    border: isSelected ? '2px solid #3b82f6' : isToday ? '2px solid #e2e8f0' : '2px solid transparent',
                    background: hasStay ? '#ecfdf5' : hasBlocked ? '#fef2f2' : '#fafafa',
                    position: 'relative',
                  }}>
                  <div style={{ fontSize: 12, fontWeight: isToday ? 700 : 500, color: isToday ? '#3b82f6' : '#374151' }}>{day}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 2 }}>
                    {hasStay && (
                      <div style={{ fontSize: 9, background: '#10b981', color: '#fff', borderRadius: 3, padding: '1px 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {isCheckin ? 'Check-in' : isCheckout ? 'Check-out' : 'Guest'}
                        {info!.reservations.filter(r => !r.is_blocked).map(r => r.guest_name ? ` ${r.guest_name}` : '').join('')}
                      </div>
                    )}
                    {hasBlocked && !hasStay && (
                      <div style={{ fontSize: 9, background: '#ef4444', color: '#fff', borderRadius: 3, padding: '1px 4px' }}>Blocked</div>
                    )}
                    {hasSession && info!.sessions.map(s => (
                      <div key={s.id} style={{ fontSize: 9, background: sessionColor(s.status), color: '#fff', borderRadius: 3, padding: '1px 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {s.cleaner_name ?? 'Clean'} · {s.status.replace('_',' ')}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 16, marginTop: 16, fontSize: 11, color: '#64748b' }}>
            <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: '#10b981', marginRight: 4 }} />Guest stay</span>
            <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: '#ef4444', marginRight: 4 }} />Blocked</span>
            <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: '#3b82f6', marginRight: 4 }} />Clean session</span>
          </div>
        </div>

        {/* Detail panel */}
        {selectedDate && (
          <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,.08)', alignSelf: 'start' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16 }}>
                {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </h3>
              <button onClick={() => setSelectedDate(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#94a3b8' }}>&times;</button>
            </div>

            {(!selectedInfo || (selectedInfo.reservations.length === 0 && selectedInfo.sessions.length === 0)) && (
              <p style={{ color: '#94a3b8', fontSize: 13 }}>No events on this date</p>
            )}

            {selectedInfo?.reservations.map(r => (
              <div key={r.id} style={{ marginBottom: 12, padding: 12, background: r.is_blocked ? '#fef2f2' : '#ecfdf5', borderRadius: 8 }}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                  {r.is_blocked ? 'Blocked' : (r.guest_name || 'Reserved')}
                </div>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  {parseDate(r.checkin_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} &rarr; {parseDate(r.checkout_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  {' '}({Math.round((parseDate(r.checkout_date).getTime() - parseDate(r.checkin_date).getTime()) / 86400000)} nights)
                </div>
                {r.num_guests && <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{r.num_guests} guest{r.num_guests > 1 ? 's' : ''}</div>}
                {r.phone && <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Phone: {r.phone}</div>}
                {r.description && r.description.includes('airbnb.com') && (
                  <a href={r.description.match(/https:\/\/www\.airbnb\.com\S+/)?.[0] ?? '#'}
                    target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 11, color: '#3b82f6', marginTop: 4, display: 'block' }}>
                    View on Airbnb &rarr;
                  </a>
                )}
              </div>
            ))}

            {selectedInfo?.sessions.map(s => (
              <div key={s.id} style={{ marginBottom: 12, padding: 12, background: '#eff6ff', borderRadius: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{s.session_type}</div>
                  <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 10, color: '#fff', background: sessionColor(s.status) }}>
                    {s.status.replace('_', ' ')}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                  {s.cleaner_name ?? 'Unassigned'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: 20, borderLeft: `4px solid ${color}`, boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
      <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{label}</div>
    </div>
  );
}

function sessionColor(s: string) {
  const map: Record<string, string> = { pending: '#f59e0b', in_progress: '#3b82f6', submitted: '#8b5cf6', approved: '#10b981', rejected: '#ef4444' };
  return map[s] ?? '#6b7280';
}

const navBtn: React.CSSProperties = {
  background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '8px 14px',
  cursor: 'pointer', fontSize: 16, fontWeight: 600, color: '#374151',
};
