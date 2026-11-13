import { Platform } from 'react-native';

export type HapticKind = 'light' | 'medium' | 'selection' | 'success' | 'warning';

/** Лёгкий haptic с безопасным fallback на web / тесты / неподдерживаемые платформы. */
export function haptic(kind: HapticKind = 'light'): void {
  if (Platform.OS === 'web') return;
  void (async () => {
    try {
      const Haptics = await import('expo-haptics');
      switch (kind) {
        case 'selection':
          await Haptics.selectionAsync();
          return;
        case 'medium':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          return;
        case 'success':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          return;
        case 'warning':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          return;
        default:
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch {
      // web, jest/tsx, симулятор без Taptic Engine
    }
  })();
}
