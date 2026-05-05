import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

function AuthPanel({ mode }) {
    const navigate = useNavigate();
    const loc = useLocation();
    const { login, register } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [err, setErr] = useState("");
    const [busy, setBusy] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        setBusy(true); setErr("");
        const res = mode === "login"
            ? await login(email, password)
            : await register(name, email, password);
        setBusy(false);
        if (res.ok) {
            toast.success(mode === "login" ? "Welcome back!" : "Account created!");
            navigate(loc.state?.from || "/");
        } else {
            setErr(res.error);
        }
    };

    return (
        <div className="min-h-[70vh] flex items-center justify-center py-12 px-4">
            <div className="w-full max-w-md">
                <h1 className="text-4xl font-black mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>
                    {mode === "login" ? "Welcome back" : "Join StyleVibe"}
                </h1>
                <p className="text-sm text-gray-500 mb-8">
                    {mode === "login" ? "Sign in to continue your style journey" : "Create an account to start shopping"}
                </p>
                <form onSubmit={submit} className="space-y-4">
                    {mode === "register" && (
                        <div>
                            <label className="text-xs font-bold uppercase tracking-widest">Name</label>
                            <input
                                value={name} onChange={(e) => setName(e.target.value)} required
                                className="w-full mt-1 px-4 py-3 border border-gray-300 focus:border-black focus:outline-none"
                                data-testid="auth-name"
                            />
                        </div>
                    )}
                    <div>
                        <label className="text-xs font-bold uppercase tracking-widest">Email</label>
                        <input
                            type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                            className="w-full mt-1 px-4 py-3 border border-gray-300 focus:border-black focus:outline-none"
                            data-testid="auth-email"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold uppercase tracking-widest">Password</label>
                        <input
                            type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
                            className="w-full mt-1 px-4 py-3 border border-gray-300 focus:border-black focus:outline-none"
                            data-testid="auth-password"
                        />
                    </div>
                    {err && <div className="text-sm text-red-600" data-testid="auth-error">{err}</div>}
                    <button
                        type="submit" disabled={busy}
                        className="w-full sv-accent-bg text-white font-bold uppercase tracking-widest py-4 hover:bg-black transition-colors disabled:opacity-60"
                        data-testid="auth-submit"
                    >
                        {busy ? "Please wait…" : mode === "login" ? "Sign In" : "Create Account"}
                    </button>
                </form>
                <p className="text-sm text-center mt-6 text-gray-600">
                    {mode === "login" ? (
                        <>New to StyleVibe? <Link to="/register" className="font-bold text-black underline" data-testid="auth-switch">Create an account</Link></>
                    ) : (
                        <>Already have an account? <Link to="/login" className="font-bold text-black underline" data-testid="auth-switch">Sign in</Link></>
                    )}
                </p>
            </div>
        </div>
    );
}

export const Login = () => <AuthPanel mode="login" />;
export const Register = () => <AuthPanel mode="register" />;
export default Login;
