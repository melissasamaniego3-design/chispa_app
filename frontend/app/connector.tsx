import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, GitMerge, Shuffle } from 'lucide-react-native';
import GamifiedButton from '../src/components/GamifiedButton';
import LevelBadge from '../src/components/LevelBadge';
import Mascot, { MascotPose } from '../src/components/Mascot';
import MascotBubble from '../src/components/MascotBubble';
import { COLORS, FONTS, xpProgress } from '../src/lib/levels';
import { applyChallengeCompletion, loadProfile, Profile, saveProfile } from '../src/lib/storage';
import { api, Concepts, Fusion } from '../src/lib/api';

export default function Connector() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [concepts, setConcepts] = useState<Concepts | null>(null);
  const [loading, setLoading] = useState(true);
  const [userIdea, setUserIdea] = useState('');
  const [fusion, setFusion] = useState<Fusion | null>(null);
  const [fusing, setFusing] = useState(false);

  const loadConcepts = useCallback(async (p: Profile) => {
    setLoading(true);
    setFusion(null);
    setUserIdea('');
    try {
      const level = xpProgress(p.xp).level;
      const c = await api.conceptsGenerate(level, p.purpose);
      setConcepts(c);
    } catch {
      Alert.alert('Ups', 'No pude generar conceptos. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      const p = await loadProfile();
      setProfile(p);
      loadConcepts(p);
    })();
  }, [loadConcepts]);

  const fuse = async () => {
    if (!profile || !concepts || fusing) return;
    const idea = userIdea.trim();
    if (idea.length < 10) {
      Alert.alert('Necesito tu chispa primero 🐾', 'Escribe al menos una frase con tu propia conexión antes de fusionar. ¡Esa es la parte importante!');
      return;
    }
    setFusing(true);
    try {
      const level = xpProgress(profile.xp).level;
      const f = await api.conceptsFuse(level, profile.purpose, concepts.concept_a, concepts.concept_b, idea);
      setFusion(f);
      // Always grant XP — the user's fusion is mandatory now
      const updated = applyChallengeCompletion(profile, 15);
      await saveProfile(updated);
      setProfile(updated);
    } catch {
      Alert.alert('Ups', 'No pude fusionar. Inténtalo de nuevo.');
    } finally {
      setFusing(false);
    }
  };

  if (!profile) return <View style={styles.safe} />;
  const level = xpProgress(profile.xp).level;

  // Reactive mascot for the intro/state
  const trimmed = userIdea.trim();
  let introPose: MascotPose = 'play_bow';
  let introMsg = 'Dos conceptos que parecen no tener nada que ver. Tu trabajo: encontrar la chispa.';
  if (loading) {
    introPose = 'sleepy_curl';
    introMsg = 'Buscando conceptos lejanos en mi caja de huesos… 🦴';
  } else if (fusing) {
    introPose = 'eager_stand';
    introMsg = 'Olfateando conexiones… ¡esto huele bien!';
  } else if (fusion) {
    introPose = 'happy_tongue';
    introMsg = '¡Mira esa chispa! +15 XP. Aquí van mis bisociaciones.';
  } else if (trimmed.length >= 10) {
    introPose = 'curious_up';
    introMsg = '¡Buena fusión! Pulsa Fusionar y vemos qué sale juntos.';
  } else if (trimmed.length > 0) {
    introPose = 'eager_stand';
    introMsg = `Voy escuchando… escribe un poco más (${trimmed.length}/10).`;
  } else if (concepts) {
    introPose = 'play_bow';
    introMsg = 'Mira estos dos. Escribe TU chispa antes de fusionar. 🐾';
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} testID="back-button" style={styles.backBtn}>
          <ChevronLeft size={26} color={COLORS.text} strokeWidth={2.5} />
        </Pressable>
        <Text style={styles.headerTitle}>Conector de conceptos</Text>
        <LevelBadge level={level} compact />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={20}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <MascotBubble
            pose={introPose}
            message={introMsg}
            size={90}
            variant="cream"
            style={{ marginBottom: 18 }}
            testID="connector-mascot-bubble"
          />

          {loading ? (
            <View style={styles.center}>
              <Mascot pose="sleepy_curl" size={130} />
              <Text style={styles.loading}>Buscando conceptos lejanos…</Text>
              <ActivityIndicator color={COLORS.violet} size="small" />
            </View>
          ) : concepts ? (
            <>
              <View style={styles.conceptsRow}>
                <ConceptCard label={concepts.concept_a} color={COLORS.yellow} testID="concept-a" />
                <View style={styles.fusionIcon}>
                  <GitMerge size={28} color={COLORS.violet} strokeWidth={2.5} />
                </View>
                <ConceptCard label={concepts.concept_b} color={COLORS.coral} textColor="#fff" testID="concept-b" />
              </View>

              <Pressable testID="connector-shuffle" style={styles.shuffleBtn} onPress={() => loadConcepts(profile)}>
                <Shuffle size={16} color={COLORS.text} strokeWidth={2.5} />
                <Text style={styles.shuffleText}>Otros conceptos</Text>
              </Pressable>

              <Text style={styles.label}>Tu fusión <Text style={styles.labelRequired}>· requerida</Text></Text>
              <TextInput
                testID="connector-input"
                style={styles.input}
                placeholder="¿Qué emerge cuando los juntas? Escribe tu propia chispa…"
                placeholderTextColor={COLORS.muted}
                value={userIdea}
                onChangeText={setUserIdea}
                multiline
                editable={!fusing}
              />
              <Text style={[styles.helper, trimmed.length < 10 && styles.helperWarn]}>
                {trimmed.length < 10
                  ? `Escribe tu propia conexión antes de fusionar (mín. 10 caracteres · ${trimmed.length}/10)`
                  : '¡Listo! Pulsa Fusionar para ver mis bisociaciones y ganar +15 XP 🔥'}
              </Text>

              <GamifiedButton
                label={fusing ? 'Fusionando…' : 'Fusionar'}
                variant="violet"
                onPress={fuse}
                disabled={fusing || trimmed.length < 10}
                testID="connector-fuse"
                style={{ marginTop: 14 }}
              />

              {fusion && (
                <View style={styles.fusionResult} testID="connector-result">
                  <View style={styles.fusionHeader}>
                    <Mascot pose="running" size={64} bounce />
                    <Text style={styles.fusionTitle}>Bisociaciones</Text>
                  </View>
                  {fusion.fusions.map((f, i) => (
                    <View key={i} style={styles.fusionItem}>
                      <View style={styles.fusionNum}>
                        <Text style={styles.fusionNumText}>{i + 1}</Text>
                      </View>
                      <Text style={styles.fusionText}>{f}</Text>
                    </View>
                  ))}
                  <View style={styles.invite}>
                    <Text style={styles.inviteLabel}>SIGUIENTE PASO</Text>
                    <Text style={styles.inviteText}>{fusion.invitation}</Text>
                  </View>
                </View>
              )}
            </>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ConceptCard({
  label,
  color,
  textColor,
  testID,
}: {
  label: string;
  color: string;
  textColor?: string;
  testID?: string;
}) {
  return (
    <View testID={testID} style={[styles.conceptCard, { backgroundColor: color }]}>
      <Text style={[styles.conceptText, textColor ? { color: textColor } : undefined]} numberOfLines={3}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.borderStrong,
    borderBottomWidth: 4,
  },
  headerTitle: { fontFamily: FONTS.heading,  flex: 1, fontSize: 18, fontWeight: '900', color: COLORS.text, marginLeft: 8 },
  scroll: { padding: 20, paddingBottom: 60 },
  introRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  intro: { flex: 1, fontSize: 15, color: COLORS.muted, lineHeight: 22 },
  center: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 12 },
  loading: { color: COLORS.muted, fontWeight: '700' },
  conceptsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  conceptCard: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: COLORS.borderStrong,
    borderBottomWidth: 6,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  conceptText: { fontFamily: FONTS.heading,  fontSize: 22, fontWeight: '900', color: COLORS.text, textAlign: 'center', letterSpacing: -0.3 },
  fusionIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.borderStrong,
    borderBottomWidth: 4,
  },
  shuffleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'center',
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.surface,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: COLORS.borderStrong,
    borderBottomWidth: 3,
  },
  shuffleText: { fontWeight: '900', color: COLORS.text, fontSize: 13, letterSpacing: 0.3 },
  label: {
    marginTop: 22,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.2,
    color: COLORS.muted,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  labelRequired: {
    color: COLORS.coral,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  helper: {
    marginTop: 8,
    fontSize: 13,
    color: COLORS.muted,
    fontWeight: '600',
  },
  helperWarn: {
    color: COLORS.coral,
    fontWeight: '700',
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: COLORS.borderStrong,
    borderBottomWidth: 5,
    minHeight: 110,
    padding: 14,
    fontSize: 16,
    color: COLORS.text,
    textAlignVertical: 'top',
  },
  fusionResult: {
    marginTop: 22,
    backgroundColor: '#FFF1DC',
    borderRadius: 22,
    borderWidth: 2,
    borderColor: COLORS.orange,
    borderBottomWidth: 6,
    borderBottomColor: COLORS.orangeDark,
    padding: 18,
  },
  fusionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  fusionTitle: { fontFamily: FONTS.heading,  fontSize: 20, fontWeight: '900', color: COLORS.orange },
  fusionItem: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.borderStrong,
    marginBottom: 8,
  },
  fusionNum: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: COLORS.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.borderStrong,
  },
  fusionNumText: { fontSize: 14, fontWeight: '900', color: COLORS.text },
  fusionText: { flex: 1, fontSize: 15, color: COLORS.text, lineHeight: 21 },
  invite: {
    marginTop: 8,
    backgroundColor: COLORS.purple,
    borderRadius: 14,
    padding: 14,
    borderWidth: 2,
    borderColor: COLORS.borderStrong,
  },
  inviteLabel: { fontFamily: FONTS.heading,  fontSize: 11, fontWeight: '900', letterSpacing: 1.2, color: COLORS.yellow, marginBottom: 4 },
  inviteText: { fontSize: 15, color: '#fff', fontWeight: '600', lineHeight: 21 },
});
