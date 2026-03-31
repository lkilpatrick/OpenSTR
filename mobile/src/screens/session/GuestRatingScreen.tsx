import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, TextInput,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { api } from '../../lib/api';

interface Props {
  sessionId: string;
  onDone: () => void;
}

export default function GuestRatingScreen({ sessionId, onDone }: Props) {
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a guest satisfaction rating');
      return;
    }
    setLoading(true);
    try {
      await api.post(`/sessions/${sessionId}/rating`, { rating, review_text: notes });
      Alert.alert('Submitted', 'Session complete!', [{ text: 'OK', onPress: onDone }]);
    } catch {
      Alert.alert('Error', 'Could not submit rating');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Guest Satisfaction</Text>
      <Text style={styles.subtitle}>How do you think the guest will rate this clean?</Text>

      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity key={star} onPress={() => setRating(star)}>
            <Text style={[styles.star, rating >= star && styles.starActive]}>★</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        style={styles.notes}
        placeholder="Any notes for the admin? (optional)"
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={4}
      />

      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Complete Session</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 32, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#666', textAlign: 'center', marginBottom: 32 },
  stars: { flexDirection: 'row', justifyContent: 'center', marginBottom: 32, gap: 8 },
  star: { fontSize: 48, color: '#d1d5db' },
  starActive: { color: '#f59e0b' },
  notes: {
    backgroundColor: '#fff', borderRadius: 10, borderWidth: 1,
    borderColor: '#ddd', padding: 14, fontSize: 15,
    textAlignVertical: 'top', marginBottom: 24, minHeight: 100,
  },
  button: { backgroundColor: '#1a73e8', borderRadius: 10, padding: 16, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
