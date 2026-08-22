import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Animated, Pressable, StyleSheet, View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './Typography';
import { spacing, radius, iconSize, floatingOffset } from '../lib/theme';
import { useAccessibility } from '../lib/accessibility';
import { successFeedback, tapFeedback, warningFeedback } from '../lib/haptics';

type Kind = 'success' | 'error' | 'info';

interface ShowOptions {
  kind?: Kind;
  /** Optional undo/retry affordance. */
  action?: { label: string; onPress: () => void };
  durationMs?: number;
}

interface Toast extends ShowOptions {
  id: number;
  message: string;
}

interface SnackbarValue {
  show: (message: string, options?: ShowOptions) => void;
}

const SnackbarContext = createContext<SnackbarValue>({ show: () => {} });

/** Long enough to read a sentence and reach the Undo button without hurrying. */
const DEFAULT_DURATION = 5000;
const ACTION_DURATION = 7000;

/**
 * Non-blocking confirmation, replacing `Alert.alert` for successes and errors.
 *
 * Alerts were being used for everything, including "Saved" — which interrupts the
 * flow and requires a dismiss tap for information the user does not need to act
 * on. Alerts now appear only for genuinely destructive confirmation.
 */
export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const nextId = useRef(0);

  const show = useCallback((message: string, options: ShowOptions = {}) => {
    if (options.kind === 'error') warningFeedback();
    else if (options.kind === 'success') successFeedback();
    setToast({ id: nextId.current++, message, ...options });
  }, []);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <SnackbarContext.Provider value={value}>
      {children}
      {toast ? <Snack key={toast.id} toast={toast} onDismiss={() => setToast(null)} /> : null}
    </SnackbarContext.Provider>
  );
}

function Snack({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const { colors, scale } = useAccessibility();
  const insets = useSafeAreaInsets();
  const enter = useRef(new Animated.Value(0)).current;
  const dismissed = useRef(false);

  const close = useCallback(() => {
    if (dismissed.current) return;
    dismissed.current = true;
    Animated.timing(enter, { toValue: 0, duration: 160, useNativeDriver: true }).start(onDismiss);
  }, [enter, onDismiss]);

  useEffect(() => {
    Animated.spring(enter, {
      toValue: 1,
      useNativeDriver: true,
      speed: 14,
      bounciness: 4,
    }).start();

    const timeout = setTimeout(close, toast.durationMs ?? (toast.action ? ACTION_DURATION : DEFAULT_DURATION));
    return () => clearTimeout(timeout);
  }, [enter, close, toast.durationMs, toast.action]);

  const icon =
    toast.kind === 'error' ? 'alert-circle' : toast.kind === 'success' ? 'checkmark-circle' : 'information-circle';
  const iconColor =
    toast.kind === 'error' ? '#FF9C94' : toast.kind === 'success' ? '#7FE3A6' : colors.inverseText;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.host,
        // Clears the tab bar *and* the extended FAB above it — the FAB is
        // right-aligned and the snackbar is full width, so they would collide.
        { bottom: floatingOffset.snackbar(Math.max(insets.bottom, 8), scale) },
        {
          opacity: enter,
          transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [28, 0] }) }],
        },
      ]}
    >
      <View
        style={[styles.bar, { backgroundColor: colors.inverseSurface }]}
        accessibilityLiveRegion="polite"
        accessible
        accessibilityLabel={toast.message}
      >
        <Ionicons name={icon} size={iconSize.md} color={iconColor} />
        <AppText variant="body" tone="inverse" style={styles.message}>
          {toast.message}
        </AppText>
        {toast.action ? (
          <Pressable
            onPress={() => {
              tapFeedback();
              toast.action?.onPress();
              close();
            }}
            accessibilityRole="button"
            accessibilityLabel={toast.action.label}
            hitSlop={10}
            android_ripple={{ color: 'rgba(255,255,255,0.18)', borderless: true }}
            style={styles.action}
          >
            <AppText variant="body" bold style={{ color: '#7FE3A6' }}>
              {toast.action.label}
            </AppText>
          </Pressable>
        ) : (
          <Pressable
            onPress={close}
            accessibilityRole="button"
            accessibilityLabel="Dismiss"
            hitSlop={10}
            style={styles.action}
          >
            <Ionicons name="close" size={iconSize.sm} color={colors.inverseText} />
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}

export function useSnackbar(): SnackbarValue {
  return useContext(SnackbarContext);
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    zIndex: 100,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 56,
    ...Platform.select({
      android: { elevation: 8 },
      default: {
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
      },
    }),
  },
  message: {
    flex: 1,
  },
  action: {
    minHeight: 40,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
});
