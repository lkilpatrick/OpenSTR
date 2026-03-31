import React from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { api } from '../../lib/api';
import type { CleanSession } from '@openstr/shared';
import type { RootStackParamList } from '../../navigation/AppNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;

async function fetchSessions(): Promise<CleanSession[]> {
  const { data } = await api.get<CleanSession[]>('/sessions?status=pending');
  return data;
}

function statusColor(status: string): string {
  switch (status) {
    case 'pending': return '#f59e0b';
    case 'in_progress': return '#3b82f6';
    case 'submitted': return '#8b5cf6';
    case 'approved': return '#10b981';
    default: return '#6b7280';
  }
}

export default function ScheduleScreen() {
  const navigation = useNavigation<Nav>();
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['sessions'],
    queryFn: fetchSessions,
  });

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" /></View>;
  }

  return (
    <FlatList
      style={styles.container}
      data={data ?? []}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      ListEmptyComponent={<Text style={styles.empty}>No upcoming cleans</Text>}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('ActiveSession', { sessionId: item.id })}
        >
          <View style={styles.cardRow}>
            <Text style={styles.cardTitle}>{(item as CleanSession & { property_name?: string }).property_name ?? 'Property'}</Text>
            <View style={[styles.badge, { backgroundColor: statusColor(item.status) }]}>
              <Text style={styles.badgeText}>{item.status.replace('_', ' ')}</Text>
            </View>
          </View>
          <Text style={styles.cardSub}>{item.sessionType ?? item.session_type} · {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}</Text>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { textAlign: 'center', color: '#999', marginTop: 40, fontSize: 16 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    marginBottom: 12, elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3,
  },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '600', flex: 1 },
  cardSub: { fontSize: 13, color: '#666', marginTop: 4 },
  badge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
});
