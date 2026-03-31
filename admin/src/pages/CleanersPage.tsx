import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../lib/api';
import { useSelectedProperty } from '../components/PropertySwitcher';

interface CleanerRow {
  id: string;
  name: string;
  email: string;
  active: boolean;
  total_sessions: number;
  avg_compliance: number;
  last_session_date?: string;
  assigned_properties: Array<{ id: string; name: string }>;
}

interface PerformanceData {
  compliance_history: Array<{ id: string; compliance_score: number; created_at: string; property_name: string }>;
  duration_by_property: Array<{ property_name: string; avg_minutes: number }>;
  task_rate_by_room: Array<{ display_name: string; completed_tasks: number; total_tasks: number }>;
  photo_submission_rate: number;
  total_sessions: number;
  issue_count: number;
}

interface CompareData {
  cleaner1: { compliance: number; speed: number; photo_rate: number; issue_rate: number; total_sessions: number };
  cleaner2: { compliance: number; speed: number; photo_rate: number; issue_rate: number; total_sessions: number };
}

interface Assignment {
  id: string;
  user_id: string;
  priority: number;
  is_primary: boolean;
  is_active: boolean;
  notes: string | null;
  name: string;
  email: string;
}

type ViewMode = 'performance' | 'assignments';

export default function CleanersPage() {
  const { propertyId } = useSelectedProperty();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('performance');
  const [compareMode, setCompareMode] = useState(false);
  const [compare1, setCompare1] = useState('');
  const [compare2, setCompare2] = useState('');
  const [comparePropId, setComparePropId] = useState('');

  const { data: cleaners } = useQuery<CleanerRow[]>({
    queryKey: ['cleaners'],
    queryFn: async () => {
      const { data } = await api.get<CleanerRow[]>('/admin/cleaners');
      return data;
    },
  });

  const { data: perf } = useQuery<PerformanceData>({
    queryKey: ['cleaner-perf', selectedId],
    queryFn: async () => {
      const { data } = await api.get<PerformanceData>(`/admin/cleaners/${selectedId}/performance`);
      return data;
    },
    enabled: !!selectedId,
  });

  const { data: compareData } = useQuery<CompareData>({
    queryKey: ['cleaner-compare', compare1, compare2, comparePropId],
    queryFn: async () => {
      const { data } = await api.get<CompareData>(
        `/admin/cleaners/compare?cleaner1=${compare1}&cleaner2=${compare2}&property_id=${comparePropId}`
      );
      return data;
    },
    enabled: !!compare1 && !!compare2 && !!comparePropId && compareMode,
  });

  const { data: assignments } = useQuery<Assignment[]>({
    queryKey: ['cleaner-assignments', propertyId],
    queryFn: async () => {
      const { data } = await api.get<Assignment[]>(`/admin/cleaners/assignments/${propertyId}`);
      return data;
    },
    enabled: !!propertyId && viewMode === 'assignments',
  });

  const updateAssignment = useMutation({
    mutationFn: ({ id, ...body }: { id: string; priority?: number; is_primary?: boolean; is_active?: boolean }) =>
      api.patch(`/admin/cleaners/assignments/${id}`, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cleaner-assignments', propertyId] }),
  });

  const addAssignment = useMutation({
    mutationFn: (body: { property_id: string; user_id: string; priority: number; is_primary: boolean }) =>
      api.post('/admin/cleaners/assignments', body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cleaner-assignments', propertyId] }),
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 22 }}>Cleaners</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => { setViewMode(viewMode === 'assignments' ? 'performance' : 'assignments'); setCompareMode(false); setSelectedId(null); }}
            style={{ background: viewMode === 'assignments' ? '#10b981' : '#e2e8f0', color: viewMode === 'assignments' ? '#fff' : '#475569', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            {viewMode === 'assignments' ? 'Property Assignments' : 'Assignments'}
          </button>
          {viewMode === 'performance' && (
            <button onClick={() => { setCompareMode(!compareMode); setSelectedId(null); }}
              style={{ background: compareMode ? '#6b7280' : '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              {compareMode ? 'Back to List' : 'Compare Cleaners'}
            </button>
          )}
        </div>
      </div>

      {viewMode === 'assignments' ? (
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
          <h2 style={{ margin: '0 0 4px', fontSize: 16 }}>Cleaner Priority for Selected Property</h2>
          <p style={{ color: '#94a3b8', fontSize: 12, margin: '0 0 16px' }}>Default cleaner is priority 0. Backups are 1, 2, etc. Lower number = higher priority.</p>
          {!propertyId ? (
            <p style={{ color: '#94a3b8' }}>Select a property in the sidebar first.</p>
          ) : (
            <>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 16 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                    <th style={thSt}>Priority</th>
                    <th style={thSt}>Cleaner</th>
                    <th style={thSt}>Role</th>
                    <th style={thSt}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(assignments ?? []).map(a => (
                    <tr key={a.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={tdSt}>
                        <select value={a.priority} onChange={e => updateAssignment.mutate({ id: a.id, priority: parseInt(e.target.value) })}
                          style={{ padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, width: 60 }}>
                          {[0,1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                      </td>
                      <td style={tdSt}>
                        <div style={{ fontWeight: 600 }}>{a.name}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{a.email}</div>
                      </td>
                      <td style={tdSt}>
                        {a.priority === 0 ? (
                          <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: '#dcfce7', color: '#166534' }}>Default</span>
                        ) : (
                          <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: '#f1f5f9', color: '#64748b' }}>Backup {a.priority}</span>
                        )}
                      </td>
                      <td style={tdSt}>
                        <button onClick={() => updateAssignment.mutate({ id: a.id, is_active: false })}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 12 }}>Remove</button>
                      </td>
                    </tr>
                  ))}
                  {(assignments ?? []).length === 0 && (
                    <tr><td colSpan={4} style={{ ...tdSt, color: '#94a3b8', textAlign: 'center' }}>No cleaners assigned to this property</td></tr>
                  )}
                </tbody>
              </table>

              {/* Add cleaner */}
              {(() => {
                const assignedIds = new Set((assignments ?? []).map(a => a.user_id));
                const available = (cleaners ?? []).filter(c => !assignedIds.has(c.id));
                if (available.length === 0) return null;
                return (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <select id="add-cleaner-select" style={{ padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, flex: 1 }}>
                      {available.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <button onClick={() => {
                      const sel = document.getElementById('add-cleaner-select') as HTMLSelectElement;
                      if (!sel?.value || !propertyId) return;
                      const nextPriority = (assignments ?? []).length;
                      addAssignment.mutate({ property_id: propertyId, user_id: sel.value, priority: nextPriority, is_primary: nextPriority === 0 });
                    }}
                      style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                      Add Cleaner
                    </button>
                  </div>
                );
              })()}
            </>
          )}
        </div>
      ) : !compareMode ? (
        <div style={{ display: 'grid', gridTemplateColumns: selectedId ? '300px 1fr' : '1fr', gap: 24 }}>
          {/* Cleaner list */}
          <div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                  <th style={thSt}>Name</th>
                  <th style={thSt}>Sessions</th>
                  <th style={thSt}>Avg Score</th>
                </tr>
              </thead>
              <tbody>
                {(cleaners ?? []).map(c => (
                  <tr key={c.id} onClick={() => setSelectedId(c.id)}
                    style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', background: selectedId === c.id ? '#eff6ff' : 'transparent' }}>
                    <td style={tdSt}>
                      <div style={{ fontWeight: 600 }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>
                        {(c.assigned_properties ?? []).map(p => p.name).join(', ') || 'No properties'}
                      </div>
                    </td>
                    <td style={tdSt}>{c.total_sessions}</td>
                    <td style={tdSt}>{c.avg_compliance ? `${Math.round(Number(c.avg_compliance))}%` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Performance profile */}
          {selectedId && perf && (
            <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
              <h2 style={{ margin: '0 0 20px', fontSize: 18 }}>Performance Profile</h2>

              {perf.total_sessions === 0 ? (
                <p style={{ color: '#94a3b8' }}>No completed sessions yet</p>
              ) : (
                <>
                  {/* Summary stats */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
                    <MiniStat label="Photo Rate" value={`${perf.photo_submission_rate}%`} />
                    <MiniStat label="Total Sessions" value={String(perf.total_sessions)} />
                    <MiniStat label="Issues Flagged" value={String(perf.issue_count)} />
                  </div>

                  {/* Compliance history */}
                  <h3 style={{ fontSize: 14, marginBottom: 12 }}>Compliance Score (Last 12 Sessions)</h3>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 80, marginBottom: 24 }}>
                    {perf.compliance_history.slice().reverse().map(s => {
                      const score = s.compliance_score ?? 0;
                      return (
                        <div key={s.id} title={`${score}% — ${new Date(s.created_at).toLocaleDateString()}`}
                          style={{ flex: 1, background: score >= 85 ? '#10b981' : score >= 70 ? '#f59e0b' : '#ef4444',
                            height: `${score}%`, borderRadius: '3px 3px 0 0', minWidth: 8 }} />
                      );
                    })}
                  </div>

                  {/* Duration by property */}
                  <h3 style={{ fontSize: 14, marginBottom: 8 }}>Avg Duration by Property</h3>
                  {perf.duration_by_property.map(d => (
                    <div key={d.property_name} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                      <span style={{ fontSize: 13, minWidth: 120 }}>{d.property_name}</span>
                      <div style={{ flex: 1, height: 8, background: '#f1f5f9', borderRadius: 4 }}>
                        <div style={{ height: '100%', width: `${Math.min((Number(d.avg_minutes) / 120) * 100, 100)}%`, background: '#3b82f6', borderRadius: 4 }} />
                      </div>
                      <span style={{ fontSize: 12, color: '#64748b', minWidth: 50 }}>{Math.round(Number(d.avg_minutes))}m</span>
                    </div>
                  ))}

                  {/* Task rate by room */}
                  <h3 style={{ fontSize: 14, margin: '20px 0 8px' }}>Task Completion by Room</h3>
                  {perf.task_rate_by_room.map(r => {
                    const pct = Number(r.total_tasks) > 0 ? Math.round((Number(r.completed_tasks) / Number(r.total_tasks)) * 100) : 0;
                    return (
                      <div key={r.display_name} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                        <span style={{ fontSize: 13, minWidth: 120 }}>{r.display_name}</span>
                        <div style={{ flex: 1, height: 8, background: '#f1f5f9', borderRadius: 4 }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: pct >= 90 ? '#10b981' : '#f59e0b', borderRadius: 4 }} />
                        </div>
                        <span style={{ fontSize: 12, color: '#64748b', minWidth: 40 }}>{pct}%</span>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Compare mode */
        <div style={{ background: '#fff', borderRadius: 12, padding: 24 }}>
          <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
            <select value={compare1} onChange={e => setCompare1(e.target.value)} style={selectSt}>
              <option value="">Select Cleaner 1</option>
              {(cleaners ?? []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <span style={{ alignSelf: 'center', fontWeight: 600, color: '#64748b' }}>vs</span>
            <select value={compare2} onChange={e => setCompare2(e.target.value)} style={selectSt}>
              <option value="">Select Cleaner 2</option>
              {(cleaners ?? []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={comparePropId} onChange={e => setComparePropId(e.target.value)} style={selectSt}>
              <option value="">Select Property</option>
              {Array.from(new Map((cleaners ?? []).flatMap(c => (c.assigned_properties ?? []).map(p => [p.id, p.name]))).entries())
                .map(([id, name]) => <option key={id} value={id}>{name}</option>)}
            </select>
          </div>

          {compareData && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              {(['compliance', 'speed', 'photo_rate', 'issue_rate'] as const).map(metric => {
                const v1 = compareData.cleaner1[metric];
                const v2 = compareData.cleaner2[metric];
                const name1 = cleaners?.find(c => c.id === compare1)?.name ?? 'Cleaner 1';
                const name2 = cleaners?.find(c => c.id === compare2)?.name ?? 'Cleaner 2';
                const label = metric === 'compliance' ? 'Compliance %' : metric === 'speed' ? 'Avg Minutes' : metric === 'photo_rate' ? 'Photo Rate %' : 'Issue Rate %';
                const better1 = metric === 'speed' ? v1 < v2 : metric === 'issue_rate' ? v1 < v2 : v1 > v2;
                return (
                  <div key={metric} style={{ padding: 16, background: '#f8fafc', borderRadius: 10 }}>
                    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>{label}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div style={{ fontWeight: better1 ? 700 : 400, color: better1 ? '#10b981' : '#64748b' }}>
                        {name1}: {Math.round(v1)}
                      </div>
                      <div style={{ fontWeight: !better1 ? 700 : 400, color: !better1 ? '#10b981' : '#64748b' }}>
                        {name2}: {Math.round(v2)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: '#f8fafc', borderRadius: 10, padding: 14, textAlign: 'center' }}>
      <div style={{ fontSize: 22, fontWeight: 700 }}>{value}</div>
      <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{label}</div>
    </div>
  );
}

const thSt: React.CSSProperties = { padding: '8px 10px', fontSize: 12, color: '#64748b', fontWeight: 500 };
const tdSt: React.CSSProperties = { padding: '10px 10px' };
const selectSt: React.CSSProperties = { padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, flex: 1 };
