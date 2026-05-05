import { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, ShoppingBag, Star } from "lucide-react";
import { useShop } from "../context/ShopContext";

export default function ProductCard({ product }) {
    const { addToCart, toggleWishlist, isWishlisted } = useShop();
    const [quickSize, setQuickSize] = useState(false);
    const [selectedSize, setSelectedSize] = useState("");

    const discount = product.original_price
        ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
        : 0;
    const wished = isWishlisted(product.id);

    const onAdd = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!quickSize) { setQuickSize(true); return; }
        if (!selectedSize) return;
        addToCart(product, selectedSize, 1);
        setQuickSize(false);
        setSelectedSize("");
    };

    return (
        <Link to={`/product/${product.id}`} className="group block" data-testid={`product-card-${product.id}`}>
            <div className="product-card-img-wrap aspect-[3/4] bg-gray-50 relative">
                <img src={product.image} alt={product.name} className="product-card-img-primary" loading="lazy" />
                {product.hover_image && (
                    <img src={product.hover_image} alt="" className="product-card-img-secondary" loading="lazy" />
                )}
                {discount > 0 && (
                    <div className="absolute top-3 left-3 sv-accent-bg text-white text-[11px] font-bold px-2 py-1 rounded-sm tracking-wide" data-testid="discount-badge">
                        {discount}% OFF
                    </div>
                )}
                {product.badge && (
                    <div className="absolute top-3 right-12 bg-black text-white text-[10px] font-bold uppercase px-2 py-1 rounded-sm tracking-wider">
                        {product.badge}
                    </div>
                )}
                <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWishlist(product); }}
                    className="absolute top-3 right-3 w-8 h-8 bg-white/95 backdrop-blur flex items-center justify-center rounded-full hover:sv-accent-bg hover:text-white transition-colors"
                    data-testid={`wishlist-toggle-${product.id}`}
                    aria-label="Wishlist"
                >
                    <Heart className={`w-4 h-4 ${wished ? "fill-[#FF3F6C] text-[#FF3F6C]" : ""}`} />
                </button>

                {/* Quick add overlay */}
                <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-white/95 backdrop-blur border-t border-gray-200 p-3">
                    {!quickSize ? (
                        <button
                            onClick={onAdd}
                            className="w-full bg-black text-white text-xs font-bold uppercase tracking-widest py-2.5 flex items-center justify-center gap-2 hover:sv-accent-bg transition-colors"
                            data-testid={`quick-add-${product.id}`}
                        >
                            <ShoppingBag className="w-4 h-4" /> Quick Add
                        </button>
                    ) : (
                        <div className="flex flex-wrap gap-1.5 justify-center">
                            {product.sizes.map((s) => (
                                <button
                                    key={s}
                                    onClick={(e) => {
                                        e.preventDefault(); e.stopPropagation();
                                        setSelectedSize(s);
                                        addToCart(product, s, 1);
                                        setQuickSize(false);
                                    }}
                                    className="text-xs font-semibold px-3 py-1.5 border border-gray-300 hover:border-black hover:bg-black hover:text-white transition"
                                    data-testid={`quick-size-${product.id}-${s}`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <div className="pt-3">
                <h3 className="text-sm font-semibold text-black line-clamp-1">{product.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-base font-bold text-black">₹{product.price}</span>
                    {product.original_price > product.price && (
                        <>
                            <span className="text-xs text-gray-400 line-through">₹{product.original_price}</span>
                            <span className="text-xs sv-accent-text font-semibold">{discount}% OFF</span>
                        </>
                    )}
                </div>
                {product.rating ? (
                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold text-black">{product.rating}</span>
                        <span>({product.reviews})</span>
                    </div>
                ) : null}
            </div>
        </Link>
    );
}
