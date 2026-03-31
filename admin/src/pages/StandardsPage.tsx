import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../lib/api';

interface Standard {
  id: string;
  name: string;
  description?: string;
  task_count: number;
  created_at: string;
}

interface StandardTask {
  id: string;
  label: string;
  room_type: string;
  category: string;
  frequency: string;
  is_high_touch: boolean;
  is_mandatory: boolean;
  display_order: number;
}

interface StandardDetail extends Standard {
  tasks: StandardTask[];
}

interface PropagationPreview {
  property_count: number;
  changes: Array<{ property_name: string; room_type: string; action: string; label: string }>;
}

export default function StandardsPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [preview, setPreview] = useState<PropagationPreview | null>(null);
  const queryClient = useQueryClient();

  const { data: standards } = useQuery<Standard[]>({
    queryKey: ['standards'],
    queryFn: async () => { const { data } = await api.get<Standard[]>('/standards'); return data; },
  });

  const { data: detail } = useQuery<StandardDetail>({
    queryKey: ['standard-detail', selectedId],
    queryFn: async () => { const { data } = await api.get<StandardDetail>(`/standards/${selectedId}`); return data; },
    enabled: !!selectedId,
  });

  const createMutation = useMutation({
    mutationFn: () => api.post('/standards', { name: newName, description: newDesc }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['standards'] }); setShowCreate(false); setNewName(''); setNewDesc(''); },
  });

  const propagateMutation = useMutation({
    mutationFn: (id: string) => api.post(`/standards/${id}/propagate`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['standard-detail'] }); setPreview(null); alert('Propagation complete'); },
  });

  async function loadPreview(id: string) {
    const { data } = await api.get<PropagationPreview>(`/standards/${id}/propagate/preview`);
    setPreview(data);
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: selectedId ? '280px 1fr' : '1fr', gap: 24 }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h1 style={{ margin: 0, fontSize: 22 }}>Standards</h1>
          <button onClick={() => setShowCreate(true)}
            style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            + New
          </button>
        </div>

        {showCreate && (
          <div style={{ background: '#fff', borderRadius: 10, padding: 16, marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
            <input placeholder="Standard name" value={newName} onChange={e => setNewName(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, marginBottom: 8, boxSizing: 'border-box' as const, fontSize: 13 }} />
            <textarea placeholder="Description" value={newDesc} onChange={e => setNewDesc(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, marginBottom: 8, boxSizing: 'border-box' as const, fontSize: 13, minHeight: 50 }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button disabled={!newName} onClick={() => createMutation.mutate()}
                style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>Create</button>
              <button onClick={() => setShowCreate(false)}
                style={{ background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        )}

        {(standards ?? []).map(s => (
          <div key={s.id} onClick={() => setSelectedId(s.id)}
            style={{ background: selectedId === s.id ? '#eff6ff' : '#fff', borderRadius: 10, padding: '12px 16px', marginBottom: 8,
              cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,.06)', border: selectedId === s.id ? '2px solid #3b82f6' : '2px solid transparent' }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{s.name}</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>{s.task_count} tasks</div>
          </div>
        ))}
      </div>

      {selectedId && detail && (
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h2 style={{ margin: '0 0 4px', fontSize: 18 }}>{detail.name}</h2>
              {detail.description && <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>{detail.description}</p>}
            </div>
            <button onClick={() => loadPreview(selectedId)}
              style={{ background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Push to Properties
            </button>
          </div>

          {/* Propagation preview */}
          {preview && (
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: 16, marginBottom: 20 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>
                Preview: {preview.changes.length} changes across {preview.property_count} properties
              </div>
              {preview.changes.length === 0 ? (
                <p style={{ fontSize: 13, color: '#92400e' }}>All properties are up to date.</p>
              ) : (
                <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                  {preview.changes.map((c, i) => (
                    <div key={i} style={{ fontSize: 12, padding: '3px 0', color: '#78350f' }}>
                      <strong>{c.property_name}</strong> → {c.room_type}: {c.action} "{c.label}"
                    </div>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button onClick={() => propagateMutation.mutate(selectedId)}
                  style={{ background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  Confirm Propagate
                </button>
                <button onClick={() => setPreview(null)}
                  style={{ background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 12, cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Tasks by room type */}
          {Object.entries(groupByRoomType(detail.tasks)).map(([roomType, tasks]) => (
            <div key={roomType} style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 14, color: '#64748b', marginBottom: 8 }}>{roomType}</h3>
              {tasks.map(t => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontSize: 13 }}>
                  <span style={{ flex: 1 }}>{t.label}</span>
                  <span style={{ fontSize: 11, color: '#6b7280', background: '#f1f5f9', padding: '2px 8px', borderRadius: 6 }}>{t.category}</span>
                  <span style={{ fontSize: 11, color: '#6b7280', background: '#f1f5f9', padding: '2px 8px', borderRadius: 6 }}>{t.frequency.replace('_', ' ')}</span>
                  {t.is_high_touch && <span style={{ fontSize: 10, color: '#ef4444', background: '#fef2f2', padding: '2px 6px', borderRadius: 6 }}>HT</span>}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function groupByRoomType(tasks: StandardTask[]): Record<string, StandardTask[]> {
  const groups: Record<string, StandardTask[]> = {};
  for (const t of tasks) {
    (groups[t.room_type] ??= []).push(t);
  }
  return groups;
}
