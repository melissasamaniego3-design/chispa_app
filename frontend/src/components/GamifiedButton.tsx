import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, ViewStyle, TextStyle, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, FONTS } from '../lib/levels';

type Variant = 'yellow' | 'coral' | 'violet' | 'green' | 'ghost' | 'orange' | 'purple' | 'red';

const VARIANTS: Record<Variant, { bg: string; bottom: string; text: string }> = {
  yellow: { bg: COLORS.yellow, bottom: COLORS.yellowDark, text: COLORS.text },
  orange: { bg: COLORS.orange, bottom: COLORS.orangeDark, text: '#fff' },
  red: { bg: COLORS.red, bottom: COLORS.redDark, text: '#fff' },
  purple: { bg: COLORS.purple, bottom: COLORS.purpleDark, text: '#fff' },
  coral: { bg: COLORS.red, bottom: COLORS.redDark, text: '#fff' },
  violet: { bg: COLORS.purple, bottom: COLORS.purpleDark, text: '#fff' },
  green: { bg: COLORS.green, bottom: COLORS.greenDark, text: '#fff' },
  ghost: { bg: COLORS.surface, bottom: COLORS.border, text: COLORS.text },
};

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
  small?: boolean;
};

export default function GamifiedButton({
  label,
  onPress,
  variant = 'yellow',
  disabled,
  style,
  textStyle,
  testID,
  small,
}: Props) {
  const v = VARIANTS[variant];
  const press = useRef(new Animated.Value(0)).current;

  const animateTo = (val: number) =>
    Animated.spring(press, { toValue: val, useNativeDriver: false, friction: 6, tension: 200 }).start();

  const translateY = press.interpolate({ inputRange: [0, 1], outputRange: [0, 4] });
  const borderBottom = press.interpolate({ inputRange: [0, 1], outputRange: [4, 0] });

  return (
    <Pressable
      testID={testID}
      disabled={disabled}
      onPressIn={() => {
        animateTo(1);
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }}
      onPressOut={() => animateTo(0)}
      onPress={onPress}
      style={({ pressed }) => [{ opacity: disabled ? 0.45 : 1 }, style]}
    >
      <Animated.View
        style={[
          styles.btn,
          small && styles.btnSmall,
          {
            backgroundColor: v.bg,
            borderColor: COLORS.borderStrong,
            borderBottomColor: v.bottom,
            transform: [{ translateY }],
            borderBottomWidth: borderBottom as unknown as number,
          },
        ]}
      >
        <Text style={[styles.label, small && styles.labelSmall, { color: v.text }, textStyle]}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  btnSmall: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    minHeight: 44,
    borderRadius: 14,
  },
  label: {
    fontSize: 17,
    fontFamily: FONTS.heading,
    fontWeight: '900',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  labelSmall: { fontSize: 14 },
});
