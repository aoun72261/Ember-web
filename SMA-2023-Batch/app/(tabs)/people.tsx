import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TextInput } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { getPeople, Person } from '../../lib/supabase';
import { PersonCard } from '../../components/PersonCard';

export default function PeopleScreen() {
  const [people, setPeople] = useState<Person[]>([]);
  const [filtered, setFiltered] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    try { const d = await getPeople(); setPeople(d); setFiltered(d); }
    catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(q ? people.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.nickname?.toLowerCase().includes(q) ||
      p.superlative?.toLowerCase().includes(q) ||
      p.types.some(t => t.toLowerCase().includes(q))
    ) : people);
  }, [search, people]);

  const pairs: Person[][] = [];
  for (let i = 0; i < filtered.length; i += 2) pairs.push(filtered.slice(i, i + 2));

  return (
    <View style={styles.container}>
      <BlurView intensity={70} tint="light" style={styles.header}>
        <Text style={styles.title}>The Squad 🃏</Text>
        <Text style={styles.subtitle}>{people.length} legends · {people.length} cards</Text>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={15} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="search the squad..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
          />
        </View>
      </BlurView>

      {loading ? (
        <View style={styles.empty}>
          <Text style={{ fontSize: 44 }}>🃏</Text>
          <Text style={styles.emptyText}>Loading cards...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ fontSize: 44 }}>🔍</Text>
          <Text style={styles.emptyText}>bro who is that 💀</Text>
          <Text style={styles.emptyHint}>Add people in Supabase → people table</Text>
        </View>
      ) : (
        <FlatList
          data={pairs}
          keyExtractor={(_, i) => String(i)}
          renderItem={({ item: row }) => (
            <View style={styles.row}>
              {row.map(p => <PersonCard key={p.id} person={p} />)}
            </View>
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.rose} />}
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
  subtitle: { fontSize: 13, color: Colors.sky, fontWeight: '600', marginTop: 2, marginBottom: 12 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.bgGlassStrong,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: Colors.borderLight,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.text },
  list: { padding: 16, gap: 12, paddingBottom: 100 },
  row: { flexDirection: 'row', gap: 12 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyText: { color: Colors.textSec, fontSize: 16, fontWeight: '700' },
  emptyHint: { color: Colors.textMuted, fontSize: 12, textAlign: 'center', paddingHorizontal: 40 },
});
