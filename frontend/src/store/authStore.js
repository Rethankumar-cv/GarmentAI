import { create } from 'zustand';
import api from '../services/api';

const useAuthStore = create((set) => ({
    user: null,
    role: null,
    isAuthenticated: false,
    isCheckingAuth: true,

    login: async (username, password) => {
        set({ loading: true, error: null });
        try {
            const response = await api.post('auth/login/', { username, password });
            const { tokens, user, role } = response.data;
            localStorage.setItem('access_token', tokens.access);
            localStorage.setItem('refresh_token', tokens.refresh);
            set({ user, role, isAuthenticated: true, loading: false });
            return role; // Return role to handle redirection in component
        } catch (error) {
            set({ error: error.response?.data?.error || 'Login failed', loading: false });
            throw error;
        }
    },

    register: async (userData) => {
        set({ loading: true, error: null });
        try {
            const response = await api.post('auth/register/', userData);
            const { tokens, user, role } = response.data;
            localStorage.setItem('access_token', tokens.access);
            localStorage.setItem('refresh_token', tokens.refresh);
            set({ user, role, isAuthenticated: true, loading: false });
            return role;
        } catch (error) {
            set({ error: error.response?.data?.error || 'Registration failed', loading: false });
            throw error;
        }
    },

    logout: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        set({ user: null, role: null, isAuthenticated: false });
    },

    checkAuth: async () => {
        set({ isCheckingAuth: true });
        const token = localStorage.getItem('access_token');
        if (token) {
            try {
                const response = await api.get('auth/me/');
                const { user, role } = response.data;
                set({ user, role, isAuthenticated: true });
            } catch (error) {
                console.error("Session restoration failed:", error);
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                set({ user: null, role: null, isAuthenticated: false });
            }
        }
        set({ isCheckingAuth: false });
    }
}));

export default useAuthStore;
