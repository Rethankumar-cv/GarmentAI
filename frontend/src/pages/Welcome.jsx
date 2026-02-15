import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, TrendingUp, ArrowRight, BarChart3, Database, ShieldCheck, Github, Twitter, Linkedin } from 'lucide-react';

const BackgroundElements = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl mix-blend-multiply animate-blob" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl mix-blend-multiply animate-blob animation-delay-2000" />
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl mix-blend-multiply animate-blob animation-delay-4000" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
    </div>
);

const Navbar = () => (
    <nav className="absolute top-0 w-full p-6 flex justify-between items-center z-50 max-w-7xl mx-auto left-0 right-0">
        <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-lg flex items-center justify-center text-white font-bold">G</div>
            <span className="font-bold text-gray-900 tracking-tight text-lg">Garment<span className="text-indigo-600">Insights</span></span>
        </Link>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-500">
            <Link to="/solutions" className="hover:text-indigo-600 transition-colors">Solutions</Link>
            <Link to="/case-studies" className="hover:text-indigo-600 transition-colors">Case Studies</Link>
            <Link to="/pricing" className="hover:text-indigo-600 transition-colors">Pricing</Link>
            <Link to="/admin/login" className="hover:text-indigo-600 transition-colors font-semibold">Admin</Link>
        </div>
    </nav>
);

const StatBadge = ({ icon: Icon, label, value }) => (
    <div className="flex items-center gap-3 bg-white/60 backdrop-blur-sm border border-gray-100 px-4 py-3 rounded-2xl shadow-sm">
        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <Icon className="w-4 h-4" />
        </div>
        <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{label}</p>
            <p className="text-sm font-bold text-gray-900">{value}</p>
        </div>
    </div>
);

const Footer = () => (
    <footer className="w-full bg-white border-t border-gray-100 py-12 px-6 mt-20 relative z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="space-y-4">
                <span className="font-bold text-gray-900 text-lg">Garment<span className="text-indigo-600">Insights</span></span>
                <p className="text-gray-500 text-sm leading-relaxed">
                    Example SaaS platform for fashion retail intelligence. Empowering boutiques with AI-driven predictions.
                </p>
                <div className="flex gap-4">
                    <Twitter className="w-5 h-5 text-gray-400 hover:text-indigo-600 cursor-pointer transition-colors" />
                    <Github className="w-5 h-5 text-gray-400 hover:text-indigo-600 cursor-pointer transition-colors" />
                    <Linkedin className="w-5 h-5 text-gray-400 hover:text-indigo-600 cursor-pointer transition-colors" />
                </div>
            </div>

            <div>
                <h4 className="font-bold text-gray-900 mb-4">Product</h4>
                <ul className="space-y-2 text-sm text-gray-500">
                    <li className="hover:text-indigo-600 cursor-pointer"><Link to="/features">Features</Link></li>
                    <li className="hover:text-indigo-600 cursor-pointer"><Link to="/integrations">Integrations</Link></li>
                    <li className="hover:text-indigo-600 cursor-pointer"><Link to="/enterprise">Enterprise</Link></li>
                    <li className="hover:text-indigo-600 cursor-pointer"><Link to="/security">Security</Link></li>
                </ul>
            </div>

            <div>
                <h4 className="font-bold text-gray-900 mb-4">Resources</h4>
                <ul className="space-y-2 text-sm text-gray-500">
                    <li className="hover:text-indigo-600 cursor-pointer"><Link to="/documentation">Documentation</Link></li>
                    <li className="hover:text-indigo-600 cursor-pointer"><Link to="/api-reference">API Reference</Link></li>
                    <li className="hover:text-indigo-600 cursor-pointer"><Link to="/blog">Blog</Link></li>
                    <li className="hover:text-indigo-600 cursor-pointer"><Link to="/community">Community</Link></li>
                </ul>
            </div>

            <div>
                <h4 className="font-bold text-gray-900 mb-4">Company</h4>
                <ul className="space-y-2 text-sm text-gray-500">
                    <li className="hover:text-indigo-600 cursor-pointer"><Link to="/about">About Us</Link></li>
                    <li className="hover:text-indigo-600 cursor-pointer"><Link to="/careers">Careers</Link></li>
                    <li className="hover:text-indigo-600 cursor-pointer"><Link to="/legal">Legal</Link></li>
                    <li className="hover:text-indigo-600 cursor-pointer"><Link to="/contact">Contact</Link></li>
                </ul>
            </div>
        </div>
        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">© 2024 GarmentInsights AI. All rights reserved.</p>
            <div className="flex gap-6 text-sm text-gray-500">
                <Link to="/privacy" className="hover:text-gray-900 cursor-pointer">Privacy Policy</Link>
                <Link to="/terms" className="hover:text-gray-900 cursor-pointer">Terms of Service</Link>
            </div>
        </div>
    </footer>
);

const Welcome = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen relative font-sans text-slate-800 overflow-x-hidden selection:bg-indigo-100 selection:text-indigo-900">
            <BackgroundElements />
            <Navbar />

            <div className="container mx-auto px-6 pt-32 pb-20 relative z-10 flex flex-col items-center">

                {/* Hero Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="text-center max-w-3xl mx-auto mb-20"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-bold tracking-wide uppercase mb-6"
                    >
                        <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
                        AI Powered Fashion Intelligence
                    </motion.div>

                    <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 leading-tight mb-6 tracking-tight">
                        Garment<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Insights</span> AI
                    </h1>

                    <p className="text-xl text-slate-500 leading-relaxed max-w-2xl mx-auto">
                        The intelligent platform bridging the gap between data-driven retail strategies and personalized shopping experiences.
                    </p>
                </motion.div>

                {/* Main Cards Section */}
                <div className="grid md:grid-cols-2 gap-8 max-w-5xl w-full">
                    {/* Customer Card */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                        className="group relative backdrop-blur-xl bg-white/60 border border-white/40 rounded-[2rem] p-8 md:p-10 shadow-xl hover:shadow-2xl hover:shadow-pink-500/10 transition-all duration-500 hover:-translate-y-1"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-transparent rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        <div className="relative z-10 flex flex-col h-full items-start text-left">
                            <div className="w-14 h-14 bg-pink-50 rounded-2xl flex items-center justify-center text-pink-600 mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-sm">
                                <ShoppingBag className="w-7 h-7" />
                            </div>

                            <h2 className="text-3xl font-bold text-slate-900 mb-3">For Shoppers</h2>
                            <p className="text-slate-500 mb-10 leading-relaxed">
                                Experience a curated marketplace. Discover trends tailored to your style and shop from top boutiques with confidence.
                            </p>

                            <button
                                onClick={() => navigate('/login?role=CUSTOMER')}
                                className="mt-auto w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all duration-300
                                border border-pink-200 bg-gradient-to-b from-white to-pink-50/50 text-pink-600 hover:border-pink-300 hover:shadow-lg hover:shadow-pink-100 group-hover:bg-white"
                            >
                                Shop Now <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                            </button>
                        </div>
                    </motion.div>

                    {/* Owner Card */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4, duration: 0.6 }}
                        className="group relative backdrop-blur-xl bg-white/80 border border-white/60 rounded-[2rem] p-8 md:p-10 shadow-xl hover:shadow-2xl hover:shadow-indigo-500/20 transition-all duration-500 hover:-translate-y-1"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        <div className="relative z-10 flex flex-col h-full items-start text-left">
                            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-6 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 shadow-sm">
                                <TrendingUp className="w-7 h-7" />
                            </div>

                            <h2 className="text-3xl font-bold text-slate-900 mb-3">For Business</h2>
                            <p className="text-slate-500 mb-10 leading-relaxed">
                                Transform your boutique with AI. Unlock demand forecasting, inventory optimization, and deep customer insights.
                            </p>

                            <button
                                onClick={() => navigate('/login?role=OWNER')}
                                className="mt-auto w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all duration-300
                                bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-200 hover:shadow-indigo-300 hover:scale-[1.01]"
                            >
                                Access Dashboard <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                            </button>
                        </div>
                    </motion.div>
                </div>

                {/* Trust Strip */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 w-full max-w-5xl"
                >
                    <StatBadge icon={BarChart3} label="Forecast Accuracy" value="92%" />
                    <StatBadge icon={Database} label="Data Points" value="Read-Time" />
                    <StatBadge icon={ShieldCheck} label="Secure" value="Enterprise Grade" />
                    <StatBadge icon={TrendingUp} label="Growth" value="Revenue Opt." />
                </motion.div>

            </div>

            <Footer />
        </div>
    );
};

export default Welcome;
