import type { ReactNode } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from './Button';
import { ListRow } from './ListRow';
import { AppText } from './Typography';
import { spacing } from '../lib/theme';
import { useAccessibility } from '../lib/accessibility';

type IoniconName = keyof typeof Ionicons.glyphMap;

interface LogScreenProps<T> {
  /** Form inputs, rendered above the list. */
  children: ReactNode;
  addLabel: string;
  onAdd: () => void;
  saving: boolean;
  items: T[];
  loaded: boolean;
  keyOf: (item: T) => string;
  titleOf: (item: T) => string;
  subtitleOf: (item: T) => string;
  onDelete: (item: T) => void;
  emptyIcon: IoniconName;
  emptyTitle: string;
  emptyText: string;
}

/**
 * Shared "add an entry, then list the entries" screen behind Medications and A1C.
 * Those two screens were near-identical copies, including their style blocks and
 * their long-press-only delete.
 */
export function LogScreen<T>({
  children,
  addLabel,
  onAdd,
  saving,
  items,
  loaded,
  keyOf,
  titleOf,
  subtitleOf,
  onDelete,
  emptyIcon,
  emptyTitle,
  emptyText,
}: LogScreenProps<T>) {
  const { colors } = useAccessibility();

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.form, { borderBottomColor: colors.border }]}>
        {children}
        <Button title={addLabel} onPress={onAdd} loading={saving} icon="add" />
      </View>

      <FlatList
        data={items}
        keyExtractor={keyOf}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          loaded ? (
            <View style={styles.empty}>
              <Ionicons name={emptyIcon} size={32} color={colors.textMuted} />
              <AppText variant="bodyLg" bold style={styles.emptyTitle}>
                {emptyTitle}
              </AppText>
              <AppText variant="body" tone="muted" style={styles.emptyText}>
                {emptyText}
              </AppText>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <ListRow
            title={titleOf(item)}
            subtitle={subtitleOf(item)}
            onDelete={() => onDelete(item)}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  form: {
    padding: spacing.lg,
    borderBottomWidth: 1,
  },
  listContent: {
    padding: spacing.lg,
  },
  empty: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  emptyTitle: {
    marginTop: spacing.sm,
  },
  emptyText: {
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});
