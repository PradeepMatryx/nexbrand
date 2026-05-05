import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, Search, ShoppingBag, User, Menu, X } from "lucide-react";
import { useShop } from "../context/ShopContext";
import { useAuth } from "../context/AuthContext";
import { http } from "../api";

const NAV = [
    { label: "Men", to: "/shop?gender=men" },
    { label: "Women", to: "/shop?gender=women" },
    { label: "Combos", to: "/category/combos" },
    { label: "New Arrivals", to: "/shop?tag=new" },
    { label: "Offers", to: "/shop?tag=trending" },
];

export default function Header() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { cartCount, setCartOpen } = useShop();
    const [searchOpen, setSearchOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [mobileOpen, setMobileOpen] = useState(false);
    const debounce = useRef(null);

    useEffect(() => {
        if (!query.trim()) { setResults([]); return; }
        clearTimeout(debounce.current);
        debounce.current = setTimeout(async () => {
            try {
                const { data } = await http.get("/products", { params: { q: query, limit: 6 } });
                setResults(data);
            } catch {}
        }, 200);
    }, [query]);

    return (
        <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-gray-200">
            <div className="bg-black text-white text-center text-xs py-2 tracking-widest uppercase">
                Free shipping on orders over ₹999 · Buy 2 Get 1 Free on Combos
            </div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
                <div className="flex items-center gap-3">
                    <button
                        className="md:hidden text-black"
                        onClick={() => setMobileOpen(true)}
                        data-testid="mobile-menu-open"
                        aria-label="Open menu"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                    <Link to="/" className="font-black text-2xl tracking-tighter" data-testid="logo-link" style={{ fontFamily: "Outfit, sans-serif" }}>
                        style<span className="sv-accent-text">vibe</span>.
                    </Link>
                </div>

                <nav className="hidden md:flex items-center gap-8 text-[13px] font-semibold uppercase tracking-wider">
                    {NAV.map((n) => (
                        <Link
                            key={n.label}
                            to={n.to}
                            className="relative text-black hover:sv-accent-text transition-colors py-2"
                            data-testid={`nav-${n.label.toLowerCase().replace(/\s+/g, "-")}`}
                        >
                            {n.label}
                        </Link>
                    ))}
                </nav>

                <div className="flex items-center gap-3 sm:gap-5 text-black">
                    <button
                        className="hover:sv-accent-text transition-colors"
                        onClick={() => setSearchOpen((v) => !v)}
                        data-testid="search-toggle"
                        aria-label="Search"
                    >
                        <Search className="w-5 h-5" />
                    </button>
                    {user ? (
                        <div className="relative group">
                            <button className="hover:sv-accent-text transition-colors flex items-center gap-1" data-testid="account-button">
                                <User className="w-5 h-5" />
                                <span className="hidden lg:block text-xs font-semibold">{user.name.split(" ")[0]}</span>
                            </button>
                            <div className="absolute right-0 top-full pt-2 hidden group-hover:block">
                                <div className="bg-white border border-gray-200 rounded shadow-lg w-48 py-1">
                                    <Link to="/wishlist" className="block px-4 py-2 text-sm hover:bg-gray-50" data-testid="menu-wishlist">My Wishlist</Link>
                                    <Link to="/orders" className="block px-4 py-2 text-sm hover:bg-gray-50" data-testid="menu-orders">My Orders</Link>
                                    <button onClick={logout} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-red-600" data-testid="menu-logout">Logout</button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <Link to="/login" className="hover:sv-accent-text transition-colors" data-testid="login-link" aria-label="Login">
                            <User className="w-5 h-5" />
                        </Link>
                    )}
                    <Link to="/wishlist" className="hover:sv-accent-text transition-colors hidden sm:inline-flex" data-testid="wishlist-link" aria-label="Wishlist">
                        <Heart className="w-5 h-5" />
                    </Link>
                    <button
                        onClick={() => setCartOpen(true)}
                        className="relative hover:sv-accent-text transition-colors"
                        data-testid="cart-button"
                        aria-label="Open cart"
                    >
                        <ShoppingBag className="w-5 h-5" />
                        {cartCount > 0 && (
                            <span className="absolute -top-2 -right-2 sv-accent-bg text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center" data-testid="cart-count">
                                {cartCount}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {searchOpen && (
                <div className="border-t border-gray-200 bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        <div className="relative">
                            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                autoFocus
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && query.trim()) {
                                        navigate(`/shop?q=${encodeURIComponent(query)}`);
                                        setSearchOpen(false);
                                    }
                                }}
                                placeholder="Search for t-shirts, hoodies, joggers…"
                                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-sm focus:outline-none focus:border-black text-base"
                                data-testid="search-input"
                            />
                        </div>
                        {results.length > 0 && (
                            <div className="mt-3 bg-white border border-gray-200 rounded-sm divide-y max-h-96 overflow-y-auto" data-testid="search-results">
                                {results.map((p) => (
                                    <Link
                                        key={p.id}
                                        to={`/product/${p.id}`}
                                        onClick={() => setSearchOpen(false)}
                                        className="flex items-center gap-4 p-3 hover:bg-gray-50"
                                        data-testid={`search-result-${p.id}`}
                                    >
                                        <img src={p.image} alt={p.name} className="w-12 h-14 object-cover" />
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-semibold truncate">{p.name}</div>
                                            <div className="text-xs text-gray-500 uppercase">{p.category}</div>
                                        </div>
                                        <div className="text-sm font-bold">₹{p.price}</div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {mobileOpen && (
                <div className="fixed inset-0 z-50 md:hidden bg-white">
                    <div className="h-16 px-4 flex items-center justify-between border-b border-gray-200">
                        <span className="font-black text-2xl tracking-tighter" style={{ fontFamily: "Outfit, sans-serif" }}>
                            style<span className="sv-accent-text">vibe</span>.
                        </span>
                        <button onClick={() => setMobileOpen(false)} data-testid="mobile-menu-close">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                    <nav className="p-6 flex flex-col gap-5 text-lg font-semibold uppercase tracking-wider">
                        {NAV.map((n) => (
                            <Link key={n.label} to={n.to} onClick={() => setMobileOpen(false)} data-testid={`mobile-nav-${n.label.toLowerCase().replace(/\s+/g, "-")}`}>
                                {n.label}
                            </Link>
                        ))}
                        <div className="h-px bg-gray-200 my-2" />
                        {user ? (
                            <>
                                <Link to="/wishlist" onClick={() => setMobileOpen(false)}>Wishlist</Link>
                                <button onClick={() => { logout(); setMobileOpen(false); }} className="text-left text-red-600">Logout</button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" onClick={() => setMobileOpen(false)}>Login</Link>
                                <Link to="/register" onClick={() => setMobileOpen(false)}>Sign Up</Link>
                            </>
                        )}
                    </nav>
                </div>
            )}
        </header>
    );
}
