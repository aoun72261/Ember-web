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
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { getPhotos, Photo } from '../../lib/supabase';
import { useAuthStore } from '../../lib/store';

const { width } = Dimensions.get('window');
const COL = 2;
const GAP = 2;
const TILE = (width - GAP * (COL + 1)) / COL;

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

  const onRefresh = () => { setRefreshing(true); load(); };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>SMA 2023</Text>
          <Text style={styles.headerSub}>Our memories ✨</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Ionicons name="lock-closed-outline" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Loading memories...</Text>
        </View>
      ) : photos.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📸</Text>
          <Text style={styles.emptyText}>No photos yet</Text>
          <Text style={styles.emptyHint}>Add photos through Supabase Storage</Text>
        </View>
      ) : (
        <FlatList
          data={photos}
          keyExtractor={(item) => item.id}
          numColumns={COL}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gold} />}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={{ gap: GAP }}
          ItemSeparatorComponent={() => <View style={{ height: GAP }} />}
          renderItem={({ item, index }) => {
            const isTall = index % 5 === 0;
            return (
              <TouchableOpacity
                style={[styles.tile, { width: TILE, height: isTall ? TILE * 1.5 : TILE }]}
                onPress={() => router.push(`/photo/${item.id}`)}
                activeOpacity={0.9}
              >
                <Image
                  source={{ uri: item.url }}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  transition={300}
                />
                {item.caption && (
                  <View style={styles.captionOverlay}>
                    <Text style={styles.captionText} numberOfLines={2}>{item.caption}</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerTitle: { fontSize: 26, fontWeight: '800', color: Colors.textPrimary, letterSpacing: 0.5 },
  headerSub: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: { padding: GAP },
  tile: { borderRadius: 4, overflow: 'hidden', backgroundColor: Colors.bgCard },
  captionOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  captionText: { color: Colors.white, fontSize: 11, fontWeight: '500' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyEmoji: { fontSize: 48 },
  emptyText: { color: Colors.textSecondary, fontSize: 16, fontWeight: '600' },
  emptyHint: { color: Colors.textMuted, fontSize: 13 },
});
