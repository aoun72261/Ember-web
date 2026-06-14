import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, RefreshControl, SectionList } from 'react-native';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Colors } from '../../constants/colors';
import { getPhotos, Photo } from '../../lib/supabase';

const { width } = Dimensions.get('window');
const THUMB = (width - 52) / 3;

const CHAPTERS: Record<string, { emoji: string; color: string }> = {
  'Year 1':     { emoji: '🌱', color: Colors.sage },
  'Year 2':     { emoji: '🌿', color: Colors.sky },
  'Year 3':     { emoji: '🌳', color: Colors.peach },
  'Graduation': { emoji: '🎓', color: Colors.gold },
  'Prom':       { emoji: '👑', color: Colors.rose },
  'Senior Trip':{ emoji: '✈️', color: Colors.sky },
  'Sports Day': { emoji: '🏅', color: Colors.sage },
  'Farewell':   { emoji: '🥹', color: Colors.rose },
};

function chunk<T>(arr: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

type Section = { title: string; data: Photo[][] };

export default function MemoriesScreen() {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getPhotos();
      const byChapter: Record<string, Photo[]> = {};
      for (const p of data) {
        const ch = p.chapter ?? 'Other';
        if (!byChapter[ch]) byChapter[ch] = [];
        byChapter[ch].push(p);
      }
      setSections(Object.entries(byChapter).map(([title, photos]) => ({ title, data: chunk(photos, 3) })));
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <View style={[styles.container, styles.centered]}>
      <Text style={{ fontSize: 44 }}>⏳</Text>
      <Text style={styles.emptyText}>Loading chapters...</Text>
    </View>
  );

  if (sections.length === 0) return (
    <View style={[styles.container, styles.centered]}>
      <Text style={{ fontSize: 52 }}>🎞️</Text>
      <Text style={styles.emptyText}>No chapters yet</Text>
      <Text style={styles.emptyHint}>Set chapter field on photos in Supabase</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <BlurView intensity={70} tint="light" style={styles.header}>
        <Text style={styles.title}>Memories 📖</Text>
        <Text style={styles.subtitle}>chapter by chapter, no cap</Text>
      </BlurView>

      <SectionList
        sections={sections}
        keyExtractor={(row, i) => String(i)}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.gold} />}
        renderSectionHeader={({ section }) => {
          const ch = CHAPTERS[section.title];
          const color = ch?.color ?? Colors.rose;
          return (
            <BlurView intensity={55} tint="light" style={styles.chapterHeader}>
              <View style={[styles.chapterDot, { backgroundColor: color }]} />
              <Text style={styles.chapterEmoji}>{ch?.emoji ?? '📷'}</Text>
              <Text style={styles.chapterTitle}>{section.title}</Text>
              <View style={[styles.countPill, { backgroundColor: color + '22', borderColor: color + '66' }]}>
                <Text style={[styles.countText, { color }]}>{section.data.flat().length} pics</Text>
              </View>
            </BlurView>
          );
        }}
        renderItem={({ item: row }) => (
          <View style={styles.thumbRow}>
            {row.map(photo => (
              <TouchableOpacity key={photo.id} style={styles.thumb} onPress={() => router.push(`/photo/${photo.id}`)} activeOpacity={0.88}>
                <Image source={{ uri: photo.url }} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  centered: { alignItems: 'center', justifyContent: 'center', gap: 10 },
  header: {
    paddingTop: 58,
    paddingBottom: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.borderLight,
  },
  title: { fontSize: 24, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: 13, color: Colors.gold, fontWeight: '600', marginTop: 2 },
  list: { paddingBottom: 100 },
  chapterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.borderLight,
    overflow: 'hidden',
  },
  chapterDot: { width: 8, height: 8, borderRadius: 4 },
  chapterEmoji: { fontSize: 16 },
  chapterTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: Colors.text },
  countPill: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  countText: { fontSize: 11, fontWeight: '700' },
  thumbRow: { flexDirection: 'row', gap: 4, padding: 4, paddingHorizontal: 16 },
  thumb: {
    width: THUMB,
    height: THUMB,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: Colors.bgCard,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  emptyText: { color: Colors.textSec, fontSize: 16, fontWeight: '700' },
  emptyHint: { color: Colors.textMuted, fontSize: 12, textAlign: 'center', paddingHorizontal: 40 },
});
