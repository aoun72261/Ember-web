import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Colors } from '../../constants/colors';
import { getPeople, getPhotos, Person, Photo } from '../../lib/supabase';

const { width } = Dimensions.get('window');
const THUMB = (width - 52) / 3;

export default function PersonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [person, setPerson] = useState<Person | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [people, pix] = await Promise.all([
          getPeople(),
          getPhotos({ person_id: id }),
        ]);
        setPerson(people.find((p) => p.id === id) ?? null);
        setPhotos(pix);
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
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator color={Colors.gold} size="large" />
      </View>
    );
  }

  if (!person) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={{ color: Colors.textSecondary }}>Person not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          {person.photo_url ? (
            <Image source={{ uri: person.photo_url }} style={styles.heroImage} contentFit="cover" />
          ) : (
            <View style={[styles.heroImage, styles.heroPlaceholder]}>
              <Text style={{ fontSize: 64 }}>👤</Text>
            </View>
          )}
          <LinearGradient
            colors={['transparent', '#0a0a0f']}
            style={styles.heroGradient}
          />
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <BlurView intensity={40} tint="dark" style={styles.backBlur}>
              <Ionicons name="chevron-back" size={22} color={Colors.white} />
            </BlurView>
          </TouchableOpacity>
        </View>

        {/* Card body */}
        <View style={styles.body}>
          {/* Pokemon-card-style header */}
          <LinearGradient
            colors={[Colors.gold + '22', 'transparent']}
            style={styles.nameSection}
          >
            <View style={styles.nameRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{person.name}</Text>
                {person.nickname && <Text style={styles.nickname}>"{person.nickname}"</Text>}
              </View>
              <View style={styles.hpBadge}>
                <Text style={styles.hpText}>HP {person.hp}</Text>
              </View>
            </View>
          </LinearGradient>

          {/* Types */}
          <View style={styles.typesRow}>
            {person.types.map((t) => (
              <View key={t} style={styles.typePill}>
                <Text style={styles.typePillText}>{t}</Text>
              </View>
            ))}
          </View>

          {/* Superlative */}
          {person.superlative && (
            <View style={styles.superlativeBox}>
              <Text style={styles.superlativeLabel}>Most likely to...</Text>
              <Text style={styles.superlativeText}>{person.superlative}</Text>
            </View>
          )}

          {/* Bio */}
          {person.bio && (
            <View style={styles.bioBox}>
              <Text style={styles.bioText}>{person.bio}</Text>
            </View>
          )}

          {/* Photos */}
          <View style={styles.photosHeader}>
            <Text style={styles.photosTitle}>Photos</Text>
            <Text style={styles.photosCount}>{photos.length}</Text>
          </View>

          {photos.length === 0 ? (
            <View style={styles.noPhotos}>
              <Text style={styles.noPhotosText}>No photos tagged yet</Text>
            </View>
          ) : (
            <View style={styles.photosGrid}>
              {photos.map((photo) => (
                <TouchableOpacity
                  key={photo.id}
                  style={styles.photoThumb}
                  onPress={() => router.push(`/photo/${photo.id}`)}
                  activeOpacity={0.85}
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

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  centered: { alignItems: 'center', justifyContent: 'center' },
  hero: { width, height: width * 1.1 },
  heroImage: { width: '100%', height: '100%' },
  heroPlaceholder: { backgroundColor: Colors.bgCard, alignItems: 'center', justifyContent: 'center' },
  heroGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 180 },
  backBtn: { position: 'absolute', top: 56, left: 20 },
  backBlur: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  body: { paddingHorizontal: 20, marginTop: -20 },
  nameSection: { borderRadius: 16, padding: 16, marginBottom: 12 },
  nameRow: { flexDirection: 'row', alignItems: 'flex-start' },
  name: { fontSize: 28, fontWeight: '800', color: Colors.textPrimary, letterSpacing: 0.3 },
  nickname: { fontSize: 15, color: Colors.gold, fontStyle: 'italic', marginTop: 2 },
  hpBadge: {
    borderWidth: 1.5,
    borderColor: Colors.gold,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  hpText: { color: Colors.gold, fontSize: 12, fontWeight: '700' },
  typesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  typePill: {
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  typePillText: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600' },
  superlativeBox: {
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.gold + '44',
    padding: 14,
    marginBottom: 12,
  },
  superlativeLabel: { fontSize: 11, color: Colors.gold, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 },
  superlativeText: { fontSize: 15, color: Colors.textPrimary, fontStyle: 'italic', fontWeight: '500' },
  bioBox: {
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 20,
  },
  bioText: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
  photosHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  photosTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  photosCount: { fontSize: 14, color: Colors.textSecondary },
  photosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  photoThumb: { width: THUMB, height: THUMB, borderRadius: 6, overflow: 'hidden', backgroundColor: Colors.bgCard },
  noPhotos: { paddingVertical: 24, alignItems: 'center' },
  noPhotosText: { color: Colors.textMuted, fontSize: 14 },
});
