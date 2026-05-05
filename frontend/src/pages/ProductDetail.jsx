import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { http } from "../api";
import { useShop } from "../context/ShopContext";
import ProductCard from "../components/ProductCard";
import { Heart, Star, Truck, RotateCcw, ShieldCheck } from "lucide-react";

export default function ProductDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart, toggleWishlist, isWishlisted } = useShop();
    const [p, setP] = useState(null);
    const [size, setSize] = useState("");
    const [imgIdx, setImgIdx] = useState(0);
    const [related, setRelated] = useState([]);
    const [zoom, setZoom] = useState(false);

    useEffect(() => {
        window.scrollTo(0, 0);
        http.get(`/products/${id}`).then(r => setP(r.data));
    }, [id]);

    useEffect(() => {
        if (!p) return;
        http.get("/products", { params: { category: p.category, limit: 8 } })
            .then(r => setRelated(r.data.filter(x => x.id !== p.id).slice(0, 4)));
    }, [p]);

    if (!p) return <div className="max-w-7xl mx-auto px-4 py-20 text-center text-gray-500">Loading…</div>;

    const images = [p.image, p.hover_image].filter(Boolean);
    const discount = Math.round(((p.original_price - p.price) / p.original_price) * 100);
    const wished = isWishlisted(p.id);

    const buyNow = () => {
        if (!size) return;
        addToCart(p, size, 1);
        navigate("/checkout");
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div>
                    <div
                        className="aspect-[3/4] bg-gray-50 relative overflow-hidden cursor-zoom-in"
                        onClick={() => setZoom((v) => !v)}
                        data-testid="product-main-image"
                    >
                        <img
                            src={images[imgIdx]}
                            alt={p.name}
                            className="w-full h-full object-cover transition-transform duration-500"
                            style={{ transform: zoom ? "scale(1.8)" : "scale(1)" }}
                        />
                    </div>
                    <div className="flex gap-3 mt-4">
                        {images.map((src, i) => (
                            <button
                                key={i}
                                onClick={() => setImgIdx(i)}
                                className={`w-20 h-24 bg-gray-50 overflow-hidden ${imgIdx === i ? "ring-2 ring-black" : "ring-1 ring-gray-200"}`}
                                data-testid={`product-thumb-${i}`}
                            >
                                <img src={src} alt="" className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <p className="text-xs font-bold uppercase tracking-widest sv-accent-text">{p.category}</p>
                    <h1 className="text-3xl sm:text-4xl font-black mt-2" style={{ fontFamily: "Outfit, sans-serif" }} data-testid="product-title">
                        {p.name}
                    </h1>
                    <div className="flex items-center gap-2 mt-3 text-sm">
                        <div className="flex items-center gap-1 bg-green-600 text-white px-2 py-0.5 rounded-sm text-xs font-bold">
                            <Star className="w-3 h-3 fill-white" /> {p.rating}
                        </div>
                        <span className="text-gray-500">{p.reviews} reviews</span>
                    </div>

                    <div className="flex items-center gap-3 mt-5">
                        <span className="text-3xl font-black" data-testid="product-price">₹{p.price}</span>
                        {p.original_price > p.price && (
                            <>
                                <span className="text-lg text-gray-400 line-through">₹{p.original_price}</span>
                                <span className="sv-accent-text font-bold">{discount}% OFF</span>
                            </>
                        )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Inclusive of all taxes</p>

                    <div className="mt-8">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-xs font-bold uppercase tracking-widest">Select Size</h3>
                            <button className="text-xs text-gray-500 underline">Size Guide</button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {p.sizes.map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setSize(s)}
                                    className={`w-14 h-12 border text-sm font-semibold ${size === s ? "bg-black text-white border-black" : "border-gray-300 hover:border-black"}`}
                                    data-testid={`size-${s}`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mt-8 grid grid-cols-2 gap-3">
                        <button
                            disabled={!size}
                            onClick={() => addToCart(p, size, 1)}
                            className="py-4 border-2 border-black font-bold uppercase tracking-widest text-sm hover:bg-black hover:text-white transition-colors disabled:opacity-50"
                            data-testid="add-to-cart-btn"
                        >
                            Add to Cart
                        </button>
                        <button
                            disabled={!size}
                            onClick={buyNow}
                            className="py-4 sv-accent-bg text-white font-bold uppercase tracking-widest text-sm hover:bg-black transition-colors disabled:opacity-50"
                            data-testid="buy-now-btn"
                        >
                            Buy Now
                        </button>
                    </div>
                    <button
                        onClick={() => toggleWishlist(p)}
                        className="mt-4 w-full py-3 border border-gray-300 inline-flex items-center justify-center gap-2 text-sm font-semibold hover:border-black"
                        data-testid="wishlist-btn"
                    >
                        <Heart className={`w-4 h-4 ${wished ? "fill-[#FF3F6C] text-[#FF3F6C]" : ""}`} />
                        {wished ? "Wishlisted" : "Add to Wishlist"}
                    </button>

                    <div className="mt-8 space-y-3 pt-6 border-t border-gray-200 text-sm text-gray-700">
                        <div className="flex items-center gap-3"><Truck className="w-5 h-5 sv-accent-text" /> Free shipping on orders over ₹999</div>
                        <div className="flex items-center gap-3"><RotateCcw className="w-5 h-5 sv-accent-text" /> 7-day easy returns, no questions asked</div>
                        <div className="flex items-center gap-3"><ShieldCheck className="w-5 h-5 sv-accent-text" /> 100% secure payments with Razorpay</div>
                    </div>

                    <div className="mt-10">
                        <h3 className="text-sm font-bold uppercase tracking-widest mb-3">Description</h3>
                        <p className="text-sm text-gray-700 leading-relaxed">{p.description}</p>
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-200">
                        <h3 className="text-sm font-bold uppercase tracking-widest mb-4">Customer Reviews</h3>
                        <div className="space-y-4">
                            {[{ n: "Rahul K.", r: 5, t: "Fit is perfect, fabric quality exceeded my expectations. Ordering more." },
                              { n: "Priya M.", r: 4, t: "Good material. Size M fit true to chart. Would recommend." },
                              { n: "Aakash V.", r: 5, t: "Delivered in 3 days. Loving the drop-shoulder styling." }].map((rv, i) => (
                                <div key={i} className="p-4 bg-gray-50 rounded-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-sm">{rv.n}</span>
                                        <div className="flex">{[...Array(5)].map((_, j) => <Star key={j} className={`w-3 h-3 ${j < rv.r ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />)}</div>
                                    </div>
                                    <p className="text-sm text-gray-700 mt-2">{rv.t}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {related.length > 0 && (
                <div className="mt-20">
                    <h2 className="text-2xl sm:text-3xl font-black mb-6" style={{ fontFamily: "Outfit, sans-serif" }}>You may also like</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                        {related.map(r => <ProductCard key={r.id} product={r} />)}
                    </div>
                </div>
            )}
        </div>
    );
}
