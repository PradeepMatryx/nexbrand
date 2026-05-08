import "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider } from "./src/context/AuthContext";
import { ShopProvider } from "./src/context/ShopContext";

import HomeScreen from "./src/screens/HomeScreen";
import ProductListScreen from "./src/screens/ProductListScreen";
import ProductDetailScreen from "./src/screens/ProductDetailScreen";
import CartScreen from "./src/screens/CartScreen";
import LoginScreen from "./src/screens/LoginScreen";

const Stack = createNativeStackNavigator();

export default function App() {
    return (
        <SafeAreaProvider>
            <AuthProvider>
                <ShopProvider>
                    <NavigationContainer>
                        <Stack.Navigator
                            screenOptions={{
                                headerStyle: { backgroundColor: "#FFFFFF" },
                                headerTintColor: "#000000",
                                headerTitleStyle: { fontWeight: "800" },
                                contentStyle: { backgroundColor: "#FFFFFF" },
                            }}
                        >
                            <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
                            <Stack.Screen name="ProductList" component={ProductListScreen} />
                            <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ title: "" }} />
                            <Stack.Screen name="Cart" component={CartScreen} options={{ title: "Your Bag" }} />
                            <Stack.Screen name="Login" component={LoginScreen} options={{ title: "Sign In" }} />
                        </Stack.Navigator>
                    </NavigationContainer>
                    <StatusBar style="dark" />
                </ShopProvider>
            </AuthProvider>
        </SafeAreaProvider>
    );
}
