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

interface SpanBar {
  reservation: Reservation;
  row: number;
  startCol: number;
  endCol: number;
  startsBeforeWeek: boolean;
  endsAfterWeek: boolean;
}

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function parseLocalDate(s: string): Date {
  const [y,m,d] = s.slice(0,10).split('-').map(Number);
  return new Date(y, m-1, d);
}
function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}
function fmtShort(s: string) {
  return parseLocalDate(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function DashboardPage() {
  const { propertyId } = useSelectedProperty();
  const [monthOffset, setMonthOffset] = useState(0);

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

  // Calendar grid: array of weeks, each week is 7 date strings (or null for padding)
  const { weeks, gridStart } = useMemo(() => {
    const firstOfMonth = new Date(year, month, 1);
    const startDay = firstOfMonth.getDay(); // 0=Sun
    const gridStart = new Date(year, month, 1 - startDay);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const totalCells = startDay + daysInMonth;
    const numWeeks = Math.ceil(totalCells / 7);
    const weeks: (string | null)[][] = [];
    for (let w = 0; w < numWeeks; w++) {
      const week: (string | null)[] = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(gridStart);
        date.setDate(date.getDate() + w * 7 + d);
        if (date.getMonth() === month) {
          week.push(toDateStr(date));
        } else {
          week.push(null);
        }
      }
      weeks.push(week);
    }
    return { weeks, gridStart };
  }, [year, month]);

  // Compute span bars per week for reservations
  const weekSpans = useMemo(() => {
    const result: SpanBar[][] = [];
    for (let w = 0; w < weeks.length; w++) {
      const weekStart = new Date(gridStart);
      weekStart.setDate(weekStart.getDate() + w * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      const bars: SpanBar[] = [];
      for (const r of (reservations ?? [])) {
        const rStart = parseLocalDate(r.checkin_date);
        const rEnd = parseLocalDate(r.checkout_date);
        if (rEnd <= weekStart || rStart >= weekEnd) continue;
        const clampStart = rStart < weekStart ? weekStart : rStart;
        const clampEnd = rEnd > weekEnd ? weekEnd : rEnd;
        let startCol = clampStart.getDay();
        let endCol = clampEnd.getDay();
        // If clamped start is outside the month, adjust
        const startStr = toDateStr(clampStart);
        const endMinusOne = new Date(clampEnd);
        endMinusOne.setDate(endMinusOne.getDate() - 1);
        const endStr = toDateStr(endMinusOne);
        // Only render within this month
        if (clampStart.getMonth() !== month && clampEnd.getMonth() !== month) continue;
        if (clampStart.getMonth() !== month) startCol = 0;
        if (endCol === 0) endCol = 7;
        if (endCol <= startCol) continue;
        bars.push({
          reservation: r,
          row: 0,
          startCol,
          endCol,
          startsBeforeWeek: rStart < weekStart,
          endsAfterWeek: rEnd > weekEnd,
        });
      }
      // Assign rows to avoid overlap
      const rows: number[][] = []; // rows[row] = occupied columns
      for (const bar of bars) {
        let placed = false;
        for (let r = 0; r < rows.length; r++) {
          if (!rows[r].some(c => c >= bar.startCol && c < bar.endCol)) {
            bar.row = r;
            for (let c = bar.startCol; c < bar.endCol; c++) rows[r].push(c);
            placed = true;
            break;
          }
        }
        if (!placed) {
          bar.row = rows.length;
          const cols: number[] = [];
          for (let c = bar.startCol; c < bar.endCol; c++) cols.push(c);
          rows.push(cols);
        }
      }
      result.push(bars);
    }
    return result;
  }, [weeks, gridStart, reservations, month]);

  // Session map by date
  const sessionsByDate = useMemo(() => {
    const map: Record<string, Session[]> = {};
    for (const s of (sessions ?? [])) {
      const key = (s.scheduled_date ?? s.created_at).slice(0, 10);
      if (!map[key]) map[key] = [];
      map[key].push(s);
    }
    return map;
  }, [sessions]);

  const todayStr = toDateStr(now);
  const pendingCount = sessions?.filter(s => s.status === 'pending').length ?? 0;
  const inProgressCount = sessions?.filter(s => s.status === 'in_progress').length ?? 0;
  const reviewCount = sessions?.filter(s => s.status === 'submitted').length ?? 0;

  // Upcoming cleans: reservations with checkout >= today, sorted by checkout
  const upcomingCleans = useMemo(() => {
    return (reservations ?? [])
      .filter(r => !r.is_blocked && parseLocalDate(r.checkout_date) >= now)
      .sort((a, b) => a.checkout_date.localeCompare(b.checkout_date));
  }, [reservations, now]);

  // Match sessions to checkouts
  const sessionForCheckout = useMemo(() => {
    const map: Record<string, Session | undefined> = {};
    for (const r of upcomingCleans) {
      const dateKey = r.checkout_date.slice(0, 10);
      const matching = (sessions ?? []).find(s =>
        (s.scheduled_date ?? s.created_at).slice(0, 10) === dateKey
      );
      map[r.id] = matching;
    }
    return map;
  }, [upcomingCleans, sessions]);

  return (
    <div>
      <h1 style={{ margin: '0 0 8px', fontSize: 24 }}>Dashboard</h1>
      <p style={{ color: '#64748b', margin: '0 0 24px', fontSize: 14 }}>Property calendar and overview</p>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard label="Upcoming Stays" value={upcomingCleans.length} color="#10b981" />
        <StatCard label="Pending Cleans" value={pendingCount} color="#3b82f6" />
        <StatCard label="In Progress" value={inProgressCount} color="#f59e0b" />
        <StatCard label="Awaiting Review" value={reviewCount} color="#8b5cf6" />
      </div>

      {/* Calendar */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,.08)', marginBottom: 24 }}>
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {DAY_NAMES.map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: 11, color: '#94a3b8', fontWeight: 600, padding: '4px 0', borderBottom: '1px solid #f1f5f9' }}>{d}</div>
          ))}
        </div>

        {/* Week rows */}
        {weeks.map((week, wi) => {
          const bars = weekSpans[wi] ?? [];
          const maxRow = bars.length > 0 ? Math.max(...bars.map(b => b.row)) + 1 : 0;
          return (
            <div key={wi}>
              {/* Date number row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                {week.map((dateStr, di) => {
                  if (!dateStr) return <div key={`e${di}`} style={{ minHeight: 28, borderBottom: '1px solid #f8fafc' }} />;
                  const day = parseInt(dateStr.slice(8));
                  const isToday = dateStr === todayStr;
                  const daySessions = sessionsByDate[dateStr];
                  return (
                    <div key={dateStr} style={{ padding: '4px 6px', minHeight: 28, borderBottom: '1px solid #f8fafc' }}>
                      <div style={{
                        fontSize: 12, fontWeight: isToday ? 700 : 400,
                        color: isToday ? '#fff' : '#374151',
                        background: isToday ? '#3b82f6' : 'transparent',
                        borderRadius: 10, width: 22, height: 22, display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                      }}>{day}</div>
                      {daySessions?.map(s => (
                        <div key={s.id} style={{
                          fontSize: 8, marginTop: 1, padding: '1px 3px', borderRadius: 2,
                          background: sColor(s.status), color: '#fff',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>{s.cleaner_name ?? 'Clean'}</div>
                      ))}
                    </div>
                  );
                })}
              </div>
              {/* Span bars */}
              {maxRow > 0 && (
                <div style={{ position: 'relative', height: maxRow * 22, marginBottom: 2 }}>
                  {bars.map((bar, bi) => {
                    const r = bar.reservation;
                    const bg = r.is_blocked ? '#fee2e2' : '#d1fae5';
                    const fg = r.is_blocked ? '#991b1b' : '#065f46';
                    const borderColor = r.is_blocked ? '#fca5a5' : '#6ee7b7';
                    const nights = daysBetween(parseLocalDate(r.checkin_date), parseLocalDate(r.checkout_date));
                    const label = r.is_blocked
                      ? 'Blocked'
                      : `${r.guest_name || 'Reserved'} (${nights}n)`;
                    return (
                      <div key={`${r.id}-${bi}`} style={{
                        position: 'absolute',
                        top: bar.row * 22,
                        left: `calc(${(bar.startCol / 7) * 100}% + 2px)`,
                        width: `calc(${((bar.endCol - bar.startCol) / 7) * 100}% - 4px)`,
                        height: 18,
                        background: bg,
                        border: `1px solid ${borderColor}`,
                        borderRadius: bar.startsBeforeWeek ? '0 4px 4px 0' : bar.endsAfterWeek ? '4px 0 0 4px' : 4,
                        borderLeft: bar.startsBeforeWeek ? 'none' : `1px solid ${borderColor}`,
                        borderRight: bar.endsAfterWeek ? 'none' : `1px solid ${borderColor}`,
                        display: 'flex', alignItems: 'center', padding: '0 6px',
                        fontSize: 10, fontWeight: 600, color: fg,
                        overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                        cursor: 'default',
                      }} title={`${label}\n${fmtShort(r.checkin_date)} - ${fmtShort(r.checkout_date)}`}>
                        {label}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Legend */}
        <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 11, color: '#64748b' }}>
          <span><span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 2, background: '#d1fae5', border: '1px solid #6ee7b7', marginRight: 4, verticalAlign: 'middle' }} />Guest stay</span>
          <span><span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 2, background: '#fee2e2', border: '1px solid #fca5a5', marginRight: 4, verticalAlign: 'middle' }} />Blocked</span>
          <span><span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 2, background: '#3b82f6', marginRight: 4, verticalAlign: 'middle' }} />Clean session</span>
        </div>
      </div>

      {/* Upcoming Cleans list */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
        <h2 style={{ margin: '0 0 16px', fontSize: 18 }}>Upcoming Cleans</h2>
        {upcomingCleans.length === 0 ? (
          <p style={{ color: '#94a3b8', fontSize: 14 }}>No upcoming checkouts</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                <th style={thStyle}>Checkout</th>
                <th style={thStyle}>Guest</th>
                <th style={thStyle}>Stay</th>
                <th style={thStyle}>Nights</th>
                <th style={thStyle}>Assigned Cleaner</th>
                <th style={thStyle}>Status</th>
              </tr>
            </thead>
            <tbody>
              {upcomingCleans.map(r => {
                const session = sessionForCheckout[r.id];
                const nights = daysBetween(parseLocalDate(r.checkin_date), parseLocalDate(r.checkout_date));
                const checkoutDate = parseLocalDate(r.checkout_date);
                const daysUntil = daysBetween(now, checkoutDate);
                const isUrgent = daysUntil <= 2 && daysUntil >= 0;
                return (
                  <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9', background: isUrgent ? '#fffbeb' : 'transparent' }}>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 600 }}>{fmtShort(r.checkout_date)}</div>
                      {daysUntil === 0 && <span style={{ fontSize: 10, color: '#f59e0b', fontWeight: 700 }}>TODAY</span>}
                      {daysUntil === 1 && <span style={{ fontSize: 10, color: '#f59e0b' }}>Tomorrow</span>}
                      {daysUntil > 1 && <span style={{ fontSize: 10, color: '#94a3b8' }}>{daysUntil} days</span>}
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 500 }}>{r.guest_name || 'Reserved'}</div>
                      {r.phone && <div style={{ fontSize: 11, color: '#94a3b8' }}>{r.phone}</div>}
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontSize: 12, color: '#64748b' }}>{fmtShort(r.checkin_date)} &rarr; {fmtShort(r.checkout_date)}</span>
                    </td>
                    <td style={tdStyle}>{nights}</td>
                    <td style={tdStyle}>
                      {session?.cleaner_name ? (
                        <span style={{ color: '#10b981', fontWeight: 600 }}>{session.cleaner_name}</span>
                      ) : (
                        <span style={{ color: '#ef4444', fontWeight: 600 }}>Open</span>
                      )}
                    </td>
                    <td style={tdStyle}>
                      {session ? (
                        <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10, color: '#fff', background: sColor(session.status) }}>
                          {session.status.replace('_', ' ')}
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10, color: '#fff', background: '#94a3b8' }}>
                          No session
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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

function sColor(s: string) {
  const map: Record<string, string> = { pending: '#f59e0b', in_progress: '#3b82f6', submitted: '#8b5cf6', approved: '#10b981', rejected: '#ef4444' };
  return map[s] ?? '#6b7280';
}

const navBtn: React.CSSProperties = {
  background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '8px 14px',
  cursor: 'pointer', fontSize: 16, fontWeight: 600, color: '#374151',
};
const thStyle: React.CSSProperties = { padding: '8px 10px', fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' };
const tdStyle: React.CSSProperties = { padding: '10px 10px' };
