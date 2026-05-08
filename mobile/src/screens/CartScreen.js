import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useShop } from "../context/ShopContext";
import { useAuth } from "../context/AuthContext";
import { COLORS } from "../config";

export default function CartScreen({ navigation }) {
    const { cart, updateQty, removeFromCart, subtotal } = useShop();
    const { user } = useAuth();
    const shipping = subtotal >= 999 ? 0 : 49;
    const total = subtotal + shipping;

    if (cart.length === 0) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white, justifyContent: "center", alignItems: "center", padding: 40 }}>
                <Text style={{ fontSize: 18, fontWeight: "800", marginBottom: 8 }}>Your bag is empty</Text>
                <Text style={{ color: COLORS.gray500, textAlign: "center", marginBottom: 24 }}>
                    Find your next favourite fit.
                </Text>
                <TouchableOpacity
                    style={styles.shopBtn}
                    onPress={() => navigation.navigate("Home")}
                    testID="cart-empty-shop"
                >
                    <Text style={styles.shopBtnText}>START SHOPPING</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }} edges={["bottom"]}>
            <ScrollView contentContainerStyle={{ padding: 16 }}>
                {cart.map((item) => (
                    <View key={`${item.product_id}-${item.size}`} style={styles.row} testID={`cart-item-${item.product_id}`}>
                        <Image source={{ uri: item.product.image }} style={styles.thumb} />
                        <View style={{ flex: 1 }}>
                            <Text numberOfLines={2} style={{ fontSize: 13, fontWeight: "600" }}>{item.product.name}</Text>
                            <Text style={{ color: COLORS.gray500, fontSize: 11, marginTop: 2 }}>Size: {item.size}</Text>
                            <Text style={{ fontWeight: "800", marginTop: 6 }}>₹{item.product.price}</Text>
                            <View style={styles.qtyRow}>
                                <View style={styles.qtyBox}>
                                    <TouchableOpacity onPress={() => updateQty(item.product_id, item.size, item.qty - 1)} style={styles.qtyBtn} testID={`cart-dec-${item.product_id}`}>
                                        <Text style={styles.qtyBtnText}>−</Text>
                                    </TouchableOpacity>
                                    <Text style={styles.qtyVal}>{item.qty}</Text>
                                    <TouchableOpacity onPress={() => updateQty(item.product_id, item.size, item.qty + 1)} style={styles.qtyBtn} testID={`cart-inc-${item.product_id}`}>
                                        <Text style={styles.qtyBtnText}>+</Text>
                                    </TouchableOpacity>
                                </View>
                                <TouchableOpacity onPress={() => removeFromCart(item.product_id, item.size)} testID={`cart-rm-${item.product_id}`}>
                                    <Text style={{ color: "#dc2626", fontSize: 12, fontWeight: "700" }}>REMOVE</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                ))}
            </ScrollView>

            <View style={styles.summary}>
                <View style={styles.sumRow}><Text style={styles.sumLabel}>Subtotal</Text><Text style={styles.sumVal}>₹{subtotal}</Text></View>
                <View style={styles.sumRow}><Text style={styles.sumLabel}>Shipping</Text><Text style={[styles.sumVal, shipping === 0 && { color: COLORS.success }]}>{shipping === 0 ? "Free" : `₹${shipping}`}</Text></View>
                <View style={[styles.sumRow, { marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.gray200 }]}>
                    <Text style={[styles.sumLabel, { fontSize: 16, fontWeight: "800", color: COLORS.black }]}>Total</Text>
                    <Text style={[styles.sumVal, { fontSize: 18, fontWeight: "900" }]} testID="cart-total">₹{total}</Text>
                </View>

                <TouchableOpacity
                    style={styles.checkoutBtn}
                    testID="checkout-btn"
                    onPress={() => {
                        if (!user) navigation.navigate("Login");
                        else navigation.navigate("ProductList", { title: "Checkout coming soon" });
                    }}
                >
                    <Text style={styles.checkoutText}>{user ? "PROCEED TO CHECKOUT" : "SIGN IN TO CHECKOUT"}</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    row: { flexDirection: "row", gap: 12, paddingBottom: 16, marginBottom: 16, borderBottomWidth: 1, borderBottomColor: COLORS.gray200 },
    thumb: { width: 80, height: 100, backgroundColor: COLORS.gray100 },
    qtyRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 10 },
    qtyBox: { flexDirection: "row", borderWidth: 1, borderColor: COLORS.gray200 },
    qtyBtn: { width: 32, height: 32, justifyContent: "center", alignItems: "center" },
    qtyBtnText: { fontSize: 16, fontWeight: "700" },
    qtyVal: { width: 32, textAlign: "center", lineHeight: 32, fontWeight: "700" },
    summary: { borderTopWidth: 1, borderTopColor: COLORS.gray200, padding: 16 },
    sumRow: { flexDirection: "row", justifyContent: "space-between", marginVertical: 4 },
    sumLabel: { color: COLORS.gray500, fontSize: 14 },
    sumVal: { fontWeight: "700", color: COLORS.black, fontSize: 14 },
    checkoutBtn: { marginTop: 14, backgroundColor: COLORS.accent, paddingVertical: 16, alignItems: "center" },
    checkoutText: { color: COLORS.white, fontWeight: "800", letterSpacing: 1.5 },
    shopBtn: { backgroundColor: COLORS.accent, paddingHorizontal: 30, paddingVertical: 14 },
    shopBtnText: { color: COLORS.white, fontWeight: "800", letterSpacing: 1.5 },
});
