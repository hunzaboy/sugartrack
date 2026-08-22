import { useCallback } from 'react';
import { useSnackbar } from '../components/Snackbar';
import { savePreparedExport, sharePreparedExport } from './export';
import type { PreparedExport } from './export';

/**
 * Save a prepared export to a folder the user picks, then offer to share it.
 *
 * This replaces an `offerShare()` helper that was copy-pasted verbatim into both
 * the export screen and settings. It also moves "Share" out of a modal Alert —
 * previously the only route to sharing a file was a button inside a success
 * dialog, so the action was invisible to anyone who dismissed the dialog.
 */
export function useExportDelivery() {
  const snackbar = useSnackbar();

  const deliver = useCallback(
    async (prepared: PreparedExport, label: string): Promise<boolean> => {
      const savedUri = await savePreparedExport(prepared);
      if (!savedUri) return false;

      snackbar.show(`${label} saved to your device.`, {
        kind: 'success',
        action: {
          label: 'Share',
          onPress: async () => {
            const shared = await sharePreparedExport(prepared);
            if (!shared) {
              snackbar.show('This device cannot open the sharing menu.', { kind: 'error' });
            }
          },
        },
      });
      return true;
    },
    [snackbar]
  );

  return { deliver };
}
