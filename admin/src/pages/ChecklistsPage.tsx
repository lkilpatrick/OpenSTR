import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback, useEffect } from 'react';
import { api } from '../lib/api';
import { useSelectedProperty } from '../components/PropertySwitcher';
interface Room {
  id: string;
  property_id: string;
  slug: string;
  display_name: string;
  theme_name?: string;
  display_order: number;
  is_laundry_phase: boolean;
}

interface TaskRow {
  id: string;
  label: string;
  category: string;
  frequency: string;
  is_high_touch: boolean;
  is_mandatory: boolean;
  requires_supply_check: boolean;
  supply_item?: string;
  supply_low_threshold?: number;
  display_order: number;
  archived: boolean;
}

const CATEGORIES = ['Cleaning', 'Sanitise', 'Laundry', 'Restocking', 'Check', 'Photography'];
const FREQUENCIES = ['every_clean', 'weekly', 'monthly', 'deep_clean'];

export default function ChecklistsPage() {
  const { propertyId } = useSelectedProperty();
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [newTaskLabel, setNewTaskLabel] = useState('');
  const [orderedTasks, setOrderedTasks] = useState<TaskRow[]>([]);
  const [orderDirty, setOrderDirty] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [editTask, setEditTask] = useState<TaskRow | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [editRoomId, setEditRoomId] = useState<string | null>(null);
  const [editRoomName, setEditRoomName] = useState('');
  const [orderedRooms, setOrderedRooms] = useState<Room[]>([]);
  const [roomDragIdx, setRoomDragIdx] = useState<number | null>(null);
  const [roomOrderDirty, setRoomOrderDirty] = useState(false);
  const queryClient = useQueryClient();

  const { data: rooms } = useQuery<Room[]>({
    queryKey: ['rooms', propertyId],
    queryFn: async () => {
      const { data } = await api.get<Room[]>(`/properties/${propertyId}/rooms`);
      return data;
    },
    enabled: !!propertyId,
  });

  const { data: tasks } = useQuery<TaskRow[]>({
    queryKey: ['tasks', selectedRoom, showArchived],
    queryFn: async () => {
      const url = showArchived
        ? `/properties/${propertyId}/rooms/${selectedRoom}/tasks?include_archived=true`
        : `/properties/${propertyId}/rooms/${selectedRoom}/tasks`;
      const { data } = await api.get<TaskRow[]>(url);
      return data;
    },
    enabled: !!selectedRoom && !!propertyId,
  });

  useEffect(() => {
    if (rooms) { setOrderedRooms(rooms); setRoomOrderDirty(false); }
  }, [rooms]);

  useEffect(() => {
    if (rooms && rooms.length > 0 && !selectedRoom) {
      setSelectedRoom(rooms[0].id);
    }
  }, [rooms, selectedRoom]);

  useEffect(() => {
    setSelectedRoom(null);
  }, [propertyId]);

  useEffect(() => {
    if (tasks) { setOrderedTasks(tasks); setOrderDirty(false); }
  }, [tasks]);

  const addRoomMutation = useMutation({
    mutationFn: (name: string) => {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const order = (rooms ?? []).length;
      return api.post(`/properties/${propertyId}/rooms`, { display_name: name, slug, display_order: order });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms', propertyId] });
      setNewRoomName('');
      setShowAddRoom(false);
    },
  });

  const renameRoomMutation = useMutation({
    mutationFn: ({ roomId, name }: { roomId: string; name: string }) =>
      api.patch(`/properties/${propertyId}/rooms/${roomId}`, { display_name: name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms', propertyId] });
      setEditRoomId(null);
      setEditRoomName('');
    },
  });

  const archiveRoomMutation = useMutation({
    mutationFn: (roomId: string) =>
      api.patch(`/properties/${propertyId}/rooms/${roomId}`, { archived: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms', propertyId] });
      if (selectedRoom === editRoomId) setSelectedRoom(null);
    },
  });

  const reorderRoomsMutation = useMutation({
    mutationFn: (roomIds: string[]) =>
      api.patch(`/properties/${propertyId}/rooms/reorder`, { room_ids: roomIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms', propertyId] });
      setRoomOrderDirty(false);
    },
  });

  const handleRoomDragStart = useCallback((idx: number) => setRoomDragIdx(idx), []);
  const handleRoomDragOver = useCallback((e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (roomDragIdx === null || roomDragIdx === idx) return;
    setOrderedRooms(prev => {
      const next = [...prev];
      const [moved] = next.splice(roomDragIdx, 1);
      next.splice(idx, 0, moved);
      return next;
    });
    setRoomDragIdx(idx);
    setRoomOrderDirty(true);
  }, [roomDragIdx]);

  const addTaskMutation = useMutation({
    mutationFn: (label: string) =>
      api.post(`/properties/${propertyId}/rooms/${selectedRoom}/tasks`, { label, category: 'Cleaning' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', selectedRoom] });
      setNewTaskLabel('');
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: (task: TaskRow) =>
      api.patch(`/properties/${propertyId}/rooms/${selectedRoom}/tasks/${task.id}`, {
        label: task.label, category: task.category, frequency: task.frequency,
        is_high_touch: task.is_high_touch, is_mandatory: task.is_mandatory,
        requires_supply_check: task.requires_supply_check,
        supply_item: task.supply_item ?? null, supply_low_threshold: task.supply_low_threshold ?? null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', selectedRoom] });
      setEditTask(null);
    },
  });

  const archiveTaskMutation = useMutation({
    mutationFn: (taskId: string) =>
      api.patch(`/properties/${propertyId}/rooms/${selectedRoom}/tasks/${taskId}`, { archived: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks', selectedRoom] }),
  });

  const restoreTaskMutation = useMutation({
    mutationFn: (taskId: string) =>
      api.patch(`/properties/${propertyId}/rooms/${selectedRoom}/tasks/${taskId}`, { archived: false }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks', selectedRoom] }),
  });

  const reorderMutation = useMutation({
    mutationFn: (taskIds: string[]) =>
      api.patch(`/properties/${propertyId}/rooms/${selectedRoom}/tasks/reorder`, { task_ids: taskIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', selectedRoom] });
      setOrderDirty(false);
    },
  });

  const handleDragStart = useCallback((idx: number) => setDragIdx(idx), []);
  const handleDragOver = useCallback((e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    setOrderedTasks(prev => {
      const next = [...prev];
      const [moved] = next.splice(dragIdx, 1);
      next.splice(idx, 0, moved);
      return next;
    });
    setDragIdx(idx);
    setOrderDirty(true);
  }, [dragIdx]);

  // Warn before navigating away with unsaved order
  useEffect(() => {
    if (!orderDirty) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [orderDirty]);

  function selectRoom(id: string) {
    if (orderDirty && !confirm('You have unsaved order changes. Discard?')) return;
    setSelectedRoom(id);
    setOrderDirty(false);
  }

  const activeTasks = orderedTasks.filter(t => !t.archived);
  const archivedTasks = orderedTasks.filter(t => t.archived);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 24 }}>
      {/* Room list */}
      <div>
        <h1 style={{ margin: '0 0 16px', fontSize: 22 }}>Checklists</h1>
        {roomOrderDirty && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            <button onClick={() => reorderRoomsMutation.mutate(orderedRooms.map(r => r.id))}
              style={{ flex: 1, background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 0', fontWeight: 600, cursor: 'pointer', fontSize: 12 }}>Save Order</button>
            <button onClick={() => { setOrderedRooms(rooms ?? []); setRoomOrderDirty(false); }}
              style={{ flex: 1, background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: 6, padding: '6px 0', fontSize: 12, cursor: 'pointer' }}>Discard</button>
          </div>
        )}
        {orderedRooms.map((room, ri) => (
          <div key={room.id} draggable onDragStart={() => handleRoomDragStart(ri)}
            onDragOver={(e) => handleRoomDragOver(e, ri)} onDragEnd={() => setRoomDragIdx(null)}
            style={{ position: 'relative', marginBottom: 6,
              border: roomDragIdx === ri ? '2px dashed #3b82f6' : '2px solid transparent', borderRadius: 10 }}>
            {editRoomId === room.id ? (
              <div style={{ display: 'flex', gap: 4 }}>
                <input value={editRoomName} onChange={e => setEditRoomName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && editRoomName.trim() && renameRoomMutation.mutate({ roomId: room.id, name: editRoomName.trim() })}
                  style={{ flex: 1, padding: '8px 10px', border: '2px solid #3b82f6', borderRadius: 8, fontSize: 13 }}
                  autoFocus />
                <button onClick={() => editRoomName.trim() && renameRoomMutation.mutate({ roomId: room.id, name: editRoomName.trim() })}
                  style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 6, padding: '0 8px', cursor: 'pointer', fontSize: 12 }}>Save</button>
                <button onClick={() => setEditRoomId(null)}
                  style={{ background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: 6, padding: '0 8px', cursor: 'pointer', fontSize: 12 }}>Cancel</button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ color: '#94a3b8', fontSize: 14, cursor: 'grab', padding: '0 4px' }}>⠿</span>
                <button onClick={() => selectRoom(room.id)} style={{
                  flex: 1, textAlign: 'left',
                  padding: '10px 14px', borderRadius: 8, border: 'none',
                  background: selectedRoom === room.id ? '#3b82f6' : '#fff',
                  color: selectedRoom === room.id ? '#fff' : '#111',
                  fontWeight: 500, cursor: 'pointer', fontSize: 14,
                }}>
                  {room.display_name}
                </button>
                <button onClick={(e) => { e.stopPropagation(); setEditRoomId(room.id); setEditRoomName(room.display_name); }}
                  title="Rename" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#94a3b8', padding: '4px' }}>✎</button>
                <button onClick={(e) => { e.stopPropagation(); if (confirm(`Archive room "${room.display_name}"?`)) archiveRoomMutation.mutate(room.id); }}
                  title="Archive" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#94a3b8', padding: '4px' }}>×</button>
              </div>
            )}
          </div>
        ))}

        {showAddRoom ? (
          <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
            <input value={newRoomName} onChange={e => setNewRoomName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && newRoomName.trim() && addRoomMutation.mutate(newRoomName.trim())}
              placeholder="Room name..." autoFocus
              style={{ flex: 1, padding: '8px 10px', border: '2px solid #3b82f6', borderRadius: 8, fontSize: 13 }} />
            <button onClick={() => newRoomName.trim() && addRoomMutation.mutate(newRoomName.trim())}
              style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 6, padding: '0 10px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Add</button>
            <button onClick={() => { setShowAddRoom(false); setNewRoomName(''); }}
              style={{ background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: 6, padding: '0 8px', cursor: 'pointer', fontSize: 12 }}>Cancel</button>
          </div>
        ) : (
          <button onClick={() => setShowAddRoom(true)}
            style={{ width: '100%', marginTop: 8, padding: '8px 14px', borderRadius: 8, border: '2px dashed #cbd5e1',
              background: 'transparent', color: '#64748b', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
            + Add Room
          </button>
        )}
      </div>

      {/* Task list */}
      <div>
        {!selectedRoom ? (
          <p style={{ color: '#94a3b8', marginTop: 48 }}>Select a room to manage its checklist</p>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <input style={{ flex: 1, padding: '8px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14 }}
                placeholder="New task description..."
                value={newTaskLabel} onChange={(e) => setNewTaskLabel(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && newTaskLabel && addTaskMutation.mutate(newTaskLabel)} />
              <button onClick={() => newTaskLabel && addTaskMutation.mutate(newTaskLabel)}
                style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 600, cursor: 'pointer' }}>
                Add
              </button>
            </div>

            {orderDirty && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <button onClick={() => reorderMutation.mutate(activeTasks.map(t => t.id))}
                  style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 16px', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
                  Save Order
                </button>
                <button onClick={() => { setOrderedTasks(tasks ?? []); setOrderDirty(false); }}
                  style={{ background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: 8, padding: '6px 16px', fontSize: 13, cursor: 'pointer' }}>
                  Discard
                </button>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {activeTasks.map((task, i) => (
                <div key={task.id} draggable onDragStart={() => handleDragStart(i)}
                  onDragOver={(e) => handleDragOver(e, i)} onDragEnd={() => setDragIdx(null)}
                  style={{ background: dragIdx === i ? '#eff6ff' : '#fff', borderRadius: 10, padding: '12px 16px',
                    display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 1px 3px rgba(0,0,0,.07)',
                    cursor: 'grab', border: dragIdx === i ? '2px dashed #3b82f6' : '2px solid transparent' }}>
                  <span style={{ color: '#94a3b8', fontSize: 16, cursor: 'grab' }}>⠿</span>
                  <span style={{ color: '#94a3b8', fontSize: 13, minWidth: 24 }}>{i + 1}.</span>
                  <span style={{ flex: 1, fontSize: 14, cursor: 'pointer' }} onClick={() => setEditTask({ ...task })}>{task.label}</span>
                  <span style={{ fontSize: 11, color: '#6b7280', background: '#f1f5f9', padding: '2px 8px', borderRadius: 8 }}>{task.category}</span>
                  <span style={{ fontSize: 10, color: '#64748b', background: '#f1f5f9', padding: '2px 7px', borderRadius: 8 }}>{task.frequency.replace('_', ' ')}</span>
                  {task.is_high_touch && <span style={{ fontSize: 10, color: '#ef4444', background: '#fef2f2', padding: '2px 7px', borderRadius: 8 }}>High Touch</span>}
                  {task.requires_supply_check && <span style={{ fontSize: 10, color: '#7c3aed', background: '#f5f3ff', padding: '2px 7px', borderRadius: 8 }}>Supply</span>}
                  <button onClick={() => archiveTaskMutation.mutate(task.id)}
                    style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
                </div>
              ))}
            </div>

            {/* Show archived toggle */}
            <button onClick={() => setShowArchived(!showArchived)}
              style={{ marginTop: 16, background: 'none', border: 'none', color: '#64748b', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}>
              {showArchived ? 'Hide archived' : `Show archived (${archivedTasks.length})`}
            </button>

            {showArchived && archivedTasks.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                {archivedTasks.map(task => (
                  <div key={task.id} style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 16px',
                    display: 'flex', alignItems: 'center', gap: 12, opacity: 0.6, boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
                    <span style={{ flex: 1, fontSize: 14, textDecoration: 'line-through' }}>{task.label}</span>
                    <button onClick={() => restoreTaskMutation.mutate(task.id)}
                      style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}>
                      Restore
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Task edit modal */}
      {editTask && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}
          onClick={() => setEditTask(null)}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, width: 440, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 30px rgba(0,0,0,.15)' }}
            onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 20px', fontSize: 18 }}>Edit Task</h3>

            <label style={labelSt}>Label</label>
            <input style={inputSt} value={editTask.label} onChange={e => setEditTask({ ...editTask, label: e.target.value })} />

            <label style={labelSt}>Category</label>
            <select style={inputSt} value={editTask.category} onChange={e => setEditTask({ ...editTask, category: e.target.value })}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <label style={labelSt}>Frequency</label>
            <select style={inputSt} value={editTask.frequency} onChange={e => setEditTask({ ...editTask, frequency: e.target.value })}>
              {FREQUENCIES.map(f => <option key={f} value={f}>{f.replace('_', ' ')}</option>)}
            </select>

            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                <input type="checkbox" checked={editTask.is_high_touch} onChange={e => setEditTask({ ...editTask, is_high_touch: e.target.checked })} />
                High Touch
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                <input type="checkbox" checked={editTask.is_mandatory} onChange={e => setEditTask({ ...editTask, is_mandatory: e.target.checked })} />
                Mandatory
              </label>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginBottom: 12 }}>
              <input type="checkbox" checked={editTask.requires_supply_check}
                onChange={e => setEditTask({ ...editTask, requires_supply_check: e.target.checked })} />
              Supply Check
            </label>

            {editTask.requires_supply_check && (
              <div style={{ background: '#f8fafc', borderRadius: 8, padding: 12, marginBottom: 16 }}>
                <label style={labelSt}>Supply Item Name</label>
                <input style={inputSt} value={editTask.supply_item ?? ''}
                  onChange={e => setEditTask({ ...editTask, supply_item: e.target.value })} />
                <label style={labelSt}>Low Threshold</label>
                <input style={inputSt} type="number" value={editTask.supply_low_threshold ?? ''}
                  onChange={e => setEditTask({ ...editTask, supply_low_threshold: Number(e.target.value) || undefined })} />
              </div>
            )}

            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => updateTaskMutation.mutate(editTask)}
                style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 600, cursor: 'pointer', flex: 1 }}>
                Save
              </button>
              <button onClick={() => setEditTask(null)}
                style={{ background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const labelSt: React.CSSProperties = { display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 13, color: '#374151' };
const inputSt: React.CSSProperties = { display: 'block', width: '100%', padding: '8px 10px', marginBottom: 14, border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' };
