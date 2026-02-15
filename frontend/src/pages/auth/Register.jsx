import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

const Register = () => {
    const [searchParams] = useSearchParams();
    const roleParam = searchParams.get('role');
    const navigate = useNavigate();

    // Default role to Customer if param is missing, but prioritize param
    const effectiveRole = roleParam === 'OWNER' ? 'OWNER' : 'CUSTOMER';
    const isOwner = effectiveRole === 'OWNER';

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        role: effectiveRole,
        boutique_name: '',
        outlet_id: '',
        city: ''
    });

    // Update formData if role changes (e.g., initial load)
    useEffect(() => {
        setFormData(prev => ({ ...prev, role: effectiveRole }));
    }, [effectiveRole]);

    const register = useAuthStore((state) => state.register);
    const loading = useAuthStore((state) => state.loading);
    const error = useAuthStore((state) => state.error);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const role = await register(formData);
            if (role === 'OWNER') navigate('/owner/dashboard');
            else navigate('/customer/home');
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass max-w-md w-full space-y-8 p-8 rounded-2xl shadow-xl relative"
            >
                <Link to="/" className="absolute top-6 left-6 text-gray-400 hover:text-gray-600">
                    <ArrowLeft className="w-6 h-6" />
                </Link>

                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Create {isOwner ? 'Business' : 'Customer'} Account
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        {isOwner ? 'Setup your boutique profile' : 'Start your shopping journey'}
                    </p>
                </div>

                {error && <div className="bg-red-100 text-red-600 p-3 rounded-lg text-sm">{error}</div>}

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4 rounded-md">
                        {/* Role is hidden/fixed based on URL */}

                        <input
                            name="username"
                            type="text"
                            required
                            className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="Username"
                            value={formData.username}
                            onChange={handleChange}
                        />
                        <input
                            name="email"
                            type="email"
                            required
                            className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="Email address"
                            value={formData.email}
                            onChange={handleChange}
                        />
                        <input
                            name="password"
                            type="password"
                            required
                            className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="Password"
                            value={formData.password}
                            onChange={handleChange}
                        />

                        {isOwner && (
                            <div className="space-y-4 pt-4 border-t border-gray-100">
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Boutique Details</h3>
                                <input
                                    name="boutique_name"
                                    type="text"
                                    required
                                    className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                    placeholder="Boutique Name"
                                    value={formData.boutique_name}
                                    onChange={handleChange}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <input
                                        name="outlet_id"
                                        type="number"
                                        required
                                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                        placeholder="Outlet ID"
                                        value={formData.outlet_id}
                                        onChange={handleChange}
                                    />
                                    <input
                                        name="city"
                                        type="text"
                                        required
                                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                        placeholder="City"
                                        value={formData.city}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 transition-colors shadow-md hover:shadow-lg ${isOwner ? 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500' : 'bg-pink-600 hover:bg-pink-700 focus:ring-pink-500'
                                }`}
                        >
                            {loading ? 'Creating Account...' : `Register as ${isOwner ? 'Owner' : 'Customer'}`}
                        </button>
                    </div>

                    <div className="text-sm text-center">
                        <Link
                            to={`/login?role=${effectiveRole}`}
                            className={`font-medium hover:underline ${isOwner ? 'text-indigo-600' : 'text-pink-600'}`}
                        >
                            Already have an account? Sign in
                        </Link>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default Register;
