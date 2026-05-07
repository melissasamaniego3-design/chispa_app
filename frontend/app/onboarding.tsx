import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Sparkles } from 'lucide-react-native';
import GamifiedButton from '../src/components/GamifiedButton';
import { COLORS, PURPOSES } from '../src/lib/levels';
import { loadProfile, saveProfile } from '../src/lib/storage';
import { ensureDailyReminder } from '../src/lib/notifications';

const HERO = 'https://images.unsplash.com/photo-1751644332113-2004a1b143f1?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzNzl8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMGNvbG9yZnVsJTIwM2QlMjBzaGFwZXN8ZW58MHx8fHwxNzc4MTgwOTUyfDA&ixlib=rb-4.1.0&q=85';

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [purpose, setPurpose] = useState<string | null>(null);

  const finish = async () => {
    const p = await loadProfile();
    await saveProfile({ ...p, purpose, onboarded: true });
    ensureDailyReminder(true);
    router.replace('/home');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.dots}>
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={[styles.dot, step >= i && { backgroundColor: COLORS.violet }]}
          />
        ))}
      </View>

      {step === 0 && (
        <ScrollView contentContainerStyle={styles.scroll}>
          <Image source={{ uri: HERO }} style={styles.hero} />
          <View style={styles.titleRow}>
            <Sparkles size={32} color={COLORS.violet} strokeWidth={2.5} />
            <Text style={styles.title} testID="onboarding-title">Chispa</Text>
          </View>
          <Text style={styles.subtitle}>
            Entrena tu pensamiento creativo con retos diarios e ideas absurdas, guiados por una IA.
          </Text>
          <GamifiedButton
            label="Empezar"
            variant="violet"
            onPress={() => setStep(1)}
            testID="onboarding-start"
            style={{ marginTop: 24 }}
          />
        </ScrollView>
      )}

      {step === 1 && (
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.eyebrow}>Cómo funciona</Text>
          <Text style={styles.h2}>Cuatro niveles. Una llama que crece.</Text>
          <View style={{ gap: 12, marginTop: 20 }}>
            <LevelRow num={1} name="Chispa" color={COLORS.yellow} desc="Calientas motores. La IA te lleva de la mano." />
            <LevelRow num={2} name="Llama" color="#FF9F1C" desc="Saltos laterales. Menos pistas, más ideas." />
            <LevelRow num={3} name="Hoguera" color={COLORS.coral} desc="Conexiones lejanas. La IA empuja fuerte." />
            <LevelRow num={4} name="Infierno" color={COLORS.violet} desc="Modo experto. La IA te reta sin piedad." />
          </View>
          <GamifiedButton
            label="Vamos"
            variant="violet"
            onPress={() => setStep(2)}
            testID="onboarding-next"
            style={{ marginTop: 28 }}
          />
        </ScrollView>
      )}

      {step === 2 && (
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.eyebrow}>Una pregunta</Text>
          <Text style={styles.h2}>¿Para qué quieres usar tu creatividad?</Text>
          <Text style={[styles.subtitle, { marginTop: 8 }]}>
            Solo personaliza ejemplos. Todos empezamos en nivel 1.
          </Text>
          <View style={{ gap: 12, marginTop: 24 }}>
            {PURPOSES.map((p) => (
              <PurposeCard
                key={p.id}
                selected={purpose === p.id}
                emoji={p.emoji}
                label={p.label}
                onPress={() => setPurpose(p.id)}
                testID={`onboarding-purpose-${p.id}`}
              />
            ))}
          </View>
          <GamifiedButton
            label="Encender la chispa"
            variant="yellow"
            disabled={!purpose}
            onPress={finish}
            testID="onboarding-finish"
            style={{ marginTop: 28 }}
          />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function LevelRow({ num, name, color, desc }: { num: number; name: string; color: string; desc: string }) {
  return (
    <View style={styles.levelRow}>
      <View style={[styles.levelNum, { backgroundColor: color }]}>
        <Text style={styles.levelNumText}>{num}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.levelName}>{name}</Text>
        <Text style={styles.levelDesc}>{desc}</Text>
      </View>
    </View>
  );
}

function PurposeCard({
  selected,
  emoji,
  label,
  onPress,
  testID,
}: {
  selected: boolean;
  emoji: string;
  label: string;
  onPress: () => void;
  testID?: string;
}) {
  const scale = React.useRef(new Animated.Value(1)).current;
  return (
    <Pressable
      testID={testID}
      onPressIn={() => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()}
      onPress={onPress}
    >
      <Animated.View
        style={[
          styles.purposeCard,
          {
            transform: [{ scale }],
            borderColor: selected ? COLORS.violet : COLORS.borderStrong,
            backgroundColor: selected ? '#F4ECFF' : COLORS.surface,
            borderBottomColor: selected ? COLORS.violetDark : COLORS.borderStrong,
          },
        ]}
      >
        <Text style={styles.purposeEmoji}>{emoji}</Text>
        <Text style={styles.purposeLabel}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  dot: {
    width: 28,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EADFD3',
  },
  scroll: { padding: 24, paddingBottom: 48 },
  hero: { width: '100%', height: 240, borderRadius: 28, marginBottom: 20, backgroundColor: '#eee' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { fontSize: 48, fontWeight: '900', color: COLORS.text, letterSpacing: -1 },
  eyebrow: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.violet,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  h2: { fontSize: 30, fontWeight: '900', color: COLORS.text, lineHeight: 36 },
  subtitle: { fontSize: 17, color: COLORS.muted, lineHeight: 24, marginTop: 12 },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 14,
    borderWidth: 2,
    borderColor: COLORS.borderStrong,
    borderBottomWidth: 4,
  },
  levelNum: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.borderStrong,
  },
  levelNumText: { fontSize: 22, fontWeight: '900', color: COLORS.text },
  levelName: { fontSize: 18, fontWeight: '900', color: COLORS.text },
  levelDesc: { fontSize: 13, color: COLORS.muted, marginTop: 2 },
  purposeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 2,
    borderBottomWidth: 5,
  },
  purposeEmoji: { fontSize: 32 },
  purposeLabel: { fontSize: 18, fontWeight: '900', color: COLORS.text },
});
