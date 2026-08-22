import { View, Pressable, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Caption } from './Typography';
import { cardShadow, radius, spacing, touchTarget, iconSize } from '../lib/theme';
import { useAccessibility } from '../lib/accessibility';
import { tapFeedback } from '../lib/haptics';

type IoniconName = keyof typeof Ionicons.glyphMap;

interface ListRowProps {
  title: string;
  subtitle?: string;
  /** Leading icon, rendered in a tinted tile. */
  icon?: IoniconName;
  onPress?: () => void;
  /** Trailing chevron. Defaults on when the row navigates. */
  chevron?: boolean;
  /** Trailing destructive action, rendered as its own button with its own label. */
  onDelete?: () => void;
  deleteLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * The shared card row used by More, Medications, and A1C.
 *
 * Two things it fixes: these rows previously had no pressed style at all, and
 * their only affordance for delete was an invisible long-press. Delete is now a
 * real, labelled, 56pt control.
 */
export function ListRow({
  title,
  subtitle,
  icon,
  onPress,
  chevron,
  onDelete,
  deleteLabel = 'Delete',
  style,
}: ListRowProps) {
  const { colors, scale } = useAccessibility();
  const minHeight = touchTarget.minHeight * Math.max(scale, 1);
  const showChevron = chevron ?? Boolean(onPress);

  const content = (
    <>
      {icon ? (
        <View style={[styles.iconTile, { backgroundColor: colors.primarySoft }]}>
          <Ionicons name={icon} size={iconSize.md} color={colors.primary} />
        </View>
      ) : null}
      <View style={styles.text}>
        <AppText variant="bodyLg" bold numberOfLines={2}>
          {title}
        </AppText>
        {subtitle ? <Caption style={styles.subtitle}>{subtitle}</Caption> : null}
      </View>
      {showChevron ? (
        <Ionicons name="chevron-forward" size={iconSize.md} color={colors.textMuted} />
      ) : null}
    </>
  );

  return (
    <View style={[styles.shell, { backgroundColor: colors.surface }, style]}>
      {onPress ? (
        <Pressable
          onPress={() => {
            tapFeedback();
            onPress();
          }}
          accessibilityRole="button"
          accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title}
          android_ripple={{ color: colors.surfaceRipple }}
          style={({ pressed }) => [
            styles.row,
            { minHeight },
            pressed && { backgroundColor: colors.primarySoft },
          ]}
        >
          {content}
        </Pressable>
      ) : (
        <View style={[styles.row, { minHeight }]}>{content}</View>
      )}

      {onDelete ? (
        <Pressable
          onPress={() => {
            tapFeedback();
            onDelete();
          }}
          accessibilityRole="button"
          accessibilityLabel={`${deleteLabel} ${title}`}
          android_ripple={{ color: colors.surfaceRipple }}
          hitSlop={6}
          style={({ pressed }) => [
            styles.delete,
            { minHeight, borderLeftColor: colors.border },
            pressed && { backgroundColor: colors.dangerSoft },
          ]}
        >
          <Ionicons name="trash-outline" size={iconSize.md} color={colors.danger} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flexDirection: 'row',
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    overflow: 'hidden',
    ...cardShadow,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  iconTile: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
  },
  subtitle: {
    marginTop: 2,
  },
  delete: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
  },
});
