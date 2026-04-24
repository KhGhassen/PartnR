import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { T } from '../constants/tokens';

type Props = {
  onPress: () => void;
};

export default function BackBtn({ onPress }: Props) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.btn} activeOpacity={0.75}>
      <Ionicons name="chevron-back" size={20} color={T.text} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: T.card,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
});
