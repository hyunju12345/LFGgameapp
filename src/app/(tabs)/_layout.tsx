import React from "react";
import { Tabs } from "expo-router";
import { Icon, colors } from "../../ui";
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
          minHeight: 78,
          paddingTop: 12,
          paddingBottom: 12,
        },
        tabBarLabelStyle: {
          fontFamily: "Pretendard-Medium",
          fontSize: 12,
          marginTop: 2,
        },
      }}
    >
      {[
        ["index", "Home", "home"],
        ["friends", "Friend", "friend"],
        ["games", "Game", "game"],
        ["chats", "Chat", "chat"],
        ["profile", "My", "my"],
      ].map(([name, title, icon]) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{ title, tabBarIcon: () => <Icon name={icon as "home"} /> }}
        />
      ))}
    </Tabs>
  );
}
