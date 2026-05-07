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
import { Target, MessageCircle, GitMerge, User } from 'lucide-react-native';
import LevelBadge from '../src/components/LevelBadge';
import StreakBadge from '../src/components/StreakBadge';
import XPProgressBar from '../src/components/XPProgressBar';
import { COLORS, LEVELS, xpProgress } from '../src/lib/levels';
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

        {/* Level + XP */}
        <View style={styles.levelHero}>
          <Text style={styles.heroEyebrow}>Tu nivel</Text>
          <Text style={styles.heroTitle}>{cfg.name}</Text>
          <Text style={styles.heroTagline}>{cfg.tagline}</Text>
          <View style={{ marginTop: 14 }}>
            <XPProgressBar pct={xp.pct} current={xp.current} needed={xp.needed} />
          </View>
        </View>

        {/* Daily Challenge - hero card */}
        <SectionCard
          title="Reto diario"
          subtitle={challengeReady ? 'Nuevo reto te está esperando' : '¡Hecho hoy! Vuelve mañana 💛'}
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
          subtitle="Charla socrática con la IA"
          color={COLORS.coral}
          textColor="#fff"
          icon={<MessageCircle size={32} color="#fff" strokeWidth={2.5} />}
          onPress={() => router.push('/trainer')}
          testID="home-trainer-card"
        />

        {/* Distant Concepts */}
        <SectionCard
          title="Conector de conceptos"
          subtitle="Fusiona dos ideas lejanas"
          color={COLORS.violet}
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
          <User size={18} color={COLORS.muted} />
          <Text style={styles.profileLinkText}>Tu perfil y progreso</Text>
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
          <Text style={[styles.sectionSubtitle, { color: tColor, opacity: 0.85 }]}>{subtitle}</Text>
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
    marginBottom: 4,
  },
  levelHero: {
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: COLORS.borderStrong,
    borderBottomWidth: 5,
    padding: 18,
  },
  heroEyebrow: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.4,
    color: COLORS.violet,
    textTransform: 'uppercase',
  },
  heroTitle: { fontSize: 36, fontWeight: '900', color: COLORS.text, marginTop: 4 },
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
  sectionBig: { minHeight: 150, borderBottomWidth: 7 },
  sectionContent: { flex: 1, paddingRight: 12 },
  sectionTitle: { fontSize: 22, fontWeight: '900', letterSpacing: -0.3 },
  sectionTitleBig: { fontSize: 30 },
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
    backgroundColor: COLORS.coral,
    borderWidth: 2,
    borderColor: COLORS.borderStrong,
  },
  profileLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'center',
    paddingVertical: 12,
  },
  profileLinkText: { fontSize: 14, color: COLORS.muted, fontWeight: '700' },
});
