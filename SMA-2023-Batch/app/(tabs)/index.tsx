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
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { getPhotos, Photo } from '../../lib/supabase';
import { useAuthStore } from '../../lib/store';

const { width } = Dimensions.get('window');
const COL = 2;
const GAP = 3;
const TILE = (width - GAP * (COL + 1)) / COL;

const HEADER_TAGLINES = [
  "no filter needed 📸",
  "we ate fr 🔥",
  "peak memories right here 💅",
  "the goats, assembled 🐐",
];
const tagline = HEADER_TAGLINES[Math.floor(Math.random() * HEADER_TAGLINES.length)];

export default function GalleryScreen() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { logout } = useAuthStore();

  const load = useCallback(async () => {
    try {
      const data = await getPhotos();
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
      {/* Header with gradient accent */}
      <LinearGradient
        colors={[Colors.pink + '18', 'transparent']}
        style={styles.headerGrad}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>SMA 2023 📸</Text>
            <Text style={styles.headerSub}>{tagline}</Text>
          </View>
          <TouchableOpacity onPress={logout} style={styles.lockBtn}>
            <Ionicons name="lock-closed" size={18} color={Colors.pink} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {loading ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>⏳</Text>
          <Text style={styles.emptyText}>Loading the memories...</Text>
        </View>
      ) : photos.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📭</Text>
          <Text style={styles.emptyText}>No pics yet bruh</Text>
          <Text style={styles.emptyHint}>Upload photos through Supabase Storage</Text>
        </View>
      ) : (
        <FlatList
          data={photos}
          keyExtractor={(item) => item.id}
          numColumns={COL}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.pink} />
          }
          contentContainerStyle={styles.grid}
          columnWrapperStyle={{ gap: GAP }}
          ItemSeparatorComponent={() => <View style={{ height: GAP }} />}
          renderItem={({ item, index }) => {
            const isTall = index % 5 === 0;
            return (
              <TouchableOpacity
                style={[styles.tile, { width: TILE, height: isTall ? TILE * 1.5 : TILE }]}
                onPress={() => router.push(`/photo/${item.id}`)}
                activeOpacity={0.88}
              >
                <Image
                  source={{ uri: item.url }}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  transition={300}
                />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.65)']}
                  style={StyleSheet.absoluteFill}
                />
                {item.caption && (
                  <View style={styles.captionBox}>
                    <Text style={styles.captionText} numberOfLines={2}>{item.caption}</Text>
                  </View>
                )}
                {item.chapter && (
                  <View style={[styles.chapterPill, { backgroundColor: Colors.pink + 'cc' }]}>
                    <Text style={styles.chapterText}>{item.chapter}</Text>
                  </View>
                )}
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 26, fontWeight: '900', color: Colors.white, letterSpacing: 0.3 },
  headerSub: { fontSize: 13, color: Colors.pink, marginTop: 2, fontWeight: '600' },
  lockBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.pink + '1a',
    borderWidth: 1,
    borderColor: Colors.pink + '44',
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: { padding: GAP },
  tile: { borderRadius: 10, overflow: 'hidden', backgroundColor: Colors.bgCard },
  captionBox: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 8,
    paddingVertical: 7,
  },
  captionText: { color: Colors.white, fontSize: 11, fontWeight: '600', lineHeight: 14 },
  chapterPill: {
    position: 'absolute',
    top: 7,
    left: 7,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  chapterText: { color: Colors.white, fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyEmoji: { fontSize: 52 },
  emptyText: { color: Colors.textSecondary, fontSize: 16, fontWeight: '700' },
  emptyHint: { color: '#555580', fontSize: 13, textAlign: 'center', paddingHorizontal: 40 },
});
