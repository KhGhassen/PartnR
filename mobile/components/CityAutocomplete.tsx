import { useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { T } from '../constants/tokens';

export type CityResult = { name: string; lat: number | null; lng: number | null };

type Commune = { nom: string; centre?: { coordinates: [number, number] } };

type Props = {
  value: string;
  onSelect: (city: CityResult) => void;
  placeholder?: string;
};

// Autocomplete over all French communes via the official open API (no key).
export default function CityAutocomplete({ value, onSelect, placeholder = 'Cherchez votre commune…' }: Props) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<Commune[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const search = (q: string) => {
    setQuery(q);
    clearTimeout(debounceRef.current);
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(q)}&fields=nom,centre&boost=population&limit=5`
        );
        if (res.ok) setResults(await res.json());
      } catch {
        // offline — keep previous results
      }
    }, 300);
  };

  const pick = (c: Commune) => {
    setQuery(c.nom);
    setResults([]);
    onSelect({
      name: c.nom,
      lat: c.centre ? c.centre.coordinates[1] : null,
      lng: c.centre ? c.centre.coordinates[0] : null,
    });
  };

  return (
    <View>
      <TextInput
        value={query}
        onChangeText={search}
        placeholder={placeholder}
        placeholderTextColor={T.textSub}
        style={styles.input}
      />
      {results.length > 0 && (
        <View style={styles.dropdown}>
          {results.map((c, i) => (
            <TouchableOpacity key={`${c.nom}-${i}`} onPress={() => pick(c)} style={styles.item}>
              <Text style={styles.itemText}>📍 {c.nom}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    paddingHorizontal: 14, paddingVertical: 12, borderRadius: 16,
    borderWidth: 1.5, borderColor: T.border, fontSize: 14,
    fontFamily: 'DMSans_400Regular', color: T.text, backgroundColor: '#fff',
  },
  dropdown: {
    marginTop: 6, borderRadius: 16, borderWidth: 1, borderColor: T.border,
    backgroundColor: '#fff', overflow: 'hidden',
  },
  item: { paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: T.bg2 },
  itemText: { fontSize: 14, color: T.textMid, fontFamily: 'DMSans_400Regular' },
});
