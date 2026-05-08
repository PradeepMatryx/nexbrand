import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "./config";

export const http = axios.create({ baseURL: `${API_URL}/api` });

http.interceptors.request.use(async (cfg) => {
    const token = await AsyncStorage.getItem("nb_token");
    if (token) cfg.headers.Authorization = `Bearer ${token}`;
    return cfg;
});

export async function setToken(token) {
    if (token) await AsyncStorage.setItem("nb_token", token);
    else await AsyncStorage.removeItem("nb_token");
}

export function formatErr(e) {
    const d = e?.response?.data?.detail;
    if (!d) return e?.message || "Something went wrong";
    if (typeof d === "string") return d;
    if (Array.isArray(d)) return d.map((x) => x?.msg || JSON.stringify(x)).join(" ");
    return String(d);
}
