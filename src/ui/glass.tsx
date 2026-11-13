import React from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { haptic } from './haptics';
import { glass } from './theme';

/** Тёмная сине-гранатовая плитка в духе iOS-иконки. */
export function GlassTile({
  size = 44,
  children,
  onPress,
  active,
  disabled,
  accessibilityLabel,
  testID,
  style,
}: {
  size?: number;
  children?: React.ReactNode;
  onPress?: () => void;
  active?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
  testID?: string;
  style?: ViewStyle;
}) {
  const radius = Math.round(size * 0.28);
  const tile = (
    <View
      style={[
        styles.tile,
        { width: size, height: size, borderRadius: radius },
        active && styles.active,
        disabled && styles.disabled,
        style,
      ]}
    >
      <View
        pointerEvents="none"
        style={[styles.glowBlue, { width: size, height: size, borderRadius: size, top: -size * 0.46, left: -size * 0.34 }]}
      />
      <View
        pointerEvents="none"
        style={[styles.glowGarnet, { width: size * 0.95, height: size * 0.95, borderRadius: size, bottom: -size * 0.5, right: -size * 0.38 }]}
      />
      <View pointerEvents="none" style={styles.sheen} />
      <View style={styles.content}>{children}</View>
    </View>
  );
  if (!onPress) return tile;
  return (
    <Pressable
      testID={testID}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: !!active, disabled: !!disabled }}
      hitSlop={4}
      onPress={() => {
        if (disabled) return;
        haptic('selection');
        onPress();
      }}
      style={({ pressed }) => [pressed && !disabled && { opacity: 0.78, transform: [{ scale: 0.96 }] }]}
    >
      {tile}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    backgroundColor: glass.bg,
    borderWidth: 1,
    borderColor: glass.line,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  active: {
    borderColor: 'rgba(237,187,0,0.92)',
    borderWidth: 1.5,
  },
  disabled: { opacity: 0.35 },
  glowBlue: {
    position: 'absolute',
    backgroundColor: glass.blue,
    opacity: 0.55,
  },
  glowGarnet: {
    position: 'absolute',
    backgroundColor: glass.garnet,
    opacity: 0.95,
  },
  sheen: {
    position: 'absolute',
    top: 0,
    left: 10,
    right: 10,
    height: StyleSheet.hairlineWidth,
    backgroundColor: glass.sheen,
  },
  content: {
    zIndex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
