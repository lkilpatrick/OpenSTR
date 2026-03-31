import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../lib/api';
import { useSelectedProperty } from '../components/PropertySwitcher';

interface Session {
  id: string;
  property_name: string;
  session_type: string;
  status: string;
  cleaner_name?: string;
  submitted_at?: string;
  cleaner_start_time?: string;
  cleaner_end_time?: string;
  compliance_score?: number;
}

interface RoomClean {
  id: string;
  room_id: string;
  display_name: string;
  slug: string;
  display_order: number;
}

interface Photo {
  id: string;
  type: 'before' | 'after';
  storage_path: string;
  uploaded_at: string;
}

interface TaskCompletion {
  id: string;
  task_id: string;
  label: string;
  completed: boolean;
  notes?: string;
}

type StatusFilter = 'all' | 'pending' | 'in_progress' | 'submitted' | 'approved' | 'rejected';

export default function SessionsPage() {
  const { propertyId } = useSelectedProperty();
  const [selected, setSelected] = useState<Session | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [expandedRoom, setExpandedRoom] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  const { data: sessions } = useQuery<Session[]>({
    queryKey: ['sessions-all', propertyId],
    queryFn: async () => {
      const { data } = await api.get<Session[]>(`/sessions?property_id=${propertyId}`);
      return data;
    },
    enabled: !!propertyId,
  });

  const { data: roomCleans } = useQuery<RoomClean[]>({
    queryKey: ['session-rooms', selected?.id],
    queryFn: async () => {
      const { data } = await api.get<RoomClean[]>(`/sessions/${selected!.id}/rooms`);
      return data;
    },
    enabled: !!selected,
  });

  const { data: roomPhotos } = useQuery<Photo[]>({
    queryKey: ['room-photos', expandedRoom],
    queryFn: async () => {
      const { data } = await api.get<Photo[]>(`/photos/${expandedRoom}`);
      return data;
    },
    enabled: !!expandedRoom,
  });

  const { data: roomTasks } = useQuery<TaskCompletion[]>({
    queryKey: ['room-tasks', expandedRoom],
    queryFn: async () => {
      const { data } = await api.get<TaskCompletion[]>(`/photos/${expandedRoom}/tasks`);
      return data;
    },
    enabled: !!expandedRoom,
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: string; reason?: string }) =>
      api.patch(`/sessions/${id}/status`, { status, rejection_reason: reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions-all'] });
      setSelected(null);
      setRejectId(null);
      setRejectReason('');
      setBulkSelected(new Set());
    },
  });

  const bulkApproveMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map(id => api.patch(`/sessions/${id}/status`, { status: 'approved' })));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions-all'] });
      setBulkSelected(new Set());
    },
  });

  const filtered = (sessions ?? []).filter(s => statusFilter === 'all' || s.status === statusFilter);
  const beforePhotos = (roomPhotos ?? []).filter(p => p.type === 'before');
  const afterPhotos = (roomPhotos ?? []).filter(p => p.type === 'after');

  function toggleBulk(id: string) {
    const next = new Set(bulkSelected);
    next.has(id) ? next.delete(id) : next.add(id);
    setBulkSelected(next);
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap: 24 }}>
      {/* Session list */}
      <div>
        <h1 style={{ margin: '0 0 16px', fontSize: 22 }}>Session Review</h1>

        {/* Filter bar */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          {(['all', 'pending', 'in_progress', 'submitted', 'approved', 'rejected'] as StatusFilter[]).map(f => (
            <button key={f} onClick={() => setStatusFilter(f)} style={{
              padding: '5px 14px', borderRadius: 20, border: 'none', fontSize: 12, fontWeight: 500, cursor: 'pointer',
              background: statusFilter === f ? '#3b82f6' : '#e2e8f0', color: statusFilter === f ? '#fff' : '#475569',
            }}>
              {f === 'all' ? 'All' : f.replace('_', ' ')}
            </button>
          ))}
          {bulkSelected.size > 0 && (
            <button onClick={() => bulkApproveMutation.mutate(Array.from(bulkSelected))} style={{ ...actionBtn, background: '#10b981', padding: '5px 14px', fontSize: 12 }}>
              Bulk Approve ({bulkSelected.size})
            </button>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((s) => (
            <div key={s.id} style={{ ...cardStyle, cursor: 'pointer', outline: selected?.id === s.id ? '2px solid #3b82f6' : 'none' }}>
              {s.status === 'submitted' && (
                <input type="checkbox" checked={bulkSelected.has(s.id)} onChange={() => toggleBulk(s.id)}
                  onClick={e => e.stopPropagation()} style={{ marginRight: 8 }} />
              )}
              <div style={{ flex: 1 }} onClick={() => { setSelected(s); setExpandedRoom(null); }}>
                <div style={{ fontWeight: 600 }}>{s.session_type} · {s.cleaner_name ?? 'Unassigned'}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                  {s.submitted_at ? `Submitted ${new Date(s.submitted_at).toLocaleDateString()}` : 'Not submitted'}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {s.compliance_score != null && <ComplianceBadge score={s.compliance_score} />}
                <span style={{ ...badgeStyle, background: statusColor(s.status) }}>{s.status.replace('_', ' ')}</span>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p style={{ color: '#94a3b8' }}>No sessions match filter</p>}
        </div>
      </div>

      {/* Session detail / photo comparison */}
      {selected && (
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, overflowY: 'auto', maxHeight: 'calc(100vh - 96px)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <h2 style={{ margin: '0 0 4px', fontSize: 18 }}>{selected.property_name}</h2>
              <p style={{ fontSize: 13, color: '#666', margin: 0 }}>
                {selected.session_type} · {selected.cleaner_name ?? 'Unassigned'}
                {selected.cleaner_start_time && selected.cleaner_end_time && ` · ${durationStr(selected.cleaner_start_time, selected.cleaner_end_time)}`}
              </p>
            </div>
            {selected.compliance_score != null && <ComplianceBadge score={selected.compliance_score} large />}
          </div>

          {/* Per-room accordion */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
            {(roomCleans ?? []).map(rc => {
              const isOpen = expandedRoom === rc.id;
              return (
                <div key={rc.id} style={{ border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
                  <button onClick={() => setExpandedRoom(isOpen ? null : rc.id)} style={{
                    width: '100%', padding: '12px 16px', background: isOpen ? '#f1f5f9' : '#fff',
                    border: 'none', textAlign: 'left', cursor: 'pointer', fontWeight: 600, fontSize: 14,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    {rc.display_name}
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>{isOpen ? '▲' : '▼'}</span>
                  </button>

                  {isOpen && (
                    <div style={{ padding: 16, borderTop: '1px solid #e2e8f0' }}>
                      {/* Before / After photos */}
                      <h4 style={{ margin: '0 0 12px', fontSize: 13, color: '#64748b' }}>Photos</h4>
                      {beforePhotos.length === 0 && afterPhotos.length === 0 ? (
                        <p style={{ fontSize: 13, color: '#94a3b8' }}>No photos uploaded</p>
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: '#f59e0b', marginBottom: 6 }}>BEFORE</div>
                            {beforePhotos.map(p => (
                              <img key={p.id} src={p.storage_path} alt="Before" style={{ width: '100%', borderRadius: 8, marginBottom: 8, background: '#f1f5f9', minHeight: 120, objectFit: 'cover' }} />
                            ))}
                            {beforePhotos.length === 0 && <div style={{ padding: 24, background: '#f8fafc', borderRadius: 8, textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>No before photos</div>}
                          </div>
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: '#10b981', marginBottom: 6 }}>AFTER</div>
                            {afterPhotos.map(p => (
                              <img key={p.id} src={p.storage_path} alt="After" style={{ width: '100%', borderRadius: 8, marginBottom: 8, background: '#f1f5f9', minHeight: 120, objectFit: 'cover' }} />
                            ))}
                            {afterPhotos.length === 0 && <div style={{ padding: 24, background: '#f8fafc', borderRadius: 8, textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>No after photos</div>}
                          </div>
                        </div>
                      )}

                      {/* Task completions */}
                      <h4 style={{ margin: '0 0 8px', fontSize: 13, color: '#64748b' }}>Tasks</h4>
                      {(roomTasks ?? []).length === 0 ? (
                        <p style={{ fontSize: 13, color: '#94a3b8' }}>No task data</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {(roomTasks ?? []).map(t => (
                            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                              <span style={{ color: t.completed ? '#10b981' : '#ef4444' }}>{t.completed ? '✓' : '✗'}</span>
                              <span>{t.label}</span>
                              {t.notes && <span style={{ color: '#94a3b8', fontSize: 11 }}>— {t.notes}</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Reject modal */}
          {rejectId && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: 16, marginBottom: 16 }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Rejection Reason (required)</label>
              <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                style={{ width: '100%', padding: 8, border: '1px solid #fca5a5', borderRadius: 6, fontSize: 13, minHeight: 60, boxSizing: 'border-box' }}
                placeholder="Explain what needs to be redone..." />
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button disabled={!rejectReason.trim()} onClick={() => reviewMutation.mutate({ id: rejectId, status: 'rejected', reason: rejectReason })}
                  style={{ ...actionBtn, background: rejectReason.trim() ? '#ef4444' : '#d1d5db', fontSize: 13, padding: '6px 14px' }}>
                  Confirm Reject
                </button>
                <button onClick={() => { setRejectId(null); setRejectReason(''); }}
                  style={{ ...actionBtn, background: '#6b7280', fontSize: 13, padding: '6px 14px' }}>Cancel</button>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 12 }}>
            {selected.status === 'submitted' && (
              <>
                <button onClick={() => reviewMutation.mutate({ id: selected.id, status: 'approved' })}
                  style={{ ...actionBtn, background: '#10b981' }}>Approve</button>
                <button onClick={() => setRejectId(selected.id)}
                  style={{ ...actionBtn, background: '#ef4444' }}>Reject</button>
              </>
            )}
            <button onClick={() => { setSelected(null); setExpandedRoom(null); }}
              style={{ ...actionBtn, background: '#6b7280' }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

function ComplianceBadge({ score, large }: { score: number; large?: boolean }) {
  const { label, bg } = score >= 95
    ? { label: 'Gold', bg: '#f59e0b' }
    : score >= 85
    ? { label: 'Good', bg: '#10b981' }
    : score >= 70
    ? { label: 'Needs Improvement', bg: '#f97316' }
    : { label: 'Below Standard', bg: '#ef4444' };

  return (
    <span style={{
      background: bg, color: '#fff', borderRadius: 12, fontWeight: 700,
      padding: large ? '4px 14px' : '2px 10px', fontSize: large ? 14 : 11,
    }}>
      {score}% {label}
    </span>
  );
}

function durationStr(start: string, end: string): string {
  const mins = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function statusColor(s: string) {
  const map: Record<string, string> = { pending: '#f59e0b', in_progress: '#3b82f6', submitted: '#8b5cf6', approved: '#10b981', rejected: '#ef4444' };
  return map[s] ?? '#6b7280';
}

const cardStyle: React.CSSProperties = { background: '#fff', borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,.07)' };
const badgeStyle: React.CSSProperties = { color: '#fff', fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 12, textTransform: 'capitalize' as const };
const actionBtn: React.CSSProperties = { color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 600, cursor: 'pointer', fontSize: 14 };
