import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useShop } from "../context/ShopContext";
import { useAuth } from "../context/AuthContext";
import { http, formatErr } from "../api";
import { toast } from "sonner";

export default function Checkout() {
    const { cart, subtotal, savings, clearCart } = useShop();
    const { user } = useAuth();
    const navigate = useNavigate();
    const shipping = subtotal >= 999 ? 0 : 49;
    const total = subtotal + shipping;

    const [address, setAddress] = useState({
        full_name: user?.name || "",
        phone: "",
        line1: "",
        line2: "",
        city: "",
        state: "",
        pincode: "",
    });
    const [payment, setPayment] = useState("razorpay");
    const [busy, setBusy] = useState(false);

    if (!user) {
        return (
            <div className="max-w-md mx-auto px-4 py-20 text-center">
                <h2 className="text-2xl font-black mb-4" style={{ fontFamily: "Outfit, sans-serif" }}>Sign in to checkout</h2>
                <Link to="/login" state={{ from: "/checkout" }} className="sv-accent-bg text-white font-bold uppercase tracking-widest text-xs px-7 py-4 inline-block">Sign In</Link>
            </div>
        );
    }
    if (cart.length === 0) {
        return (
            <div className="max-w-md mx-auto px-4 py-20 text-center">
                <h2 className="text-2xl font-black mb-4" style={{ fontFamily: "Outfit, sans-serif" }}>Your bag is empty</h2>
                <Link to="/shop" className="sv-accent-bg text-white font-bold uppercase tracking-widest text-xs px-7 py-4 inline-block">Shop Now</Link>
            </div>
        );
    }

    const onChange = (k, v) => setAddress((a) => ({ ...a, [k]: v }));

    const placeOrder = async (rzpIds = {}) => {
        try {
            const { data } = await http.post("/orders", {
                address,
                payment_method: payment,
                ...rzpIds,
            });
            await clearCart();
            toast.success("Order placed successfully!");
            navigate("/order-success", { state: { order: data } });
        } catch (e) {
            toast.error(formatErr(e));
        }
    };

    const submit = async (e) => {
        e.preventDefault();
        if (!address.full_name || !address.phone || !address.line1 || !address.city || !address.pincode) {
            toast.error("Please fill all required address fields");
            return;
        }
        setBusy(true);
        try {
            if (payment === "cod") {
                await placeOrder();
            } else {
                const { data: order } = await http.post("/payments/create-order", { amount: total * 100 });
                if (order.mock || !order.key_id) {
                    // MOCKED flow when Razorpay keys not set
                    toast.info("Demo mode: simulating payment success");
                    await placeOrder({
                        razorpay_order_id: order.id,
                        razorpay_payment_id: "pay_mock_" + Date.now(),
                    });
                } else {
                    const options = {
                        key: order.key_id,
                        amount: order.amount,
                        currency: "INR",
                        name: "Nexbrand",
                        description: `Order for ${cart.length} item(s)`,
                        order_id: order.id,
                        prefill: { name: address.full_name, email: user.email, contact: address.phone },
                        theme: { color: "#FF3F6C" },
                        handler: async (res) => {
                            await placeOrder({
                                razorpay_order_id: res.razorpay_order_id,
                                razorpay_payment_id: res.razorpay_payment_id,
                                razorpay_signature: res.razorpay_signature,
                            });
                        },
                        modal: { ondismiss: () => setBusy(false) },
                    };
                    // eslint-disable-next-line no-undef
                    const rzp = new window.Razorpay(options);
                    rzp.open();
                    return;
                }
            }
        } catch (e) {
            toast.error(formatErr(e));
        } finally {
            setBusy(false);
        }
    };

    const inputCls = "w-full px-4 py-3 border border-gray-300 focus:border-black focus:outline-none text-sm";

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-4xl font-black mb-8" style={{ fontFamily: "Outfit, sans-serif" }}>Checkout</h1>
            <form onSubmit={submit} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-8">
                    <section>
                        <h2 className="text-xs font-bold uppercase tracking-widest mb-4">Shipping Address</h2>
                        <div className="grid grid-cols-2 gap-3">
                            <input required placeholder="Full name *" value={address.full_name} onChange={(e) => onChange("full_name", e.target.value)} className={`${inputCls} col-span-2 md:col-span-1`} data-testid="addr-name" />
                            <input required placeholder="Phone *" value={address.phone} onChange={(e) => onChange("phone", e.target.value)} className={`${inputCls} col-span-2 md:col-span-1`} data-testid="addr-phone" />
                            <input required placeholder="Address line 1 *" value={address.line1} onChange={(e) => onChange("line1", e.target.value)} className={`${inputCls} col-span-2`} data-testid="addr-line1" />
                            <input placeholder="Address line 2 (optional)" value={address.line2} onChange={(e) => onChange("line2", e.target.value)} className={`${inputCls} col-span-2`} data-testid="addr-line2" />
                            <input required placeholder="City *" value={address.city} onChange={(e) => onChange("city", e.target.value)} className={inputCls} data-testid="addr-city" />
                            <input required placeholder="State *" value={address.state} onChange={(e) => onChange("state", e.target.value)} className={inputCls} data-testid="addr-state" />
                            <input required placeholder="Pincode *" value={address.pincode} onChange={(e) => onChange("pincode", e.target.value)} className={`${inputCls} col-span-2 md:col-span-1`} data-testid="addr-pincode" />
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xs font-bold uppercase tracking-widest mb-4">Payment Method</h2>
                        <div className="space-y-2">
                            {[
                                { id: "razorpay", label: "Razorpay — UPI / Cards / Wallets / Netbanking" },
                                { id: "cod", label: "Cash on Delivery" },
                            ].map((opt) => (
                                <label key={opt.id} className={`flex items-center gap-3 p-4 border cursor-pointer ${payment === opt.id ? "border-black bg-gray-50" : "border-gray-300"}`} data-testid={`pay-${opt.id}`}>
                                    <input type="radio" checked={payment === opt.id} onChange={() => setPayment(opt.id)} className="accent-[#FF3F6C]" />
                                    <span className="text-sm font-semibold">{opt.label}</span>
                                </label>
                            ))}
                        </div>
                    </section>
                </div>

                <aside className="lg:col-span-1">
                    <div className="border border-gray-200 p-6 sticky top-24">
                        <h3 className="text-xs font-bold uppercase tracking-widest mb-4">Order Summary</h3>
                        <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
                            {cart.map((i) => (
                                <div key={`${i.product_id}-${i.size}`} className="flex gap-3 text-sm">
                                    <img src={i.product.image} alt="" className="w-14 h-16 object-cover" />
                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold line-clamp-1">{i.product.name}</div>
                                        <div className="text-xs text-gray-500">Size {i.size} · Qty {i.qty}</div>
                                    </div>
                                    <div className="font-semibold">₹{i.product.price * i.qty}</div>
                                </div>
                            ))}
                        </div>
                        <div className="space-y-2 text-sm border-t border-gray-200 pt-4">
                            <div className="flex justify-between"><span className="text-gray-600">Subtotal</span><span>₹{subtotal}</span></div>
                            <div className="flex justify-between"><span className="text-gray-600">Shipping</span><span className={shipping === 0 ? "text-green-600" : ""}>{shipping === 0 ? "Free" : `₹${shipping}`}</span></div>
                            {savings > 0 && <div className="flex justify-between text-green-600 font-semibold"><span>You save</span><span>₹{savings}</span></div>}
                            <div className="flex justify-between text-lg font-black border-t border-gray-200 pt-3 mt-3"><span>Total</span><span data-testid="checkout-total">₹{total}</span></div>
                        </div>
                        <button type="submit" disabled={busy} className="mt-6 w-full sv-accent-bg text-white font-bold uppercase tracking-widest py-4 hover:bg-black transition-colors disabled:opacity-60" data-testid="place-order-btn">
                            {busy ? "Processing…" : "Place Order"}
                        </button>
                    </div>
                </aside>
            </form>
        </div>
    );
}
