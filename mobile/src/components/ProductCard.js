import { Image, Pressable, Text, View } from "react-native";
import { COLORS } from "../config";

export default function ProductCard({ product, onPress, style }) {
    const discount = product.original_price
        ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
        : 0;

    return (
        <Pressable
            onPress={onPress}
            style={[{ width: "48%", marginBottom: 16 }, style]}
            testID={`product-card-${product.id}`}
        >
            <View style={{ aspectRatio: 3 / 4, backgroundColor: COLORS.gray100, position: "relative" }}>
                <Image source={{ uri: product.image }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                {discount > 0 && (
                    <View style={{
                        position: "absolute", top: 8, left: 8,
                        backgroundColor: COLORS.accent, paddingHorizontal: 8, paddingVertical: 3,
                    }}>
                        <Text style={{ color: COLORS.white, fontSize: 10, fontWeight: "800" }}>{discount}% OFF</Text>
                    </View>
                )}
            </View>
            <Text numberOfLines={1} style={{ fontSize: 13, fontWeight: "600", marginTop: 8, color: COLORS.black }}>
                {product.name}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 }}>
                <Text style={{ fontSize: 14, fontWeight: "800", color: COLORS.black }}>₹{product.price}</Text>
                {product.original_price > product.price && (
                    <Text style={{ fontSize: 11, color: COLORS.gray500, textDecorationLine: "line-through" }}>
                        ₹{product.original_price}
                    </Text>
                )}
            </View>
        </Pressable>
    );
}
