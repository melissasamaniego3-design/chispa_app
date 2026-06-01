import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Animated,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Send, RefreshCw } from 'lucide-react-native';
import LevelBadge from '../src/components/LevelBadge';
import Mascot, { MascotPose } from '../src/components/Mascot';
import { COLORS, xpProgress } from '../src/lib/levels';
import {
  clearTrainerHistory,
  loadProfile,
  loadTrainerHistory,
  Profile,
  saveTrainerHistory,
} from '../src/lib/storage';
import { api } from '../src/lib/api';

type Message = { role: 'user' | 'assistant'; content: string; ts: number };

export default function Trainer() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [topic, setTopic] = useState<string>('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    (async () => {
      const p = await loadProfile();
      setProfile(p);
      const hist = await loadTrainerHistory();
      setMessages(hist);
    })();
  }, []);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
  }, [messages.length, sending]);

  const send = async () => {
    if (!profile || sending || input.trim().length === 0) return;
    const userMsg: Message = { role: 'user', content: input.trim(), ts: Date.now() };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setInput('');
    setSending(true);
    try {
      const level = xpProgress(profile.xp).level;
      const isFirst = messages.length === 0;
      const t = isFirst ? userMsg.content : topic || messages[0]?.content;
      if (isFirst) setTopic(userMsg.content);
      const res = await api.trainerChat(profile.trainerSessionId, level, profile.purpose, userMsg.content, t);
      const ai: Message = { role: 'assistant', content: res.reply, ts: Date.now() };
      const final = [...newMsgs, ai];
      setMessages(final);
      await saveTrainerHistory(final);
    } catch {
      Alert.alert('Ups', 'No pude conectar. Inténtalo de nuevo.');
      setMessages(messages);
    } finally {
      setSending(false);
    }
  };

  const reset = () => {
    Alert.alert('Reiniciar conversación', '¿Empezar de cero?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Reiniciar',
        style: 'destructive',
        onPress: async () => {
          await clearTrainerHistory();
          setMessages([]);
          setTopic('');
        },
      },
    ]);
  };

  if (!profile) return <View style={styles.safe} />;
  const level = xpProgress(profile.xp).level;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} testID="back-button" style={styles.backBtn}>
          <ChevronLeft size={26} color={COLORS.text} strokeWidth={2.5} />
        </Pressable>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={styles.headerTitle}>Entrenador de ideas</Text>
          <Text style={styles.headerSub}>Coach socrático · Nv {level}</Text>
        </View>
        {messages.length > 0 && (
          <Pressable onPress={reset} testID="trainer-reset" style={styles.resetBtn}>
            <RefreshCw size={18} color={COLORS.text} strokeWidth={2.5} />
          </Pressable>
        )}
        <LevelBadge level={level} compact />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={20}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {messages.length === 0 && (
            <View style={styles.emptyCard} testID="trainer-empty">
              <Mascot pose="begging" size={130} />
              <Text style={styles.emptyTitle}>¿Sobre qué quieres pensar?</Text>
              <Text style={styles.emptyText}>
                Lanza un tema, una idea, un problema, una obsesión. Te haré preguntas
                inesperadas para llevarlo a otro lugar. No te juzgo, te empujo. 🐾
              </Text>
              <View style={styles.suggestions}>
                {SUGGESTIONS.map((s) => (
                  <Pressable
                    key={s}
                    style={styles.suggestion}
                    onPress={() => setInput(s)}
                    testID={`suggestion-${s.slice(0, 8)}`}
                  >
                    <Text style={styles.suggestionText}>{s}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {messages.map((m, i) => (
            <Bubble key={i} message={m} index={i} />
          ))}

          {sending && (
            <View style={styles.aiRow}>
              <Mascot pose="curious_up" size={48} style={styles.aiAvatar} />
              <View style={[styles.bubble, styles.aiBubble, styles.typingBubble]}>
                <TypingDots />
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.inputBar}>
          <TextInput
            testID="trainer-input"
            style={styles.input}
            placeholder="Escribe tu idea o pregunta…"
            placeholderTextColor={COLORS.muted}
            value={input}
            onChangeText={setInput}
            multiline
            editable={!sending}
          />
          <Pressable
            testID="trainer-send"
            onPress={send}
            disabled={sending || input.trim().length === 0}
            style={({ pressed }) => [
              styles.sendBtn,
              { opacity: sending || input.trim().length === 0 ? 0.4 : 1, transform: [{ scale: pressed ? 0.94 : 1 }] },
            ]}
          >
            <Send size={20} color="#fff" strokeWidth={2.5} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const SUGGESTIONS = [
  'Quiero reinventar mi rutina matutina',
  'Tengo una idea para una historia corta',
  'Cómo hacer mi trabajo más interesante',
];

function Bubble({ message, index }: { message: Message; index: number }) {
  const scale = useRef(new Animated.Value(0.85)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 6, tension: 100 }),
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();
  }, [scale, opacity]);

  const isUser = message.role === 'user';
  if (isUser) {
    return (
      <Animated.View style={[styles.bubble, styles.userBubble, { transform: [{ scale }], opacity }]}>
        <Text style={[styles.bubbleText, styles.userText]}>{message.content}</Text>
      </Animated.View>
    );
  }
  // Rotate AI mascot poses to keep the dog "alive" through the conversation
  const aiPoses: MascotPose[] = ['side_sit', 'curious_up', 'play_bow', 'happy_tongue', 'eager_stand'];
  const aiIndex = Math.floor(index / 2) % aiPoses.length;
  const pose = aiPoses[aiIndex];
  return (
    <Animated.View style={[styles.aiRow, { transform: [{ scale }], opacity }]}>
      <Mascot pose={pose} size={48} style={styles.aiAvatar} />
      <View style={[styles.bubble, styles.aiBubble]}>
        <Text style={styles.bubbleText}>{message.content}</Text>
      </View>
    </Animated.View>
  );
}

function TypingDots() {
  const a = useRef(new Animated.Value(0.3)).current;
  const b = useRef(new Animated.Value(0.3)).current;
  const c = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    const make = (v: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(v, { toValue: 1, duration: 360, useNativeDriver: true }),
          Animated.timing(v, { toValue: 0.3, duration: 360, useNativeDriver: true }),
        ]),
      );
    const anims = [make(a, 0), make(b, 150), make(c, 300)];
    anims.forEach((x) => x.start());
    return () => anims.forEach((x) => x.stop());
  }, [a, b, c]);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 }}>
      <Animated.View style={[styles.dot, { opacity: a }]} />
      <Animated.View style={[styles.dot, { opacity: b }]} />
      <Animated.View style={[styles.dot, { opacity: c }]} />
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
  headerTitle: { fontSize: 18, fontWeight: '900', color: COLORS.text },
  headerSub: { fontSize: 12, color: COLORS.muted, fontWeight: '700' },
  resetBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.borderStrong,
    borderBottomWidth: 3,
  },
  scroll: { padding: 16, paddingBottom: 24, gap: 10 },
  emptyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: COLORS.borderStrong,
    borderBottomWidth: 5,
    padding: 22,
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
  },
  aiRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    maxWidth: '92%',
  },
  aiAvatar: {
    marginBottom: -4,
  },
  emptyTitle: { fontSize: 24, fontWeight: '900', color: COLORS.text },
  emptyText: { fontSize: 15, lineHeight: 22, color: COLORS.muted },
  suggestions: { gap: 8, marginTop: 8, alignSelf: 'stretch' },
  suggestion: {
    backgroundColor: '#FFF8E5',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 2,
    borderColor: COLORS.borderStrong,
    borderBottomWidth: 3,
  },
  suggestionText: { fontSize: 14, color: COLORS.text, fontWeight: '700' },
  bubble: {
    padding: 14,
    borderRadius: 18,
    maxWidth: '88%',
    borderWidth: 2,
    borderColor: COLORS.borderStrong,
    borderBottomWidth: 4,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.yellow,
    borderBottomRightRadius: 6,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFE7D5',
    borderBottomLeftRadius: 6,
    borderColor: COLORS.orange,
    borderBottomColor: COLORS.orangeDark,
    flex: 1,
  },
  bubbleText: { fontSize: 15, lineHeight: 22, color: COLORS.text, fontWeight: '500' },
  userText: { color: COLORS.text },
  typing: { fontSize: 22, color: COLORS.orange, fontWeight: '900' },
  typingBubble: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.orange,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 10 : 14,
    backgroundColor: COLORS.bg,
    borderTopWidth: 2,
    borderTopColor: COLORS.border,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: COLORS.borderStrong,
    borderBottomWidth: 3,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.text,
    maxHeight: 120,
  },
  sendBtn: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: COLORS.orange,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.borderStrong,
    borderBottomWidth: 4,
    borderBottomColor: COLORS.orangeDark,
  },
});
