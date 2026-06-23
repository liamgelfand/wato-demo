import { StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, typography } from '../../constants/theme'

type WatoLogoProps = {
  size?: 'sm' | 'md' | 'lg'
}

const sizes = {
  sm: { icon: 20, fontSize: 22 },
  md: { icon: 28, fontSize: 32 },
  lg: { icon: 34, fontSize: 38 },
}

export function WatoLogo({ size = 'md' }: WatoLogoProps) {
  const s = sizes[size]
  return (
    <View style={styles.row}>
      <Ionicons name="flash" size={s.icon} color={colors.primary} />
      <Text style={[styles.text, { fontSize: s.fontSize }]}>Wato</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  text: {
    ...typography.title,
    color: colors.primary,
    letterSpacing: -1,
  },
})
