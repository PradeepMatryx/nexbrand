import { Link } from "react-router-dom";
import { useShop } from "../context/ShopContext";
import ProductCard from "../components/ProductCard";
import { Heart } from "lucide-react";

export default function Wishlist() {
    const { wishlist } = useShop();
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-4xl font-black" style={{ fontFamily: "Outfit, sans-serif" }}>My Wishlist</h1>
            <p className="text-sm text-gray-500 mt-1 mb-8">{wishlist.length} items saved</p>
            {wishlist.length === 0 ? (
                <div className="py-20 text-center">
                    <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 mb-6">Your wishlist is empty. Start adding products you love.</p>
                    <Link to="/shop" className="sv-accent-bg text-white font-bold uppercase tracking-widest text-xs px-7 py-4 inline-block hover:bg-black" data-testid="wishlist-shop-link">
                        Shop Now
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6" data-testid="wishlist-grid">
                    {wishlist.map(p => <ProductCard key={p.id} product={p} />)}
                </div>
            )}
        </div>
    );
}
