import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, LEVELS, LevelId } from '../lib/levels';

export default function LevelBadge({ level, compact }: { level: LevelId; compact?: boolean }) {
  const cfg = LEVELS[level];
  return (
    <View
      testID="level-badge"
      style={[
        styles.wrap,
        compact && styles.compact,
        { backgroundColor: cfg.color, borderBottomColor: COLORS.borderStrong },
      ]}
    >
      <Text style={styles.bolt}>⚡</Text>
      <Text style={[styles.text, compact && styles.textCompact]} numberOfLines={1}>
        Nv {level} · {cfg.name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: COLORS.borderStrong,
    borderBottomWidth: 4,
  },
  compact: { paddingHorizontal: 10, paddingVertical: 6, gap: 4 },
  bolt: { fontSize: 14, color: COLORS.text },
  text: {
    fontFamily: FONTS.heading,
    fontWeight: '900',
    fontSize: 14,
    color: COLORS.text,
    letterSpacing: 0.3,
  },
  textCompact: { fontSize: 12 },
});
