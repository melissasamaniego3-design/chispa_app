import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, Text } from 'react-native';
import { COLORS } from '../lib/levels';

export default function XPProgressBar({ pct, current, needed }: { pct: number; current: number; needed: number }) {
  const w = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(w, { toValue: pct, useNativeDriver: false, friction: 7, tension: 60 }).start();
  }, [pct, w]);

  const widthInterp = w.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View testID="xp-progress" style={styles.wrap}>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, { width: widthInterp }]} />
      </View>
      <Text style={styles.text}>
        {current} / {needed} XP
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  track: {
    height: 18,
    borderRadius: 999,
    backgroundColor: '#F1E7DC',
    borderWidth: 2,
    borderColor: COLORS.borderStrong,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: COLORS.yellow,
    borderRightWidth: 2,
    borderRightColor: COLORS.yellowDark,
  },
  text: { fontWeight: '800', fontSize: 12, color: COLORS.muted, letterSpacing: 0.3 },
});
