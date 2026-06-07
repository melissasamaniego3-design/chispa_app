import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { ChevronLeft, RotateCcw, Bell } from 'lucide-react-native';
import LevelBadge from '../src/components/LevelBadge';
import XPProgressBar from '../src/components/XPProgressBar';
import GamifiedButton from '../src/components/GamifiedButton';
import Mascot from '../src/components/Mascot';
import { COLORS, FONTS, LEVELS, PURPOSES, xpProgress, LevelId, levelToPose } from '../src/lib/levels';
import { loadProfile, Profile, resetProfile, updateProfile } from '../src/lib/storage';
import { ensureDailyReminder } from '../src/lib/notifications';

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);

  const reload = useCallback(async () => {
    const p = await loadProfile();
    setProfile(p);
  }, []);

  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  const reset = () => {
    Alert.alert('Reiniciar progreso', '¿Borrar XP, racha y nivel? No se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Reiniciar',
        style: 'destructive',
        onPress: async () => {
          await resetProfile();
          router.replace('/onboarding');
        },
      },
    ]);
  };

  const toggleNotif = async (val: boolean) => {
    if (!profile) return;
    const next = await updateProfile({ notifications: val });
    setProfile(next);
    ensureDailyReminder(val);
  };

  const setPurpose = async (id: string) => {
    if (!profile) return;
    const next = await updateProfile({ purpose: id });
    setProfile(next);
  };

  if (!profile) return <View style={styles.safe} />;
  const xp = xpProgress(profile.xp);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} testID="back-button" style={styles.backBtn}>
          <ChevronLeft size={26} color={COLORS.text} strokeWidth={2.5} />
        </Pressable>
        <Text style={styles.headerTitle}>Tu progreso</Text>
        <LevelBadge level={xp.level} compact />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Stats Hero */}
        <View style={styles.heroCard}>
          <View style={styles.heroRow}>
            <Mascot pose={levelToPose(xp.level)} size={110} />
            <View style={{ flex: 1 }}>
              <LevelBadge level={xp.level} />
              <Text style={styles.heroName}>{LEVELS[xp.level].name}</Text>
              <Text style={styles.heroTagline}>{LEVELS[xp.level].tagline}</Text>
            </View>
          </View>
          <View style={{ marginTop: 16 }}>
            <XPProgressBar pct={xp.pct} current={xp.current} needed={xp.needed} />
          </View>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <Stat label="XP TOTAL" value={String(profile.xp)} color={COLORS.yellow} />
          <Stat label="RACHA" value={`${profile.streak}🔥`} color={COLORS.coral} textColor="#fff" />
        </View>

        {/* All levels */}
        <Text style={styles.sectionTitle}>Camino de la chispa</Text>
        <View style={styles.levels}>
          {([1, 2, 3, 4] as LevelId[]).map((l) => (
            <LevelRow key={l} id={l} current={xp.level} />
          ))}
        </View>

        {/* Purpose */}
        <Text style={styles.sectionTitle}>Tu enfoque</Text>
        <View style={styles.purposes}>
          {PURPOSES.map((p) => (
            <Pressable
              key={p.id}
              testID={`profile-purpose-${p.id}`}
              onPress={() => setPurpose(p.id)}
              style={[
                styles.purpose,
                {
                  backgroundColor: profile.purpose === p.id ? '#F4ECFF' : COLORS.surface,
                  borderColor: profile.purpose === p.id ? COLORS.violet : COLORS.borderStrong,
                  borderBottomColor: profile.purpose === p.id ? COLORS.violetDark : COLORS.borderStrong,
                },
              ]}
            >
              <Text style={styles.purposeEmoji}>{p.emoji}</Text>
              <Text style={styles.purposeLabel}>{p.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Notifications */}
        <View style={styles.notif}>
          <Bell size={20} color={COLORS.text} strokeWidth={2.5} />
          <View style={{ flex: 1 }}>
            <Text style={styles.notifTitle}>Recordatorio diario</Text>
            <Text style={styles.notifSub}>A las 10:00 cada mañana</Text>
          </View>
          <Switch
            testID="profile-notifications"
            value={profile.notifications}
            onValueChange={toggleNotif}
            thumbColor={profile.notifications ? COLORS.orange : '#fff'}
            trackColor={{ false: '#EADBC8', true: '#FFD0AC' }}
          />
        </View>

        <GamifiedButton
          label="Reiniciar progreso"
          variant="ghost"
          onPress={reset}
          testID="profile-reset"
          style={{ marginTop: 24 }}
        />

        <Text style={styles.footer}>Chispa · v1.0 · Hecho con curiosidad</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value, color, textColor }: { label: string; value: string; color: string; textColor?: string }) {
  return (
    <View style={[styles.stat, { backgroundColor: color }]}>
      <Text style={[styles.statValue, textColor ? { color: textColor } : undefined]}>{value}</Text>
      <Text style={[styles.statLabel, textColor ? { color: textColor, opacity: 0.85 } : undefined]}>{label}</Text>
    </View>
  );
}

function LevelRow({ id, current }: { id: LevelId; current: LevelId }) {
  const cfg = LEVELS[id];
  const reached = id <= current;
  return (
    <View
      style={[
        styles.levelRow,
        {
          opacity: reached ? 1 : 0.55,
          backgroundColor: reached ? COLORS.surface : '#F1E8DC',
        },
      ]}
    >
      <View style={[styles.levelDot, { backgroundColor: cfg.color }]}>
        <Text style={styles.levelDotText}>{id}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.levelName}>{cfg.name}</Text>
        <Text style={styles.levelTag}>{cfg.tagline}</Text>
      </View>
      {id === current && (
        <View style={styles.activePill}>
          <Text style={styles.activePillText}>AQUÍ</Text>
        </View>
      )}
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
  scroll: { padding: 20, paddingBottom: 60, gap: 16 },
  heroCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: COLORS.borderStrong,
    borderBottomWidth: 5,
    padding: 18,
  },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  heroName: { fontFamily: FONTS.heading,  fontSize: 28, fontWeight: '900', color: COLORS.text, marginTop: 8, letterSpacing: -0.5 },
  heroTagline: { fontSize: 13, color: COLORS.muted, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: 12 },
  stat: {
    flex: 1,
    borderRadius: 18,
    padding: 16,
    borderWidth: 2,
    borderColor: COLORS.borderStrong,
    borderBottomWidth: 5,
    alignItems: 'center',
  },
  statValue: { fontFamily: FONTS.heading,  fontSize: 28, fontWeight: '900', color: COLORS.text },
  statLabel: { fontSize: 11, fontWeight: '900', letterSpacing: 1.2, color: COLORS.text, marginTop: 2 },
  sectionTitle: { fontFamily: FONTS.heading,  fontSize: 13, fontWeight: '900', letterSpacing: 1.4, color: COLORS.muted, textTransform: 'uppercase', marginTop: 8 },
  levels: { gap: 10 },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: COLORS.borderStrong,
    borderBottomWidth: 4,
  },
  levelDot: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.borderStrong,
  },
  levelDotText: { fontFamily: FONTS.heading,  fontSize: 20, fontWeight: '900', color: COLORS.text },
  levelName: { fontFamily: FONTS.heading,  fontSize: 16, fontWeight: '900', color: COLORS.text },
  levelTag: { fontSize: 12, color: COLORS.muted, fontWeight: '600' },
  activePill: {
    backgroundColor: COLORS.orange,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: COLORS.borderStrong,
  },
  activePillText: { color: '#fff', fontWeight: '900', fontSize: 11, letterSpacing: 1 },
  purposes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  purpose: {
    flexBasis: '48%',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 2,
    borderBottomWidth: 4,
    alignItems: 'center',
    gap: 6,
  },
  purposeEmoji: { fontSize: 24 },
  purposeLabel: { fontFamily: FONTS.heading,  fontSize: 13, fontWeight: '800', color: COLORS.text, textAlign: 'center' },
  notif: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.borderStrong,
    borderBottomWidth: 4,
  },
  notifTitle: { fontFamily: FONTS.heading,  fontSize: 15, fontWeight: '900', color: COLORS.text },
  notifSub: { fontSize: 12, color: COLORS.muted, fontWeight: '600' },
  footer: { textAlign: 'center', color: COLORS.muted, fontSize: 12, marginTop: 30, fontWeight: '700' },
});
