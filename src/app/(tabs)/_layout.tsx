import React from "react";
import { View } from "react-native";
import { Tabs } from "expo-router";
import { Icon, colors } from "../../ui";
const tabs = [
  { name: "index", title: "Home", icon: "homeIdle", activeIcon: "home", width: 22, height: 22.2667 },
  { name: "friends", title: "Friend", icon: "friend", activeIcon: "friendActive", width: 22, height: 20.146 },
  { name: "games", title: "Game", icon: "game", activeIcon: "game", width: 28.391, height: 20.3355 },
  { name: "chats", title: "Chat", icon: "chat", activeIcon: "chatActive", width: 32, height: 32 },
  { name: "profile", title: "My", icon: "my", activeIcon: "myActive", width: 24, height: 24 },
] as const;

export default function Layout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: "#b7b7b7",
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: 0,
          height: 104,
          paddingTop: 16,
          paddingBottom: 36,
        },
        tabBarLabelStyle: {
          fontFamily: "Pretendard-Medium",
          fontSize: 12,
          lineHeight: 14,
          marginTop: 2,
        },
      }}
    >
      {tabs.map(({ name, title, icon, activeIcon, width, height }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            tabBarIcon: ({ focused }) => (
              <View style={{ width: 32, height: 32, alignItems: "center", justifyContent: "center" }}>
                <Icon name={focused ? activeIcon : icon} size={width} height={height} />
              </View>
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
