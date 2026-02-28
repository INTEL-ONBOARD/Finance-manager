import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
    id: string;
    name: string;
    email: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    logout: () => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const savedUser = localStorage.getItem('finmate-auth-user');
        if (savedUser) {
            try {
                setUser(JSON.parse(savedUser));
            } catch {
                localStorage.removeItem('finmate-auth-user');
            }
        }
        setLoading(false);
    }, []);

    const login = async (email: string, password: string) => {
        const result = await window.electron!.auth.login(email, password);
        if (!result.ok) throw new Error(result.error ?? 'Login failed');
        const u = result.user!;
        setUser(u);
        localStorage.setItem('finmate-auth-user', JSON.stringify(u));
    };

    const register = async (name: string, email: string, password: string) => {
        const result = await window.electron!.auth.register(name, email, password);
        if (!result.ok) throw new Error(result.error ?? 'Registration failed');
        const u = result.user!;
        setUser(u);
        localStorage.setItem('finmate-auth-user', JSON.stringify(u));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('finmate-auth-user');
    };

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated: !!user,
            login,
            register,
            logout,
            loading
        }}>
            {children}
        </AuthContext.Provider>
    );
}
