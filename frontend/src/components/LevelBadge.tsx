import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, LEVELS, LevelId } from '../lib/levels';
import { Sparkles, Flame, Sun, Zap } from 'lucide-react-native';

const ICONS: Record<LevelId, any> = {
  1: Sparkles,
  2: Zap,
  3: Flame,
  4: Sun,
};

export default function LevelBadge({ level, compact }: { level: LevelId; compact?: boolean }) {
  const Icon = ICONS[level];
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
      <Icon size={compact ? 16 : 20} color={COLORS.text} strokeWidth={2.5} />
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
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: COLORS.borderStrong,
    borderBottomWidth: 4,
  },
  compact: { paddingHorizontal: 10, paddingVertical: 6 },
  text: {
    fontWeight: '900',
    fontSize: 14,
    color: COLORS.text,
    letterSpacing: 0.3,
  },
  textCompact: { fontSize: 12 },
});
