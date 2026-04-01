import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../lib/api';
import { useSelectedProperty } from '../components/PropertySwitcher';

interface Issue {
  id: string;
  title: string;
  description?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  reporter_name?: string;
  reporter_type?: string;
  created_at: string;
}

interface IssueForm {
  title: string;
  description: string;
  severity: string;
}
const EMPTY_ISSUE: IssueForm = { title: '', description: '', severity: 'medium' };

export default function IssuesPage() {
  const { propertyId } = useSelectedProperty();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<IssueForm>(EMPTY_ISSUE);
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null);
  const [editForm, setEditForm] = useState<IssueForm>(EMPTY_ISSUE);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const queryClient = useQueryClient();

  const { data: issues } = useQuery<Issue[]>({
    queryKey: ['issues', propertyId],
    queryFn: async () => {
      const { data } = await api.get<Issue[]>(`/issues?property_id=${propertyId}`);
      return data;
    },
    enabled: !!propertyId,
  });

  const createIssueMutation = useMutation({
    mutationFn: (data: IssueForm) => api.post('/issues', { ...data, property_id: propertyId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      setShowCreate(false);
      setForm(EMPTY_ISSUE);
    },
  });

  const updateIssueMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<IssueForm & { status: string }> }) =>
      api.patch(`/issues/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      setEditingIssue(null);
    },
  });

  const deleteIssueMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/issues/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['issues'] }),
  });

  const filteredIssues = (issues ?? []).filter(i => statusFilter === 'all' || i.status === statusFilter);

  function startEdit(issue: Issue) {
    setEditingIssue(issue);
    setEditForm({ title: issue.title, description: issue.description ?? '', severity: issue.severity });
  }

  return (
    <div>
      <h1 style={{ margin: '0 0 24px', fontSize: 22 }}>Issues</h1>

        <div>
          {/* Controls bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              {['all', 'open', 'in_progress', 'resolved', 'closed'].map(s => (
                <button key={s} onClick={() => setStatusFilter(s)} style={{
                  padding: '4px 12px', borderRadius: 16, border: 'none', fontSize: 12, cursor: 'pointer',
                  background: statusFilter === s ? '#3b82f6' : '#e2e8f0',
                  color: statusFilter === s ? '#fff' : '#475569',
                }}>
                  {s === 'all' ? 'All' : s.replace('_', ' ')}
                </button>
              ))}
            </div>
            <button onClick={() => setShowCreate(true)} style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              + New Issue
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filteredIssues.length === 0 && <p style={{ color: '#94a3b8' }}>No issues match filter</p>}
            {filteredIssues.map((issue) => (
              <div key={issue.id} style={{ background: '#fff', borderRadius: 10, padding: '14px 18px', display: 'flex', gap: 12, alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,.07)', borderLeft: `4px solid ${severityColor(issue.severity)}` }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{issue.title}</div>
                  {issue.description && <div style={{ fontSize: 13, color: '#64748b', marginTop: 3 }}>{issue.description}</div>}
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                    {new Date(issue.created_at).toLocaleDateString()}
                    {issue.reporter_name && ` · ${issue.reporter_name}`}
                    <span style={{ marginLeft: 8, padding: '1px 6px', borderRadius: 6, background: statusBg(issue.status), color: statusFg(issue.status), fontSize: 10, fontWeight: 600 }}>
                      {issue.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 8, background: severityColor(issue.severity), color: '#fff' }}>{issue.severity}</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  {issue.status === 'open' && (
                    <button onClick={() => updateIssueMutation.mutate({ id: issue.id, data: { status: 'resolved' } })}
                      style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 12, cursor: 'pointer' }}>
                      Resolve
                    </button>
                  )}
                  {issue.status === 'resolved' && (
                    <button onClick={() => updateIssueMutation.mutate({ id: issue.id, data: { status: 'closed' } })}
                      style={{ background: '#6b7280', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 12, cursor: 'pointer' }}>
                      Close
                    </button>
                  )}
                  <button onClick={() => startEdit(issue)}
                    style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 12, cursor: 'pointer' }}>
                    Edit
                  </button>
                  <button onClick={() => { if (confirm('Delete this issue?')) deleteIssueMutation.mutate(issue.id); }}
                    style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 12, cursor: 'pointer' }}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      {/* Create issue modal */}
      {showCreate && (
        <div style={overlayStyle} onClick={() => setShowCreate(false)}>
          <div style={modalStyle} onClick={e => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 16px', fontSize: 18 }}>New Issue</h2>
            <label style={lblStyle}>Title *</label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} style={inpStyle} placeholder="Issue title" />
            <label style={lblStyle}>Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ ...inpStyle, minHeight: 80 }} placeholder="Describe the issue..." />
            <label style={lblStyle}>Severity</label>
            <select value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value })} style={inpStyle}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button onClick={() => setShowCreate(false)} style={{ background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer' }}>Cancel</button>
              <button disabled={!form.title.trim()} onClick={() => createIssueMutation.mutate(form)}
                style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 600, cursor: 'pointer', opacity: form.title.trim() ? 1 : 0.5 }}>
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit issue modal */}
      {editingIssue && (
        <div style={overlayStyle} onClick={() => setEditingIssue(null)}>
          <div style={modalStyle} onClick={e => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 16px', fontSize: 18 }}>Edit Issue</h2>
            <label style={lblStyle}>Title</label>
            <input value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} style={inpStyle} />
            <label style={lblStyle}>Description</label>
            <textarea value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} style={{ ...inpStyle, minHeight: 80 }} />
            <label style={lblStyle}>Severity</label>
            <select value={editForm.severity} onChange={e => setEditForm({ ...editForm, severity: e.target.value })} style={inpStyle}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
            <label style={lblStyle}>Status</label>
            <select value={editingIssue.status} onChange={e => updateIssueMutation.mutate({ id: editingIssue.id, data: { status: e.target.value } })} style={inpStyle}>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button onClick={() => setEditingIssue(null)} style={{ background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => updateIssueMutation.mutate({ id: editingIssue.id, data: editForm })}
                style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 600, cursor: 'pointer' }}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function severityColor(s: string) {
  const map: Record<string, string> = { low: '#10b981', medium: '#f59e0b', high: '#ef4444', critical: '#7f1d1d' };
  return map[s] ?? '#6b7280';
}
function statusBg(s: string) {
  const map: Record<string, string> = { open: '#fef3c7', in_progress: '#dbeafe', resolved: '#d1fae5', closed: '#f1f5f9' };
  return map[s] ?? '#f1f5f9';
}
function statusFg(s: string) {
  const map: Record<string, string> = { open: '#92400e', in_progress: '#1e40af', resolved: '#065f46', closed: '#475569' };
  return map[s] ?? '#475569';
}

const overlayStyle: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 };
const modalStyle: React.CSSProperties = { background: '#fff', borderRadius: 16, padding: 32, width: 460, maxHeight: '90vh', overflowY: 'auto' };
const lblStyle: React.CSSProperties = { display: 'block', fontWeight: 500, fontSize: 13, marginBottom: 4, color: '#374151' };
const inpStyle: React.CSSProperties = { display: 'block', width: '100%', padding: '8px 10px', marginBottom: 14, border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' as const };
