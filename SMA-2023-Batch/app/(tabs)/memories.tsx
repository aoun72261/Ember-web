import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  SectionList,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Colors } from '../../constants/colors';
import { getPhotos, Photo } from '../../lib/supabase';

const { width } = Dimensions.get('window');
const THUMB = (width - 52) / 3;

const CHAPTERS: Record<string, { emoji: string; gradient: [string, string] }> = {
  'Year 1':     { emoji: '🌱', gradient: [Colors.cyan,   Colors.purple] },
  'Year 2':     { emoji: '🌿', gradient: [Colors.purple, Colors.pink]   },
  'Year 3':     { emoji: '🌳', gradient: [Colors.pink,   Colors.orange] },
  'Graduation': { emoji: '🎓', gradient: [Colors.gold,   Colors.orange] },
  'Prom':       { emoji: '👑', gradient: [Colors.pink,   Colors.purple] },
  'Senior Trip':{ emoji: '✈️', gradient: [Colors.cyan,   Colors.lime]   },
  'Sports Day': { emoji: '🏅', gradient: [Colors.lime,   Colors.cyan]   },
  'Farewell':   { emoji: '🥹', gradient: [Colors.purple, Colors.pink]   },
};

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
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
      setSections(
        Object.entries(byChapter).map(([title, photos]) => ({ title, data: chunk(photos, 3) }))
      );
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={{ fontSize: 40 }}>⏳</Text>
        <Text style={styles.emptyText}>Loading chapters...</Text>
      </View>
    );
  }

  if (sections.length === 0) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={{ fontSize: 52 }}>🎞️</Text>
        <Text style={styles.emptyText}>No chapters yet bro</Text>
        <Text style={styles.emptyHint}>Set a chapter field on photos in Supabase</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={[Colors.gold + '18', 'transparent']} style={styles.headerGrad}>
        <Text style={styles.headerTitle}>Memories 📖</Text>
        <Text style={styles.headerSub}>chapter by chapter, no cap</Text>
      </LinearGradient>

      <SectionList
        sections={sections}
        keyExtractor={(row, i) => String(i)}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.gold} />
        }
        renderSectionHeader={({ section }) => {
          const ch = CHAPTERS[section.title];
          const grad = ch?.gradient ?? [Colors.pink, Colors.purple];
          return (
            <View style={styles.chapterHeader}>
              <LinearGradient
                colors={grad}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.chapterLine}
              />
              <View style={styles.chapterRow}>
                <LinearGradient colors={grad} style={styles.chapterDot} />
                <Text style={styles.chapterEmoji}>{ch?.emoji ?? '📷'}</Text>
                <Text style={styles.chapterTitle}>{section.title}</Text>
                <Text style={styles.chapterCount}>
                  {section.data.flat().length} pics
                </Text>
              </View>
            </View>
          );
        }}
        renderItem={({ item: row }) => (
          <View style={styles.thumbRow}>
            {row.map((photo) => (
              <TouchableOpacity
                key={photo.id}
                style={styles.thumb}
                onPress={() => router.push(`/photo/${photo.id}`)}
                activeOpacity={0.85}
              >
                <Image source={{ uri: photo.url }} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.4)']} style={StyleSheet.absoluteFill} />
              </TouchableOpacity>
            ))}
          </View>
        )}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  centered: { alignItems: 'center', justifyContent: 'center', gap: 10 },
  headerGrad: { paddingTop: 56, paddingBottom: 14, paddingHorizontal: 20 },
  headerTitle: { fontSize: 26, fontWeight: '900', color: Colors.white, letterSpacing: 0.3 },
  headerSub: { fontSize: 13, color: Colors.gold, fontWeight: '600', marginTop: 2 },
  list: { paddingBottom: 24 },
  chapterHeader: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  chapterLine: { height: 2, borderRadius: 1, marginBottom: 10, opacity: 0.6 },
  chapterRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  chapterDot: { width: 8, height: 8, borderRadius: 4 },
  chapterEmoji: { fontSize: 18 },
  chapterTitle: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary, flex: 1 },
  chapterCount: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600' },
  thumbRow: { flexDirection: 'row', gap: 4, paddingHorizontal: 16, marginBottom: 4 },
  thumb: {
    width: THUMB,
    height: THUMB,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: Colors.bgCard,
  },
  emptyText: { color: Colors.textSecondary, fontSize: 16, fontWeight: '700' },
  emptyHint: { color: '#555580', fontSize: 12, textAlign: 'center', paddingHorizontal: 40 },
});
