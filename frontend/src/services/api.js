import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: Attach Token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor: Handle Errors & Refresh Token

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Handle Network Errors (Server down / Connection refused)
        if (!error.response) {
            console.error("Network Error: Could not connect to server.");
            return Promise.reject(new Error("Cannot connect to server. Please ensure the backend is running."));
        }

        if (error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const refreshToken = localStorage.getItem('refresh_token');
                if (!refreshToken) throw new Error("No refresh token");

                const response = await axios.post('/api/auth/token/refresh/', {
                    refresh: refreshToken,
                });
                localStorage.setItem('access_token', response.data.access);
                api.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`;
                originalRequest.headers['Authorization'] = `Bearer ${response.data.access}`;
                return api(originalRequest);
            } catch (err) {
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
