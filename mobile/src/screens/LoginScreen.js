import { useState } from "react";
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { COLORS } from "../config";

export default function LoginScreen({ navigation }) {
    const { login, register } = useAuth();
    const [mode, setMode] = useState("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [busy, setBusy] = useState(false);

    const submit = async () => {
        setBusy(true);
        const res = mode === "login"
            ? await login(email.trim().toLowerCase(), password)
            : await register(name.trim(), email.trim().toLowerCase(), password);
        setBusy(false);
        if (res.ok) {
            navigation.goBack();
        } else {
            Alert.alert("Auth failed", res.error || "Try again");
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 40 }}>
                    <Image source={require("../../assets/logo.jpg")} style={{ width: 120, height: 40, alignSelf: "center", marginBottom: 32 }} resizeMode="contain" />
                    <Text style={styles.title}>{mode === "login" ? "Welcome back" : "Join Nexbrand"}</Text>
                    <Text style={styles.sub}>
                        {mode === "login" ? "Sign in to continue your style journey" : "Create an account to start shopping"}
                    </Text>

                    {mode === "register" && (
                        <View style={styles.field}>
                            <Text style={styles.label}>Name</Text>
                            <TextInput value={name} onChangeText={setName} style={styles.input} testID="auth-name" />
                        </View>
                    )}

                    <View style={styles.field}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            style={styles.input}
                            testID="auth-email"
                        />
                    </View>

                    <View style={styles.field}>
                        <Text style={styles.label}>Password</Text>
                        <TextInput value={password} onChangeText={setPassword} secureTextEntry style={styles.input} testID="auth-password" />
                    </View>

                    <TouchableOpacity style={styles.btn} onPress={submit} disabled={busy} testID="auth-submit">
                        <Text style={styles.btnText}>{busy ? "PLEASE WAIT…" : mode === "login" ? "SIGN IN" : "CREATE ACCOUNT"}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => setMode(mode === "login" ? "register" : "login")} style={{ marginTop: 18, alignItems: "center" }} testID="auth-switch">
                        <Text style={{ color: COLORS.gray500, fontSize: 13 }}>
                            {mode === "login" ? "New to Nexbrand? " : "Already have an account? "}
                            <Text style={{ color: COLORS.black, fontWeight: "700", textDecorationLine: "underline" }}>
                                {mode === "login" ? "Create an account" : "Sign in"}
                            </Text>
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    title: { fontSize: 28, fontWeight: "900", color: COLORS.black },
    sub: { color: COLORS.gray500, marginTop: 6, marginBottom: 24 },
    field: { marginBottom: 14 },
    label: { fontSize: 11, fontWeight: "800", letterSpacing: 1.5, marginBottom: 6, color: COLORS.black },
    input: { borderWidth: 1, borderColor: COLORS.gray200, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
    btn: { backgroundColor: COLORS.accent, paddingVertical: 16, alignItems: "center", marginTop: 8 },
    btnText: { color: COLORS.white, fontWeight: "800", letterSpacing: 1.5 },
});
