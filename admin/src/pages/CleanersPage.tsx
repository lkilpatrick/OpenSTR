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
  cleaning_rate?: string;
  ytd_sessions?: number;
  assigned_properties: Array<{ id: string; name: string }>;
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

type ViewMode = 'pay' | 'assignments';

export default function CleanersPage() {
  const { propertyId } = useSelectedProperty();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<ViewMode>('pay');

  const { data: cleaners } = useQuery<CleanerRow[]>({
    queryKey: ['cleaners'],
    queryFn: async () => {
      const { data } = await api.get<CleanerRow[]>('/admin/cleaners');
      return data;
    },
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
        <h1 style={{ margin: 0, fontSize: 22 }}>Cleaner Pay</h1>
        <button onClick={() => setViewMode(viewMode === 'assignments' ? 'pay' : 'assignments')}
          style={{ background: viewMode === 'assignments' ? '#10b981' : '#e2e8f0', color: viewMode === 'assignments' ? '#fff' : '#475569', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          {viewMode === 'assignments' ? 'Property Assignments' : 'Assignments'}
        </button>
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
      ) : (
        /* Pay tracking */
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
          {/* Summary cards */}
          {(() => {
            const totalYtd = (cleaners ?? []).reduce((sum, c) => {
              const rate = Number(c.cleaning_rate) || 0;
              const sessions = Number(c.ytd_sessions) || 0;
              return sum + rate * sessions;
            }, 0);
            const totalCleans = (cleaners ?? []).reduce((sum, c) => sum + (Number(c.ytd_sessions) || 0), 0);
            return (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
                <div style={{ background: '#f0fdf4', borderRadius: 10, padding: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#10b981' }}>${totalYtd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Total YTD Spend</div>
                </div>
                <div style={{ background: '#eff6ff', borderRadius: 10, padding: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#3b82f6' }}>{totalCleans}</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Total YTD Cleans</div>
                </div>
                <div style={{ background: '#f8fafc', borderRadius: 10, padding: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#64748b' }}>{(cleaners ?? []).filter(c => c.active).length}</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Active Cleaners</div>
                </div>
              </div>
            );
          })()}

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                <th style={thSt}>Cleaner</th>
                <th style={thSt}>Rate / Clean</th>
                <th style={thSt}>Total Cleans</th>
                <th style={thSt}>YTD Cleans</th>
                <th style={thSt}>YTD Earnings</th>
                <th style={thSt}>Properties</th>
              </tr>
            </thead>
            <tbody>
              {(cleaners ?? []).map(c => {
                const rate = Number(c.cleaning_rate) || 0;
                const ytd = Number(c.ytd_sessions) || 0;
                const ytdEarnings = rate * ytd;
                return (
                  <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={tdSt}>
                      <div style={{ fontWeight: 600 }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>{c.email}</div>
                    </td>
                    <td style={tdSt}>
                      {rate > 0 ? (
                        <span style={{ fontWeight: 600, color: '#10b981' }}>${rate.toFixed(2)}</span>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>Not set</span>
                      )}
                    </td>
                    <td style={tdSt}>{c.total_sessions}</td>
                    <td style={tdSt}>{ytd}</td>
                    <td style={tdSt}>
                      <span style={{ fontWeight: 600 }}>${ytdEarnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </td>
                    <td style={tdSt}>
                      <div style={{ fontSize: 12, color: '#64748b' }}>
                        {(c.assigned_properties ?? []).map(p => p.name).join(', ') || 'None'}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {(cleaners ?? []).length === 0 && (
                <tr><td colSpan={6} style={{ ...tdSt, color: '#94a3b8', textAlign: 'center' }}>No cleaners found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const thSt: React.CSSProperties = { padding: '8px 10px', fontSize: 12, color: '#64748b', fontWeight: 500 };
const tdSt: React.CSSProperties = { padding: '10px 10px' };
