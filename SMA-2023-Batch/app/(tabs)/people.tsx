import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
    try {
      const data = await getPeople();
      setPeople(data);
      setFiltered(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      q
        ? people.filter(
            (p) =>
              p.name.toLowerCase().includes(q) ||
              p.nickname?.toLowerCase().includes(q) ||
              p.superlative?.toLowerCase().includes(q) ||
              p.types.some((t) => t.toLowerCase().includes(q))
          )
        : people
    );
  }, [search, people]);

  const pairs: Person[][] = [];
  for (let i = 0; i < filtered.length; i += 2) {
    pairs.push(filtered.slice(i, i + 2));
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.purple + '22', 'transparent']}
        style={styles.headerGrad}
      >
        <Text style={styles.headerTitle}>The Squad 🃏</Text>
        <Text style={styles.headerSub}>
          {people.length} legends, {people.length} cards
        </Text>
      </LinearGradient>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={16} color={Colors.purple} />
        <TextInput
          style={styles.searchInput}
          placeholder="search the squad..."
          placeholderTextColor="#555580"
          value={search}
          onChangeText={setSearch}
          autoCorrect={false}
        />
      </View>

      {loading ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🃏</Text>
          <Text style={styles.emptyText}>Loading the cards...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🔍</Text>
          <Text style={styles.emptyText}>Bro who is that 💀</Text>
          <Text style={styles.emptyHint}>Add people in Supabase → people table</Text>
        </View>
      ) : (
        <FlatList
          data={pairs}
          keyExtractor={(_, i) => String(i)}
          renderItem={({ item: row }) => (
            <View style={styles.row}>
              {row.map((person) => <PersonCard key={person.id} person={person} />)}
            </View>
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.purple} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  headerGrad: { paddingTop: 56, paddingBottom: 14, paddingHorizontal: 20 },
  headerTitle: { fontSize: 26, fontWeight: '900', color: Colors.white, letterSpacing: 0.3 },
  headerSub: { fontSize: 13, color: Colors.purple, fontWeight: '600', marginTop: 2 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 14,
    backgroundColor: Colors.bgElevated,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchInput: { flex: 1, color: Colors.textPrimary, fontSize: 14 },
  list: { paddingHorizontal: 16, paddingBottom: 20, gap: 12 },
  row: { flexDirection: 'row', gap: 12 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyEmoji: { fontSize: 52 },
  emptyText: { color: Colors.textSecondary, fontSize: 16, fontWeight: '700' },
  emptyHint: { color: '#555580', fontSize: 12, textAlign: 'center', paddingHorizontal: 40 },
});
