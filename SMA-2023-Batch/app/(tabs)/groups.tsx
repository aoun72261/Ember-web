import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Colors } from '../../constants/colors';
import { getPhotos, Photo } from '../../lib/supabase';

const { width } = Dimensions.get('window');

const CHAPTER_COLORS: Record<string, [string, string]> = {
  'Year 1':     [Colors.cyan, Colors.purple],
  'Year 2':     [Colors.purple, Colors.pink],
  'Year 3':     [Colors.pink, Colors.orange],
  'Graduation': [Colors.gold, Colors.orange],
  'Prom':       [Colors.pink, Colors.purple],
  'Senior Trip':[Colors.cyan, Colors.lime],
  'Sports Day': [Colors.lime, Colors.cyan],
  'Farewell':   [Colors.purple, Colors.pink],
};

export default function GroupsScreen() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getPhotos({ is_group: true });
      setPhotos(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <View style={styles.container}>
      <LinearGradient colors={[Colors.cyan + '18', 'transparent']} style={styles.headerGrad}>
        <Text style={styles.headerTitle}>Group Shots 👥</Text>
        <Text style={styles.headerSub}>when we were all together 🔥</Text>
      </LinearGradient>

      {loading ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>👀</Text>
          <Text style={styles.emptyText}>Loading...</Text>
        </View>
      ) : photos.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🫂</Text>
          <Text style={styles.emptyText}>No group shots yet</Text>
          <Text style={styles.emptyHint}>Set is_group = true on photos in Supabase</Text>
        </View>
      ) : (
        <FlatList
          data={photos}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.cyan} />
          }
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const chapterColors = CHAPTER_COLORS[item.chapter ?? ''] ?? [Colors.pink, Colors.purple];
            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() => router.push(`/photo/${item.id}`)}
                activeOpacity={0.88}
              >
                {/* Colored top border accent */}
                <LinearGradient
                  colors={chapterColors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.cardAccent}
                />
                <Image source={{ uri: item.url }} style={styles.cardImage} contentFit="cover" transition={300} />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.75)']}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.cardOverlay}>
                  {item.caption && <Text style={styles.cardCaption}>{item.caption}</Text>}
                  {item.chapter && (
                    <LinearGradient
                      colors={chapterColors}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.chapterTag}
                    >
                      <Text style={styles.chapterText}>{item.chapter}</Text>
                    </LinearGradient>
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  headerGrad: { paddingTop: 56, paddingBottom: 14, paddingHorizontal: 20 },
  headerTitle: { fontSize: 26, fontWeight: '900', color: Colors.white, letterSpacing: 0.3 },
  headerSub: { fontSize: 13, color: Colors.cyan, fontWeight: '600', marginTop: 2 },
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 16 },
  card: {
    width: width - 32,
    height: (width - 32) * 0.62,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: Colors.bgCard,
  },
  cardAccent: { height: 3, width: '100%' },
  cardImage: { width: '100%', height: '100%' },
  cardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  cardCaption: { color: Colors.white, fontSize: 14, fontWeight: '700', flex: 1 },
  chapterTag: { borderRadius: 8, paddingHorizontal: 11, paddingVertical: 5, marginLeft: 10 },
  chapterText: { color: '#000', fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyEmoji: { fontSize: 52 },
  emptyText: { color: Colors.textSecondary, fontSize: 16, fontWeight: '700' },
  emptyHint: { color: '#555580', fontSize: 12, textAlign: 'center', paddingHorizontal: 40 },
});
