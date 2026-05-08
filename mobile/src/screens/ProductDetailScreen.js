import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { http } from "../api";
import { COLORS } from "../config";
import { useShop } from "../context/ShopContext";

export default function ProductDetailScreen({ route, navigation }) {
    const { id } = route.params;
    const { addToCart } = useShop();
    const [p, setP] = useState(null);
    const [size, setSize] = useState("");

    useEffect(() => {
        http.get(`/products/${id}`).then((r) => setP(r.data));
    }, [id]);

    if (!p) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator size="large" color={COLORS.accent} />
            </View>
        );
    }

    const discount = Math.round(((p.original_price - p.price) / p.original_price) * 100);

    const onAdd = async () => {
        if (!size) { Alert.alert("Select a size", "Please choose a size before adding to cart."); return; }
        await addToCart(p, size, 1);
        Alert.alert("Added to cart", `${p.name} — Size ${size}`);
    };

    const onBuy = async () => {
        if (!size) { Alert.alert("Select a size"); return; }
        await addToCart(p, size, 1);
        navigation.navigate("Cart");
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }} edges={["bottom"]}>
            <ScrollView>
                <Image source={{ uri: p.image }} style={styles.img} resizeMode="cover" />
                <View style={{ padding: 16 }}>
                    <Text style={styles.cat}>{p.category?.toUpperCase()}</Text>
                    <Text style={styles.name}>{p.name}</Text>

                    <View style={styles.priceRow}>
                        <Text style={styles.price}>₹{p.price}</Text>
                        {p.original_price > p.price && (
                            <>
                                <Text style={styles.priceOld}>₹{p.original_price}</Text>
                                <Text style={styles.priceOff}>{discount}% OFF</Text>
                            </>
                        )}
                    </View>

                    <Text style={[styles.label, { marginTop: 24 }]}>SELECT SIZE</Text>
                    <View style={styles.sizes}>
                        {p.sizes.map((s) => (
                            <TouchableOpacity
                                key={s}
                                onPress={() => setSize(s)}
                                style={[styles.sizeBox, size === s && styles.sizeBoxActive]}
                                testID={`size-${s}`}
                            >
                                <Text style={[styles.sizeText, size === s && { color: COLORS.white }]}>{s}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={[styles.label, { marginTop: 28 }]}>DESCRIPTION</Text>
                    <Text style={styles.desc}>{p.description}</Text>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.btnSecondary} onPress={onAdd} testID="add-to-cart">
                    <Text style={styles.btnSecondaryText}>ADD TO CART</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnPrimary} onPress={onBuy} testID="buy-now">
                    <Text style={styles.btnPrimaryText}>BUY NOW</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    img: { width: "100%", aspectRatio: 3 / 4, backgroundColor: COLORS.gray100 },
    cat: { fontSize: 11, fontWeight: "800", letterSpacing: 2, color: COLORS.accent },
    name: { fontSize: 24, fontWeight: "900", marginTop: 6, color: COLORS.black },
    priceRow: { flexDirection: "row", alignItems: "baseline", gap: 10, marginTop: 14 },
    price: { fontSize: 26, fontWeight: "900", color: COLORS.black },
    priceOld: { fontSize: 14, color: COLORS.gray500, textDecorationLine: "line-through" },
    priceOff: { fontSize: 14, fontWeight: "700", color: COLORS.accent },
    label: { fontSize: 11, fontWeight: "800", letterSpacing: 2, color: COLORS.black },
    sizes: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
    sizeBox: { width: 56, height: 48, borderWidth: 1, borderColor: COLORS.gray200, justifyContent: "center", alignItems: "center" },
    sizeBoxActive: { backgroundColor: COLORS.black, borderColor: COLORS.black },
    sizeText: { fontWeight: "700", color: COLORS.black },
    desc: { marginTop: 12, fontSize: 14, color: COLORS.gray800, lineHeight: 22 },
    footer: { flexDirection: "row", borderTopWidth: 1, borderTopColor: COLORS.gray200, padding: 12, gap: 10 },
    btnSecondary: { flex: 1, paddingVertical: 16, borderWidth: 2, borderColor: COLORS.black, alignItems: "center" },
    btnSecondaryText: { fontWeight: "800", letterSpacing: 1.5, color: COLORS.black },
    btnPrimary: { flex: 1, paddingVertical: 16, backgroundColor: COLORS.accent, alignItems: "center" },
    btnPrimaryText: { fontWeight: "800", letterSpacing: 1.5, color: COLORS.white },
});
