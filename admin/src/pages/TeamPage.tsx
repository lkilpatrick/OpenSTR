import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../lib/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  active: boolean;
  created_at: string;
}

interface CreateForm {
  name: string;
  email: string;
  password: string;
  role: string;
}

const EMPTY_FORM: CreateForm = { name: '', email: '', password: '', role: 'cleaner' };
const ROLES = ['cleaner', 'admin', 'owner'] as const;

export default function TeamPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<CreateForm>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ name: string; role: string }>({ name: '', role: '' });
  const [error, setError] = useState('');
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => { const { data } = await api.get<User[]>('/users'); return data; },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateForm) => api.post('/users', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowCreate(false);
      setForm(EMPTY_FORM);
      setError('');
    },
    onError: (err: any) => {
      setError(err.response?.data?.error ?? 'Failed to create user');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => api.patch(`/users/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setEditingId(null);
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => api.patch(`/users/${id}`, { active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  function startEdit(user: User) {
    setEditingId(user.id);
    setEditForm({ name: user.name, role: user.role });
  }

  function saveEdit(id: string) {
    updateMutation.mutate({ id, data: editForm });
  }

  const activeUsers = (users ?? []).filter(u => u.active);
  const inactiveUsers = (users ?? []).filter(u => !u.active);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24 }}>Team</h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>
            Manage users, roles, and access
          </p>
        </div>
        <button onClick={() => { setShowCreate(true); setError(''); }} style={primaryBtnStyle}>
          + Add User
        </button>
      </div>

      {/* Create user modal */}
      {showCreate && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <h2 style={{ margin: '0 0 20px', fontSize: 18 }}>Add New User</h2>

            <label style={labelStyle}>Name</label>
            <input
              style={inputStyle}
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Full name"
            />

            <label style={labelStyle}>Email</label>
            <input
              style={inputStyle}
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="email@example.com"
              type="email"
            />

            <label style={labelStyle}>Password</label>
            <input
              style={inputStyle}
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              placeholder="Minimum 6 characters"
              type="password"
            />

            <label style={labelStyle}>Role</label>
            <select
              style={inputStyle}
              value={form.role}
              onChange={e => setForm({ ...form, role: e.target.value })}
            >
              {ROLES.map(r => (
                <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
              ))}
            </select>

            {error && <p style={{ color: '#ef4444', fontSize: 13, marginTop: 8 }}>{error}</p>}

            <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
              <button
                onClick={() => { setShowCreate(false); setError(''); }}
                style={cancelBtnStyle}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!form.name || !form.email || !form.password) {
                    setError('All fields are required');
                    return;
                  }
                  if (form.password.length < 6) {
                    setError('Password must be at least 6 characters');
                    return;
                  }
                  createMutation.mutate(form);
                }}
                disabled={createMutation.isPending}
                style={primaryBtnStyle}
              >
                {createMutation.isPending ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <p style={{ color: '#64748b' }}>Loading...</p>
      ) : (
        <>
          {/* Active users */}
          <div style={tableContainerStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Name</th>
                  <th style={thStyle}>Email</th>
                  <th style={thStyle}>Role</th>
                  <th style={thStyle}>Created</th>
                  <th style={{ ...thStyle, width: 160 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeUsers.length === 0 && (
                  <tr><td colSpan={5} style={{ ...tdStyle, textAlign: 'center', color: '#94a3b8' }}>No users</td></tr>
                )}
                {activeUsers.map(user => (
                  <tr key={user.id}>
                    <td style={tdStyle}>
                      {editingId === user.id ? (
                        <input
                          style={{ ...inputStyle, margin: 0, padding: '4px 8px' }}
                          value={editForm.name}
                          onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                        />
                      ) : (
                        <span style={{ fontWeight: 500 }}>{user.name}</span>
                      )}
                    </td>
                    <td style={tdStyle}>{user.email}</td>
                    <td style={tdStyle}>
                      {editingId === user.id ? (
                        <select
                          style={{ ...inputStyle, margin: 0, padding: '4px 8px' }}
                          value={editForm.role}
                          onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                        >
                          {ROLES.map(r => (
                            <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                          ))}
                        </select>
                      ) : (
                        <span style={roleBadgeStyle(user.role)}>
                          {user.role}
                        </span>
                      )}
                    </td>
                    <td style={tdStyle}>{formatDate(user.created_at)}</td>
                    <td style={tdStyle}>
                      {editingId === user.id ? (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => saveEdit(user.id)} style={smallBtnStyle}>Save</button>
                          <button onClick={() => setEditingId(null)} style={{ ...smallBtnStyle, background: '#f1f5f9', color: '#475569' }}>Cancel</button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => startEdit(user)} style={smallBtnStyle}>Edit</button>
                          <button
                            onClick={() => {
                              if (confirm(`Deactivate ${user.name}? They will lose access.`)) {
                                toggleActiveMutation.mutate({ id: user.id, active: false });
                              }
                            }}
                            style={{ ...smallBtnStyle, background: '#fef2f2', color: '#ef4444' }}
                          >
                            Deactivate
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Inactive users */}
          {inactiveUsers.length > 0 && (
            <>
              <h3 style={{ margin: '28px 0 12px', fontSize: 16, color: '#64748b' }}>
                Deactivated ({inactiveUsers.length})
              </h3>
              <div style={tableContainerStyle}>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Name</th>
                      <th style={thStyle}>Email</th>
                      <th style={thStyle}>Role</th>
                      <th style={{ ...thStyle, width: 100 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inactiveUsers.map(user => (
                      <tr key={user.id} style={{ opacity: 0.6 }}>
                        <td style={tdStyle}>{user.name}</td>
                        <td style={tdStyle}>{user.email}</td>
                        <td style={tdStyle}>
                          <span style={roleBadgeStyle(user.role)}>{user.role}</span>
                        </td>
                        <td style={tdStyle}>
                          <button
                            onClick={() => toggleActiveMutation.mutate({ id: user.id, active: true })}
                            style={{ ...smallBtnStyle, background: '#f0fdf4', color: '#16a34a' }}
                          >
                            Reactivate
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return '';
  }
}

function roleBadgeStyle(role: string): React.CSSProperties {
  const colors: Record<string, { bg: string; fg: string }> = {
    owner: { bg: '#ede9fe', fg: '#7c3aed' },
    admin: { bg: '#dbeafe', fg: '#2563eb' },
    cleaner: { bg: '#d1fae5', fg: '#059669' },
    guest: { bg: '#f3f4f6', fg: '#6b7280' },
  };
  const c = colors[role] ?? colors.guest;
  return {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 4,
    fontSize: 12,
    fontWeight: 600,
    background: c.bg,
    color: c.fg,
    textTransform: 'capitalize',
  };
}

const primaryBtnStyle: React.CSSProperties = {
  background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8,
  padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
};

const cancelBtnStyle: React.CSSProperties = {
  background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 8,
  padding: '10px 20px', fontSize: 14, cursor: 'pointer',
};

const smallBtnStyle: React.CSSProperties = {
  background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 6,
  padding: '4px 10px', fontSize: 12, cursor: 'pointer', fontWeight: 500,
};

const overlayStyle: React.CSSProperties = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center',
  justifyContent: 'center', zIndex: 100,
};

const modalStyle: React.CSSProperties = {
  background: '#fff', borderRadius: 12, padding: 28, width: 420,
  maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,.15)',
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4, marginTop: 12,
};

const inputStyle: React.CSSProperties = {
  display: 'block', width: '100%', padding: '8px 12px', borderRadius: 6,
  border: '1px solid #d1d5db', fontSize: 14, boxSizing: 'border-box',
};

const tableContainerStyle: React.CSSProperties = {
  background: '#fff', borderRadius: 10, overflow: 'hidden',
  border: '1px solid #e5e7eb',
};

const tableStyle: React.CSSProperties = {
  width: '100%', borderCollapse: 'collapse',
};

const thStyle: React.CSSProperties = {
  textAlign: 'left', padding: '10px 14px', fontSize: 12, fontWeight: 600,
  color: '#64748b', borderBottom: '1px solid #e5e7eb', background: '#f8fafc',
  textTransform: 'uppercase', letterSpacing: 0.5,
};

const tdStyle: React.CSSProperties = {
  padding: '10px 14px', fontSize: 14, borderBottom: '1px solid #f1f5f9',
};
