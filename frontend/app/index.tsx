import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { loadProfile } from '../src/lib/storage';
import { COLORS } from '../src/lib/levels';

export default function Index() {
  const [target, setTarget] = useState<null | '/home' | '/onboarding'>(null);

  useEffect(() => {
    let cancelled = false;
    const fallback = setTimeout(() => {
      if (!cancelled && !target) setTarget('/onboarding');
    }, 1500);
    (async () => {
      try {
        const p = await loadProfile();
        if (!cancelled) setTarget(p.onboarded ? '/home' : '/onboarding');
      } catch {
        if (!cancelled) setTarget('/onboarding');
      }
    })();
    return () => {
      cancelled = true;
      clearTimeout(fallback);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (target) return <Redirect href={target} />;

  return (
    <View style={styles.wrap}>
      <ActivityIndicator color={COLORS.violet} size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' },
});
