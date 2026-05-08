import Constants from "expo-constants";

// Override locally by setting EXPO_PUBLIC_API_URL or editing app.json -> extra.apiUrl.
export const API_URL =
    process.env.EXPO_PUBLIC_API_URL ||
    Constants.expoConfig?.extra?.apiUrl ||
    "http://localhost:8001";

export const COLORS = {
    accent: "#FF3F6C",
    black: "#000000",
    white: "#FFFFFF",
    gray100: "#F3F4F6",
    gray200: "#E5E7EB",
    gray500: "#6B7280",
    gray800: "#1F2937",
    success: "#10B981",
};
