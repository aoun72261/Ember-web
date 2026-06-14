import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { Colors } from '../constants/colors';
import { Person } from '../lib/supabase';

const { width } = Dimensions.get('window');
const CARD_W = (width - 48) / 2;
const CARD_H = CARD_W * 1.58;

const DEFAULT_TYPE = { bg: Colors.bgCard, text: Colors.textSec, border: Colors.borderMid };

export function PersonCard({ person }: { person: Person }) {
  const primaryType = person.types[0] ?? '';
  const theme = Colors.typeColors[primaryType] ?? DEFAULT_TYPE;

  return (
    <TouchableOpacity
      onPress={() => router.push(`/person/${person.id}`)}
      activeOpacity={0.88}
      style={[styles.wrapper, { width: CARD_W, height: CARD_H }]}
    >
      {/* Full card photo background */}
      {person.photo_url ? (
        <Image source={{ uri: person.photo_url }} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
      ) : (
        <LinearGradient
          colors={['#f0f0f5', '#e0e0ea']}
          style={StyleSheet.absoluteFill}
        />
      )}

      {/* Top: name + HP chip — frosted glass pill */}
      <BlurView intensity={50} tint="light" style={styles.topChip}>
        <Text style={styles.chipName} numberOfLines={1}>
          {person.nickname ?? person.name.split(' ')[0]}
        </Text>
        <View style={styles.hpBubble}>
          <Text style={styles.hpText}>HP {person.hp}</Text>
        </View>
      </BlurView>

      {/* Bottom info panel — frosted glass */}
      <BlurView intensity={70} tint="light" style={styles.infoPanel}>
        {/* Type badges */}
        <View style={styles.typesRow}>
          {person.types.slice(0, 2).map((t) => {
            const tc = Colors.typeColors[t] ?? DEFAULT_TYPE;
            return (
              <View key={t} style={[styles.badge, { backgroundColor: tc.bg, borderColor: tc.border }]}>
                <Text style={[styles.badgeText, { color: tc.text }]}>{t}</Text>
              </View>
            );
          })}
        </View>

        {/* Superlative */}
        <Text style={styles.superlative} numberOfLines={2}>
          "{person.superlative ?? 'TBD 👀'}"
        </Text>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={[styles.footerDot, { backgroundColor: theme.border }]} />
          <Text style={styles.footerText}>SMA '23</Text>
        </View>
      </BlurView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: Colors.bgCard,
    shadowColor: '#000',
    shadowOpacity: 0.13,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },

  // Top chip
  topChip: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderGlass,
  },
  chipName: { fontSize: 11, fontWeight: '800', color: Colors.text, flex: 1, textTransform: 'uppercase', letterSpacing: 0.3 },
  hpBubble: {
    backgroundColor: Colors.gold,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
  },
  hpText: { fontSize: 9, fontWeight: '900', color: '#5a3e00' },

  // Bottom info
  infoPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
    overflow: 'hidden',
    borderTopWidth: 1,
    borderTopColor: Colors.borderGlass,
  },
  typesRow: { flexDirection: 'row', gap: 5, marginBottom: 6, flexWrap: 'wrap' },
  badge: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  badgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.4, textTransform: 'uppercase' },

  superlative: {
    fontSize: 10,
    color: Colors.textSec,
    fontStyle: 'italic',
    lineHeight: 14,
    marginBottom: 8,
  },

  footer: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  footerDot: { width: 6, height: 6, borderRadius: 3 },
  footerText: { fontSize: 10, color: Colors.textMuted, fontWeight: '600' },
});
