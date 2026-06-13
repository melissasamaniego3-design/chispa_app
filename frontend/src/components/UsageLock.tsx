import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Lock, Sparkles } from 'lucide-react-native';
import { router } from 'expo-router';
import { COLORS, FONTS } from '../lib/levels';

type UsageBadgeProps = {
  used: number;
  total: number;
  label?: string;
  testID?: string;
};

export function UsageBadge({ used, total, label = 'hoy', testID }: UsageBadgeProps) {
  const remaining = Math.max(0, total - used);
  const lowOrZero = remaining <= 1;
  return (
    <View
      testID={testID}
      style={[
        styles.badge,
        {
          backgroundColor: lowOrZero ? '#FFE0E0' : COLORS.yellow,
          borderColor: COLORS.borderStrong,
        },
      ]}
    >
      <Sparkles color={COLORS.text} size={12} />
      <Text style={styles.badgeText}>
        {remaining} / {total} {label}
      </Text>
    </View>
  );
}

type LimitReachedProps = {
  title: string;
  message: string;
  ctaLabel?: string;
  testID?: string;
};

export function LimitReachedCard({
  title,
  message,
  ctaLabel = 'CONOCE CHISPA PRO ✨',
  testID,
}: LimitReachedProps) {
  return (
    <View testID={testID} style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.lockCircle}>
          <Lock color="#fff" size={20} strokeWidth={3} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardMsg}>{message}</Text>
        </View>
      </View>
      <Pressable
        onPress={() => router.push('/premium')}
        style={({ pressed }) => [styles.cta, pressed && { opacity: 0.85 }]}
      >
        <Sparkles color={COLORS.text} size={16} />
        <Text style={styles.ctaText}>{ctaLabel}</Text>
      </Pressable>
      <Text style={styles.cardFoot}>Tus límites se renuevan mañana 🐾</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 2,
    borderBottomWidth: 3,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontFamily: FONTS.heading,
    color: COLORS.text,
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.borderStrong,
    borderWidth: 2,
    borderBottomWidth: 5,
    borderRadius: 20,
    padding: 18,
    gap: 14,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  lockCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.violet,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.borderStrong,
  },
  cardTitle: { fontFamily: FONTS.heading, fontSize: 16, fontWeight: '900', color: COLORS.text },
  cardMsg: { fontSize: 13, color: COLORS.muted, marginTop: 2, lineHeight: 18, fontWeight: '600' },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.yellow,
    borderColor: COLORS.borderStrong,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderRadius: 14,
    paddingVertical: 14,
  },
  ctaText: {
    fontFamily: FONTS.heading,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: 0.8,
    fontSize: 14,
  },
  cardFoot: { textAlign: 'center', color: COLORS.muted, fontSize: 12, fontWeight: '600' },
});
