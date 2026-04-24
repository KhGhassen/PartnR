import { View, StyleSheet } from 'react-native';
import { T } from '../constants/tokens';

type Props = {
  joined: number;
  total: number;
};

export default function ProgressBar({ joined, total }: Props) {
  const pct = total > 0 ? Math.min((joined / total) * 100, 100) : 0;
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${pct}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flex: 1,
    height: 4,
    borderRadius: 4,
    backgroundColor: T.border,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: T.coral,
  },
});
