// app/wallpaper/_layout.tsx
import { Stack } from "expo-router";

export default function WallpaperLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // Hide header for this screen
      }}
    />
  );
}
