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

const FUNNY_HINTS = [
  'Enter the code or stay broke 💀',
  'Wrong code = L + ratio 😭',
  'No randoms allowed fr fr 🚫',
  "You forgot it didn't you 💀",
  'Bro really forgot the code 😂',
];

export default function LockScreen() {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [hint] = useState(() => FUNNY_HINTS[Math.floor(Math.random() * FUNNY_HINTS.length)]);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const { setAuthed } = useAuthStore();

  useEffect(() => {
    if (pin.length === PIN_LENGTH) {
      handleSubmit(pin);
    }
  }, [pin]);

  function shake() {
    Vibration.vibrate([0, 80, 60, 80]);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 12, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -12, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 55, useNativeDriver: true }),
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
        setTimeout(() => { setPin(''); setError(false); }, 1200);
      }
    } catch {
      shake();
      setError(true);
      setTimeout(() => { setPin(''); setError(false); }, 1200);
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
    <LinearGradient
      colors={['#0d0d14', '#1a0d28', '#0d1428']}
      style={styles.container}
    >
      {/* Decorative blobs */}
      <View style={[styles.blob, { top: -60, right: -60, backgroundColor: Colors.pink + '22' }]} />
      <View style={[styles.blob, { bottom: 100, left: -80, backgroundColor: Colors.cyan + '1a' }]} />
      <View style={[styles.blob, { top: 200, left: -40, width: 160, height: 160, backgroundColor: Colors.purple + '18' }]} />

      <View style={styles.inner}>
        {/* Logo */}
        <LinearGradient
          colors={[Colors.pink, Colors.purple, Colors.cyan]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.logoRing}
        >
          <View style={styles.logoInner}>
            <Text style={styles.logoEmoji}>📸</Text>
          </View>
        </LinearGradient>

        <Text style={styles.title}>SMA 2023 Batch</Text>
        <Text style={styles.sub}>where the legends live 🔥</Text>
        <Text style={styles.hint}>{hint}</Text>

        {/* Dots */}
        <Animated.View style={[styles.dotsRow, { transform: [{ translateX: shakeAnim }] }]}>
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <LinearGradient
              key={i}
              colors={
                error
                  ? ['#ff2d78', '#ff2d78']
                  : i < pin.length
                  ? [Colors.pink, Colors.purple]
                  : ['transparent', 'transparent']
              }
              style={[
                styles.dot,
                i < pin.length && styles.dotFilled,
                error && styles.dotError,
              ]}
            />
          ))}
        </Animated.View>

        {error && <Text style={styles.errorText}>nah bro that's wrong 💀</Text>}
        {loading && <ActivityIndicator color={Colors.pink} style={{ marginTop: 8 }} />}

        {/* Keypad */}
        <View style={styles.keypad}>
          {KEYPAD.map((row, ri) => (
            <View key={ri} style={styles.keypadRow}>
              {row.map((key, ki) => (
                <TouchableOpacity
                  key={ki}
                  style={[styles.key, !key && styles.keyEmpty]}
                  onPress={() => handleKey(key)}
                  disabled={!key || loading}
                  activeOpacity={0.65}
                >
                  {key ? (
                    key === '⌫' ? (
                      <Text style={styles.keyBackspace}>{key}</Text>
                    ) : (
                      <Text style={styles.keyText}>{key}</Text>
                    )
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
  container: { flex: 1, overflow: 'hidden' },
  blob: { position: 'absolute', width: 220, height: 220, borderRadius: 110 },
  inner: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  logoRing: {
    width: 90,
    height: 90,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    padding: 3,
  },
  logoInner: {
    width: '100%',
    height: '100%',
    borderRadius: 23,
    backgroundColor: '#0d0d14',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoEmoji: { fontSize: 38 },
  title: {
    fontSize: 30,
    fontWeight: '900',
    color: Colors.white,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  sub: { fontSize: 14, color: Colors.textSecondary, marginBottom: 6 },
  hint: { fontSize: 12, color: Colors.pink, marginBottom: 36, fontWeight: '600' },
  dotsRow: { flexDirection: 'row', gap: 14, marginBottom: 12 },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  dotFilled: { borderColor: 'transparent' },
  dotError: { borderColor: 'transparent' },
  errorText: { color: Colors.pink, fontSize: 13, fontWeight: '700', marginBottom: 6 },
  keypad: { width: '100%', marginTop: 28, gap: 10 },
  keypadRow: { flexDirection: 'row', justifyContent: 'center', gap: 14 },
  key: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyEmpty: { backgroundColor: 'transparent', borderColor: 'transparent' },
  keyText: { fontSize: 26, fontWeight: '600', color: Colors.textPrimary },
  keyBackspace: { fontSize: 22, color: Colors.textSecondary },
});
