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
import { ChevronLeft, Lightbulb, Target, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import GamifiedButton from '../src/components/GamifiedButton';
import LevelBadge from '../src/components/LevelBadge';
import { COLORS, xpProgress } from '../src/lib/levels';
import {
  applyChallengeCompletion,
  loadCachedChallenge,
  loadProfile,
  Profile,
  saveCachedChallenge,
  saveProfile,
  todayStr,
} from '../src/lib/storage';
import { api, DailyChallenge as ChallengeT, ChallengeFeedback } from '../src/lib/api';

export default function Challenge() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [challenge, setChallenge] = useState<ChallengeT | null>(null);
  const [loading, setLoading] = useState(true);
  const [response, setResponse] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<ChallengeFeedback | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [completed, setCompleted] = useState(false);

  const fetchChallenge = useCallback(async (p: Profile) => {
    setLoading(true);
    try {
      const cached = await loadCachedChallenge();
      const today = todayStr();
      const level = xpProgress(p.xp).level;
      if (cached && cached.date === today && cached.level === level) {
        setChallenge(cached.data);
        if (cached.completed) {
          setCompleted(true);
          if (cached.feedback) setFeedback(cached.feedback);
          if (cached.response) setResponse(cached.response);
        }
      } else {
        const data = await api.dailyChallenge(level, p.purpose, today);
        setChallenge(data);
        await saveCachedChallenge({ date: today, level, data, completed: false });
      }
    } catch (e: any) {
      Alert.alert('Ups', 'No pude cargar el reto. Revisa tu conexión.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      const p = await loadProfile();
      setProfile(p);
      fetchChallenge(p);
    })();
  }, [fetchChallenge]);

  const submit = async () => {
    if (!profile || !challenge || response.trim().length < 5) return;
    setSubmitting(true);
    try {
      const level = xpProgress(profile.xp).level;
      const fb = await api.challengeFeedback(level, profile.purpose, challenge.prompt, response.trim());
      setFeedback(fb);

      const updated = applyChallengeCompletion(profile, fb.xp);
      await saveProfile(updated);
      setProfile(updated);
      const today = todayStr();
      await saveCachedChallenge({
        date: today,
        level,
        data: challenge,
        completed: true,
        feedback: fb,
        response: response.trim(),
      });
      setCompleted(true);
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch {
      Alert.alert('Ups', 'No pude enviar tu respuesta. Inténtalo de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !profile) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Header onBack={() => router.back()} level={1} />
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.violet} size="large" />
          <Text style={styles.loading}>Encendiendo tu reto…</Text>
        </View>
      </SafeAreaView>
    );
  }

  const level = xpProgress(profile.xp).level;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header onBack={() => router.back()} level={level} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={20}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {challenge && (
            <View style={styles.promptCard}>
              <View style={styles.promptHeader}>
                <Target size={20} color={COLORS.text} strokeWidth={2.5} />
                <Text style={styles.promptType}>{labelType(challenge.type)}</Text>
              </View>
              <Text style={styles.promptTitle} testID="challenge-title">{challenge.title}</Text>
              <Text style={styles.promptText} testID="challenge-prompt">{challenge.prompt}</Text>

              {challenge.hint && !showHint && (
                <Pressable onPress={() => setShowHint(true)} style={styles.hintBtn} testID="challenge-hint-toggle">
                  <Lightbulb size={16} color={COLORS.violet} />
                  <Text style={styles.hintBtnText}>Ver pista</Text>
                </Pressable>
              )}
              {challenge.hint && showHint && (
                <View style={styles.hint}>
                  <Lightbulb size={16} color={COLORS.violet} strokeWidth={2.5} />
                  <Text style={styles.hintText}>{challenge.hint}</Text>
                </View>
              )}
            </View>
          )}

          {!completed && (
            <>
              <Text style={styles.label}>Tu respuesta</Text>
              <TextInput
                testID="challenge-input"
                style={styles.input}
                multiline
                placeholder="Escribe tu idea, no te censures…"
                placeholderTextColor={COLORS.muted}
                value={response}
                onChangeText={setResponse}
                editable={!submitting}
              />
              <GamifiedButton
                label={submitting ? 'Enviando…' : 'Enviar respuesta'}
                variant="green"
                onPress={submit}
                disabled={submitting || response.trim().length < 5}
                testID="challenge-submit"
                style={{ marginTop: 16 }}
              />
            </>
          )}

          {completed && feedback && (
            <View style={styles.feedbackWrap} testID="challenge-feedback">
              <View style={styles.responseBubble}>
                <Text style={styles.responseLabel}>TU RESPUESTA</Text>
                <Text style={styles.responseText}>{response}</Text>
              </View>

              <View style={styles.feedbackCard}>
                <View style={styles.feedbackHeader}>
                  <Sparkles size={20} color={COLORS.violet} strokeWidth={2.5} />
                  <Text style={styles.feedbackTitle}>Chispa dice</Text>
                  <View style={styles.xpPill}>
                    <Text style={styles.xpPillText}>+{feedback.xp} XP</Text>
                  </View>
                </View>
                <Text style={styles.feedbackText}>{feedback.feedback}</Text>
                <View style={styles.pushBox}>
                  <Text style={styles.pushLabel}>SIGUIENTE EMPUJÓN</Text>
                  <Text style={styles.pushText}>{feedback.next_push}</Text>
                </View>
              </View>

              <GamifiedButton
                label="Volver al inicio"
                variant="violet"
                onPress={() => router.replace('/home')}
                testID="challenge-back-home"
                style={{ marginTop: 8 }}
              />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function labelType(t: string): string {
  return (
    {
      lateral: 'Pensamiento lateral',
      what_if: '¿Y si…?',
      constraint: 'Restricción inusual',
      analogy: 'Analogía',
    } as Record<string, string>
  )[t] ?? 'Reto creativo';
}

function Header({ onBack, level }: { onBack: () => void; level: any }) {
  return (
    <View style={styles.header}>
      <Pressable onPress={onBack} testID="back-button" style={styles.backBtn}>
        <ChevronLeft size={26} color={COLORS.text} strokeWidth={2.5} />
      </Pressable>
      <Text style={styles.headerTitle}>Reto diario</Text>
      <LevelBadge level={level} compact />
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
  headerTitle: { flex: 1, fontSize: 20, fontWeight: '900', color: COLORS.text, marginLeft: 8 },
  scroll: { padding: 20, paddingBottom: 60 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loading: { color: COLORS.muted, fontSize: 14, fontWeight: '700' },
  promptCard: {
    backgroundColor: COLORS.yellow,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: COLORS.borderStrong,
    borderBottomWidth: 6,
    padding: 18,
    marginBottom: 20,
  },
  promptHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  promptType: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: COLORS.text,
  },
  promptTitle: { fontSize: 24, fontWeight: '900', color: COLORS.text, marginBottom: 8 },
  promptText: { fontSize: 17, lineHeight: 24, color: COLORS.text, fontWeight: '500' },
  hintBtn: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFEF5',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    alignSelf: 'flex-start',
    borderWidth: 2,
    borderColor: COLORS.borderStrong,
  },
  hintBtnText: { fontWeight: '900', color: COLORS.violet, fontSize: 13 },
  hint: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#FFFEF5',
    padding: 12,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.borderStrong,
  },
  hintText: { flex: 1, fontSize: 14, color: COLORS.text, lineHeight: 20 },
  label: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.2,
    color: COLORS.muted,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: COLORS.borderStrong,
    borderBottomWidth: 5,
    minHeight: 160,
    padding: 16,
    fontSize: 16,
    color: COLORS.text,
    textAlignVertical: 'top',
  },
  feedbackWrap: { gap: 14 },
  responseBubble: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 14,
    borderWidth: 2,
    borderColor: COLORS.borderStrong,
    borderBottomWidth: 4,
  },
  responseLabel: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
    color: COLORS.muted,
    marginBottom: 4,
  },
  responseText: { fontSize: 15, color: COLORS.text, lineHeight: 22 },
  feedbackCard: {
    backgroundColor: '#F4ECFF',
    borderRadius: 22,
    padding: 18,
    borderWidth: 2,
    borderColor: COLORS.violet,
    borderBottomWidth: 6,
    borderBottomColor: COLORS.violetDark,
  },
  feedbackHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  feedbackTitle: { flex: 1, fontSize: 18, fontWeight: '900', color: COLORS.violet },
  xpPill: {
    backgroundColor: COLORS.green,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: COLORS.borderStrong,
  },
  xpPillText: { color: '#fff', fontWeight: '900', fontSize: 13 },
  feedbackText: { fontSize: 16, lineHeight: 24, color: COLORS.text },
  pushBox: {
    marginTop: 14,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    borderWidth: 2,
    borderColor: COLORS.borderStrong,
  },
  pushLabel: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
    color: COLORS.coral,
    marginBottom: 4,
  },
  pushText: { fontSize: 15, color: COLORS.text, fontWeight: '600', lineHeight: 21 },
});
