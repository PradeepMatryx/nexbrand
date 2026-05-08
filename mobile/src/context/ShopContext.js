import { createContext, useCallback, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { http } from "../api";
import { useAuth } from "./AuthContext";

const ShopContext = createContext(null);
const LS_CART = "nb_cart_guest";

export function ShopProvider({ children }) {
    const { user } = useAuth();
    const [cart, setCart] = useState([]);

    const refreshServer = useCallback(async () => {
        try {
            const { data } = await http.get("/cart");
            setCart(data);
        } catch {}
    }, []);

    const loadGuest = useCallback(async () => {
        const raw = JSON.parse((await AsyncStorage.getItem(LS_CART)) || "[]");
        if (raw.length === 0) { setCart([]); return; }
        const ids = Array.from(new Set(raw.map((i) => i.product_id)));
        const products = await Promise.all(
            ids.map((id) => http.get(`/products/${id}`).then((r) => r.data).catch(() => null)),
        );
        const pmap = {};
        products.filter(Boolean).forEach((p) => { pmap[p.id] = p; });
        setCart(raw.filter((i) => pmap[i.product_id]).map((i) => ({ ...i, product: pmap[i.product_id] })));
    }, []);

    useEffect(() => {
        if (user) {
            (async () => {
                const raw = JSON.parse((await AsyncStorage.getItem(LS_CART)) || "[]");
                for (const it of raw) { try { await http.post("/cart", it); } catch {} }
                await AsyncStorage.removeItem(LS_CART);
                refreshServer();
            })();
        } else {
            loadGuest();
        }
    }, [user, loadGuest, refreshServer]);

    const addToCart = async (product, size, qty = 1) => {
        if (user) {
            const { data } = await http.post("/cart", { product_id: product.id, size, qty });
            setCart(data);
        } else {
            const raw = JSON.parse((await AsyncStorage.getItem(LS_CART)) || "[]");
            const idx = raw.findIndex((i) => i.product_id === product.id && i.size === size);
            if (idx >= 0) raw[idx].qty += qty;
            else raw.push({ product_id: product.id, size, qty });
            await AsyncStorage.setItem(LS_CART, JSON.stringify(raw));
            await loadGuest();
        }
    };

    const updateQty = async (product_id, size, qty) => {
        if (user) {
            const { data } = await http.put("/cart", { product_id, size, qty });
            setCart(data);
        } else {
            let raw = JSON.parse((await AsyncStorage.getItem(LS_CART)) || "[]");
            if (qty <= 0) raw = raw.filter((i) => !(i.product_id === product_id && i.size === size));
            else raw = raw.map((i) => i.product_id === product_id && i.size === size ? { ...i, qty } : i);
            await AsyncStorage.setItem(LS_CART, JSON.stringify(raw));
            await loadGuest();
        }
    };

    const removeFromCart = async (product_id, size) => {
        if (user) {
            const { data } = await http.delete("/cart", { params: { product_id, size } });
            setCart(data);
        } else {
            const raw = JSON.parse((await AsyncStorage.getItem(LS_CART)) || "[]")
                .filter((i) => !(i.product_id === product_id && i.size === size));
            await AsyncStorage.setItem(LS_CART, JSON.stringify(raw));
            await loadGuest();
        }
    };

    const cartCount = cart.reduce((s, i) => s + i.qty, 0);
    const subtotal = cart.reduce((s, i) => s + (i.product?.price || 0) * i.qty, 0);

    return (
        <ShopContext.Provider value={{ cart, cartCount, subtotal, addToCart, updateQty, removeFromCart }}>
            {children}
        </ShopContext.Provider>
    );
}

export const useShop = () => useContext(ShopContext);
