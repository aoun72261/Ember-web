import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Vibration,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Colors } from '../constants/colors';
import { verifyPasscode } from '../lib/supabase';
import { useAuthStore } from '../lib/store';

const PIN_LENGTH = 6;

const KEYPAD = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['', '0', '⌫'],
];

export default function LockScreen() {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const { setAuthed } = useAuthStore();

  useEffect(() => {
    if (pin.length === PIN_LENGTH) {
      handleSubmit(pin);
    }
  }, [pin]);

  function shake() {
    Vibration.vibrate(400);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  }

  async function handleSubmit(code: string) {
    setLoading(true);
    setError(false);
    try {
      const ok = await verifyPasscode(code);
      if (ok) {
        await setAuthed(true);
        router.replace('/(tabs)');
      } else {
        shake();
        setError(true);
        setTimeout(() => { setPin(''); setError(false); }, 1000);
      }
    } catch {
      shake();
      setError(true);
      setTimeout(() => { setPin(''); setError(false); }, 1000);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(key: string) {
    if (key === '⌫') {
      setPin((p) => p.slice(0, -1));
    } else if (key && pin.length < PIN_LENGTH) {
      setPin((p) => p + key);
    }
  }

  return (
    <LinearGradient colors={['#0a0a0f', '#12121a', '#0a0a0f']} style={styles.container}>
      <View style={styles.inner}>
        <LinearGradient
          colors={['#c9a227', '#7b2d8b', '#1a3a8b']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.logoGlow}
        >
          <Text style={styles.logoEmoji}>📸</Text>
        </LinearGradient>

        <Text style={styles.title}>SMA 2023 Batch</Text>
        <Text style={styles.subtitle}>Enter your access code</Text>

        <Animated.View style={[styles.dotsRow, { transform: [{ translateX: shakeAnim }] }]}>
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i < pin.length && styles.dotFilled,
                error && styles.dotError,
              ]}
            />
          ))}
        </Animated.View>

        {error && <Text style={styles.errorText}>Wrong code. Try again.</Text>}
        {loading && <ActivityIndicator color={Colors.gold} style={{ marginTop: 8 }} />}

        <View style={styles.keypad}>
          {KEYPAD.map((row, ri) => (
            <View key={ri} style={styles.keypadRow}>
              {row.map((key, ki) => (
                <TouchableOpacity
                  key={ki}
                  style={[styles.key, !key && styles.keyEmpty]}
                  onPress={() => handleKey(key)}
                  disabled={!key || loading}
                  activeOpacity={0.7}
                >
                  {key ? (
                    <Text style={[styles.keyText, key === '⌫' && styles.keyBackspace]}>{key}</Text>
                  ) : null}
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  logoGlow: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  logoEmoji: { fontSize: 36 },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: 1,
    marginBottom: 8,
  },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginBottom: 40 },
  dotsRow: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: Colors.textMuted,
    backgroundColor: 'transparent',
  },
  dotFilled: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  dotError: { backgroundColor: '#e53e3e', borderColor: '#e53e3e' },
  errorText: { color: '#e53e3e', fontSize: 13, marginBottom: 8 },
  keypad: { width: '100%', marginTop: 32, gap: 12 },
  keypadRow: { flexDirection: 'row', justifyContent: 'center', gap: 16 },
  key: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyEmpty: { backgroundColor: 'transparent', borderColor: 'transparent' },
  keyText: { fontSize: 24, fontWeight: '600', color: Colors.textPrimary },
  keyBackspace: { fontSize: 20 },
});
