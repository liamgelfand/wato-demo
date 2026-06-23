import { Animated, Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { WatoLogo } from '../ui/wato-logo'
import { colors, spacing, typography } from '../../constants/theme'

type FeedBrandHeaderProps = {
  scrollY: Animated.Value
  onCreate?: () => void
}

export function FeedBrandHeader({ scrollY, onCreate }: FeedBrandHeaderProps) {
  const opacity = scrollY.interpolate({
    inputRange: [0, 72],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  })

  const translateY = scrollY.interpolate({
    inputRange: [0, 72],
    outputRange: [0, -8],
    extrapolate: 'clamp',
  })

  return (
    <Animated.View style={[styles.wrap, { opacity, transform: [{ translateY }] }]}>
      <View style={styles.row}>
        <View style={styles.brand}>
          <WatoLogo />
        </View>
        {onCreate ? (
          <Pressable
            onPress={onCreate}
            style={styles.createBtn}
            accessibilityRole="button"
            accessibilityLabel="Create challenge"
          >
            <Ionicons name="add" size={26} color={colors.foreground} />
          </Pressable>
        ) : null}
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    paddingBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  brand: {
    flex: 1,
    justifyContent: 'center',
  },
  createBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: colors.muted,
    marginTop: 2,
  },
})
