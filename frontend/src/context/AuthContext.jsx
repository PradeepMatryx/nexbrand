import { createContext, useContext, useEffect, useState } from "react";
import { http, formatErr } from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        http.get("/auth/me")
            .then((r) => setUser(r.data))
            .catch(() => setUser(null))
            .finally(() => setReady(true));
    }, []);

    const login = async (email, password) => {
        try {
            const { data } = await http.post("/auth/login", { email, password });
            setUser({ id: data.id, email: data.email, name: data.name, role: data.role });
            return { ok: true };
        } catch (e) {
            return { ok: false, error: formatErr(e) };
        }
    };

    const register = async (name, email, password) => {
        try {
            const { data } = await http.post("/auth/register", { name, email, password });
            setUser({ id: data.id, email: data.email, name: data.name, role: data.role });
            return { ok: true };
        } catch (e) {
            return { ok: false, error: formatErr(e) };
        }
    };

    const logout = async () => {
        try { await http.post("/auth/logout"); } catch {}
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, ready, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
