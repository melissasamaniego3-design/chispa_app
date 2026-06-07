/**
 * Chispa - Mascota (perro naranja). Cambia de pose según el contexto.
 * Anima suavemente cada cambio de pose (cross-fade + ligero bounce).
 */
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, ImageStyle, StyleProp, View, ViewStyle } from 'react-native';

export type MascotPose =
  | 'sit_alert'      // calmo, sentado de frente (default)
  | 'play_bow'       // estirado, juguetón
  | 'curious_up'     // mira hacia arriba con curiosidad
  | 'side_sit'       // sentado mirando de lado
  | 'lying_relaxed'  // tumbado, relajado / dormido
  | 'walking'        // caminando alegre
  | 'sleepy_curl'    // enroscado, durmiendo
  | 'begging'        // de pie pidiendo, atento
  | 'eager_stand'    // de pie ansioso
  | 'happy_tongue'   // sentado con lengua fuera, feliz
  | 'running'        // saltando / corriendo, celebración
  | 'playful_roll';  // patas arriba, juguetón

const SOURCES: Record<MascotPose, any> = {
  sit_alert: require('../../assets/mascot/sit_alert.png'),
  play_bow: require('../../assets/mascot/play_bow.png'),
  curious_up: require('../../assets/mascot/curious_up.png'),
  side_sit: require('../../assets/mascot/side_sit.png'),
  lying_relaxed: require('../../assets/mascot/lying_relaxed.png'),
  walking: require('../../assets/mascot/walking.png'),
  sleepy_curl: require('../../assets/mascot/sleepy_curl.png'),
  begging: require('../../assets/mascot/begging.png'),
  eager_stand: require('../../assets/mascot/eager_stand.png'),
  happy_tongue: require('../../assets/mascot/happy_tongue.png'),
  running: require('../../assets/mascot/running.png'),
  playful_roll: require('../../assets/mascot/playful_roll.png'),
};

type Props = {
  pose?: MascotPose;
  size?: number;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  testID?: string;
  /** When true, plays a celebration bounce on mount/pose change. */
  bounce?: boolean;
  /** Disable animations entirely (e.g., for static decorative use). */
  animated?: boolean;
};

export default function Mascot({
  pose = 'sit_alert',
  size = 120,
  style,
  imageStyle,
  testID,
  bounce = false,
  animated = true,
}: Props) {
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const prevPose = useRef<MascotPose>(pose);

  // Cross-fade + tiny pop when pose changes
  useEffect(() => {
    if (!animated) return;
    if (prevPose.current === pose) return;
    prevPose.current = pose;
    opacity.setValue(0.25);
    scale.setValue(0.86);
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 5,
        tension: 140,
        useNativeDriver: true,
      }),
    ]).start();
  }, [pose, animated, opacity, scale]);

  // Celebration bounce
  useEffect(() => {
    if (!animated || !bounce) return;
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.18, duration: 160, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 4, tension: 160, useNativeDriver: true }),
    ]).start();
  }, [bounce, animated, scale]);

  return (
    <View
      testID={testID ?? `mascot-${pose}`}
      style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}
    >
      <Animated.Image
        source={SOURCES[pose]}
        style={[
          { width: size, height: size, transform: [{ scale }], opacity },
          imageStyle,
        ]}
        resizeMode="contain"
      />
    </View>
  );
}

export function MascotLogo({ width = 220, style }: { width?: number; style?: StyleProp<ImageStyle> }) {
  return (
    <Image
      source={require('../../assets/mascot/logo.png')}
      style={[{ width, height: width * 0.32 }, style]}
      resizeMode="contain"
    />
  );
}

export function MascotHero({ width = 280, style }: { width?: number; style?: StyleProp<ImageStyle> }) {
  return (
    <Image
      source={require('../../assets/mascot/hero_logo.png')}
      style={[{ width, height: width * 1.43 }, style]}
      resizeMode="contain"
    />
  );
}
