import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Share,
} from 'react-native';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { getPhotos, Photo } from '../../lib/supabase';

const { width, height } = Dimensions.get('window');

export default function PhotoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const photos = await getPhotos();
        setPhoto(photos.find((p) => p.id === id) ?? null);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={Colors.gold} size="large" style={{ flex: 1 }} />
      </View>
    );
  }

  if (!photo) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: Colors.textSecondary }}>Photo not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: photo.url }}
        style={styles.image}
        contentFit="contain"
        transition={200}
      />

      {/* Top bar */}
      <BlurView intensity={50} tint="dark" style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="close" size={24} color={Colors.white} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => Share.share({ url: photo.url, message: photo.caption ?? 'SMA 2023 Memory' })}
        >
          <Ionicons name="share-outline" size={22} color={Colors.white} />
        </TouchableOpacity>
      </BlurView>

      {/* Bottom info */}
      {(photo.caption || photo.chapter) && (
        <BlurView intensity={60} tint="dark" style={styles.bottomBar}>
          {photo.caption && <Text style={styles.caption}>{photo.caption}</Text>}
          {photo.chapter && <Text style={styles.chapter}>{photo.chapter}</Text>}
        </BlurView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  image: { width, height },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 6,
  },
  caption: { color: Colors.white, fontSize: 16, fontWeight: '500', lineHeight: 22 },
  chapter: { color: Colors.gold, fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
});
