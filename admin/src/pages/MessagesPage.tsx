import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../lib/api';
import { useSelectedProperty } from '../components/PropertySwitcher';

interface Message {
  id: string;
  property_id: string;
  reservation_id?: string;
  sender_name?: string;
  sender_email?: string;
  subject?: string;
  message: string;
  source: string;
  read: boolean;
  received_at: string;
}

export default function MessagesPage() {
  const { propertyId } = useSelectedProperty();
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [selected, setSelected] = useState<Message | null>(null);
  const queryClient = useQueryClient();

  const { data: messages } = useQuery<Message[]>({
    queryKey: ['messages', propertyId, filter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (propertyId) params.set('property_id', propertyId);
      if (filter === 'unread') params.set('unread', 'true');
      const { data } = await api.get<Message[]>(`/messages?${params}`);
      if (filter === 'read') return data.filter(m => m.read);
      return data;
    },
    enabled: !!propertyId,
  });

  const toggleReadMutation = useMutation({
    mutationFn: ({ id, read }: { id: string; read: boolean }) =>
      api.patch(`/messages/${id}/read`, { read }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['messages'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/messages/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      setSelected(null);
    },
  });

  const unreadCount = (messages ?? []).filter(m => !m.read).length;

  return (
    <div>
      <h1 style={{ margin: '0 0 24px', fontSize: 22 }}>Messages</h1>

      {/* Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['all', 'unread', 'read'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '4px 12px', borderRadius: 16, border: 'none', fontSize: 12, cursor: 'pointer',
              background: filter === f ? '#3b82f6' : '#e2e8f0',
              color: filter === f ? '#fff' : '#475569',
            }}>
              {f === 'all' ? `All (${messages?.length ?? 0})` : f === 'unread' ? `Unread (${unreadCount})` : 'Read'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16 }}>
        {/* Message list */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(messages ?? []).length === 0 && <p style={{ color: '#94a3b8' }}>No messages</p>}
          {(messages ?? []).map(msg => (
            <div key={msg.id} onClick={() => {
              setSelected(msg);
              if (!msg.read) toggleReadMutation.mutate({ id: msg.id, read: true });
            }} style={{
              background: selected?.id === msg.id ? '#eff6ff' : '#fff',
              borderRadius: 10, padding: '14px 18px', cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,.07)',
              borderLeft: `4px solid ${msg.read ? '#cbd5e1' : '#3b82f6'}`,
              opacity: msg.read ? 0.8 : 1,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: msg.read ? 400 : 600, fontSize: 14 }}>
                  {msg.sender_name || 'Guest'}
                  {msg.sender_email && <span style={{ color: '#94a3b8', fontWeight: 400, marginLeft: 8, fontSize: 12 }}>{msg.sender_email}</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 8,
                    background: sourceColor(msg.source), color: '#fff',
                  }}>{msg.source}</span>
                  {!msg.read && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6', display: 'inline-block' }} />}
                </div>
              </div>
              {msg.subject && <div style={{ fontSize: 13, fontWeight: 500, marginTop: 4, color: '#334155' }}>{msg.subject}</div>}
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 500 }}>
                {msg.message}
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>
                {new Date(msg.received_at).toLocaleString()}
              </div>
            </div>
          ))}
        </div>

        {/* Detail panel */}
        {selected && (
          <div style={{ width: 400, background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,.08)', alignSelf: 'flex-start', position: 'sticky', top: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16 }}>{selected.subject || 'Message'}</h3>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#94a3b8' }}>×</button>
            </div>

            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>
              <div><strong>From:</strong> {selected.sender_name || 'Guest'}{selected.sender_email && ` <${selected.sender_email}>`}</div>
              <div><strong>Source:</strong> {selected.source}</div>
              <div><strong>Received:</strong> {new Date(selected.received_at).toLocaleString()}</div>
            </div>

            <div style={{ background: '#f8fafc', borderRadius: 8, padding: 14, fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap', marginBottom: 16 }}>
              {selected.message}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => toggleReadMutation.mutate({ id: selected.id, read: !selected.read })} style={{
                flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff',
                fontSize: 13, cursor: 'pointer', color: '#475569',
              }}>
                {selected.read ? 'Mark Unread' : 'Mark Read'}
              </button>
              <button onClick={() => {
                if (confirm('Delete this message?')) deleteMutation.mutate(selected.id);
              }} style={{
                padding: '8px 12px', borderRadius: 8, border: 'none', background: '#ef4444',
                fontSize: 13, cursor: 'pointer', color: '#fff', fontWeight: 600,
              }}>
                Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function sourceColor(source: string): string {
  switch (source) {
    case 'airbnb': return '#ff5a5f';
    case 'guest_portal': return '#3b82f6';
    case 'sms': return '#10b981';
    default: return '#94a3b8';
  }
}
