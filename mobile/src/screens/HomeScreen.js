import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { http } from "../api";
import { COLORS } from "../config";
import ProductCard from "../components/ProductCard";

export default function HomeScreen({ navigation }) {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            http.get("/products").then((r) => setProducts(r.data)),
            http.get("/categories").then((r) => setCategories(r.data)),
        ]).finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator size="large" color={COLORS.accent} />
            </View>
        );
    }

    const featured = products.slice(0, 6);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }} edges={["top"]}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <Image source={require("../../assets/logo.jpg")} style={styles.logo} resizeMode="contain" />
                    <TouchableOpacity onPress={() => navigation.navigate("Cart")} testID="header-cart">
                        <Text style={{ fontSize: 18 }}>🛍️</Text>
                    </TouchableOpacity>
                </View>

                {/* Promo strip */}
                <View style={styles.promo}>
                    <Text style={styles.promoText}>BUY 2 GET 1 FREE · FREE SHIPPING ABOVE ₹999</Text>
                </View>

                {/* Hero card */}
                <View style={styles.hero}>
                    <Image
                        source={{ uri: products[0]?.image }}
                        style={StyleSheet.absoluteFill}
                        resizeMode="cover"
                    />
                    <View style={styles.heroOverlay} />
                    <View style={styles.heroContent}>
                        <View style={styles.heroBadge}>
                            <Text style={styles.heroBadgeText}>SEASON DROP</Text>
                        </View>
                        <Text style={styles.heroTitle}>BUY 2 GET 1 FREE</Text>
                        <Text style={styles.heroSub}>On all Oversized Tees & Hoodies</Text>
                        <TouchableOpacity
                            style={styles.heroCta}
                            onPress={() => navigation.navigate("ProductList", { title: "Combos", category: "combos" })}
                            testID="hero-shop-now"
                        >
                            <Text style={styles.heroCtaText}>SHOP COMBOS</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Categories */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>SHOP BY CATEGORY</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 16 }}>
                        {categories.map((c) => (
                            <TouchableOpacity
                                key={c.slug}
                                style={styles.catCard}
                                onPress={() => navigation.navigate("ProductList", { title: c.name, category: c.slug })}
                                testID={`category-${c.slug}`}
                            >
                                <Image source={{ uri: c.image }} style={styles.catImg} />
                                <Text style={styles.catLabel}>{c.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Featured grid */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>FEATURED DROPS</Text>
                    <View style={styles.grid}>
                        {featured.map((p) => (
                            <ProductCard
                                key={p.id}
                                product={p}
                                onPress={() => navigation.navigate("ProductDetail", { id: p.id })}
                            />
                        ))}
                    </View>
                    <TouchableOpacity
                        style={styles.viewAll}
                        onPress={() => navigation.navigate("ProductList", { title: "Shop All" })}
                        testID="view-all-products"
                    >
                        <Text style={styles.viewAllText}>VIEW ALL PRODUCTS</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
        paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.gray200,
    },
    logo: { width: 110, height: 36 },
    promo: { backgroundColor: COLORS.black, paddingVertical: 8 },
    promoText: { color: COLORS.white, textAlign: "center", fontSize: 11, fontWeight: "700", letterSpacing: 1.5 },
    hero: { height: 360, marginHorizontal: 0, position: "relative", justifyContent: "flex-end" },
    heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)" },
    heroContent: { padding: 20 },
    heroBadge: { backgroundColor: COLORS.accent, alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4 },
    heroBadgeText: { color: COLORS.white, fontSize: 10, fontWeight: "800", letterSpacing: 2 },
    heroTitle: { color: COLORS.white, fontSize: 38, fontWeight: "900", marginTop: 12, lineHeight: 40 },
    heroSub: { color: COLORS.white, opacity: 0.9, marginTop: 8, fontSize: 14 },
    heroCta: { backgroundColor: COLORS.white, alignSelf: "flex-start", marginTop: 18, paddingHorizontal: 24, paddingVertical: 14 },
    heroCtaText: { color: COLORS.black, fontSize: 12, fontWeight: "800", letterSpacing: 2 },
    section: { paddingHorizontal: 16, paddingTop: 28, paddingBottom: 8 },
    sectionTitle: { fontSize: 13, fontWeight: "800", color: COLORS.black, letterSpacing: 2, marginBottom: 14 },
    catCard: { width: 100, marginRight: 12 },
    catImg: { width: 100, height: 100, borderRadius: 4, backgroundColor: COLORS.gray100 },
    catLabel: { fontSize: 11, fontWeight: "700", marginTop: 8, textAlign: "center", color: COLORS.black },
    grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
    viewAll: { borderWidth: 2, borderColor: COLORS.black, paddingVertical: 14, marginTop: 8 },
    viewAllText: { textAlign: "center", fontWeight: "800", letterSpacing: 2, fontSize: 12, color: COLORS.black },
});
