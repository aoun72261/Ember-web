import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Colors } from '../constants/colors';
import { Person } from '../lib/supabase';

const { width } = Dimensions.get('window');
const CARD_W = (width - 48) / 2;
const CARD_H = CARD_W * 1.48;

const TYPE_COLORS: Record<string, [string, string]> = {
  Funny: ['#f6ad55', '#ed8936'],
  Chill: ['#68d391', '#48bb78'],
  Hype: ['#fc8181', '#e53e3e'],
  Smart: ['#76e4f7', '#4299e1'],
  Foodie: ['#f6e05e', '#d69e2e'],
  Artist: ['#b794f4', '#805ad5'],
  Athlete: ['#63b3ed', '#3182ce'],
  Leader: ['#fbb6ce', '#d53f8c'],
  Chaos: ['#ff6b6b', '#c0392b'],
  Vibes: ['#a78bfa', '#7c3aed'],
};

function TypeBadge({ type }: { type: string }) {
  const colors = TYPE_COLORS[type] ?? ['#718096', '#4a5568'];
  return (
    <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={badgeStyles.badge}>
      <Text style={badgeStyles.text}>{type}</Text>
    </LinearGradient>
  );
}

const badgeStyles = StyleSheet.create({
  badge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3 },
  text: { fontSize: 9, fontWeight: '800', color: '#fff', letterSpacing: 0.5, textTransform: 'uppercase' },
});

export function PersonCard({ person }: { person: Person }) {
  return (
    <TouchableOpacity
      onPress={() => router.push(`/person/${person.id}`)}
      activeOpacity={0.88}
      style={[styles.wrapper, { width: CARD_W, height: CARD_H }]}
    >
      {/* Holographic background shimmer */}
      <LinearGradient
        colors={['#c9a227', '#7b2d8b', '#1a3a8b', '#0d7377', '#c9a227']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.holoFrame}
      >
        <View style={styles.card}>
          {/* Card header */}
          <View style={styles.cardHeader}>
            <Text style={styles.cardName} numberOfLines={1}>{person.nickname ?? person.name}</Text>
            <Text style={styles.hp}>HP {person.hp}</Text>
          </View>

          {/* Photo */}
          <View style={styles.photoFrame}>
            <LinearGradient
              colors={['#c9a227aa', '#7b2d8b88']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.photoGlow}
            >
              {person.photo_url ? (
                <Image
                  source={{ uri: person.photo_url }}
                  style={styles.photo}
                  contentFit="cover"
                  transition={400}
                />
              ) : (
                <View style={[styles.photo, styles.photoPlaceholder]}>
                  <Text style={{ fontSize: 32 }}>👤</Text>
                </View>
              )}
            </LinearGradient>
          </View>

          {/* Type badges */}
          <View style={styles.typesRow}>
            {person.types.slice(0, 2).map((t) => <TypeBadge key={t} type={t} />)}
          </View>

          {/* Divider */}
          <LinearGradient
            colors={[Colors.gold + '00', Colors.gold, Colors.gold + '00']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.divider}
          />

          {/* Superlative */}
          <Text style={styles.superlative} numberOfLines={2}>
            {person.superlative ?? '???'}
          </Text>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>SMA 2023 • Batch #{String(person.hp % 23 + 1).padStart(3, '0')}</Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: { borderRadius: 14 },
  holoFrame: { flex: 1, borderRadius: 14, padding: 2 },
  card: {
    flex: 1,
    backgroundColor: '#0f0f1a',
    borderRadius: 12,
    padding: 8,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardName: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: 0.3,
    flex: 1,
    textTransform: 'uppercase',
  },
  hp: { fontSize: 9, fontWeight: '700', color: Colors.gold, marginLeft: 4 },
  photoFrame: { marginBottom: 6 },
  photoGlow: { borderRadius: 6, padding: 2 },
  photo: { width: '100%', aspectRatio: 1, borderRadius: 4 },
  photoPlaceholder: {
    backgroundColor: Colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typesRow: { flexDirection: 'row', gap: 4, marginBottom: 6 },
  divider: { height: 1, marginVertical: 4 },
  superlative: {
    fontSize: 9.5,
    color: Colors.textSecondary,
    lineHeight: 14,
    flex: 1,
    fontStyle: 'italic',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 4,
    marginTop: 4,
  },
  footerText: { fontSize: 8, color: Colors.textMuted, letterSpacing: 0.5 },
});
