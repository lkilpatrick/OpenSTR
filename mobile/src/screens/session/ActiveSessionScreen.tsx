import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, Image,
  StyleSheet, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRoute, type RouteProp, useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
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

interface Task {
  id: string;
  label: string;
  task_type: string;
  required: boolean;
  display_order: number;
}

interface Photo {
  id: string;
  type: 'before' | 'after' | 'issue';
  storage_path: string;
}

// Possible states for the room-by-room flow
type RoomStep = 'before_photo' | 'tasks' | 'after_photo' | 'issue_photo' | 'done';

export default function ActiveSessionScreen() {
  const { params } = useRoute<RouteProps>();
  const navigation = useNavigation();
  const queryClient = useQueryClient();

  const [showRating, setShowRating] = useState(false);
  const [started, setStarted] = useState(false);
  const [currentRoomIdx, setCurrentRoomIdx] = useState(0);
  const [roomStep, setRoomStep] = useState<RoomStep>('before_photo');
  const [completedTasks, setCompletedTasks] = useState<Record<string, Set<string>>>({});
  const [roomPhotos, setRoomPhotos] = useState<Record<string, Photo[]>>({});
  const [uploading, setUploading] = useState(false);

  const { data: rooms, isLoading } = useQuery({
    queryKey: ['session-rooms', params.sessionId],
    queryFn: async () => {
      const { data } = await api.get<RoomClean[]>(`/sessions/${params.sessionId}/rooms`);
      return data;
    },
  });

  const currentRoom = rooms?.[currentRoomIdx];

  const { data: tasks } = useQuery({
    queryKey: ['room-tasks', currentRoom?.room_id],
    queryFn: async () => {
      if (!currentRoom) return [];
      // Find the property_id from the session
      const sessionRes = await api.get(`/sessions/${params.sessionId}`);
      const propertyId = (sessionRes.data as { property_id: string }).property_id;
      const { data } = await api.get<Task[]>(`/properties/${propertyId}/rooms/${currentRoom.room_id}/tasks`);
      return data;
    },
    enabled: !!currentRoom && started,
  });

  const startMutation = useMutation({
    mutationFn: () => api.patch(`/sessions/${params.sessionId}/status`, { status: 'in_progress' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      setStarted(true);
      setCurrentRoomIdx(0);
      setRoomStep('before_photo');
    },
  });

  const submitMutation = useMutation({
    mutationFn: () => api.patch(`/sessions/${params.sessionId}/status`, { status: 'submitted' }),
    onSuccess: () => setShowRating(true),
  });

  const completeTaskMutation = useMutation({
    mutationFn: ({ roomCleanId, taskId }: { roomCleanId: string; taskId: string }) =>
      api.post(`/photos/${roomCleanId}/tasks/${taskId}/complete`, {}),
  });

  const takePhoto = useCallback(async (type: 'before' | 'after' | 'issue') => {
    if (!currentRoom) return;
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: 'images',
      quality: 0.7,
      allowsEditing: false,
    });
    if (result.canceled || !result.assets?.[0]) return;

    setUploading(true);
    try {
      const asset = result.assets[0];
      const formData = new FormData();
      formData.append('photo', {
        uri: asset.uri,
        type: 'image/jpeg',
        name: `${type}_${Date.now()}.jpg`,
      } as unknown as Blob);
      formData.append('type', type);
      formData.append('taken_at', new Date().toISOString());

      const { data } = await api.post(`/photos/${currentRoom.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setRoomPhotos(prev => ({
        ...prev,
        [currentRoom.id]: [...(prev[currentRoom.id] ?? []), data as Photo],
      }));
      return data as Photo;
    } catch (err) {
      Alert.alert('Upload Failed', 'Could not upload photo. Try again.');
      return null;
    } finally {
      setUploading(false);
    }
  }, [currentRoom]);

  const handleTakeBeforePhoto = useCallback(async () => {
    const photo = await takePhoto('before');
    if (photo) setRoomStep('tasks');
  }, [takePhoto]);

  const handleTaskComplete = useCallback(async (taskId: string) => {
    if (!currentRoom) return;
    const roomId = currentRoom.id;
    try {
      await completeTaskMutation.mutateAsync({ roomCleanId: roomId, taskId });
      setCompletedTasks(prev => {
        const set = new Set(prev[roomId] ?? []);
        set.add(taskId);
        return { ...prev, [roomId]: set };
      });
    } catch {
      Alert.alert('Error', 'Failed to complete task');
    }
  }, [currentRoom, completeTaskMutation]);

  const handleTakeAfterPhoto = useCallback(async () => {
    const photo = await takePhoto('after');
    if (photo) setRoomStep('issue_photo');
  }, [takePhoto]);

  const handleTakeIssuePhoto = useCallback(async () => {
    await takePhoto('issue');
    // Stay on issue_photo step so they can take more
  }, [takePhoto]);

  const handleFinishRoom = useCallback(() => {
    if (!rooms) return;
    if (currentRoomIdx < rooms.length - 1) {
      const nextIdx = currentRoomIdx + 1;
      setCurrentRoomIdx(nextIdx);
      // Only the first room requires a before photo
      setRoomStep('tasks');
    } else {
      // Last room done — submit
      Alert.alert('All Rooms Complete', 'Submit this session for review?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Submit', onPress: () => submitMutation.mutate() },
      ]);
    }
  }, [rooms, currentRoomIdx, submitMutation]);

  const allTasksDone = currentRoom && tasks
    ? tasks.every(t => completedTasks[currentRoom.id]?.has(t.id))
    : false;

  // --- Rating screen ---
  if (showRating) {
    return <GuestRatingScreen sessionId={params.sessionId} onDone={() => navigation.goBack()} />;
  }

  // --- Loading ---
  if (isLoading) {
    return <View style={s.center}><ActivityIndicator size="large" /></View>;
  }

  // --- Not started: show room overview ---
  if (!started) {
    return (
      <ScrollView style={s.container}>
        <Text style={s.header}>Rooms to Clean</Text>
        <Text style={s.subtitle}>{rooms?.length ?? 0} rooms · Photo flow: Before → Tasks → After → Issues</Text>
        {(rooms ?? []).map((room, idx) => (
          <View key={room.id} style={s.overviewCard}>
            <View style={s.overviewNum}><Text style={s.overviewNumText}>{idx + 1}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={s.overviewName}>{room.display_name}</Text>
              {room.theme_name ? <Text style={s.overviewTheme}>{room.theme_name}</Text> : null}
            </View>
            {idx === 0 && <View style={s.badgeBefore}><Text style={s.badgeText}>Before Photo</Text></View>}
          </View>
        ))}
        <TouchableOpacity style={s.startBtn} onPress={() => {
          Alert.alert('Start Session', 'Begin this clean session?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Start', onPress: () => startMutation.mutate() },
          ]);
        }} disabled={startMutation.isPending}>
          <Text style={s.btnText}>{startMutation.isPending ? 'Starting...' : 'Start Session'}</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // --- Active session: room-by-room flow ---
  if (!currentRoom) {
    return <View style={s.center}><Text>No rooms found</Text></View>;
  }

  const roomNum = currentRoomIdx + 1;
  const totalRooms = rooms?.length ?? 0;
  const photos = roomPhotos[currentRoom.id] ?? [];

  return (
    <ScrollView style={s.container}>
      {/* Progress bar */}
      <View style={s.progressBar}>
        <View style={[s.progressFill, { width: `${(roomNum / totalRooms) * 100}%` }]} />
      </View>
      <Text style={s.progressText}>Room {roomNum} of {totalRooms}</Text>

      {/* Room header */}
      <View style={s.roomHeader}>
        <Text style={s.roomName}>{currentRoom.display_name}</Text>
        {currentRoom.theme_name ? <Text style={s.roomTheme}>{currentRoom.theme_name}</Text> : null}
      </View>

      {/* Step: Before photo (first room only) */}
      {roomStep === 'before_photo' && (
        <View style={s.stepCard}>
          <Text style={s.stepTitle}>📷 Before Photo Required</Text>
          <Text style={s.stepDesc}>Take a photo showing the current state of this room before cleaning.</Text>
          <TouchableOpacity style={s.photoBtn} onPress={handleTakeBeforePhoto} disabled={uploading}>
            <Text style={s.photoBtnText}>{uploading ? 'Uploading...' : 'Take Before Photo'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Step: Tasks */}
      {roomStep === 'tasks' && (
        <View style={s.stepCard}>
          <Text style={s.stepTitle}>Checklist</Text>
          {!tasks ? (
            <ActivityIndicator style={{ marginVertical: 16 }} />
          ) : tasks.length === 0 ? (
            <Text style={s.stepDesc}>No tasks for this room.</Text>
          ) : (
            tasks.map(task => {
              const done = completedTasks[currentRoom.id]?.has(task.id);
              return (
                <TouchableOpacity key={task.id} style={[s.taskRow, done && s.taskDone]}
                  onPress={() => !done && handleTaskComplete(task.id)}
                  disabled={done || completeTaskMutation.isPending}>
                  <View style={[s.checkbox, done && s.checkboxDone]}>
                    {done && <Text style={s.checkmark}>✓</Text>}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.taskLabel, done && s.taskLabelDone]}>{task.label}</Text>
                    {task.task_type === 'supply_check' && (
                      <Text style={s.taskType}>Supply check</Text>
                    )}
                  </View>
                  {task.required && !done && <Text style={s.required}>Required</Text>}
                </TouchableOpacity>
              );
            })
          )}
          {allTasksDone && (
            <TouchableOpacity style={s.nextBtn} onPress={() => setRoomStep('after_photo')}>
              <Text style={s.btnText}>All Tasks Done → Take After Photo</Text>
            </TouchableOpacity>
          )}
          {tasks && tasks.length === 0 && (
            <TouchableOpacity style={s.nextBtn} onPress={() => setRoomStep('after_photo')}>
              <Text style={s.btnText}>Continue → Take After Photo</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Step: After photo */}
      {roomStep === 'after_photo' && (
        <View style={s.stepCard}>
          <Text style={s.stepTitle}>📷 After Photo Required</Text>
          <Text style={s.stepDesc}>Take a photo showing this room after cleaning is complete.</Text>
          <TouchableOpacity style={s.photoBtn} onPress={handleTakeAfterPhoto} disabled={uploading}>
            <Text style={s.photoBtnText}>{uploading ? 'Uploading...' : 'Take After Photo'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Step: Issue photo (optional) */}
      {roomStep === 'issue_photo' && (
        <View style={s.stepCard}>
          <Text style={s.stepTitle}>🔍 Anything to Report?</Text>
          <Text style={s.stepDesc}>Take photos of anything broken, out of place, or left behind by the guest. This is optional.</Text>

          {/* Show issue photos taken */}
          {photos.filter(p => p.type === 'issue').length > 0 && (
            <View style={s.photoGrid}>
              {photos.filter(p => p.type === 'issue').map(p => (
                <View key={p.id} style={s.photoThumb}>
                  <Text style={s.photoThumbLabel}>Issue</Text>
                </View>
              ))}
            </View>
          )}

          <View style={s.issueActions}>
            <TouchableOpacity style={s.issueBtnPhoto} onPress={handleTakeIssuePhoto} disabled={uploading}>
              <Text style={s.issueBtnPhotoText}>{uploading ? 'Uploading...' : '📷 Report Issue'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.nextBtn} onPress={handleFinishRoom}>
              <Text style={s.btnText}>
                {currentRoomIdx < (rooms?.length ?? 1) - 1 ? 'Next Room →' : 'Finish & Submit'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Photo summary for this room */}
      {photos.length > 0 && roomStep !== 'issue_photo' && (
        <View style={s.photoSummary}>
          <Text style={s.photoSummaryTitle}>Photos taken: {photos.length}</Text>
          <View style={s.photoGrid}>
            {photos.map(p => (
              <View key={p.id} style={[s.photoThumb, { borderColor: p.type === 'issue' ? '#ef4444' : '#10b981' }]}>
                <Text style={s.photoThumbLabel}>{p.type}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#64748b', marginBottom: 20 },

  // Overview (pre-start)
  overviewCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  overviewNum: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#3b82f6',
    justifyContent: 'center', alignItems: 'center',
  },
  overviewNumText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  overviewName: { fontSize: 15, fontWeight: '600' },
  overviewTheme: { fontSize: 12, color: '#94a3b8', marginTop: 1 },
  badgeBefore: { backgroundColor: '#dbeafe', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 10, color: '#2563eb', fontWeight: '600' },

  startBtn: { backgroundColor: '#3b82f6', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 20 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  // Progress
  progressBar: { height: 6, backgroundColor: '#e2e8f0', borderRadius: 3, marginBottom: 4 },
  progressFill: { height: 6, backgroundColor: '#3b82f6', borderRadius: 3 },
  progressText: { fontSize: 12, color: '#64748b', marginBottom: 16 },

  // Room header
  roomHeader: { marginBottom: 16 },
  roomName: { fontSize: 22, fontWeight: 'bold' },
  roomTheme: { fontSize: 13, color: '#94a3b8', marginTop: 2 },

  // Step card
  stepCard: { backgroundColor: '#fff', borderRadius: 14, padding: 18, marginBottom: 16 },
  stepTitle: { fontSize: 17, fontWeight: '700', marginBottom: 6 },
  stepDesc: { fontSize: 13, color: '#64748b', marginBottom: 14, lineHeight: 18 },

  // Photo button
  photoBtn: { backgroundColor: '#3b82f6', borderRadius: 10, padding: 14, alignItems: 'center' },
  photoBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },

  // Tasks
  taskRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9', gap: 12,
  },
  taskDone: { opacity: 0.6 },
  checkbox: {
    width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: '#cbd5e1',
    justifyContent: 'center', alignItems: 'center',
  },
  checkboxDone: { backgroundColor: '#10b981', borderColor: '#10b981' },
  checkmark: { color: '#fff', fontWeight: '700', fontSize: 14 },
  taskLabel: { fontSize: 14, fontWeight: '500' },
  taskLabelDone: { textDecorationLine: 'line-through', color: '#94a3b8' },
  taskType: { fontSize: 11, color: '#f59e0b', marginTop: 2 },
  required: { fontSize: 10, color: '#ef4444', fontWeight: '600' },
  nextBtn: { backgroundColor: '#10b981', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 14 },

  // Issue step
  issueActions: { gap: 10 },
  issueBtnPhoto: {
    backgroundColor: '#fff', borderWidth: 2, borderColor: '#f59e0b',
    borderRadius: 10, padding: 14, alignItems: 'center',
  },
  issueBtnPhotoText: { color: '#92400e', fontWeight: '600', fontSize: 14 },

  // Photo displays
  photoSummary: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 16 },
  photoSummaryTitle: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 8 },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  photoThumb: {
    width: 60, height: 60, borderRadius: 8, borderWidth: 2, borderColor: '#10b981',
    backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center',
  },
  photoThumbLabel: { fontSize: 9, fontWeight: '600', color: '#475569', textTransform: 'uppercase' },
});
