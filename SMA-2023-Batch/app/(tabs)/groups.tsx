import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions, RefreshControl } from 'react-native';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { Colors } from '../../constants/colors';
import { getPhotos, Photo } from '../../lib/supabase';

const { width } = Dimensions.get('window');

export default function GroupsScreen() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try { setPhotos(await getPhotos({ is_group: true })); }
    catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <View style={styles.container}>
      <BlurView intensity={70} tint="light" style={styles.header}>
        <Text style={styles.title}>Group Shots 👥</Text>
        <Text style={styles.subtitle}>when we were all together 🔥</Text>
      </BlurView>

      {loading ? (
        <View style={styles.empty}><Text style={{ fontSize: 44 }}>👀</Text><Text style={styles.emptyText}>Loading...</Text></View>
      ) : photos.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ fontSize: 44 }}>🫂</Text>
          <Text style={styles.emptyText}>No group shots yet</Text>
          <Text style={styles.emptyHint}>Set is_group = true in Supabase</Text>
        </View>
      ) : (
        <FlatList
          data={photos}
          keyExtractor={(i) => i.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.sky} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/photo/${item.id}`)}
              activeOpacity={0.9}
            >
              <Image source={{ uri: item.url }} style={styles.cardImg} contentFit="cover" transition={300} />
              {/* Frosted glass footer */}
              <BlurView intensity={65} tint="light" style={styles.cardFooter}>
                <View style={styles.footerInner}>
                  {item.caption && <Text style={styles.caption}>{item.caption}</Text>}
                  {item.chapter && (
                    <View style={styles.chapterPill}>
                      <Text style={styles.chapterText}>{item.chapter}</Text>
                    </View>
                  )}
                </View>
              </BlurView>
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
    paddingTop: 58,
    paddingBottom: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.borderLight,
  },
  title: { fontSize: 24, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: 13, color: Colors.sky, fontWeight: '600', marginTop: 2 },
  list: { padding: 16, gap: 14, paddingBottom: 100 },
  card: {
    width: width - 32,
    height: (width - 32) * 0.62,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: Colors.bgCard,
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 5 },
    elevation: 6,
  },
  cardImg: { width: '100%', height: '100%' },
  cardFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 0.5,
    borderTopColor: Colors.borderGlass,
    overflow: 'hidden',
  },
  footerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  caption: { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.text },
  chapterPill: {
    backgroundColor: Colors.rose,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: 8,
  },
  chapterText: { color: Colors.white, fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyText: { color: Colors.textSec, fontSize: 16, fontWeight: '700' },
  emptyHint: { color: Colors.textMuted, fontSize: 12, textAlign: 'center', paddingHorizontal: 40 },
});
