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
import { BlurView } from 'expo-blur';
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

const HINTS = [
  "enter the code or stay outside 🚪",
  "bro really forgot the code 😭",
  "no randoms allowed, sry 💅",
  "wrong code = public humiliation 💀",
  "squad members only fr fr 🔒",
];

export default function LockScreen() {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [hint] = useState(() => HINTS[Math.floor(Math.random() * HINTS.length)]);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const { setAuthed } = useAuthStore();

  useEffect(() => {
    if (pin.length === PIN_LENGTH) handleSubmit(pin);
  }, [pin]);

  function shake() {
    Vibration.vibrate([0, 70, 50, 70]);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 55, useNativeDriver: true }),
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
    if (key === '⌫') setPin((p) => p.slice(0, -1));
    else if (key && pin.length < PIN_LENGTH) setPin((p) => p + key);
  }

  return (
    <LinearGradient
      colors={['#ffd6e7', '#ffc0cb', '#ffd6b0', '#c8eaff', '#b0d8ff']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {/* Soft bokeh blobs */}
      <View style={[styles.blob, { top: -40, left: -60, backgroundColor: 'rgba(255,150,180,0.35)' }]} />
      <View style={[styles.blob, { bottom: 80, right: -50, width: 200, height: 200, backgroundColor: 'rgba(160,210,255,0.35)' }]} />

      {/* Glass card */}
      <Animated.View style={[styles.card, { transform: [{ translateX: shakeAnim }] }]}>
        <BlurView intensity={60} tint="light" style={styles.cardBlur}>
          <View style={styles.cardInner}>
            {/* Icon */}
            <View style={styles.iconWrap}>
              <Text style={styles.iconEmoji}>📸</Text>
            </View>

            <Text style={styles.title}>SMA 2023 Batch</Text>
            <Text style={styles.subtitle}>where the legends live 🔥</Text>
            <Text style={styles.hint}>{hint}</Text>

            {/* Dots */}
            <View style={styles.dotsRow}>
              {Array.from({ length: PIN_LENGTH }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    i < pin.length && (error ? styles.dotError : styles.dotFilled),
                  ]}
                />
              ))}
            </View>

            {error && <Text style={styles.errorText}>nah bro that's wrong 💀</Text>}
            {loading && <ActivityIndicator color={Colors.rose} size="small" style={{ marginTop: 6 }} />}
          </View>
        </BlurView>
      </Animated.View>

      {/* Keypad */}
      <View style={styles.keypad}>
        {KEYPAD.map((row, ri) => (
          <View key={ri} style={styles.keyRow}>
            {row.map((key, ki) => (
              <TouchableOpacity
                key={ki}
                style={[styles.key, !key && styles.keyEmpty]}
                onPress={() => handleKey(key)}
                disabled={!key || loading}
                activeOpacity={0.6}
              >
                {key ? (
                  <BlurView intensity={30} tint="light" style={styles.keyBlur}>
                    <Text style={[styles.keyText, key === '⌫' && styles.keyDel]}>{key}</Text>
                  </BlurView>
                ) : null}
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  blob: { position: 'absolute', width: 260, height: 260, borderRadius: 130 },

  card: {
    width: '85%',
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: Colors.borderGlass,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    marginBottom: 32,
  },
  cardBlur: { width: '100%' },
  cardInner: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 24 },

  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: Colors.bgGlassStrong,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  iconEmoji: { fontSize: 34 },

  title: { fontSize: 22, fontWeight: '800', color: Colors.text, letterSpacing: 0.3, marginBottom: 4 },
  subtitle: { fontSize: 13, color: Colors.textSec, marginBottom: 4 },
  hint: { fontSize: 12, color: Colors.rose, fontWeight: '600', marginBottom: 24, textAlign: 'center' },

  dotsRow: { flexDirection: 'row', gap: 12, marginBottom: 10 },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Colors.borderMid,
    backgroundColor: 'transparent',
  },
  dotFilled: { backgroundColor: Colors.rose, borderColor: Colors.rose },
  dotError: { backgroundColor: Colors.coral, borderColor: Colors.coral },
  errorText: { color: Colors.coral, fontSize: 12, fontWeight: '700', marginTop: 4 },

  keypad: { width: '80%', gap: 12 },
  keyRow: { flexDirection: 'row', justifyContent: 'center', gap: 16 },
  key: { width: 78, height: 78, borderRadius: 39, overflow: 'hidden', borderWidth: 1, borderColor: Colors.borderGlass },
  keyEmpty: { borderColor: 'transparent', backgroundColor: 'transparent' },
  keyBlur: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  keyText: { fontSize: 24, fontWeight: '500', color: Colors.text },
  keyDel: { fontSize: 20, color: Colors.textSec },
});
