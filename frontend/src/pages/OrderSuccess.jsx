import { Link, useLocation } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";

export default function OrderSuccess() {
    const { state } = useLocation();
    const order = state?.order;
    return (
        <div className="max-w-2xl mx-auto px-4 py-20 text-center" data-testid="order-success">
            <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-6" />
            <h1 className="text-4xl font-black" style={{ fontFamily: "Outfit, sans-serif" }}>Order Placed!</h1>
            <p className="text-gray-600 mt-3">Thanks for shopping with StyleVibe. You'll get a confirmation shortly.</p>
            {order && (
                <div className="mt-8 border border-gray-200 p-6 text-left">
                    <div className="flex justify-between text-sm mb-2"><span className="text-gray-500">Order ID</span><span className="font-semibold">{order.id.slice(0, 12)}…</span></div>
                    <div className="flex justify-between text-sm mb-2"><span className="text-gray-500">Total</span><span className="font-bold">₹{order.total}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-gray-500">Payment</span><span className="font-semibold uppercase">{order.payment_method}</span></div>
                </div>
            )}
            <Link to="/" className="mt-8 inline-block sv-accent-bg text-white font-bold uppercase tracking-widest text-xs px-7 py-4 hover:bg-black transition-colors" data-testid="continue-shopping">
                Continue Shopping
            </Link>
        </div>
    );
}
