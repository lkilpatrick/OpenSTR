import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRoute, type RouteProp, useNavigation } from '@react-navigation/native';
import { api } from '../../lib/api';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import GuestRatingScreen from './GuestRatingScreen';

type RouteProps = RouteProp<RootStackParamList, 'ActiveSession'>;

interface RoomClean {
  id: string;
  room_id: string;
  session_id: string;
  status: string;
  display_name: string;
  theme_name: string;
  display_order: number;
}

interface TaskCompletion {
  task_id: string;
  completed: boolean;
}

export default function ActiveSessionScreen() {
  const { params } = useRoute<RouteProps>();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const [showRating, setShowRating] = useState(false);

  const { data: rooms, isLoading } = useQuery({
    queryKey: ['session-rooms', params.sessionId],
    queryFn: async () => {
      const { data } = await api.get<RoomClean[]>(`/sessions/${params.sessionId}/rooms`);
      return data;
    },
  });

  const startMutation = useMutation({
    mutationFn: () => api.patch(`/sessions/${params.sessionId}/status`, { status: 'in_progress' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sessions'] }),
  });

  const submitMutation = useMutation({
    mutationFn: () => api.patch(`/sessions/${params.sessionId}/status`, { status: 'submitted' }),
    onSuccess: () => {
      setShowRating(true);
    },
  });

  function handleStart() {
    Alert.alert('Start Session', 'Begin this clean session?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Start', onPress: () => startMutation.mutate() },
    ]);
  }

  function handleSubmit() {
    Alert.alert('Submit Session', 'Mark all rooms as complete and submit for review?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Submit', onPress: () => submitMutation.mutate() },
    ]);
  }

  if (showRating) {
    return <GuestRatingScreen sessionId={params.sessionId} onDone={() => navigation.goBack()} />;
  }

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" /></View>;
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Rooms to Clean</Text>
      {(rooms ?? []).map((room) => (
        <View key={room.id} style={styles.roomCard}>
          <View style={styles.roomHeader}>
            <Text style={styles.roomName}>{room.display_name}</Text>
            <Text style={styles.roomTheme}>{room.theme_name}</Text>
          </View>
          <View style={[styles.statusDot, { backgroundColor: room.status === 'completed' ? '#10b981' : '#e5e7eb' }]} />
        </View>
      ))}

      <View style={styles.actions}>
        <TouchableOpacity style={styles.startBtn} onPress={handleStart} disabled={startMutation.isPending}>
          <Text style={styles.btnText}>Start Session</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitMutation.isPending}>
          <Text style={styles.btnText}>Submit for Review</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  roomCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    marginBottom: 10, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
  },
  roomHeader: { flex: 1 },
  roomName: { fontSize: 16, fontWeight: '600' },
  roomTheme: { fontSize: 13, color: '#888', marginTop: 2 },
  statusDot: { width: 14, height: 14, borderRadius: 7 },
  actions: { marginTop: 24, gap: 12 },
  startBtn: { backgroundColor: '#3b82f6', borderRadius: 10, padding: 16, alignItems: 'center' },
  submitBtn: { backgroundColor: '#10b981', borderRadius: 10, padding: 16, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
