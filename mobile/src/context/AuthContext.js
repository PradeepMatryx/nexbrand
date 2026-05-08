import { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { http, setToken, formatErr } from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        (async () => {
            const t = await AsyncStorage.getItem("nb_token");
            if (!t) { setReady(true); return; }
            try {
                const { data } = await http.get("/auth/me");
                setUser(data);
            } catch {
                await setToken(null);
            } finally {
                setReady(true);
            }
        })();
    }, []);

    const login = async (email, password) => {
        try {
            const { data } = await http.post("/auth/login", { email, password });
            await setToken(data.token);
            setUser({ id: data.id, email: data.email, name: data.name, role: data.role });
            return { ok: true };
        } catch (e) { return { ok: false, error: formatErr(e) }; }
    };

    const register = async (name, email, password) => {
        try {
            const { data } = await http.post("/auth/register", { name, email, password });
            await setToken(data.token);
            setUser({ id: data.id, email: data.email, name: data.name, role: data.role });
            return { ok: true };
        } catch (e) { return { ok: false, error: formatErr(e) }; }
    };

    const logout = async () => {
        await setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, ready, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
