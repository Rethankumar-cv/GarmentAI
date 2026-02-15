import { create } from 'zustand';
import api from '../services/api';

const useCartStore = create((set, get) => ({
    cart: [],
    loading: false,
    error: null,

    fetchCart: async () => {
        set({ loading: true });
        try {
            const response = await api.get('cart/');
            set({ cart: response.data, loading: false });
        } catch (error) {
            console.error("Failed to fetch cart:", error);
            set({ error: "Failed to load cart", loading: false });
        }
    },

    addToCart: async (productId, quantity = 1) => {
        set({ loading: true });
        try {
            await api.post('cart/', { product: productId, quantity });
            // Refresh cart after adding
            await get().fetchCart();
            set({ loading: false });
            return { success: true };
        } catch (error) {
            console.error("Failed to add to cart:", error);
            const errorMessage = error.response?.data?.error || "Failed to add to cart";
            set({ error: errorMessage, loading: false });
            return { success: false, message: errorMessage };
        }
    },

    removeFromCart: async (cartId) => {
        try {
            await api.delete('cart/', { data: { cart_id: cartId } });
            set((state) => ({
                cart: state.cart.filter((item) => item.id !== cartId)
            }));
        } catch (error) {
            console.error("Failed to remove from cart:", error);
        }
    },

    checkout: async () => {
        set({ loading: true });
        try {
            await api.post('checkout/');
            set({ cart: [], loading: false });
            return true;
        } catch (error) {
            console.error("Checkout failed:", error);
            set({ error: error.response?.data?.error || "Checkout failed", loading: false });
            return false;
        }
    },

    clearCart: () => set({ cart: [] }),
}));

export default useCartStore;
