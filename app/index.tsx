import { useEffect, useRef, useState } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { Colors } from '../constants/theme';

const SPLASH_DURATION = 4000;

export default function SplashScreen() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const [timerDone, setTimerDone] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 60,
        friction: 7,
        useNativeDriver: false,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 900,
        useNativeDriver: false,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 900,
        useNativeDriver: false,
      }),
    ]).start();

    const timer = setTimeout(() => setTimerDone(true), SPLASH_DURATION);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!timerDone || loading) return;
    if (user) {
      router.replace('/(tabs)');
    } else {
      router.replace('/login');
    }
  }, [timerDone, loading, user]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.logoContainer,
          { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
        ]}
      >
        <View style={styles.logoBox}>
          <Animated.Text style={styles.logoText}>UP</Animated.Text>
          <View style={styles.logoBowl} />
        </View>
      </Animated.View>

      <Animated.View
        style={[
          styles.textContainer,
          { opacity: opacityAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <Animated.Text style={styles.appName}>Up App</Animated.Text>
        <Animated.Text style={styles.tagline}>Delivery rápido e fácil</Animated.Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoBox: {
    width: 130,
    height: 130,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  logoText: {
    fontSize: 64,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -2,
  },
  logoBowl: {
    position: 'absolute',
    bottom: 24,
    width: 30,
    height: 13,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    borderWidth: 3,
    borderTopWidth: 0,
    borderColor: '#FFFFFF',
  },
  textContainer: {
    alignItems: 'center',
    gap: 6,
  },
  appName: {
    fontSize: 38,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '400',
    letterSpacing: 0.3,
  },
});
