import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { T } from '../constants/tokens';

type Props = {
  label: string;
  active?: boolean;
  onPress?: () => void;
  small?: boolean;
};

export default function Pill({ label, active = false, onPress, small = false }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[
        styles.base,
        small ? styles.paddingSm : styles.paddingMd,
        active ? styles.activeContainer : styles.inactiveContainer,
      ]}
    >
      <Text style={[styles.text, { fontSize: small ? 11 : 13 }, active ? styles.textActive : styles.textInactive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 999,
    borderWidth: 1.5,
  },
  paddingMd: { paddingHorizontal: 14, paddingVertical: 6 },
  paddingSm: { paddingHorizontal: 10, paddingVertical: 4 },
  activeContainer:   { borderColor: T.coral, backgroundColor: T.coral },
  inactiveContainer: { borderColor: T.border, backgroundColor: T.card },
  text:         { fontFamily: 'DMSans_500Medium', fontWeight: '500' },
  textActive:   { color: '#fff' },
  textInactive: { color: T.textMid },
});
