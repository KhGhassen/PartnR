import { TouchableOpacity, Text, StyleSheet, type ViewStyle } from 'react-native';
import { T } from '../constants/tokens';

type Props = {
  label: string;
  onPress?: () => void;
  secondary?: boolean;
  style?: ViewStyle;
  disabled?: boolean;
};

export default function CTAButton({ label, onPress, secondary = false, style, disabled = false }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.82}
      disabled={disabled}
      style={[
        styles.base,
        secondary ? styles.secondary : styles.primary,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text style={[styles.text, secondary ? styles.textSecondary : styles.textPrimary]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary:   { backgroundColor: T.coral },
  secondary: { backgroundColor: T.card, borderWidth: 2, borderColor: T.coral },
  disabled:  { opacity: 0.45 },
  text:          { fontSize: 15, fontWeight: '600', fontFamily: 'DMSans_600SemiBold' },
  textPrimary:   { color: '#fff' },
  textSecondary: { color: T.coral },
});
