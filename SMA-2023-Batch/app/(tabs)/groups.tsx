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
import { Colors } from '../../constants/colors';
import { getPhotos, Photo } from '../../lib/supabase';

const { width } = Dimensions.get('window');

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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Group Shots</Text>
        <Text style={styles.headerSub}>When we were all together 🔥</Text>
      </View>

      {loading ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Loading...</Text>
        </View>
      ) : photos.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>👥</Text>
          <Text style={styles.emptyText}>No group photos yet</Text>
          <Text style={styles.emptyHint}>Upload photos with is_group = true in Supabase</Text>
        </View>
      ) : (
        <FlatList
          data={photos}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.gold} />
          }
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/photo/${item.id}`)}
              activeOpacity={0.9}
            >
              <Image
                source={{ uri: item.url }}
                style={styles.cardImage}
                contentFit="cover"
                transition={300}
              />
              <View style={styles.cardOverlay}>
                {item.caption && <Text style={styles.cardCaption}>{item.caption}</Text>}
                {item.chapter && (
                  <View style={styles.chapterTag}>
                    <Text style={styles.chapterText}>{item.chapter}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerTitle: { fontSize: 26, fontWeight: '800', color: Colors.textPrimary, letterSpacing: 0.5 },
  headerSub: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  list: { paddingHorizontal: 16, paddingBottom: 20, gap: 14 },
  card: {
    width: width - 32,
    height: (width - 32) * 0.65,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Colors.bgCard,
  },
  cardImage: { width: '100%', height: '100%' },
  cardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
    backgroundColor: 'rgba(0,0,0,0.5)',
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  cardCaption: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  chapterTag: {
    backgroundColor: Colors.gold + 'cc',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: 8,
  },
  chapterText: { color: '#000', fontSize: 11, fontWeight: '800' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyEmoji: { fontSize: 48 },
  emptyText: { color: Colors.textSecondary, fontSize: 16, fontWeight: '600' },
  emptyHint: { color: Colors.textMuted, fontSize: 12, textAlign: 'center', paddingHorizontal: 40 },
});
