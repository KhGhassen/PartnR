import { View, Text, StyleSheet } from 'react-native';
import { T } from '../constants/tokens';

type Props = {
  initials?: string;
  emoji?: string;
  color?: string;
  size?: number;
};

export default function Avatar({ initials, emoji, color = T.coralL, size = 36 }: Props) {
  const isEmoji = emoji && emoji.length <= 2;
  const display = isEmoji ? emoji : (initials ?? '?');
  const fontSize = isEmoji ? size * 0.5 : Math.floor(size * 0.34);

  return (
    <View style={[styles.base, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }]}>
      <Text style={[styles.label, { fontSize }]}>{display}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: T.text,
    fontWeight: '600',
    letterSpacing: -0.5,
    fontFamily: 'DMSans_600SemiBold',
  },
});
