import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Colors } from '../constants/colors';
import { Person } from '../lib/supabase';

const { width } = Dimensions.get('window');
const CARD_W = (width - 48) / 2;
const CARD_H = CARD_W * 1.55;

// Default fallback for unknown types
const DEFAULT_TYPE = { bg: ['#1a1a2e', '#2a2a4e'] as [string, string], border: Colors.gold, text: Colors.gold };

function getTypeTheme(types: string[]) {
  const primary = types[0];
  return Colors.typeColors[primary] ?? DEFAULT_TYPE;
}

const BORDER_GRADIENTS: Record<string, string[]> = {
  Hype:    [Colors.pink, '#ff6b00', Colors.pink],
  Leader:  [Colors.gold, Colors.cyan, Colors.gold],
  Artist:  [Colors.purple, Colors.pink, Colors.purple],
  Smart:   [Colors.lime, Colors.cyan, Colors.lime],
  Funny:   ['#ff9a00', Colors.gold, '#ff9a00'],
  Chill:   [Colors.cyan, Colors.purple, Colors.cyan],
  Foodie:  [Colors.orange, '#ff9a44', Colors.orange],
  Athlete: [Colors.cyan, Colors.lime, Colors.cyan],
  Chaos:   [Colors.pink, Colors.purple, '#ff6b00', Colors.pink],
  Vibes:   [Colors.purple, Colors.pink, Colors.cyan, Colors.purple],
};

function getBorderGradient(types: string[]): string[] {
  return BORDER_GRADIENTS[types[0]] ?? [Colors.gold, Colors.purple, Colors.gold];
}

export function PersonCard({ person }: { person: Person }) {
  const theme = getTypeTheme(person.types);
  const borderGrad = getBorderGradient(person.types);

  return (
    <TouchableOpacity
      onPress={() => router.push(`/person/${person.id}`)}
      activeOpacity={0.85}
      style={[styles.wrapper, { width: CARD_W, height: CARD_H }]}
    >
      {/* Animated holographic border */}
      <LinearGradient
        colors={borderGrad as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.borderGrad}
      >
        {/* Card body with type-themed bg */}
        <LinearGradient
          colors={[...theme.bg, '#0d0d14']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.card}
        >
          {/* HP row */}
          <View style={styles.topRow}>
            <Text style={[styles.cardName, { color: theme.border }]} numberOfLines={1}>
              {person.nickname ?? person.name.split(' ')[0]}
            </Text>
            <Text style={[styles.hpText, { color: theme.border }]}>HP {person.hp}</Text>
          </View>

          {/* Photo */}
          <View style={[styles.photoRing, { borderColor: theme.border + '88' }]}>
            {person.photo_url ? (
              <Image source={{ uri: person.photo_url }} style={styles.photo} contentFit="cover" transition={300} />
            ) : (
              <View style={[styles.photo, styles.photoFallback]}>
                <Text style={{ fontSize: 28 }}>🧑</Text>
              </View>
            )}
            {/* Glow overlay at bottom of photo */}
            <LinearGradient
              colors={['transparent', theme.bg[1] + 'ee']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 0, y: 1 }}
              pointerEvents="none"
            />
          </View>

          {/* Type badges */}
          <View style={styles.typesRow}>
            {person.types.slice(0, 2).map((t) => {
              const tc = Colors.typeColors[t] ?? DEFAULT_TYPE;
              return (
                <View key={t} style={[styles.typeBadge, { borderColor: tc.border, backgroundColor: tc.border + '22' }]}>
                  <Text style={[styles.typeText, { color: tc.text }]}>{t}</Text>
                </View>
              );
            })}
          </View>

          {/* Divider */}
          <LinearGradient
            colors={[theme.border + '00', theme.border, theme.border + '00']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.divider}
          />

          {/* Superlative */}
          <Text style={styles.superlative} numberOfLines={2}>
            "{person.superlative ?? '???'}"
          </Text>

          {/* Footer */}
          <Text style={[styles.footer, { color: theme.border + 'aa' }]}>
            SMA '23 · #{String(person.hp % 23 + 1).padStart(3, '0')}
          </Text>
        </LinearGradient>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: { borderRadius: 16 },
  borderGrad: { flex: 1, borderRadius: 16, padding: 1.5 },
  card: { flex: 1, borderRadius: 15, padding: 9, overflow: 'hidden' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 },
  cardName: { fontSize: 12, fontWeight: '900', letterSpacing: 0.3, flex: 1, textTransform: 'uppercase' },
  hpText: { fontSize: 9, fontWeight: '800', marginLeft: 4 },
  photoRing: {
    borderWidth: 1.5,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 7,
  },
  photo: { width: '100%', aspectRatio: 1, borderRadius: 6 },
  photoFallback: { backgroundColor: '#1a1a2e', alignItems: 'center', justifyContent: 'center' },
  typesRow: { flexDirection: 'row', gap: 4, marginBottom: 6, flexWrap: 'wrap' },
  typeBadge: { borderRadius: 6, borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2 },
  typeText: { fontSize: 8.5, fontWeight: '800', letterSpacing: 0.4, textTransform: 'uppercase' },
  divider: { height: 1, marginVertical: 5 },
  superlative: { fontSize: 9, color: '#b0b0c8', fontStyle: 'italic', lineHeight: 13, flex: 1 },
  footer: { fontSize: 7.5, letterSpacing: 0.5, marginTop: 4 },
});
