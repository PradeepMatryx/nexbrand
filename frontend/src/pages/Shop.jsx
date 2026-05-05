import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useParams } from "react-router-dom";
import { http } from "../api";
import ProductCard from "../components/ProductCard";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "../components/ui/sheet";
import { SlidersHorizontal } from "lucide-react";

const CATEGORIES = [
    { slug: "all", name: "All" },
    { slug: "t-shirts", name: "T-Shirts" },
    { slug: "shirts", name: "Shirts" },
    { slug: "joggers", name: "Joggers" },
    { slug: "hoodies", name: "Hoodies" },
    { slug: "tops", name: "Women Tops" },
    { slug: "combos", name: "Combos" },
];
const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const PRICE_RANGES = [
    { label: "Under ₹500", min: 0, max: 499 },
    { label: "₹500 - ₹999", min: 500, max: 999 },
    { label: "₹1000 - ₹1499", min: 1000, max: 1499 },
    { label: "₹1500+", min: 1500, max: 99999 },
];

function Filters({ category, setCategory, size, setSize, priceIdx, setPriceIdx }) {
    return (
        <div className="space-y-8 text-sm">
            <div>
                <h3 className="text-xs font-bold uppercase tracking-widest mb-3">Category</h3>
                <div className="space-y-2">
                    {CATEGORIES.map((c) => (
                        <label key={c.slug} className="flex items-center gap-2 cursor-pointer" data-testid={`filter-cat-${c.slug}`}>
                            <input
                                type="radio"
                                name="category"
                                checked={category === c.slug}
                                onChange={() => setCategory(c.slug)}
                                className="accent-[#FF3F6C]"
                            />
                            <span>{c.name}</span>
                        </label>
                    ))}
                </div>
            </div>
            <div>
                <h3 className="text-xs font-bold uppercase tracking-widest mb-3">Size</h3>
                <div className="flex flex-wrap gap-2">
                    {SIZES.map((s) => (
                        <button
                            key={s}
                            onClick={() => setSize(size === s ? "" : s)}
                            className={`px-3 py-1.5 border text-xs font-semibold ${size === s ? "bg-black text-white border-black" : "border-gray-300 hover:border-black"}`}
                            data-testid={`filter-size-${s}`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>
            <div>
                <h3 className="text-xs font-bold uppercase tracking-widest mb-3">Price</h3>
                <div className="space-y-2">
                    {PRICE_RANGES.map((p, i) => (
                        <label key={i} className="flex items-center gap-2 cursor-pointer" data-testid={`filter-price-${i}`}>
                            <input
                                type="radio"
                                name="price"
                                checked={priceIdx === i}
                                onChange={() => setPriceIdx(i)}
                                className="accent-[#FF3F6C]"
                            />
                            <span>{p.label}</span>
                        </label>
                    ))}
                    <button onClick={() => setPriceIdx(-1)} className="text-xs text-gray-500 underline mt-2" data-testid="filter-price-clear">Clear price</button>
                </div>
            </div>
        </div>
    );
}

export default function Shop() {
    const { slug } = useParams();
    const [sp] = useSearchParams();
    const [products, setProducts] = useState([]);
    const [category, setCategory] = useState(slug || "all");
    const [size, setSize] = useState("");
    const [priceIdx, setPriceIdx] = useState(-1);
    const [loading, setLoading] = useState(true);

    const gender = sp.get("gender");
    const tag = sp.get("tag");
    const q = sp.get("q");

    useEffect(() => {
        setCategory(slug || "all");
    }, [slug]);

    useEffect(() => {
        setLoading(true);
        const params = {};
        if (category && category !== "all") params.category = category;
        if (gender) params.gender = gender;
        if (tag) params.tag = tag;
        if (q) params.q = q;
        if (size) params.size = size;
        if (priceIdx >= 0) {
            params.min_price = PRICE_RANGES[priceIdx].min;
            params.max_price = PRICE_RANGES[priceIdx].max;
        }
        http.get("/products", { params })
            .then(r => setProducts(r.data))
            .finally(() => setLoading(false));
    }, [category, gender, tag, q, size, priceIdx]);

    const title = useMemo(() => {
        if (q) return `Search: "${q}"`;
        if (tag === "new") return "New Arrivals";
        if (tag === "trending") return "Offers & Trending";
        if (gender === "men") return "Men's Collection";
        if (gender === "women") return "Women's Collection";
        if (slug) return CATEGORIES.find(c => c.slug === slug)?.name || "Shop";
        return "Shop All";
    }, [q, tag, gender, slug]);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
            <div className="flex items-end justify-between mb-8">
                <div>
                    <h1 className="text-3xl sm:text-5xl font-black" style={{ fontFamily: "Outfit, sans-serif" }} data-testid="shop-title">
                        {title}
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">{products.length} products</p>
                </div>
                <div className="lg:hidden">
                    <Sheet>
                        <SheetTrigger asChild>
                            <button className="inline-flex items-center gap-2 border border-black px-4 py-2 text-xs font-bold uppercase tracking-widest" data-testid="filters-mobile-trigger">
                                <SlidersHorizontal className="w-4 h-4" /> Filters
                            </button>
                        </SheetTrigger>
                        <SheetContent side="left" className="overflow-y-auto">
                            <SheetHeader><SheetTitle>Filters</SheetTitle></SheetHeader>
                            <div className="mt-6">
                                <Filters category={category} setCategory={setCategory} size={size} setSize={setSize} priceIdx={priceIdx} setPriceIdx={setPriceIdx} />
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-8">
                <aside className="hidden lg:block col-span-3">
                    <Filters category={category} setCategory={setCategory} size={size} setSize={setSize} priceIdx={priceIdx} setPriceIdx={setPriceIdx} />
                </aside>
                <div className="col-span-12 lg:col-span-9">
                    {loading ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="aspect-[3/4] bg-gray-100 animate-pulse" />
                            ))}
                        </div>
                    ) : products.length === 0 ? (
                        <div className="text-center py-20 text-gray-500">No products match these filters.</div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6" data-testid="shop-grid">
                            {products.map(p => <ProductCard key={p.id} product={p} />)}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
