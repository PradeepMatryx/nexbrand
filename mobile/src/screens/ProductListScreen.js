import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { http } from "../api";
import { COLORS } from "../config";
import ProductCard from "../components/ProductCard";

const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

export default function ProductListScreen({ route, navigation }) {
    const { title = "Shop", category, gender, tag } = route.params || {};
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [size, setSize] = useState("");

    useEffect(() => {
        navigation.setOptions({ title });
    }, [title]);

    useEffect(() => {
        setLoading(true);
        const params = {};
        if (category && category !== "all") params.category = category;
        if (gender) params.gender = gender;
        if (tag) params.tag = tag;
        if (size) params.size = size;
        http.get("/products", { params })
            .then((r) => setProducts(r.data))
            .finally(() => setLoading(false));
    }, [category, gender, tag, size]);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }} edges={["bottom"]}>
            <View style={styles.filterBar}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12 }}>
                    {SIZES.map((s) => (
                        <TouchableOpacity
                            key={s}
                            onPress={() => setSize(size === s ? "" : s)}
                            style={[styles.sizeChip, size === s && styles.sizeChipActive]}
                            testID={`size-filter-${s}`}
                        >
                            <Text style={[styles.sizeChipText, size === s && { color: COLORS.white }]}>{s}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {loading ? (
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                    <ActivityIndicator size="large" color={COLORS.accent} />
                </View>
            ) : products.length === 0 ? (
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 40 }}>
                    <Text style={{ color: COLORS.gray500 }}>No products match these filters.</Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={{ padding: 16 }}>
                    <Text style={{ marginBottom: 12, color: COLORS.gray500, fontSize: 12 }}>{products.length} products</Text>
                    <View style={styles.grid}>
                        {products.map((p) => (
                            <ProductCard
                                key={p.id}
                                product={p}
                                onPress={() => navigation.navigate("ProductDetail", { id: p.id })}
                            />
                        ))}
                    </View>
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    filterBar: { borderBottomWidth: 1, borderBottomColor: COLORS.gray200, paddingVertical: 10 },
    sizeChip: {
        paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderColor: COLORS.gray200,
        marginRight: 8, borderRadius: 4, backgroundColor: COLORS.white,
    },
    sizeChipActive: { backgroundColor: COLORS.black, borderColor: COLORS.black },
    sizeChipText: { fontSize: 12, fontWeight: "700", color: COLORS.black },
    grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
});
