import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Check, Sparkles } from 'lucide-react-native';
import Mascot from '../src/components/Mascot';
import GamifiedButton from '../src/components/GamifiedButton';
import { COLORS, FONTS } from '../src/lib/levels';

type Feature = { emoji: string; title: string; sub: string };

const FEATURES: Feature[] = [
  { emoji: '∞', title: 'Retos diarios sin límite', sub: 'Empieza nuevos cada vez que te apetezca, no solo uno al día' },
  { emoji: '💬', title: 'Chat con el Entrenador ilimitado', sub: 'Hoy: 5 mensajes/día · Pro: charla todo lo que quieras' },
  { emoji: '🔀', title: 'Fusiones de conceptos ilimitadas', sub: 'Hoy: 5/día · Pro: ∞' },
  { emoji: '🧠', title: 'Memoria personalizada', sub: 'La IA aprenderá tu estilo y se adaptará a ti' },
  { emoji: '📊', title: 'Estadísticas avanzadas', sub: 'Visualiza tu evolución creativa y tus patrones' },
  { emoji: '🎁', title: 'Retos especiales semanales', sub: 'Curados a mano + colaboraciones con creativos' },
  { emoji: '⚡️', title: 'Modo "Sprint creativo"', sub: 'Sesiones intensas de 15 min con feedback instantáneo' },
  { emoji: '🌗', title: 'Temas y modo oscuro', sub: 'Personaliza la apariencia a tu gusto' },
];

export default function PremiumScreen() {
  const [notified, setNotified] = useState(false);

  const onNotify = () => {
    setNotified(true);
    Alert.alert(
      '¡Anotado! 🐾',
      'Te avisaremos cuando Chispa Pro esté listo. Mientras, sigue afilando tu creatividad cada día.',
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable testID="premium-back" onPress={() => router.back()} hitSlop={10}>
          <ArrowLeft color={COLORS.text} size={24} />
        </Pressable>
        <Text style={styles.headerTitle}>Chispa Pro</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Hero */}
        <View style={styles.hero}>
          <Mascot pose="running" size={150} bounce />
          <View style={styles.proBadge}>
            <Sparkles color={COLORS.text} size={16} />
            <Text style={styles.proBadgeText}>PRO · Próximamente</Text>
          </View>
          <Text style={styles.title}>Lleva tu creatividad{'\n'}al siguiente nivel</Text>
          <Text style={styles.subtitle}>
            Saca a tu perro creativo a correr sin correa. Sin límites diarios, con memoria personalizada y retos exclusivos.
          </Text>
        </View>

        {/* Comparison header */}
        <View style={styles.compareHeader}>
          <View style={styles.colHeader}>
            <Text style={styles.colLabel}>GRATIS</Text>
            <Text style={styles.colHint}>Hoy</Text>
          </View>
          <View style={styles.colHeaderPro}>
            <Text style={styles.colLabelPro}>PRO ✨</Text>
            <Text style={styles.colHintPro}>Pronto</Text>
          </View>
        </View>

        {/* Features */}
        <View style={styles.features}>
          {FEATURES.map((f, i) => (
            <View key={i} style={styles.feature}>
              <Text style={styles.featureEmoji}>{f.emoji}</Text>
              <View style={styles.featureBody}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureSub}>{f.sub}</Text>
              </View>
              <Check color={COLORS.violet} size={22} strokeWidth={3} />
            </View>
          ))}
        </View>

        {/* Pricing teaser */}
        <View style={styles.pricing}>
          <Text style={styles.pricingLabel}>PRECIO</Text>
          <Text style={styles.pricingMain}>Aún no anunciado</Text>
          <Text style={styles.pricingHint}>Los primeros suscriptores tendrán precio especial</Text>
        </View>

        <GamifiedButton
          label={notified ? '¡Te avisaremos! 🐾' : 'AVÍSAME CUANDO ESTÉ LISTO'}
          variant={notified ? 'ghost' : 'violet'}
          onPress={onNotify}
          disabled={notified}
          testID="premium-notify"
          style={{ marginTop: 8 }}
        />

        <Text style={styles.foot}>
          Por ahora, la versión gratuita incluye 5 mensajes de chat y 5 fusiones al día.
          Se renuevan automáticamente cada mañana.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: { fontFamily: FONTS.heading, fontSize: 20, fontWeight: '900', color: COLORS.text },
  scroll: { padding: 20, paddingBottom: 60 },
  hero: { alignItems: 'center', gap: 8, marginBottom: 22 },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.yellow,
    borderColor: COLORS.borderStrong,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  proBadgeText: { fontFamily: FONTS.heading, fontWeight: '900', color: COLORS.text, letterSpacing: 0.8, fontSize: 12 },
  title: {
    fontFamily: FONTS.heading,
    textAlign: 'center',
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.text,
    marginTop: 8,
    lineHeight: 32,
  },
  subtitle: { textAlign: 'center', color: COLORS.muted, fontSize: 15, lineHeight: 22, paddingHorizontal: 8, fontWeight: '600' },

  compareHeader: { flexDirection: 'row', gap: 12, marginTop: 6, marginBottom: 8 },
  colHeader: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  colLabel: { fontFamily: FONTS.heading, fontWeight: '900', color: COLORS.muted, letterSpacing: 1.2, fontSize: 12 },
  colHint: { fontSize: 11, color: COLORS.muted, fontWeight: '600' },
  colHeaderPro: {
    flex: 1,
    backgroundColor: COLORS.violet,
    borderWidth: 2,
    borderColor: COLORS.borderStrong,
    borderBottomWidth: 4,
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  colLabelPro: { fontFamily: FONTS.heading, fontWeight: '900', color: '#fff', letterSpacing: 1.2, fontSize: 12 },
  colHintPro: { fontSize: 11, color: '#FFE0F0', fontWeight: '600' },

  features: { gap: 10 },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.surface,
    borderColor: COLORS.borderStrong,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderRadius: 16,
    padding: 14,
  },
  featureEmoji: { fontSize: 24, width: 30, textAlign: 'center' },
  featureBody: { flex: 1 },
  featureTitle: { fontFamily: FONTS.heading, fontWeight: '900', color: COLORS.text, fontSize: 15 },
  featureSub: { color: COLORS.muted, fontSize: 12, marginTop: 2, fontWeight: '600' },

  pricing: {
    alignItems: 'center',
    marginTop: 24,
    backgroundColor: COLORS.yellow,
    borderColor: COLORS.borderStrong,
    borderWidth: 2,
    borderBottomWidth: 5,
    borderRadius: 18,
    padding: 18,
  },
  pricingLabel: { fontFamily: FONTS.heading, fontWeight: '900', color: COLORS.text, letterSpacing: 1.4, fontSize: 11 },
  pricingMain: { fontFamily: FONTS.heading, fontWeight: '900', color: COLORS.text, fontSize: 26, marginTop: 4 },
  pricingHint: { color: COLORS.text, fontSize: 12, fontWeight: '700', marginTop: 6 },

  foot: { textAlign: 'center', color: COLORS.muted, fontSize: 12, marginTop: 16, fontWeight: '600', lineHeight: 18 },
});
