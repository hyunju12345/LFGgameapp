import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import { ActivityIndicator, View, Text } from "react-native";
import { GameLibraryProvider } from "../game-library";
import { Provider } from "../store";
export default function Layout() {
  const [loaded, error] = useFonts({
    "Pretendard-Black": require("../../assets/fonts/Pretendard-Black.otf"),
    "Pretendard-Light": require("../../assets/fonts/Pretendard-Light.otf"),
    "Pretendard-Regular": require("../../assets/fonts/Pretendard-Regular.otf"),
    "Pretendard-Bold": require("../../assets/fonts/Pretendard-Bold.otf"),
    "Pretendard-SemiBold": require("../../assets/fonts/Pretendard-SemiBold.otf"),
    "Pretendard-Medium": require("../../assets/fonts/Pretendard-Medium.otf"),
  });
  if (!loaded)
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#191919",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {error ? (
          <Text style={{ color: "white" }}>
            Could not load fonts. Restart the app.
          </Text>
        ) : (
          <ActivityIndicator color="#bd8aff" />
        )}
      </View>
    );
  return (
    <SafeAreaProvider>
      <Provider>
      <GameLibraryProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: "#191919" },
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="auth" options={{ presentation: "modal" }} />
        </Stack>
      </GameLibraryProvider>
      </Provider>
    </SafeAreaProvider>
  );
}
