import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../lib/api';

interface Property {
  id: string;
  name: string;
  type: 'str' | 'residence';
  address?: string;
  slug?: string;
  active: boolean;
  ical_url?: string;
  webhook_secret?: string;
  standard_id?: string;
  created_at: string;
}

interface WizardState {
  step: number;
  name: string;
  type: 'str' | 'residence';
  address: string;
  slug: string;
  ical_url: string;
  rooms: string[];
  standard_id: string;
}

const INITIAL_WIZARD: WizardState = { step: 1, name: '', type: 'str', address: '', slug: '', ical_url: '', rooms: ['Kitchen', 'Living Room', 'Bathroom', 'Bedroom'], standard_id: '' };

export default function PropertiesPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [wizard, setWizard] = useState<WizardState | null>(null);
  const [editField, setEditField] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();

  const { data: properties } = useQuery<Property[]>({
    queryKey: ['properties-admin'],
    queryFn: async () => { const { data } = await api.get<Property[]>('/properties'); return data; },
  });

  const selected = (properties ?? []).find(p => p.id === selectedId);

  const createMutation = useMutation({
    mutationFn: async (w: WizardState) => {
      const { data: prop } = await api.post('/properties', { name: w.name, type: w.type, address: w.address, slug: w.slug, ical_url: w.ical_url, standard_id: w.standard_id || null });
      for (const room of w.rooms) {
        if (room.trim()) await api.post(`/properties/${prop.id}/rooms`, { display_name: room.trim() });
      }
      return prop;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['properties-admin'] }); setWizard(null); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => api.patch(`/properties/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['properties-admin'] }),
  });

  function saveField(field: string) {
    if (selectedId && editField[field] !== undefined) {
      updateMutation.mutate({ id: selectedId, data: { [field]: editField[field] } });
      setEditField(prev => { const n = { ...prev }; delete n[field]; return n; });
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 22 }}>Properties</h1>
        <button onClick={() => setWizard({ ...INITIAL_WIZARD })}
          style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          + Add Property
        </button>
      </div>

      {/* Properties list */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedId ? '300px 1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {!selectedId && (properties ?? []).map(p => (
          <div key={p.id} onClick={() => setSelectedId(p.id)}
            style={{ background: '#fff', borderRadius: 12, padding: 20, cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,.08)', transition: 'transform .15s', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: '50%', background: p.active ? '#10b981' : '#ef4444' }} />
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{p.name}</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>{p.type === 'str' ? 'Short-Term Rental' : 'Residence'}</div>
            {p.address && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{p.address}</div>}
          </div>
        ))}

        {selectedId && (
          <>
            {/* Sidebar list */}
            <div>
              {(properties ?? []).map(p => (
                <button key={p.id} onClick={() => { setSelectedId(p.id); setEditField({}); }}
                  style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', marginBottom: 6, borderRadius: 8, border: 'none',
                    background: selectedId === p.id ? '#3b82f6' : '#fff', color: selectedId === p.id ? '#fff' : '#111',
                    fontWeight: 500, cursor: 'pointer', fontSize: 14 }}>
                  {p.name}
                </button>
              ))}
            </div>

            {/* Settings */}
            {selected && (
              <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <h2 style={{ margin: 0, fontSize: 18 }}>{selected.name} Settings</h2>
                  <button onClick={() => setSelectedId(null)}
                    style={{ background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 12, cursor: 'pointer' }}>
                    Back to Grid
                  </button>
                </div>

                {(['name', 'address', 'slug', 'ical_url'] as const).map(field => (
                  <div key={field} style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontWeight: 500, fontSize: 13, marginBottom: 4, color: '#374151', textTransform: 'capitalize' as const }}>
                      {field.replace('_', ' ')}
                    </label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input value={editField[field] ?? (selected as Record<string, string>)[field] ?? ''}
                        onChange={e => setEditField(prev => ({ ...prev, [field]: e.target.value }))}
                        style={{ flex: 1, padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }} />
                      {editField[field] !== undefined && (
                        <button onClick={() => saveField(field)}
                          style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 12, cursor: 'pointer' }}>
                          Save
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontWeight: 500, fontSize: 13, marginBottom: 4, color: '#374151' }}>Type</label>
                  <select value={selected.type} onChange={e => updateMutation.mutate({ id: selected.id, data: { type: e.target.value } })}
                    style={{ padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }}>
                    <option value="str">Short-Term Rental</option>
                    <option value="residence">Residence</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: 16, marginTop: 24 }}>
                  <button onClick={() => updateMutation.mutate({ id: selected.id, data: { active: !selected.active } })}
                    style={{ background: selected.active ? '#ef4444' : '#10b981', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    {selected.active ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* New property wizard modal */}
      {wizard && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}
          onClick={() => setWizard(null)}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, width: 500, maxHeight: '90vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 4px', fontSize: 20 }}>Add Property</h2>
            <p style={{ color: '#64748b', fontSize: 13, marginBottom: 20 }}>Step {wizard.step} of 3</p>

            {wizard.step === 1 && (
              <div>
                <label style={lblSt}>Property Name *</label>
                <input value={wizard.name} onChange={e => setWizard({ ...wizard, name: e.target.value })} style={inpSt} placeholder="Beach House" />
                <label style={lblSt}>Type</label>
                <select value={wizard.type} onChange={e => setWizard({ ...wizard, type: e.target.value as 'str' | 'residence' })} style={inpSt}>
                  <option value="str">Short-Term Rental</option>
                  <option value="residence">Residence</option>
                </select>
                <label style={lblSt}>Address</label>
                <input value={wizard.address} onChange={e => setWizard({ ...wizard, address: e.target.value })} style={inpSt} placeholder="123 Main St" />
                <label style={lblSt}>URL Slug</label>
                <input value={wizard.slug} onChange={e => setWizard({ ...wizard, slug: e.target.value })} style={inpSt} placeholder="beach-house" />
              </div>
            )}

            {wizard.step === 2 && (
              <div>
                <label style={lblSt}>Rooms (one per line)</label>
                <textarea value={wizard.rooms.join('\n')} onChange={e => setWizard({ ...wizard, rooms: e.target.value.split('\n') })}
                  style={{ ...inpSt, minHeight: 120 }} />
              </div>
            )}

            {wizard.step === 3 && (
              <div>
                <label style={lblSt}>iCal URL (optional)</label>
                <input value={wizard.ical_url} onChange={e => setWizard({ ...wizard, ical_url: e.target.value })} style={inpSt} placeholder="https://..." />
                <div style={{ background: '#f8fafc', borderRadius: 8, padding: 16, marginTop: 12 }}>
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>Summary</div>
                  <div style={{ fontSize: 13 }}>Name: {wizard.name}</div>
                  <div style={{ fontSize: 13 }}>Type: {wizard.type === 'str' ? 'Short-Term Rental' : 'Residence'}</div>
                  <div style={{ fontSize: 13 }}>Rooms: {wizard.rooms.filter(r => r.trim()).length}</div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
              {wizard.step > 1 ? (
                <button onClick={() => setWizard({ ...wizard, step: wizard.step - 1 })}
                  style={{ background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer' }}>Back</button>
              ) : <div />}
              {wizard.step < 3 ? (
                <button disabled={!wizard.name} onClick={() => setWizard({ ...wizard, step: wizard.step + 1 })}
                  style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 600, cursor: 'pointer' }}>Next</button>
              ) : (
                <button disabled={!wizard.name} onClick={() => createMutation.mutate(wizard)}
                  style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 600, cursor: 'pointer' }}>Create Property</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const lblSt: React.CSSProperties = { display: 'block', fontWeight: 500, fontSize: 13, marginBottom: 4, color: '#374151' };
const inpSt: React.CSSProperties = { display: 'block', width: '100%', padding: '8px 10px', marginBottom: 14, border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' };
