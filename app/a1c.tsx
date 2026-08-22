import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Field } from '../components/Field';
import { LogScreen } from '../components/LogScreen';
import { useSnackbar } from '../components/Snackbar';
import { listA1c, addA1c, deleteA1c } from '../lib/a1c';
import { warningFeedback } from '../lib/haptics';
import { formatDayLabel } from '../lib/datetime';
import type { A1cEntry } from '../lib/types';

/** A1C is a percentage; anything outside this is a typo, not a result. */
const A1C_MIN = 3;
const A1C_MAX = 20;

export default function A1cScreen() {
  const snackbar = useSnackbar();
  const [entries, setEntries] = useState<A1cEntry[]>([]);
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    () =>
      listA1c()
        .then(setEntries)
        .finally(() => setLoaded(true)),
    []
  );

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleAdd = async () => {
    const numeric = parseFloat(value.replace(',', '.'));
    if (!value.trim()) {
      setError('Enter the A1C percentage from your lab result.');
      warningFeedback();
      return;
    }
    if (Number.isNaN(numeric) || numeric < A1C_MIN || numeric > A1C_MAX) {
      setError(`An A1C result is normally between ${A1C_MIN}% and ${A1C_MAX}%.`);
      warningFeedback();
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await addA1c(numeric, new Date().toISOString());
      setValue('');
      await load();
      snackbar.show('A1C result saved.', { kind: 'success' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (item: A1cEntry) => {
    Alert.alert('Delete this result?', `${item.value}% will be removed from your log.`, [
      { text: 'Keep it', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteA1c(item.id);
          await load();
          snackbar.show('Result deleted.', {
            kind: 'success',
            action: {
              label: 'Undo',
              onPress: async () => {
                await addA1c(item.value, item.date);
                await load();
              },
            },
          });
        },
      },
    ]);
  };

  return (
    <LogScreen
      addLabel="Log A1C result"
      onAdd={handleAdd}
      saving={saving}
      items={entries}
      loaded={loaded}
      keyOf={(item) => String(item.id)}
      titleOf={(item) => `${item.value}%`}
      subtitleOf={(item) => formatDayLabel(item.date)}
      onDelete={handleDelete}
      emptyIcon="water-outline"
      emptyTitle="No A1C results yet"
      emptyText="Add results from your lab tests to track them over time."
    >
      <Field
        label="A1C result"
        value={value}
        onChangeText={(next) => {
          setValue(next);
          if (error) setError(null);
        }}
        keyboardType="decimal-pad"
        placeholder="e.g. 6.8"
        suffix="%"
        error={error}
        maxLength={5}
      />
    </LogScreen>
  );
}
