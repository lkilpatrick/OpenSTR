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
  created_at: string;
}

interface GuestMessage {
  id: string;
  sender_name?: string;
  message: string;
  source: string;
  read: boolean;
  received_at: string;
}

type Tab = 'issues' | 'messages';

export default function IssuesPage() {
  const { propertyId } = useSelectedProperty();
  const [tab, setTab] = useState<Tab>('issues');
  const queryClient = useQueryClient();

  const { data: issues } = useQuery<Issue[]>({
    queryKey: ['issues', propertyId],
    queryFn: async () => {
      const { data } = await api.get<Issue[]>(`/issues?property_id=${propertyId}`);
      return data;
    },
    enabled: !!propertyId && tab === 'issues',
  });

  const { data: messages } = useQuery<GuestMessage[]>({
    queryKey: ['messages', propertyId],
    queryFn: async () => {
      const { data } = await api.get<GuestMessage[]>(`/messages?property_id=${propertyId}`);
      return data;
    },
    enabled: !!propertyId && tab === 'messages',
  });

  const resolveIssueMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/issues/${id}`, { status: 'resolved' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['issues'] }),
  });

  return (
    <div>
      <h1 style={{ margin: '0 0 24px', fontSize: 22 }}>Issues & Messages</h1>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderBottom: '2px solid #e2e8f0' }}>
        {(['issues', 'messages'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '8px 20px', border: 'none', background: 'none',
              borderBottom: tab === t ? '2px solid #3b82f6' : 'none',
              color: tab === t ? '#3b82f6' : '#64748b',
              fontWeight: tab === t ? 600 : 400, cursor: 'pointer',
              fontSize: 14, marginBottom: -2, textTransform: 'capitalize',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'issues' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {(issues ?? []).length === 0 && <p style={{ color: '#94a3b8' }}>No open issues</p>}
          {(issues ?? []).map((issue) => (
            <div key={issue.id} style={{ background: '#fff', borderRadius: 10, padding: '14px 18px', display: 'flex', gap: 12, alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,.07)', borderLeft: `4px solid ${severityColor(issue.severity)}` }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{issue.title}</div>
                {issue.description && <div style={{ fontSize: 13, color: '#64748b', marginTop: 3 }}>{issue.description}</div>}
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{new Date(issue.created_at).toLocaleDateString()}</div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 8, background: severityColor(issue.severity), color: '#fff' }}>{issue.severity}</span>
              {issue.status === 'open' && (
                <button onClick={() => resolveIssueMutation.mutate(issue.id)} style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 12, cursor: 'pointer' }}>
                  Resolve
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'messages' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {(messages ?? []).length === 0 && <p style={{ color: '#94a3b8' }}>No messages</p>}
          {(messages ?? []).map((msg) => (
            <div key={msg.id} style={{ background: '#fff', borderRadius: 10, padding: '14px 18px', boxShadow: '0 1px 3px rgba(0,0,0,.07)', opacity: msg.read ? 0.7 : 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontWeight: 600 }}>{msg.sender_name ?? 'Guest'}</span>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>{new Date(msg.received_at).toLocaleDateString()}</span>
              </div>
              <p style={{ margin: 0, fontSize: 14, color: '#374151' }}>{msg.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function severityColor(s: string) {
  const map: Record<string, string> = { low: '#10b981', medium: '#f59e0b', high: '#ef4444', critical: '#7f1d1d' };
  return map[s] ?? '#6b7280';
}
