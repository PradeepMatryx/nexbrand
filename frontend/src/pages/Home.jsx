import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { http } from "../api";
import ProductCard from "../components/ProductCard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { ArrowRight, Truck, RefreshCw, ShieldCheck, Tag } from "lucide-react";

const HERO_SLIDES = [
    {
        tag: "Season Drop",
        title: "BUY 2 GET 1 FREE",
        sub: "On all Oversized Tees & Hoodies. This week only.",
        cta: "Shop Combos",
        to: "/category/combos",
        image: "https://images.unsplash.com/photo-1604942926673-48ee8a893c34?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxOTB8MHwxfHNlYXJjaHwyfHxjYXN1YWwlMjBmYXNoaW9uJTIwY291cGxlJTIwd2hpdGUlMjBiYWNrZ3JvdW5kfGVufDB8fHx8MTc3Nzg5NjY3Nnww&ixlib=rb-4.1.0&q=85",
    },
    {
        tag: "New Arrivals",
        title: "FRESH OFF THE RACK",
        sub: "Brand new fits. Built for every vibe.",
        cta: "Shop New",
        to: "/shop?tag=new",
        image: "https://images.unsplash.com/photo-1648249664646-c58cd3954f00?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxOTB8MHwxfHNlYXJjaHw0fHxjYXN1YWwlMjBmYXNoaW9uJTIwY291cGxlJTIwd2hpdGUlMjBiYWNrZ3JvdW5kfGVufDB8fHx8MTc3Nzg5NjY3Nnww&ixlib=rb-4.1.0&q=85",
    },
    {
        tag: "Flat 50% Off",
        title: "DRESS THE DEAL",
        sub: "Bestsellers at half price. While stocks last.",
        cta: "Shop Offers",
        to: "/shop?tag=trending",
        image: "https://images.unsplash.com/photo-1697748403348-260ec3169d87?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxOTB8MHwxfHNlYXJjaHwzfHxjYXN1YWwlMjBmYXNoaW9uJTIwY291cGxlJTIwd2hpdGUlMjBiYWNrZ3JvdW5kfGVufDB8fHx8MTc3Nzg5NjY3Nnww&ixlib=rb-4.1.0&q=85",
    },
];

function Hero() {
    const [i, setI] = useState(0);
    useEffect(() => {
        const t = setInterval(() => setI((v) => (v + 1) % HERO_SLIDES.length), 5000);
        return () => clearInterval(t);
    }, []);
    const s = HERO_SLIDES[i];
    return (
        <section className="relative bg-gray-50 overflow-hidden" data-testid="hero-section">
            <div className="relative h-[70vh] sm:h-[80vh] min-h-[480px] max-h-[720px]">
                {HERO_SLIDES.map((slide, idx) => (
                    <div
                        key={idx}
                        className="absolute inset-0 transition-opacity duration-[1200ms] ease-out"
                        style={{ opacity: idx === i ? 1 : 0 }}
                    >
                        <img src={slide.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
                    </div>
                ))}
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
                    <div className="max-w-xl text-white fade-up" key={i}>
                        <span className="inline-block text-xs font-bold uppercase tracking-widest sv-accent-bg px-3 py-1 rounded-sm mb-5">
                            {s.tag}
                        </span>
                        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tighter leading-none" style={{ fontFamily: "Outfit, sans-serif" }}>
                            {s.title}
                        </h1>
                        <p className="mt-5 text-base sm:text-lg text-white/90 max-w-md">{s.sub}</p>
                        <Link
                            to={s.to}
                            className="mt-8 inline-flex items-center gap-2 bg-white text-black font-bold uppercase tracking-widest text-xs px-7 py-4 hover:sv-accent-bg hover:text-white transition-colors"
                            data-testid="hero-cta"
                        >
                            {s.cta} <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                    {HERO_SLIDES.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setI(idx)}
                            aria-label={`Slide ${idx + 1}`}
                            data-testid={`hero-dot-${idx}`}
                            className={`h-1 rounded-full transition-all ${idx === i ? "w-10 bg-white" : "w-5 bg-white/50"}`}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}

function BenefitsStrip() {
    const items = [
        { icon: Truck, label: "Free shipping over ₹999" },
        { icon: RefreshCw, label: "7-day easy returns" },
        { icon: ShieldCheck, label: "100% secure checkout" },
        { icon: Tag, label: "Flat 40% off on 1st order" },
    ];
    return (
        <div className="border-y border-gray-200 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 grid grid-cols-2 md:grid-cols-4 gap-4">
                {items.map((it, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                        <it.icon className="w-5 h-5 sv-accent-text flex-shrink-0" />
                        <span className="font-medium text-gray-800">{it.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function Categories({ categories }) {
    return (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20" data-testid="categories-section">
            <div className="flex items-end justify-between mb-8">
                <div>
                    <p className="text-xs font-bold uppercase tracking-widest sv-accent-text">Shop by Category</p>
                    <h2 className="text-3xl sm:text-4xl font-black text-black mt-2" style={{ fontFamily: "Outfit, sans-serif" }}>
                        Find your fit
                    </h2>
                </div>
                <Link to="/shop" className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold hover:sv-accent-text" data-testid="categories-view-all">
                    View all <ArrowRight className="w-4 h-4" />
                </Link>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 sm:gap-5">
                {categories.map((c) => (
                    <Link
                        key={c.slug}
                        to={`/category/${c.slug}`}
                        className="group text-center"
                        data-testid={`category-${c.slug}`}
                    >
                        <div className="aspect-square bg-gray-50 overflow-hidden mb-3">
                            <img src={c.image} alt={c.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                        </div>
                        <div className="text-xs sm:text-sm font-bold uppercase tracking-wider text-black group-hover:sv-accent-text transition-colors">
                            {c.name}
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}

function PromoStrip() {
    return (
        <section className="sv-accent-bg text-white py-3 overflow-hidden">
            <div className="marquee text-sm font-bold uppercase tracking-widest">
                {[...Array(8)].map((_, i) => (
                    <span key={i} className="inline-flex items-center gap-3">
                        BUY 2 GET 1 FREE <span className="opacity-60">·</span> FLAT 50% OFF ON COMBOS <span className="opacity-60">·</span> FREE SHIPPING ABOVE ₹999 <span className="opacity-60">·</span>
                    </span>
                ))}
            </div>
        </section>
    );
}

function FeaturedGrid({ title, subtitle, products, testid }) {
    return (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20" data-testid={testid}>
            <div className="flex items-end justify-between mb-8">
                <div>
                    <p className="text-xs font-bold uppercase tracking-widest sv-accent-text">{subtitle}</p>
                    <h2 className="text-3xl sm:text-4xl font-black text-black mt-2" style={{ fontFamily: "Outfit, sans-serif" }}>
                        {title}
                    </h2>
                </div>
                <Link to="/shop" className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold hover:sv-accent-text">
                    Shop all <ArrowRight className="w-4 h-4" />
                </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                {products.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
        </section>
    );
}

function BestSellers({ all }) {
    const men = all.filter(p => p.gender === "men").slice(0, 4);
    const women = all.filter(p => p.gender === "women").slice(0, 4);
    const combos = all.filter(p => p.category === "combos").slice(0, 4);
    return (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20" data-testid="best-sellers-section">
            <div className="text-center mb-10">
                <p className="text-xs font-bold uppercase tracking-widest sv-accent-text">Trending Now</p>
                <h2 className="text-3xl sm:text-5xl font-black text-black mt-2" style={{ fontFamily: "Outfit, sans-serif" }}>
                    Best Sellers
                </h2>
            </div>
            <Tabs defaultValue="men" className="w-full">
                <div className="flex justify-center mb-8">
                    <TabsList className="bg-gray-100">
                        <TabsTrigger value="men" data-testid="tab-men">Men</TabsTrigger>
                        <TabsTrigger value="women" data-testid="tab-women">Women</TabsTrigger>
                        <TabsTrigger value="combos" data-testid="tab-combos">Combos</TabsTrigger>
                    </TabsList>
                </div>
                <TabsContent value="men">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                        {men.map(p => <ProductCard key={p.id} product={p} />)}
                    </div>
                </TabsContent>
                <TabsContent value="women">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                        {women.map(p => <ProductCard key={p.id} product={p} />)}
                    </div>
                </TabsContent>
                <TabsContent value="combos">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                        {combos.map(p => <ProductCard key={p.id} product={p} />)}
                    </div>
                </TabsContent>
            </Tabs>
        </section>
    );
}

function ComboDeals({ combos }) {
    return (
        <section className="bg-gray-50 py-12 md:py-20" data-testid="combo-deals-section">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-10">
                    <p className="text-xs font-bold uppercase tracking-widest sv-accent-text">Combo Deals</p>
                    <h2 className="text-3xl sm:text-5xl font-black text-black mt-2" style={{ fontFamily: "Outfit, sans-serif" }}>
                        Save more, bundle up.
                    </h2>
                    <p className="text-gray-600 mt-3 max-w-xl mx-auto">Hand-picked bundles so good, you'll want every one. Real savings, no inflated MRPs.</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                    {combos.map(p => <ProductCard key={p.id} product={p} />)}
                </div>
            </div>
        </section>
    );
}

function EditorialBanner() {
    return (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
            <div className="relative overflow-hidden" style={{ aspectRatio: "21/9" }}>
                <img
                    src="https://images.unsplash.com/photo-1648249664646-c58cd3954f00?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxOTB8MHwxfHNlYXJjaHw0fHxjYXN1YWwlMjBmYXNoaW9uJTIwY291cGxlJTIwd2hpdGUlMjBiYWNrZ3JvdW5kfGVufDB8fHx8MTc3Nzg5NjY3Nnww&ixlib=rb-4.1.0&q=85"
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40" />
                <div className="relative h-full flex flex-col items-center justify-center text-center text-white px-4">
                    <p className="text-xs font-bold uppercase tracking-widest sv-accent-text">The Weekend Edit</p>
                    <h3 className="text-3xl sm:text-5xl font-black tracking-tight mt-3 max-w-2xl" style={{ fontFamily: "Outfit, sans-serif" }}>
                        Dress easy. Live loud.
                    </h3>
                    <Link
                        to="/shop"
                        className="mt-6 bg-white text-black font-bold uppercase tracking-widest text-xs px-7 py-4 hover:sv-accent-bg hover:text-white transition-colors"
                        data-testid="editorial-cta"
                    >
                        Explore the Edit
                    </Link>
                </div>
            </div>
        </section>
    );
}

export default function Home() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        http.get("/products").then(r => setProducts(r.data));
        http.get("/categories").then(r => setCategories(r.data));
    }, []);

    const featured = products.slice(0, 8);
    const combos = products.filter(p => p.category === "combos");

    return (
        <div>
            <Hero />
            <BenefitsStrip />
            <Categories categories={categories} />
            <PromoStrip />
            <FeaturedGrid title="Featured Drops" subtitle="Just In" products={featured} testid="featured-section" />
            <BestSellers all={products} />
            <ComboDeals combos={combos} />
            <EditorialBanner />
        </div>
    );
}
