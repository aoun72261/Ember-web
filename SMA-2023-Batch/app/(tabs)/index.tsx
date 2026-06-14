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
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { getPhotos, Photo } from '../../lib/supabase';
import { useAuthStore } from '../../lib/store';

const { width } = Dimensions.get('window');
const COL = 2;
const GAP = 3;
const TILE = (width - GAP * (COL + 1)) / COL;

const TAGLINES = [
  "no filter needed 📸",
  "we ate and left no crumbs 🔥",
  "peak era, no debate 💅",
  "the goats, assembled 🐐",
  "certified moments ✨",
];
const tagline = TAGLINES[Math.floor(Math.random() * TAGLINES.length)];

export default function GalleryScreen() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { logout } = useAuthStore();

  const load = useCallback(async () => {
    try { setPhotos(await getPhotos()); }
    catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <View style={styles.container}>
      {/* Frosted header */}
      <BlurView intensity={70} tint="light" style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>SMA 2023 📸</Text>
            <Text style={styles.headerSub}>{tagline}</Text>
          </View>
          <TouchableOpacity onPress={logout} style={styles.lockBtn}>
            <Ionicons name="lock-closed-outline" size={18} color={Colors.textSec} />
          </TouchableOpacity>
        </View>
      </BlurView>

      {loading ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>⏳</Text>
          <Text style={styles.emptyText}>Loading the memories...</Text>
        </View>
      ) : photos.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📭</Text>
          <Text style={styles.emptyText}>No pics yet bruh</Text>
          <Text style={styles.emptyHint}>Upload photos via Supabase Storage</Text>
        </View>
      ) : (
        <FlatList
          data={photos}
          keyExtractor={(i) => i.id}
          numColumns={COL}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={{ gap: GAP }}
          ItemSeparatorComponent={() => <View style={{ height: GAP }} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.rose} />}
          renderItem={({ item, index }) => {
            const isTall = index % 5 === 0;
            return (
              <TouchableOpacity
                style={[styles.tile, { width: TILE, height: isTall ? TILE * 1.5 : TILE }]}
                onPress={() => router.push(`/photo/${item.id}`)}
                activeOpacity={0.9}
              >
                <Image source={{ uri: item.url }} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
                {/* Glass caption strip */}
                {(item.caption || item.chapter) && (
                  <BlurView intensity={50} tint="light" style={styles.captionStrip}>
                    {item.caption && (
                      <Text style={styles.captionText} numberOfLines={1}>{item.caption}</Text>
                    )}
                    {item.chapter && (
                      <View style={styles.chapterPill}>
                        <Text style={styles.chapterText}>{item.chapter}</Text>
                      </View>
                    )}
                  </BlurView>
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
  header: {
    paddingTop: 58,
    paddingBottom: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.borderLight,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: Colors.text },
  headerSub: { fontSize: 13, color: Colors.rose, fontWeight: '600', marginTop: 2 },
  lockBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.bgGlass,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: { padding: GAP },
  tile: { borderRadius: 12, overflow: 'hidden', backgroundColor: Colors.bgCard },
  captionStrip: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 8,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
    borderTopWidth: 0.5,
    borderTopColor: Colors.borderGlass,
    overflow: 'hidden',
  },
  captionText: { flex: 1, fontSize: 10, fontWeight: '600', color: Colors.text },
  chapterPill: {
    backgroundColor: Colors.rose,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  chapterText: { color: Colors.white, fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyEmoji: { fontSize: 52 },
  emptyText: { color: Colors.textSec, fontSize: 16, fontWeight: '700' },
  emptyHint: { color: Colors.textMuted, fontSize: 13 },
});
