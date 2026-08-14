import { useCallback, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Field } from '../components/Field';
import { Button } from '../components/Button';
import { listMedications, addMedication, deleteMedication } from '../lib/medications';
import { colors, fontSize, spacing, radius } from '../lib/theme';
import type { Medication } from '../lib/types';

export default function MedicationsScreen() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [name, setName] = useState('');
  const [dose, setDose] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    listMedications().then(setMedications);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleAdd = async () => {
    if (!name.trim() || !dose.trim()) {
      Alert.alert('Missing info', 'Please enter both a medication name and dose.');
      return;
    }
    setSaving(true);
    try {
      await addMedication(name.trim(), dose.trim(), new Date().toISOString());
      setName('');
      setDose('');
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert('Delete Entry', 'Remove this medication log entry?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteMedication(id); load(); } },
    ]);
  };

  return (
    <View style={styles.screen}>
      <View style={styles.form}>
        <Field label="Medication Name" value={name} onChangeText={setName} placeholder="e.g. Metformin" />
        <Field label="Dose" value={dose} onChangeText={setDose} placeholder="e.g. 500mg" />
        <Button title={saving ? 'Saving...' : 'Log Medication'} onPress={handleAdd} disabled={saving} />
      </View>

      <FlatList
        data={medications}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.empty}>No medications logged yet.</Text>}
        renderItem={({ item }) => (
          <Pressable style={styles.row} onLongPress={() => handleDelete(item.id)}>
            <Text style={styles.rowTitle}>{item.name}</Text>
            <Text style={styles.rowMeta}>
              {item.dose} · {new Date(item.timestamp).toLocaleString()}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  form: { padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  listContent: { padding: spacing.lg },
  empty: { fontSize: fontSize.md, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
  row: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  rowTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  rowMeta: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 2 },
});
