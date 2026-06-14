import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TextInput,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { getPeople, Person } from '../../lib/supabase';
import { PersonCard } from '../../components/PersonCard';
import { Ionicons } from '@expo/vector-icons';

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
              p.superlative?.toLowerCase().includes(q)
          )
        : people
    );
  }, [search, people]);

  const renderPair = ({ item }: { item: Person[] }) => (
    <View style={styles.row}>
      {item.map((person) => <PersonCard key={person.id} person={person} />)}
    </View>
  );

  const pairs: Person[][] = [];
  for (let i = 0; i < filtered.length; i += 2) {
    pairs.push(filtered.slice(i, i + 2));
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>The Squad</Text>
        <Text style={styles.headerSub}>{people.length} legends</Text>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={16} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search people..."
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
          autoCorrect={false}
        />
      </View>

      {loading ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Loading the squad...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🃏</Text>
          <Text style={styles.emptyText}>No cards found</Text>
          <Text style={styles.emptyHint}>Add people in Supabase → people table</Text>
        </View>
      ) : (
        <FlatList
          data={pairs}
          keyExtractor={(_, i) => String(i)}
          renderItem={renderPair}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.gold} />
          }
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
    paddingBottom: 12,
  },
  headerTitle: { fontSize: 26, fontWeight: '800', color: Colors.textPrimary, letterSpacing: 0.5 },
  headerSub: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: Colors.bgElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchInput: { flex: 1, color: Colors.textPrimary, fontSize: 14 },
  list: { paddingHorizontal: 16, paddingBottom: 20, gap: 12 },
  row: { flexDirection: 'row', gap: 12, justifyContent: 'flex-start' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyEmoji: { fontSize: 48 },
  emptyText: { color: Colors.textSecondary, fontSize: 16, fontWeight: '600' },
  emptyHint: { color: Colors.textMuted, fontSize: 12, textAlign: 'center', paddingHorizontal: 40 },
});
