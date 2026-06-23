import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { DeviceFrame } from '../components/device-frame'
import { colors } from '../constants/theme'

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <DeviceFrame>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background, flex: 1 },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="login" />
          <Stack.Screen name="create" options={{ presentation: 'modal' }} />
          <Stack.Screen name="challenge/[id]" />
          <Stack.Screen name="attempt/[id]" />
          <Stack.Screen name="messages/[threadId]" />
          <Stack.Screen name="messages/new" />
          <Stack.Screen name="profile/completed" />
          <Stack.Screen name="profile/created" />
          <Stack.Screen name="profile/edit" />
        </Stack>
      </DeviceFrame>
    </SafeAreaProvider>
  )
}
