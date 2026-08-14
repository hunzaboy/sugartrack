import { useCallback, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Field } from '../components/Field';
import { Button } from '../components/Button';
import { listA1c, addA1c, deleteA1c } from '../lib/a1c';
import { colors, fontSize, spacing, radius } from '../lib/theme';
import type { A1cEntry } from '../lib/types';

export default function A1cScreen() {
  const [entries, setEntries] = useState<A1cEntry[]>([]);
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    listA1c().then(setEntries);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleAdd = async () => {
    const numeric = parseFloat(value);
    if (Number.isNaN(numeric) || numeric <= 0) {
      Alert.alert('Invalid value', 'Please enter a valid A1C percentage.');
      return;
    }
    setSaving(true);
    try {
      await addA1c(numeric, new Date().toISOString());
      setValue('');
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert('Delete Entry', 'Remove this A1C entry?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteA1c(id); load(); } },
    ]);
  };

  return (
    <View style={styles.screen}>
      <View style={styles.form}>
        <Field label="A1C (%)" value={value} onChangeText={setValue} keyboardType="decimal-pad" placeholder="e.g. 6.8" />
        <Button title={saving ? 'Saving...' : 'Log A1C Result'} onPress={handleAdd} disabled={saving} />
      </View>

      <FlatList
        data={entries}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.empty}>No A1C results logged yet.</Text>}
        renderItem={({ item }) => (
          <Pressable style={styles.row} onLongPress={() => handleDelete(item.id)}>
            <Text style={styles.rowTitle}>{item.value}%</Text>
            <Text style={styles.rowMeta}>{new Date(item.date).toLocaleDateString()}</Text>
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
