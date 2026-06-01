/**
 * MascotBubble: la mascota junto a una burbuja de diálogo.
 * Anima el mensaje cuando cambia de texto, y la pose cambia suavemente
 * a través del componente Mascot.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View, ViewStyle, StyleProp } from 'react-native';
import Mascot, { MascotPose } from './Mascot';
import { COLORS } from '../lib/levels';

type Variant = 'cream' | 'yellow' | 'orange' | 'purple';

const VARIANT_STYLES: Record<Variant, { bg: string; border: string; bottomBorder: string; color: string }> = {
  cream: { bg: COLORS.surface, border: COLORS.borderStrong, bottomBorder: COLORS.borderStrong, color: COLORS.text },
  yellow: { bg: COLORS.yellow, border: COLORS.borderStrong, bottomBorder: COLORS.borderStrong, color: COLORS.text },
  orange: { bg: '#FFE7D5', border: COLORS.orange, bottomBorder: COLORS.orangeDark, color: COLORS.text },
  purple: { bg: '#F4ECFF', border: COLORS.violet, bottomBorder: COLORS.violetDark ?? COLORS.borderStrong, color: COLORS.text },
};

type Props = {
  pose: MascotPose;
  message: string;
  size?: number;
  variant?: Variant;
  bounce?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export default function MascotBubble({
  pose,
  message,
  size = 90,
  variant = 'cream',
  bounce = false,
  style,
  testID,
}: Props) {
  const v = VARIANT_STYLES[variant];
  const opacity = useRef(new Animated.Value(1)).current;
  const ty = useRef(new Animated.Value(0)).current;
  const prevMsg = useRef(message);

  useEffect(() => {
    if (prevMsg.current === message) return;
    prevMsg.current = message;
    opacity.setValue(0);
    ty.setValue(6);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.spring(ty, { toValue: 0, friction: 6, useNativeDriver: true }),
    ]).start();
  }, [message, opacity, ty]);

  return (
    <View testID={testID} style={[styles.row, style]}>
      <Mascot pose={pose} size={size} bounce={bounce} />
      <View
        style={[
          styles.bubble,
          { backgroundColor: v.bg, borderColor: v.border, borderBottomColor: v.bottomBorder },
        ]}
      >
        <Animated.Text style={[styles.text, { color: v.color, opacity, transform: [{ translateY: ty }] }]}>
          {message}
        </Animated.Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bubble: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
    borderWidth: 2,
    borderBottomWidth: 4,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
});
