import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
    id: string;
    name: string;
    email: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    login: (email: string) => Promise<void>;
    register: (name: string, email: string) => Promise<void>;
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
        // Load persisted auth on mount
        const savedUser = localStorage.getItem('finmate-auth-user');
        if (savedUser) {
            try {
                setUser(JSON.parse(savedUser));
            } catch (e) {
                localStorage.removeItem('finmate-auth-user');
            }
        }
        setLoading(false);
    }, []);

    const login = async (email: string) => {
        // Mock login mechanism
        return new Promise<void>((resolve) => {
            setTimeout(() => {
                const mockUser: User = {
                    id: `u_${Date.now()}`,
                    name: email.split('@')[0],
                    email,
                };
                setUser(mockUser);
                localStorage.setItem('finmate-auth-user', JSON.stringify(mockUser));
                resolve();
            }, 800);
        });
    };

    const register = async (name: string, email: string) => {
        // Mock register mechanism
        return new Promise<void>((resolve) => {
            setTimeout(() => {
                const mockUser: User = {
                    id: `u_${Date.now()}`,
                    name,
                    email,
                };
                setUser(mockUser);
                localStorage.setItem('finmate-auth-user', JSON.stringify(mockUser));
                resolve();
            }, 800);
        });
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
