import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Flame } from 'lucide-react-native';
import { COLORS } from '../lib/levels';

export default function StreakBadge({ streak }: { streak: number }) {
  const scale = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 4, tension: 120 }).start();
  }, [streak, scale]);

  return (
    <Animated.View
      testID="streak-badge"
      style={[styles.wrap, { transform: [{ scale }] }]}
    >
      <Flame size={16} color={COLORS.coral} strokeWidth={3} fill={COLORS.coral} />
      <Text style={styles.text}>{streak}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.borderStrong,
    borderBottomWidth: 4,
  },
  text: { fontWeight: '900', fontSize: 16, color: COLORS.coral },
});
