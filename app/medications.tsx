import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Field } from '../components/Field';
import { LogScreen } from '../components/LogScreen';
import { useSnackbar } from '../components/Snackbar';
import { listMedications, addMedication, deleteMedication } from '../lib/medications';
import { warningFeedback } from '../lib/haptics';
import { formatReadingTimestamp } from '../lib/datetime';
import type { Medication } from '../lib/types';

export default function MedicationsScreen() {
  const snackbar = useSnackbar();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [name, setName] = useState('');
  const [dose, setDose] = useState('');
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [doseError, setDoseError] = useState<string | null>(null);

  const load = useCallback(
    () =>
      listMedications()
        .then(setMedications)
        .finally(() => setLoaded(true)),
    []
  );

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleAdd = async () => {
    const missingName = !name.trim();
    const missingDose = !dose.trim();
    setNameError(missingName ? 'Enter the medication name.' : null);
    setDoseError(missingDose ? 'Enter the dose.' : null);
    if (missingName || missingDose) {
      warningFeedback();
      return;
    }
    setSaving(true);
    try {
      await addMedication(name.trim(), dose.trim(), new Date().toISOString());
      setName('');
      setDose('');
      await load();
      snackbar.show('Medication logged.', { kind: 'success' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (item: Medication) => {
    Alert.alert('Delete this entry?', `${item.name} ${item.dose} will be removed.`, [
      { text: 'Keep it', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteMedication(item.id);
          await load();
          snackbar.show('Entry deleted.', {
            kind: 'success',
            action: {
              label: 'Undo',
              onPress: async () => {
                await addMedication(item.name, item.dose, item.timestamp);
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
      addLabel="Log medication"
      onAdd={handleAdd}
      saving={saving}
      items={medications}
      loaded={loaded}
      keyOf={(item) => String(item.id)}
      titleOf={(item) => item.name}
      subtitleOf={(item) => `${item.dose} · ${formatReadingTimestamp(item.timestamp)}`}
      onDelete={handleDelete}
      emptyIcon="medical-outline"
      emptyTitle="No medications logged yet"
      emptyText="Add what you take so your report is complete."
    >
      <Field
        label="Medication name"
        value={name}
        onChangeText={(next) => {
          setName(next);
          if (nameError) setNameError(null);
        }}
        placeholder="e.g. Metformin"
        error={nameError}
      />
      <Field
        label="Dose"
        value={dose}
        onChangeText={(next) => {
          setDose(next);
          if (doseError) setDoseError(null);
        }}
        placeholder="e.g. 500mg"
        error={doseError}
      />
    </LogScreen>
  );
}
