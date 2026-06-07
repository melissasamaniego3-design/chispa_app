import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Target, MessageCircle, GitMerge } from 'lucide-react-native';
import LevelBadge from '../src/components/LevelBadge';
import StreakBadge from '../src/components/StreakBadge';
import XPProgressBar from '../src/components/XPProgressBar';
import Mascot, { MascotLogo } from '../src/components/Mascot';
import { COLORS, FONTS, LEVELS, levelToPose, xpProgress } from '../src/lib/levels';
import { loadProfile, Profile, todayStr } from '../src/lib/storage';

export default function Home() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const reload = useCallback(async () => {
    const p = await loadProfile();
    setProfile(p);
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  if (!profile) {
    return <View style={styles.safe} />;
  }

  const xp = xpProgress(profile.xp);
  const cfg = LEVELS[xp.level];
  const challengeReady = profile.lastChallengeDate !== todayStr();
  // Mascot reflects state: eager if a new challenge is waiting, happy if completed today, level pose otherwise
  const heroPose = challengeReady
    ? 'eager_stand'
    : profile.streak > 0
    ? 'happy_tongue'
    : levelToPose(xp.level);

  return (
    <SafeAreaView style={styles.safe} edges={['top']} testID="home-screen">
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await reload(); setRefreshing(false); }} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.push('/profile')} testID="open-profile">
            <LevelBadge level={xp.level} />
          </Pressable>
          <StreakBadge streak={profile.streak} />
        </View>

        {/* Mascot + Logo Hero */}
        <View style={styles.heroBlock}>
          <MascotLogo width={160} />
          <View style={styles.mascotBubble}>
            <Mascot pose={heroPose} size={170} testID="home-mascot" />
            <View style={styles.speechBubble}>
              <Text style={styles.speechText} numberOfLines={3}>
                {challengeReady
                  ? '¡Hey! Hay un reto fresquito esperándote 🐾'
                  : profile.streak > 0
                  ? `¡${profile.streak} día${profile.streak > 1 ? 's' : ''} seguidos! Sigamos.`
                  : '¿Empezamos? Tira de mi correa.'}
              </Text>
              <View style={styles.speechTail} />
            </View>
          </View>
        </View>

        {/* Level + XP */}
        <View style={styles.levelHero}>
          <View style={styles.levelHeroTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroEyebrow}>Tu nivel</Text>
              <Text style={[styles.heroTitle, { color: cfg.color === COLORS.yellow ? COLORS.text : cfg.color }]}>
                {cfg.name}
              </Text>
              <Text style={styles.heroTagline}>{cfg.tagline}</Text>
            </View>
          </View>
          <View style={{ marginTop: 14 }}>
            <XPProgressBar pct={xp.pct} current={xp.current} needed={xp.needed} />
          </View>
        </View>

        {/* Daily Challenge - hero card */}
        <SectionCard
          title="Reto diario"
          subtitle={challengeReady ? 'Nuevo reto te está esperando' : '¡Hecho hoy! Vuelve mañana 🐶'}
          color={COLORS.yellow}
          icon={<Target size={36} color={COLORS.text} strokeWidth={2.5} />}
          onPress={() => router.push('/challenge')}
          testID="home-daily-challenge-card"
          big
          dot={challengeReady}
        />

        {/* Idea Trainer */}
        <SectionCard
          title="Entrenador de ideas"
          subtitle="Charla socrática conmigo"
          color={COLORS.orange}
          textColor="#fff"
          icon={<MessageCircle size={32} color="#fff" strokeWidth={2.5} />}
          onPress={() => router.push('/trainer')}
          testID="home-trainer-card"
        />

        {/* Distant Concepts */}
        <SectionCard
          title="Conector de conceptos"
          subtitle="Fusiona dos ideas lejanas"
          color={COLORS.purple}
          textColor="#fff"
          icon={<GitMerge size={32} color="#fff" strokeWidth={2.5} />}
          onPress={() => router.push('/connector')}
          testID="home-connector-card"
        />

        <Pressable
          testID="home-open-profile"
          onPress={() => router.push('/profile')}
          style={styles.profileLink}
        >
          <Text style={styles.profileLinkText}>🐾 Tu perfil y progreso</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionCard({
  title,
  subtitle,
  color,
  textColor,
  icon,
  onPress,
  big,
  testID,
  dot,
}: {
  title: string;
  subtitle: string;
  color: string;
  textColor?: string;
  icon: React.ReactNode;
  onPress: () => void;
  big?: boolean;
  testID?: string;
  dot?: boolean;
}) {
  const scale = React.useRef(new Animated.Value(1)).current;
  const tColor = textColor ?? COLORS.text;

  return (
    <Pressable
      testID={testID}
      onPressIn={() => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, friction: 6 }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 6 }).start()}
      onPress={onPress}
    >
      <Animated.View
        style={[
          styles.section,
          big && styles.sectionBig,
          { backgroundColor: color, transform: [{ scale }] },
        ]}
      >
        <View style={styles.sectionContent}>
          <Text style={[styles.sectionTitle, big && styles.sectionTitleBig, { color: tColor }]}>{title}</Text>
          <Text style={[styles.sectionSubtitle, { color: tColor, opacity: 0.9 }]}>{subtitle}</Text>
        </View>
        <View style={styles.iconWrap}>{icon}</View>
        {dot && <View style={styles.newDot} />}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: 20, paddingBottom: 60, gap: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
  },
  heroBlock: {
    alignItems: 'center',
    gap: 6,
    marginVertical: 6,
  },
  mascotBubble: {
    width: '100%',
    alignItems: 'center',
    position: 'relative',
  },
  speechBubble: {
    position: 'absolute',
    top: 8,
    right: 8,
    maxWidth: 180,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.borderStrong,
    borderBottomWidth: 4,
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  speechText: { fontSize: 13, fontWeight: '700', color: COLORS.text, lineHeight: 18 },
  speechTail: {
    position: 'absolute',
    bottom: -10,
    left: 18,
    width: 14,
    height: 14,
    backgroundColor: COLORS.surface,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: COLORS.borderStrong,
    transform: [{ rotate: '45deg' }],
  },
  levelHero: {
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: COLORS.borderStrong,
    borderBottomWidth: 5,
    padding: 18,
  },
  levelHeroTop: { flexDirection: 'row', alignItems: 'center' },
  heroEyebrow: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.4,
    color: COLORS.orange,
    textTransform: 'uppercase',
  },
  heroTitle: { fontFamily: FONTS.heading,  fontSize: 34, fontWeight: '900', color: COLORS.text, marginTop: 4 },
  heroTagline: { fontSize: 14, color: COLORS.muted, marginTop: 2 },
  section: {
    borderRadius: 22,
    borderWidth: 2,
    borderColor: COLORS.borderStrong,
    borderBottomWidth: 6,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 110,
  },
  sectionBig: { minHeight: 130, borderBottomWidth: 7 },
  sectionContent: { flex: 1, paddingRight: 12 },
  sectionTitle: { fontFamily: FONTS.heading,  fontSize: 22, fontWeight: '900', letterSpacing: -0.3 },
  sectionTitleBig: { fontSize: 28 },
  sectionSubtitle: { fontSize: 14, marginTop: 4, fontWeight: '600' },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  newDot: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.red,
    borderWidth: 2,
    borderColor: COLORS.borderStrong,
  },
  profileLink: {
    alignSelf: 'center',
    paddingVertical: 12,
  },
  profileLinkText: { fontSize: 14, color: COLORS.muted, fontWeight: '800' },
});
