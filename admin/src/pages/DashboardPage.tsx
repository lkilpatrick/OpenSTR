import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  reservation_id?: string;
  compliance_score?: number;
  cleaner_start_time?: string;
  cleaner_end_time?: string;
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
  source?: string;
  external_uid?: string;
}

interface CleanerNote {
  id: string;
  session_id: string;
  user_id: string;
  note: string;
  author_name: string;
  created_at: string;
  reservation_summary?: string;
  guest_name?: string;
  checkin_date?: string;
  checkout_date?: string;
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
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [showAddReservation, setShowAddReservation] = useState(false);
  const [selectedRes, setSelectedRes] = useState<Reservation | null>(null);
  const [editingRes, setEditingRes] = useState<Reservation | null>(null);
  const [resForm, setResForm] = useState({ checkin_date: '', checkout_date: '', guest_name: '', phone: '', num_guests: '', is_blocked: false });
  const queryClient = useQueryClient();

  const now = new Date();
  const todayStr = toDateStr(now);
  const viewMonth = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();

  const { data: sessions } = useQuery<Session[]>({
    queryKey: ['sessions', propertyId],
    queryFn: async () => { const { data } = await api.get<Session[]>(`/sessions?property_id=${propertyId}`); return data; },
    enabled: !!propertyId,
  });

  const { data: reservations } = useQuery<Reservation[]>({
    queryKey: ['reservations', propertyId],
    queryFn: async () => { const { data } = await api.get<Reservation[]>(`/ical/reservations/${propertyId}`); return data; },
    enabled: !!propertyId,
  });

  const { data: recentNotes } = useQuery<CleanerNote[]>({
    queryKey: ['cleaner-notes-recent', propertyId],
    queryFn: async () => { const { data } = await api.get<CleanerNote[]>(`/sessions/notes/recent?property_id=${propertyId}&limit=10`); return data; },
    enabled: !!propertyId,
  });

  const syncMutation = useMutation({
    mutationFn: () => api.post(`/ical/sync/${propertyId}`),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      const d = res.data as { synced: number; created: number; updated: number };
      setSyncStatus(`Synced ${d.synced} events (${d.created} new, ${d.updated} updated)`);
      setTimeout(() => setSyncStatus(null), 5000);
    },
    onError: (err: any) => { setSyncStatus(err.response?.data?.error ?? 'Sync failed'); setTimeout(() => setSyncStatus(null), 5000); },
  });

  const createResMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post(`/ical/reservations/${propertyId}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['reservations'] }); setShowAddReservation(false); setResForm({ checkin_date: '', checkout_date: '', guest_name: '', phone: '', num_guests: '', is_blocked: false }); },
  });

  const updateResMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => api.patch(`/ical/reservations/${propertyId}/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['reservations'] }); setEditingRes(null); setSelectedRes(null); },
  });

  const deleteResMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/ical/reservations/${propertyId}/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['reservations'] }); setSelectedRes(null); },
  });

  const clearAllResMutation = useMutation({
    mutationFn: () => api.delete(`/ical/reservations/${propertyId}/all`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reservations'] }),
  });

  // Calendar weeks
  const { weeks, gridStart } = useMemo(() => {
    const firstOfMonth = new Date(year, month, 1);
    const startDay = firstOfMonth.getDay();
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
        week.push(date.getMonth() === month ? toDateStr(date) : null);
      }
      weeks.push(week);
    }
    return { weeks, gridStart };
  }, [year, month]);

  // Span bars
  const weekSpans = useMemo(() => {
    const result: SpanBar[][] = [];
    for (let w = 0; w < weeks.length; w++) {
      const weekStart = new Date(gridStart); weekStart.setDate(weekStart.getDate() + w * 7);
      const weekEnd = new Date(weekStart); weekEnd.setDate(weekEnd.getDate() + 7);
      const bars: SpanBar[] = [];
      for (const r of (reservations ?? [])) {
        const rStart = parseLocalDate(r.checkin_date);
        const rEnd = parseLocalDate(r.checkout_date);
        if (rEnd <= weekStart || rStart >= weekEnd) continue;
        const clampStart = rStart < weekStart ? weekStart : rStart;
        const clampEnd = rEnd > weekEnd ? weekEnd : rEnd;
        let startCol = clampStart.getDay();
        let endCol = clampEnd.getDay();
        if (clampStart.getMonth() !== month && clampEnd.getMonth() !== month) continue;
        if (clampStart.getMonth() !== month) startCol = 0;
        if (endCol === 0) endCol = 7;
        if (endCol <= startCol) continue;
        bars.push({ reservation: r, row: 0, startCol, endCol, startsBeforeWeek: rStart < weekStart, endsAfterWeek: rEnd > weekEnd });
      }
      const rows: number[][] = [];
      for (const bar of bars) {
        let placed = false;
        for (let r = 0; r < rows.length; r++) {
          if (!rows[r].some(c => c >= bar.startCol && c < bar.endCol)) {
            bar.row = r;
            for (let c = bar.startCol; c < bar.endCol; c++) rows[r].push(c);
            placed = true; break;
          }
        }
        if (!placed) { bar.row = rows.length; const cols: number[] = []; for (let c = bar.startCol; c < bar.endCol; c++) cols.push(c); rows.push(cols); }
      }
      result.push(bars);
    }
    return result;
  }, [weeks, gridStart, reservations, month]);

  // Session markers by date
  const sessionsByDate = useMemo(() => {
    const map: Record<string, Session[]> = {};
    for (const s of (sessions ?? [])) { const key = (s.scheduled_date ?? s.created_at).slice(0, 10); if (!map[key]) map[key] = []; map[key].push(s); }
    return map;
  }, [sessions]);

  // Reservation sections
  const nonBlocked = useMemo(() => (reservations ?? []).filter(r => !r.is_blocked), [reservations]);

  const upcomingStays = useMemo(() =>
    nonBlocked.filter(r => parseLocalDate(r.checkin_date) >= now || (parseLocalDate(r.checkin_date) <= now && parseLocalDate(r.checkout_date) > now))
      .sort((a, b) => a.checkin_date.localeCompare(b.checkin_date)).slice(0, 8),
    [nonBlocked, now]);

  const recentStays = useMemo(() =>
    nonBlocked.filter(r => parseLocalDate(r.checkout_date) < now)
      .sort((a, b) => b.checkout_date.localeCompare(a.checkout_date)).slice(0, 3),
    [nonBlocked, now]);

  // Find cleaning session for a reservation
  function findSessionForRes(resId: string): Session | undefined {
    return (sessions ?? []).find(s => s.reservation_id === resId);
  }

  const pendingCount = sessions?.filter(s => s.status === 'pending').length ?? 0;
  const inProgressCount = sessions?.filter(s => s.status === 'in_progress').length ?? 0;
  const reviewCount = sessions?.filter(s => s.status === 'submitted').length ?? 0;

  return (
    <div>
      <h1 style={{ margin: '0 0 8px', fontSize: 24 }}>Dashboard</h1>
      <p style={{ color: '#64748b', margin: '0 0 24px', fontSize: 14 }}>Property calendar and overview</p>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard label="Upcoming Stays" value={upcomingStays.length} color="#10b981" />
        <StatCard label="Pending Cleans" value={pendingCount} color="#3b82f6" />
        <StatCard label="In Progress" value={inProgressCount} color="#f59e0b" />
        <StatCard label="Awaiting Review" value={reviewCount} color="#8b5cf6" />
      </div>

      {/* Sync bar */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '16px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.08)', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontWeight: 600, fontSize: 14 }}>Airbnb Calendar Sync</span>
          <span style={{ fontSize: 12, color: '#64748b', marginLeft: 12 }}>{(reservations ?? []).length} reservations</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {syncStatus && <span style={{ fontSize: 12, color: syncStatus.includes('failed') ? '#ef4444' : '#10b981' }}>{syncStatus}</span>}
          <button onClick={() => setShowAddReservation(true)} style={secondaryBtn}>+ Add Booking</button>
          <button onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending} style={{ ...primaryBtn, opacity: syncMutation.isPending ? 0.6 : 1 }}>
            {syncMutation.isPending ? 'Syncing...' : 'Sync Now'}
          </button>
          <button onClick={() => { if (confirm('Clear all reservations?')) clearAllResMutation.mutate(); }} style={dangerBtn}>Clear All</button>
        </div>
      </div>

      {/* Calendar */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,.08)', marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <button onClick={() => setMonthOffset(o => o - 1)} style={navBtn}>&larr;</button>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{MONTH_NAMES[month]} {year}</div>
            {monthOffset !== 0 && <button onClick={() => setMonthOffset(0)} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: 12, marginTop: 2 }}>Today</button>}
          </div>
          <button onClick={() => setMonthOffset(o => o + 1)} style={navBtn}>&rarr;</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {DAY_NAMES.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 11, color: '#94a3b8', fontWeight: 600, padding: '4px 0', borderBottom: '1px solid #f1f5f9' }}>{d}</div>)}
        </div>
        {weeks.map((week, wi) => {
          const bars = weekSpans[wi] ?? [];
          const maxRow = bars.length > 0 ? Math.max(...bars.map(b => b.row)) + 1 : 0;
          return (
            <div key={wi}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                {week.map((dateStr, di) => {
                  if (!dateStr) return <div key={`e${di}`} style={{ minHeight: 28, borderBottom: '1px solid #f8fafc' }} />;
                  const day = parseInt(dateStr.slice(8));
                  const isToday = dateStr === todayStr;
                  const daySessions = sessionsByDate[dateStr];
                  return (
                    <div key={dateStr} style={{ padding: '4px 6px', minHeight: 28, borderBottom: '1px solid #f8fafc' }}>
                      <div style={{ fontSize: 12, fontWeight: isToday ? 700 : 400, color: isToday ? '#fff' : '#374151', background: isToday ? '#3b82f6' : 'transparent', borderRadius: 10, width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{day}</div>
                      {daySessions?.map(s => <div key={s.id} style={{ fontSize: 8, marginTop: 1, padding: '1px 3px', borderRadius: 2, background: sColor(s.status), color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.cleaner_name ?? 'Clean'}</div>)}
                    </div>
                  );
                })}
              </div>
              {maxRow > 0 && (
                <div style={{ position: 'relative', height: maxRow * 22, marginBottom: 2 }}>
                  {bars.map((bar, bi) => {
                    const r = bar.reservation;
                    const bg = r.is_blocked ? '#fee2e2' : '#d1fae5';
                    const fg = r.is_blocked ? '#991b1b' : '#065f46';
                    const borderColor = r.is_blocked ? '#fca5a5' : '#6ee7b7';
                    const nights = daysBetween(parseLocalDate(r.checkin_date), parseLocalDate(r.checkout_date));
                    const label = r.is_blocked ? 'Blocked' : `${r.guest_name || r.summary || 'Reserved'} (${nights}n)`;
                    return (
                      <div key={`${r.id}-${bi}`} onClick={() => setSelectedRes(r)} style={{
                        position: 'absolute', top: bar.row * 22,
                        left: `calc(${(bar.startCol / 7) * 100}% + 2px)`,
                        width: `calc(${((bar.endCol - bar.startCol) / 7) * 100}% - 4px)`,
                        height: 18, background: bg, border: `1px solid ${borderColor}`,
                        borderRadius: bar.startsBeforeWeek ? '0 4px 4px 0' : bar.endsAfterWeek ? '4px 0 0 4px' : 4,
                        borderLeft: bar.startsBeforeWeek ? 'none' : `1px solid ${borderColor}`,
                        borderRight: bar.endsAfterWeek ? 'none' : `1px solid ${borderColor}`,
                        display: 'flex', alignItems: 'center', padding: '0 6px',
                        fontSize: 10, fontWeight: 600, color: fg, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', cursor: 'pointer',
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
        <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 11, color: '#64748b' }}>
          <span><span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 2, background: '#d1fae5', border: '1px solid #6ee7b7', marginRight: 4, verticalAlign: 'middle' }} />Guest stay</span>
          <span><span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 2, background: '#fee2e2', border: '1px solid #fca5a5', marginRight: 4, verticalAlign: 'middle' }} />Blocked</span>
          <span><span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 2, background: '#3b82f6', marginRight: 4, verticalAlign: 'middle' }} />Cleaning</span>
        </div>
      </div>

      {/* Two-column layout: Upcoming + Recent / Notes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* Upcoming Stays */}
        <div style={cardStyle}>
          <h2 style={{ margin: '0 0 16px', fontSize: 18 }}>Upcoming Stays</h2>
          {upcomingStays.length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: 14 }}>No upcoming stays</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {upcomingStays.map(r => {
                const nights = daysBetween(parseLocalDate(r.checkin_date), parseLocalDate(r.checkout_date));
                const daysUntil = daysBetween(now, parseLocalDate(r.checkin_date));
                const session = findSessionForRes(r.id);
                const isCurrentStay = parseLocalDate(r.checkin_date) <= now && parseLocalDate(r.checkout_date) > now;
                return (
                  <div key={r.id} onClick={() => setSelectedRes(r)}
                    style={{ padding: '12px 16px', background: isCurrentStay ? '#f0fdf4' : '#f8fafc', borderRadius: 10, cursor: 'pointer', border: isCurrentStay ? '1px solid #86efac' : '1px solid #e2e8f0', transition: 'box-shadow .15s', }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{r.guest_name || r.summary || 'Reserved'}</span>
                      {isCurrentStay ? (
                        <span style={badgeStyle('#10b981')}>Current Guest</span>
                      ) : daysUntil <= 2 ? (
                        <span style={badgeStyle('#f59e0b')}>{daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil} days`}</span>
                      ) : (
                        <span style={{ fontSize: 11, color: '#94a3b8' }}>{daysUntil} days</span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>
                      {fmtShort(r.checkin_date)} &rarr; {fmtShort(r.checkout_date)} &middot; {nights} nights
                      {r.num_guests ? ` \u00B7 ${r.num_guests} guests` : ''}
                    </div>
                    {session && (
                      <div style={{ marginTop: 6, fontSize: 11 }}>
                        <span style={{ ...badgeStyle(sColor(session.status)), fontSize: 10 }}>Cleaning: {session.status.replace('_', ' ')}</span>
                        {session.cleaner_name && <span style={{ marginLeft: 8, color: '#64748b' }}>{session.cleaner_name}</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Stays + Cleaner Notes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Last 2-3 stays */}
          <div style={cardStyle}>
            <h2 style={{ margin: '0 0 16px', fontSize: 18 }}>Recent Stays</h2>
            {recentStays.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: 14 }}>No past stays yet</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {recentStays.map(r => {
                  const nights = daysBetween(parseLocalDate(r.checkin_date), parseLocalDate(r.checkout_date));
                  const session = findSessionForRes(r.id);
                  return (
                    <div key={r.id} onClick={() => setSelectedRes(r)}
                      style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: 10, cursor: 'pointer', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontWeight: 600, fontSize: 14 }}>{r.guest_name || r.summary || 'Reserved'}</span>
                        {session ? (
                          <span style={{ ...badgeStyle(sColor(session.status)), fontSize: 10 }}>
                            {session.status === 'approved' ? 'Cleaned' : session.status.replace('_', ' ')}
                            {session.compliance_score ? ` (${session.compliance_score}%)` : ''}
                          </span>
                        ) : (
                          <span style={{ ...badgeStyle('#94a3b8'), fontSize: 10 }}>No cleaning</span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>
                        {fmtShort(r.checkin_date)} &rarr; {fmtShort(r.checkout_date)} &middot; {nights} nights
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Cleaner Notes */}
          <div style={cardStyle}>
            <h2 style={{ margin: '0 0 16px', fontSize: 18 }}>Cleaner Notes</h2>
            {(recentNotes ?? []).length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: 14 }}>No cleaner notes yet</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(recentNotes ?? []).map(n => (
                  <div key={n.id} style={{ padding: '10px 14px', background: '#fffbeb', borderRadius: 8, border: '1px solid #fde68a' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, fontSize: 13, color: '#92400e' }}>{n.author_name}</span>
                      <span style={{ fontSize: 10, color: '#94a3b8' }}>{new Date(n.created_at).toLocaleDateString()}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 13, color: '#374151' }}>{n.note}</p>
                    {n.guest_name && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Re: {n.guest_name} ({fmtShort(n.checkin_date!)} stay)</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reservation detail modal */}
      {selectedRes && !editingRes && (
        <div style={overlayStyle} onClick={() => setSelectedRes(null)}>
          <div style={modalStyle} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 20 }}>
                {selectedRes.is_blocked ? 'Blocked Dates' : (selectedRes.guest_name || selectedRes.summary || 'Reservation')}
              </h2>
              <button onClick={() => setSelectedRes(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#94a3b8' }}>&times;</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div>
                <div style={detailLabel}>Check-in</div>
                <div style={detailValue}>{fmtShort(selectedRes.checkin_date)}</div>
              </div>
              <div>
                <div style={detailLabel}>Check-out</div>
                <div style={detailValue}>{fmtShort(selectedRes.checkout_date)}</div>
              </div>
              <div>
                <div style={detailLabel}>Nights</div>
                <div style={detailValue}>{daysBetween(parseLocalDate(selectedRes.checkin_date), parseLocalDate(selectedRes.checkout_date))}</div>
              </div>
              <div>
                <div style={detailLabel}>Guests</div>
                <div style={detailValue}>{selectedRes.num_guests ?? '--'}</div>
              </div>
              {selectedRes.phone && (
                <div>
                  <div style={detailLabel}>Phone</div>
                  <div style={detailValue}>{selectedRes.phone}</div>
                </div>
              )}
              {selectedRes.source && (
                <div>
                  <div style={detailLabel}>Source</div>
                  <div style={detailValue}>{selectedRes.source}</div>
                </div>
              )}
            </div>

            {selectedRes.description && (
              <div style={{ marginBottom: 16 }}>
                <div style={detailLabel}>Description</div>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#374151' }}>{selectedRes.description}</p>
              </div>
            )}

            {/* Cleaning record for this reservation */}
            {(() => {
              const session = findSessionForRes(selectedRes.id);
              if (!session) return (
                <div style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: 8, marginBottom: 16, fontSize: 13, color: '#94a3b8' }}>
                  No cleaning record for this stay
                </div>
              );
              return (
                <div style={{ padding: '12px 16px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0', marginBottom: 16 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6, color: '#166534' }}>Cleaning Record</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13 }}>
                    <div><span style={{ color: '#64748b' }}>Status:</span> <span style={{ fontWeight: 600 }}>{session.status.replace('_', ' ')}</span></div>
                    <div><span style={{ color: '#64748b' }}>Cleaner:</span> <span style={{ fontWeight: 600 }}>{session.cleaner_name ?? 'Unassigned'}</span></div>
                    {session.compliance_score != null && <div><span style={{ color: '#64748b' }}>Score:</span> <span style={{ fontWeight: 600 }}>{session.compliance_score}%</span></div>}
                    {session.cleaner_start_time && <div><span style={{ color: '#64748b' }}>Duration:</span> <span style={{ fontWeight: 600 }}>
                      {session.cleaner_end_time ? `${Math.round((new Date(session.cleaner_end_time).getTime() - new Date(session.cleaner_start_time).getTime()) / 60000)} min` : 'In progress'}
                    </span></div>}
                  </div>
                </div>
              );
            })()}

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { setEditingRes(selectedRes); setResForm({ checkin_date: selectedRes.checkin_date.slice(0,10), checkout_date: selectedRes.checkout_date.slice(0,10), guest_name: selectedRes.guest_name ?? '', phone: selectedRes.phone ?? '', num_guests: selectedRes.num_guests?.toString() ?? '', is_blocked: selectedRes.is_blocked }); }}
                style={primaryBtn}>Edit</button>
              <button onClick={() => { if (confirm('Delete this reservation?')) deleteResMutation.mutate(selectedRes.id); }}
                style={dangerBtn}>Delete</button>
              <button onClick={() => setSelectedRes(null)} style={secondaryBtn}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Add reservation modal */}
      {showAddReservation && (
        <div style={overlayStyle} onClick={() => setShowAddReservation(false)}>
          <div style={modalStyle} onClick={e => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 16px', fontSize: 18 }}>Add Booking</h2>
            <label style={lblSt}>Check-in Date *</label>
            <input type="date" value={resForm.checkin_date} onChange={e => setResForm({ ...resForm, checkin_date: e.target.value })} style={inpSt} />
            <label style={lblSt}>Check-out Date *</label>
            <input type="date" value={resForm.checkout_date} onChange={e => setResForm({ ...resForm, checkout_date: e.target.value })} style={inpSt} />
            <label style={lblSt}>Guest Name</label>
            <input value={resForm.guest_name} onChange={e => setResForm({ ...resForm, guest_name: e.target.value })} style={inpSt} />
            <label style={lblSt}>Phone</label>
            <input value={resForm.phone} onChange={e => setResForm({ ...resForm, phone: e.target.value })} style={inpSt} />
            <label style={lblSt}>Number of Guests</label>
            <input type="number" value={resForm.num_guests} onChange={e => setResForm({ ...resForm, num_guests: e.target.value })} style={inpSt} />
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, fontSize: 13, fontWeight: 500 }}>
              <input type="checkbox" checked={resForm.is_blocked} onChange={e => setResForm({ ...resForm, is_blocked: e.target.checked })} /> Blocked dates
            </label>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button onClick={() => setShowAddReservation(false)} style={secondaryBtn}>Cancel</button>
              <button disabled={!resForm.checkin_date || !resForm.checkout_date}
                onClick={() => createResMutation.mutate({ checkin_date: resForm.checkin_date, checkout_date: resForm.checkout_date, guest_name: resForm.guest_name || null, phone: resForm.phone || null, num_guests: resForm.num_guests ? parseInt(resForm.num_guests) : null, is_blocked: resForm.is_blocked, summary: resForm.is_blocked ? 'Blocked' : (resForm.guest_name || 'Manual booking') })}
                style={primaryBtn}>Add Booking</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit reservation modal */}
      {editingRes && (
        <div style={overlayStyle} onClick={() => { setEditingRes(null); setSelectedRes(null); }}>
          <div style={modalStyle} onClick={e => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 16px', fontSize: 18 }}>Edit Reservation</h2>
            <label style={lblSt}>Check-in Date</label>
            <input type="date" value={resForm.checkin_date} onChange={e => setResForm({ ...resForm, checkin_date: e.target.value })} style={inpSt} />
            <label style={lblSt}>Check-out Date</label>
            <input type="date" value={resForm.checkout_date} onChange={e => setResForm({ ...resForm, checkout_date: e.target.value })} style={inpSt} />
            <label style={lblSt}>Guest Name</label>
            <input value={resForm.guest_name} onChange={e => setResForm({ ...resForm, guest_name: e.target.value })} style={inpSt} />
            <label style={lblSt}>Phone</label>
            <input value={resForm.phone} onChange={e => setResForm({ ...resForm, phone: e.target.value })} style={inpSt} />
            <label style={lblSt}>Number of Guests</label>
            <input type="number" value={resForm.num_guests} onChange={e => setResForm({ ...resForm, num_guests: e.target.value })} style={inpSt} />
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, fontSize: 13, fontWeight: 500 }}>
              <input type="checkbox" checked={resForm.is_blocked} onChange={e => setResForm({ ...resForm, is_blocked: e.target.checked })} /> Blocked dates
            </label>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button onClick={() => { setEditingRes(null); setSelectedRes(null); }} style={secondaryBtn}>Cancel</button>
              <button onClick={() => updateResMutation.mutate({ id: editingRes.id, data: { checkin_date: resForm.checkin_date, checkout_date: resForm.checkout_date, guest_name: resForm.guest_name || null, phone: resForm.phone || null, num_guests: resForm.num_guests ? parseInt(resForm.num_guests) : null, is_blocked: resForm.is_blocked } })}
                style={primaryBtn}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
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

function badgeStyle(bg: string): React.CSSProperties {
  return { display: 'inline-block', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10, color: '#fff', background: bg };
}

function sColor(s: string) {
  const map: Record<string, string> = { pending: '#f59e0b', in_progress: '#3b82f6', submitted: '#8b5cf6', approved: '#10b981', rejected: '#ef4444' };
  return map[s] ?? '#6b7280';
}

const primaryBtn: React.CSSProperties = { background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' };
const secondaryBtn: React.CSSProperties = { background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' };
const dangerBtn: React.CSSProperties = { background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' };
const navBtn: React.CSSProperties = { background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 16, fontWeight: 600, color: '#374151' };
const cardStyle: React.CSSProperties = { background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,.08)' };
const overlayStyle: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 };
const modalStyle: React.CSSProperties = { background: '#fff', borderRadius: 16, padding: 32, width: 520, maxHeight: '90vh', overflowY: 'auto' };
const lblSt: React.CSSProperties = { display: 'block', fontWeight: 500, fontSize: 13, marginBottom: 4, color: '#374151' };
const inpSt: React.CSSProperties = { display: 'block', width: '100%', padding: '8px 10px', marginBottom: 14, border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' };
const detailLabel: React.CSSProperties = { fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' };
const detailValue: React.CSSProperties = { fontSize: 15, fontWeight: 600, color: '#1e293b', marginTop: 2 };
