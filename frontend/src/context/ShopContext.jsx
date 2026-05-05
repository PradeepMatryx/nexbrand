import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { http } from "../api";
import { useAuth } from "./AuthContext";
import { toast } from "sonner";

const ShopContext = createContext(null);

const LS_CART = "sv_cart";
const LS_WL = "sv_wishlist";

export function ShopProvider({ children }) {
    const { user } = useAuth();
    const [cart, setCart] = useState([]); // [{product_id, size, qty, product}]
    const [wishlist, setWishlist] = useState([]); // [product]
    const [cartOpen, setCartOpen] = useState(false);

    const loadGuest = useCallback(async () => {
        const raw = JSON.parse(localStorage.getItem(LS_CART) || "[]");
        const wraw = JSON.parse(localStorage.getItem(LS_WL) || "[]");
        const ids = Array.from(new Set([...raw.map(i => i.product_id), ...wraw]));
        if (ids.length === 0) { setCart([]); setWishlist([]); return; }
        const products = await Promise.all(
            ids.map((id) => http.get(`/products/${id}`).then(r => r.data).catch(() => null))
        );
        const pmap = {};
        products.filter(Boolean).forEach(p => { pmap[p.id] = p; });
        setCart(raw.filter(i => pmap[i.product_id]).map(i => ({ ...i, product: pmap[i.product_id] })));
        setWishlist(wraw.map(id => pmap[id]).filter(Boolean));
    }, []);

    const refreshServer = useCallback(async () => {
        try {
            const [c, w] = await Promise.all([
                http.get("/cart").then(r => r.data),
                http.get("/wishlist").then(r => r.data),
            ]);
            setCart(c);
            setWishlist(w);
        } catch {}
    }, []);

    // Sync localStorage cart to server on login
    useEffect(() => {
        async function sync() {
            if (user) {
                const raw = JSON.parse(localStorage.getItem(LS_CART) || "[]");
                const wraw = JSON.parse(localStorage.getItem(LS_WL) || "[]");
                for (const it of raw) {
                    try { await http.post("/cart", it); } catch {}
                }
                for (const pid of wraw) {
                    try { await http.post("/wishlist", { product_id: pid }); } catch {}
                }
                localStorage.removeItem(LS_CART);
                localStorage.removeItem(LS_WL);
                refreshServer();
            } else {
                loadGuest();
            }
        }
        sync();
    }, [user, loadGuest, refreshServer]);

    const addToCart = async (product, size, qty = 1) => {
        if (!size) { toast.error("Please select a size"); return; }
        if (user) {
            const { data } = await http.post("/cart", { product_id: product.id, size, qty });
            setCart(data);
        } else {
            const raw = JSON.parse(localStorage.getItem(LS_CART) || "[]");
            const idx = raw.findIndex(i => i.product_id === product.id && i.size === size);
            if (idx >= 0) raw[idx].qty += qty;
            else raw.push({ product_id: product.id, size, qty });
            localStorage.setItem(LS_CART, JSON.stringify(raw));
            await loadGuest();
        }
        toast.success("Added to cart", { description: `${product.name} — Size ${size}` });
        setCartOpen(true);
    };

    const updateQty = async (product_id, size, qty) => {
        if (user) {
            const { data } = await http.put("/cart", { product_id, size, qty });
            setCart(data);
        } else {
            let raw = JSON.parse(localStorage.getItem(LS_CART) || "[]");
            if (qty <= 0) raw = raw.filter(i => !(i.product_id === product_id && i.size === size));
            else raw = raw.map(i => i.product_id === product_id && i.size === size ? { ...i, qty } : i);
            localStorage.setItem(LS_CART, JSON.stringify(raw));
            await loadGuest();
        }
    };

    const removeFromCart = async (product_id, size) => {
        if (user) {
            const { data } = await http.delete("/cart", { params: { product_id, size } });
            setCart(data);
        } else {
            const raw = JSON.parse(localStorage.getItem(LS_CART) || "[]")
                .filter(i => !(i.product_id === product_id && i.size === size));
            localStorage.setItem(LS_CART, JSON.stringify(raw));
            await loadGuest();
        }
    };

    const toggleWishlist = async (product) => {
        const has = wishlist.some(p => p.id === product.id);
        if (user) {
            if (has) {
                await http.delete(`/wishlist/${product.id}`);
                setWishlist(wishlist.filter(p => p.id !== product.id));
            } else {
                await http.post("/wishlist", { product_id: product.id });
                setWishlist([...wishlist, product]);
            }
        } else {
            let raw = JSON.parse(localStorage.getItem(LS_WL) || "[]");
            if (has) raw = raw.filter(id => id !== product.id);
            else raw = [...raw, product.id];
            localStorage.setItem(LS_WL, JSON.stringify(raw));
            await loadGuest();
        }
        toast.success(has ? "Removed from wishlist" : "Added to wishlist");
    };

    const clearCart = async () => {
        if (user) { await http.delete("/cart/all"); setCart([]); }
        else { localStorage.removeItem(LS_CART); setCart([]); }
    };

    const cartCount = cart.reduce((s, i) => s + i.qty, 0);
    const subtotal = cart.reduce((s, i) => s + (i.product?.price || 0) * i.qty, 0);
    const savings = cart.reduce((s, i) => s + ((i.product?.original_price || 0) - (i.product?.price || 0)) * i.qty, 0);

    return (
        <ShopContext.Provider value={{
            cart, wishlist, cartOpen, setCartOpen,
            addToCart, updateQty, removeFromCart, toggleWishlist, clearCart,
            cartCount, subtotal, savings,
            isWishlisted: (id) => wishlist.some(p => p.id === id),
        }}>
            {children}
        </ShopContext.Provider>
    );
}

export const useShop = () => useContext(ShopContext);
