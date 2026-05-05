import { Instagram, Facebook, Twitter, Youtube } from "lucide-react";

export default function Footer() {
    return (
        <footer className="bg-black text-white mt-16" data-testid="footer">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-2 md:grid-cols-5 gap-8">
                <div className="col-span-2">
                    <div className="font-black text-3xl tracking-tighter mb-3" style={{ fontFamily: "Outfit, sans-serif" }}>
                        style<span className="sv-accent-text">vibe</span>.
                    </div>
                    <p className="text-sm text-white/70 leading-relaxed max-w-sm">
                        D2C fashion for the modern Indian wardrobe. Premium fabrics, conscious pricing, and drops that actually deliver.
                    </p>
                    <div className="flex items-center gap-4 mt-6">
                        <a href="#" className="hover:sv-accent-text" aria-label="Instagram"><Instagram className="w-5 h-5" /></a>
                        <a href="#" className="hover:sv-accent-text" aria-label="Facebook"><Facebook className="w-5 h-5" /></a>
                        <a href="#" className="hover:sv-accent-text" aria-label="Twitter"><Twitter className="w-5 h-5" /></a>
                        <a href="#" className="hover:sv-accent-text" aria-label="YouTube"><Youtube className="w-5 h-5" /></a>
                    </div>
                </div>
                <div>
                    <h4 className="text-sm font-semibold uppercase tracking-widest mb-4">Shop</h4>
                    <ul className="space-y-2 text-sm text-white/70">
                        <li><a href="/category/t-shirts" className="hover:text-white">T-Shirts</a></li>
                        <li><a href="/category/shirts" className="hover:text-white">Shirts</a></li>
                        <li><a href="/category/joggers" className="hover:text-white">Joggers</a></li>
                        <li><a href="/category/combos" className="hover:text-white">Combos</a></li>
                    </ul>
                </div>
                <div>
                    <h4 className="text-sm font-semibold uppercase tracking-widest mb-4">Help</h4>
                    <ul className="space-y-2 text-sm text-white/70">
                        <li><a href="#" className="hover:text-white">Contact Us</a></li>
                        <li><a href="#" className="hover:text-white">Returns</a></li>
                        <li><a href="#" className="hover:text-white">Shipping</a></li>
                        <li><a href="#" className="hover:text-white">Size Guide</a></li>
                    </ul>
                </div>
                <div>
                    <h4 className="text-sm font-semibold uppercase tracking-widest mb-4">Company</h4>
                    <ul className="space-y-2 text-sm text-white/70">
                        <li><a href="#" className="hover:text-white">About</a></li>
                        <li><a href="#" className="hover:text-white">Careers</a></li>
                        <li><a href="#" className="hover:text-white">Privacy</a></li>
                        <li><a href="#" className="hover:text-white">Terms</a></li>
                    </ul>
                </div>
            </div>
            <div className="border-t border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/60">
                    <p>© 2026 StyleVibe. All rights reserved.</p>
                    <div className="flex items-center gap-3 text-[11px] uppercase tracking-widest">
                        <span className="border border-white/20 px-2 py-1 rounded">UPI</span>
                        <span className="border border-white/20 px-2 py-1 rounded">Visa</span>
                        <span className="border border-white/20 px-2 py-1 rounded">Mastercard</span>
                        <span className="border border-white/20 px-2 py-1 rounded">Rupay</span>
                        <span className="border border-white/20 px-2 py-1 rounded">COD</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
