import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

const Login = () => {
    const [searchParams] = useSearchParams();
    const roleParam = searchParams.get('role');
    const navigate = useNavigate();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const login = useAuthStore((state) => state.login);
    const loading = useAuthStore((state) => state.loading);
    const error = useAuthStore((state) => state.error);

    // If no role logic is handled in the component itself (optional redirect if missing)
    useEffect(() => {
        if (!roleParam) {
            // Default to customer or redirect to welcome?
            // For now, let's just default visual style to Customer
        }
    }, [roleParam]);

    const isOwner = roleParam === 'OWNER';

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const role = await login(username, password);
            if (role === 'OWNER') navigate('/owner/dashboard');
            else navigate('/customer/home');
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass p-8 rounded-2xl shadow-xl w-full max-w-md relative"
            >
                <Link to="/" className="absolute top-6 left-6 text-gray-400 hover:text-gray-600">
                    <ArrowLeft className="w-6 h-6" />
                </Link>

                <h2 className="text-3xl font-bold text-center mb-2 text-gray-900">
                    {isOwner ? 'Business Login' : 'Customer Login'}
                </h2>
                <p className="text-center text-gray-500 mb-6">
                    {isOwner ? 'Manage your boutique' : 'Welcome back, shopper!'}
                </p>

                {error && <div className="bg-red-100 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-3 rounded-lg font-semibold text-white shadow-md hover:shadow-lg transform active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed ${isOwner ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-pink-600 hover:bg-pink-700'
                            }`}
                    >
                        {loading ? (
                            <span className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Logging in...
                            </span>
                        ) : 'Sign In'}
                    </button>

                    <div className="mt-6 text-center">
                        <p className="text-gray-600 text-sm">Don't have an account?</p>
                        <button
                            type="button"
                            onClick={() => navigate(`/register?role=${roleParam || 'CUSTOMER'}`)}
                            className={`mt - 2 font - medium hover:underline transition - colors ${isOwner ? 'text-indigo-600' : 'text-pink-600'
                                } `}
                        >
                            Create {isOwner ? 'Business' : 'Customer'} Account
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default Login;
