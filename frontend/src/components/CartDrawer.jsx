import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "./ui/sheet";
import { useShop } from "../context/ShopContext";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";

export default function CartDrawer() {
    const { cart, cartOpen, setCartOpen, updateQty, removeFromCart, subtotal, savings } = useShop();
    const navigate = useNavigate();

    const checkout = () => {
        setCartOpen(false);
        navigate("/checkout");
    };

    return (
        <Sheet open={cartOpen} onOpenChange={setCartOpen}>
            <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
                <SheetHeader className="px-6 py-5 border-b border-gray-200">
                    <SheetTitle className="flex items-center gap-2 text-lg" style={{ fontFamily: "Outfit, sans-serif" }}>
                        <ShoppingBag className="w-5 h-5" /> Your Bag ({cart.length})
                    </SheetTitle>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto px-6 py-4" data-testid="cart-items">
                    {cart.length === 0 ? (
                        <div className="text-center py-20">
                            <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">Your bag is empty</p>
                            <button
                                onClick={() => { setCartOpen(false); navigate("/shop"); }}
                                className="mt-6 sv-accent-bg text-white text-sm font-bold uppercase tracking-widest px-6 py-3 hover:bg-black transition-colors"
                                data-testid="cart-empty-shop"
                            >
                                Start Shopping
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            {cart.map((item) => (
                                <div key={`${item.product_id}-${item.size}`} className="flex gap-4" data-testid={`cart-item-${item.product_id}`}>
                                    <img src={item.product.image} alt={item.product.name} className="w-20 h-24 object-cover bg-gray-50" />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-semibold line-clamp-2">{item.product.name}</div>
                                        <div className="text-xs text-gray-500 mt-1">Size: {item.size}</div>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="text-sm font-bold">₹{item.product.price}</span>
                                            {item.product.original_price > item.product.price && (
                                                <span className="text-xs text-gray-400 line-through">₹{item.product.original_price}</span>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between mt-3">
                                            <div className="inline-flex items-center border border-gray-300">
                                                <button onClick={() => updateQty(item.product_id, item.size, item.qty - 1)} className="w-8 h-8 flex items-center justify-center hover:bg-gray-100" data-testid={`cart-decrease-${item.product_id}`}>
                                                    <Minus className="w-3 h-3" />
                                                </button>
                                                <span className="w-8 text-center text-sm font-semibold">{item.qty}</span>
                                                <button onClick={() => updateQty(item.product_id, item.size, item.qty + 1)} className="w-8 h-8 flex items-center justify-center hover:bg-gray-100" data-testid={`cart-increase-${item.product_id}`}>
                                                    <Plus className="w-3 h-3" />
                                                </button>
                                            </div>
                                            <button onClick={() => removeFromCart(item.product_id, item.size)} className="text-gray-400 hover:text-red-500" data-testid={`cart-remove-${item.product_id}`}>
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {cart.length > 0 && (
                    <div className="border-t border-gray-200 px-6 py-5 space-y-3">
                        {savings > 0 && (
                            <div className="text-xs text-green-600 font-semibold" data-testid="cart-savings">
                                You saved ₹{savings} on this order!
                            </div>
                        )}
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Subtotal</span>
                            <span className="font-semibold">₹{subtotal}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Shipping</span>
                            <span className="font-semibold text-green-600">{subtotal >= 999 ? "Free" : "₹49"}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold pt-3 border-t border-gray-200">
                            <span>Total</span>
                            <span data-testid="cart-total">₹{subtotal + (subtotal >= 999 ? 0 : 49)}</span>
                        </div>
                        <button
                            onClick={checkout}
                            className="w-full sv-accent-bg text-white font-bold uppercase tracking-widest py-4 hover:bg-black transition-colors"
                            data-testid="checkout-button"
                        >
                            Checkout
                        </button>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
