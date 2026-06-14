import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  SectionList,
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/colors';
import { getPhotos, Photo } from '../../lib/supabase';

const { width } = Dimensions.get('window');
const THUMB = (width - 56) / 3;

const CHAPTER_EMOJIS: Record<string, string> = {
  'Year 1': '🌱',
  'Year 2': '🌿',
  'Year 3': '🌳',
  'Graduation': '🎓',
  'Prom': '👑',
  'Senior Trip': '✈️',
  'Sports Day': '🏅',
  'Farewell': '🥹',
};

type Section = { title: string; data: Photo[][] };

function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size));
  return result;
}

export default function MemoriesScreen() {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getPhotos();
      const byChapter: Record<string, Photo[]> = {};
      for (const p of data) {
        const ch = p.chapter ?? 'Uncategorized';
        if (!byChapter[ch]) byChapter[ch] = [];
        byChapter[ch].push(p);
      }
      const built: Section[] = Object.entries(byChapter).map(([title, photos]) => ({
        title,
        data: chunk(photos, 3),
      }));
      setSections(built);
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
        <Text style={styles.emptyText}>Loading memories...</Text>
      </View>
    );
  }

  if (sections.length === 0) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={{ fontSize: 48 }}>🎞️</Text>
        <Text style={styles.emptyText}>No chapters yet</Text>
        <Text style={styles.emptyHint}>Set a chapter field on your photos in Supabase</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Memories</Text>
        <Text style={styles.headerSub}>Chapter by chapter 📖</Text>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(row, i) => String(i)}
        stickySectionHeadersEnabled={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.gold} />
        }
        renderSectionHeader={({ section }) => (
          <LinearGradient
            colors={[Colors.bg, Colors.bgCard, Colors.bg]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.chapterHeader}
          >
            <View style={styles.chapterDot} />
            <Text style={styles.chapterEmoji}>{CHAPTER_EMOJIS[section.title] ?? '📷'}</Text>
            <Text style={styles.chapterTitle}>{section.title}</Text>
          </LinearGradient>
        )}
        renderItem={({ item: row }) => (
          <View style={styles.thumbRow}>
            {row.map((photo) => (
              <TouchableOpacity
                key={photo.id}
                style={styles.thumb}
                onPress={() => router.push(`/photo/${photo.id}`)}
                activeOpacity={0.88}
              >
                <Image
                  source={{ uri: photo.url }}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  transition={300}
                />
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
  centered: { alignItems: 'center', justifyContent: 'center', gap: 8 },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: Colors.textPrimary, letterSpacing: 0.5 },
  headerSub: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  list: { paddingBottom: 20 },
  chapterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginTop: 8,
  },
  chapterDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.gold,
  },
  chapterEmoji: { fontSize: 18 },
  chapterTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, letterSpacing: 0.3 },
  thumbRow: { flexDirection: 'row', gap: 4, paddingHorizontal: 16, marginBottom: 4 },
  thumb: {
    width: THUMB,
    height: THUMB,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: Colors.bgCard,
  },
  emptyText: { color: Colors.textSecondary, fontSize: 16, fontWeight: '600' },
  emptyHint: { color: Colors.textMuted, fontSize: 12, textAlign: 'center', paddingHorizontal: 40 },
});
