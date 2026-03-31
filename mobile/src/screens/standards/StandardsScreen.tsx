import React, { useState } from 'react';
import {
  View, Text, SectionList, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type { Task } from '@openstr/shared';

interface RoomWithTasks {
  id: string;
  display_name: string;
  theme_name: string;
  tasks: Task[];
}

// For standards we use the first property the cleaner is assigned to
async function fetchStandardsData(): Promise<RoomWithTasks[]> {
  const { data: sessions } = await api.get<{ property_id: string }[]>('/sessions?status=pending');
  const propertyId = sessions[0]?.property_id;
  if (!propertyId) return [];

  const { data: rooms } = await api.get<RoomWithTasks[]>(`/properties/${propertyId}/rooms`);
  const roomsWithTasks = await Promise.all(
    rooms.map(async (room) => {
      const { data: tasks } = await api.get<Task[]>(`/properties/${propertyId}/rooms/${room.id}/tasks`);
      return { ...room, tasks };
    })
  );
  return roomsWithTasks;
}

export default function StandardsScreen() {
  const [expandedRoom, setExpandedRoom] = useState<string | null>(null);
  const { data: rooms, isLoading } = useQuery({
    queryKey: ['standards'],
    queryFn: fetchStandardsData,
  });

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" /></View>;
  }

  const sections = (rooms ?? []).map((room) => ({
    title: `${room.theme_name} — ${room.display_name}`,
    roomId: room.id,
    data: expandedRoom === room.id ? room.tasks : [],
  }));

  return (
    <SectionList
      style={styles.container}
      sections={sections}
      keyExtractor={(item) => item.id}
      renderSectionHeader={({ section }) => (
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => setExpandedRoom(expandedRoom === section.roomId ? null : section.roomId)}
        >
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <Text style={styles.chevron}>{expandedRoom === section.roomId ? '▲' : '▼'}</Text>
        </TouchableOpacity>
      )}
      renderItem={({ item }) => (
        <View style={styles.taskRow}>
          <View style={[styles.categoryDot, { backgroundColor: categoryColor(item.category) }]} />
          <View style={styles.taskText}>
            <Text style={styles.taskLabel}>{item.label}</Text>
            <Text style={styles.taskMeta}>
              {item.category}{item.isHighTouch ? ' · High Touch' : ''}{item.frequency !== 'every_clean' ? ` · ${item.frequency}` : ''}
            </Text>
          </View>
        </View>
      )}
    />
  );
}

function categoryColor(cat: string): string {
  switch (cat) {
    case 'Cleaning': return '#3b82f6';
    case 'Sanitise': return '#ef4444';
    case 'Laundry': return '#8b5cf6';
    case 'Restocking': return '#f59e0b';
    case 'Check': return '#10b981';
    case 'Photography': return '#06b6d4';
    default: return '#6b7280';
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  sectionHeader: {
    backgroundColor: '#e5e7eb', flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center',
    padding: 14, marginTop: 8,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111' },
  chevron: { fontSize: 12, color: '#555' },
  taskRow: { flexDirection: 'row', alignItems: 'flex-start', padding: 12, paddingLeft: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  categoryDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5, marginRight: 10 },
  taskText: { flex: 1 },
  taskLabel: { fontSize: 14, color: '#111' },
  taskMeta: { fontSize: 11, color: '#888', marginTop: 2 },
});
