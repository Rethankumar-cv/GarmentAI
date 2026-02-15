import React, { useState } from 'react';
import api from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Line } from 'react-chartjs-2';
import { Settings, TrendingUp, AlertTriangle, DollarSign, Map, BarChart2, PieChart, List, Sparkles, ArrowRight, RotateCcw, Clock } from 'lucide-react';
import usePredictionStore from '../../store/predictionStore';
import { useNavigate } from 'react-router-dom';
import { PageHeader, DashboardCard, StatCard } from '../../components/common/OwnerComponents';

const Predictions = () => {
    const { predictionData, setPredictionData, formData, setFormData, lastRun, resetAll } = usePredictionStore();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ [e.target.name]: e.target.value });
    };

    const handleReset = () => {
        if (window.confirm("Start a new prediction? This will clear current results.")) {
            resetAll();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Convert strings to numbers for API
            const payload = {
                ...formData,
                item_weight: parseFloat(formData.item_weight) || 0,
                price: parseFloat(formData.price) || 0,
                outlet_id: parseInt(formData.outlet_id) || 1,
                outlet_established_year: parseInt(formData.outlet_established_year) || 2000,
                outlet_size: parseInt(formData.outlet_size) || 1,
                outlet_location_type: parseInt(formData.outlet_location_type) || 1,
                outlet_type: parseInt(formData.outlet_type) || 1
            };

            const response = await api.post('predict/', payload);
            setPredictionData(response.data);
        } catch (error) {
            console.error('Prediction failed:', error);
            alert(error.response?.data?.error || "Prediction failed. Please check your inputs.");
        } finally {
            setLoading(false);
        }
    };

    const chartData = predictionData ? {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [
            {
                label: 'Forecasted Sales',
                data: predictionData.forecast,
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.2)',
                tension: 0.4,
                fill: true,
            },
        ],
    } : null;

    const modules = [
        { name: 'Sales Patterns', icon: TrendingUp, path: 'sales-patterns', desc: "Analyze trends & seasonality" },
        { name: 'Geo Intelligence', icon: Map, path: 'geo-map', desc: "Regional demand heatmaps" },
        { name: 'Decision Support', icon: PieChart, path: 'decision-support', desc: "Price elasticity modeling" },
        { name: 'Detailed Forecast', icon: BarChart2, path: 'forecast', desc: "Deep dive into future metrics" },
        { name: 'AI Recommendations', icon: List, path: 'recommendations', desc: "Actionable strategy list" },
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <PageHeader
                    title="AI Prediction Engine"
                    subtitle="Generate advanced sales forecasts and strategic insights using ML models."
                />

                {predictionData && (
                    <div className="flex items-center gap-3">
                        {lastRun && (
                            <div className="hidden md:flex items-center text-sm text-gray-500 bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-sm">
                                <Clock className="w-3.5 h-3.5 mr-1.5" />
                                Last run: {new Date(lastRun).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        )}
                        <button
                            onClick={handleReset}
                            className="flex items-center px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 hover:text-indigo-600 transition-colors text-sm font-medium shadow-sm hover:shadow"
                        >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            New Prediction
                        </button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left: Control Panel */}
                <div className="lg:col-span-4 space-y-6">
                    <DashboardCard title="Model Parameters" icon={Settings} className="sticky top-24">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Category & Fabric</label>
                                    <div className="grid grid-cols-2 gap-3 mt-2">
                                        <select name="garment_category" value={formData.garment_category} onChange={handleChange} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none">
                                            {['Shirts', 'T-Shirts', 'Jeans', 'Jackets', 'Sweaters', 'Dresses'].map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                        <select name="fabric_type" value={formData.fabric_type} onChange={handleChange} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none">
                                            {['Cotton', 'Silk', 'Polyester', 'Wool', 'Linen'].map(f => <option key={f} value={f}>{f}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Product Details</label>
                                    <div className="grid grid-cols-2 gap-3 mt-2">
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                                            <input type="number" name="price" value={formData.price} onChange={handleChange} className="w-full pl-7 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none" placeholder="Price" />
                                        </div>
                                        <div className="relative">
                                            <input type="number" name="item_weight" value={formData.item_weight} onChange={handleChange} className="w-full pl-3 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none" placeholder="Weight" />
                                            <span className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none">kg</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Outlet Details</label>
                                    <div className="grid grid-cols-2 gap-3 mt-2">
                                        <select name="outlet_id" value={formData.outlet_id} onChange={handleChange} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none">
                                            {[...Array(10)].map((_, i) => <option key={i} value={i + 1}>{`OUT0${(i * 3 + 10).toString().slice(-2)}`}</option>)}
                                        </select>
                                        <div className="relative group">
                                            <input
                                                type="number"
                                                name="outlet_established_year"
                                                value={formData.outlet_established_year}
                                                onChange={handleChange}
                                                min="1980"
                                                max="2025"
                                                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                                                placeholder="Year (YYYY)"
                                                title="Outlet Establishment Year"
                                            />
                                            {/* Tooltip on hover */}
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                                                Establishment Year
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 mt-3">
                                        <select name="outlet_size" value={formData.outlet_size} onChange={handleChange} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none">
                                            <option value="0">Small</option>
                                            <option value="1">Medium</option>
                                            <option value="2">Large</option>
                                        </select>
                                        <select name="outlet_location_type" value={formData.outlet_location_type} onChange={handleChange} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none">
                                            <option value="0">Metro</option>
                                            <option value="1">Urban</option>
                                            <option value="2">Semi-Urban</option>
                                        </select>
                                    </div>
                                    <div className="mt-3">
                                        <select name="outlet_type" value={formData.outlet_type} onChange={handleChange} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none">
                                            <option value="0">Garment Store</option>
                                            <option value="1">Apparel Supermarket</option>
                                            <option value="2">Large Apparel Outlet</option>
                                            <option value="3">Premium Fashion Store</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white py-3.5 rounded-xl font-bold hover:shadow-lg hover:shadow-indigo-500/20 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
                            >
                                {loading ? (
                                    <><div className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full" /> Processing...</>
                                ) : (
                                    <>Run Prediction <ArrowRight className="w-5 h-5" /></>
                                )}
                            </button>
                        </form>
                    </DashboardCard>
                </div>

                {/* Right: Results Panel */}
                <div className="lg:col-span-8">
                    <AnimatePresence mode='wait'>
                        {predictionData ? (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                {/* Key Metrics Row */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <StatCard
                                        title="Projected Sales"
                                        value={`${Math.round(predictionData.forecast.reduce((a, b) => a + b, 0))} Units`}
                                        trend="up" icon={TrendingUp} color="indigo"
                                        subtext="Annual estimate"
                                    />
                                    <StatCard
                                        title="Optimal Price"
                                        value={`₹${predictionData.pricing.optimal_price}`}
                                        trend={predictionData.pricing.optimal_price > formData.price ? "up" : "down"}
                                        icon={DollarSign} color="emerald"
                                        subtext={`Current: ₹${formData.price}`}
                                    />
                                    <StatCard
                                        title="Risk Score"
                                        value={predictionData.inventory.stockout_risk || 'Low'}
                                        icon={AlertTriangle} color={predictionData.inventory.stockout_risk === 'High' ? 'red' : 'blue'}
                                        subtext="Stockout probability"
                                    />
                                </div>

                                {/* Main Chart */}
                                <DashboardCard title="12-Month Forecast Curve">
                                    <div className="h-[300px] w-full mt-2">
                                        <Line options={{ responsive: true, maintainAspectRatio: false }} data={chartData} />
                                    </div>
                                </DashboardCard>

                                {/* Deep Dive Modules */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {modules.map((mod) => (
                                        <button
                                            key={mod.name}
                                            onClick={() => navigate(mod.path)}
                                            className="group bg-white p-5 rounded-2xl border border-gray-100 hover:border-indigo-300 hover:shadow-md transition-all text-left flex items-start gap-4"
                                        >
                                            <div className="p-3 bg-gray-50 text-gray-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                                <mod.icon className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{mod.name}</h4>
                                                <p className="text-sm text-gray-500 mt-1">{mod.desc}</p>
                                            </div>
                                            <ArrowRight className="w-5 h-5 text-gray-300 ml-auto self-center group-hover:text-indigo-600 transform group-hover:translate-x-1 transition-all" />
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="h-full min-h-[500px] flex flex-col items-center justify-center bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-200 text-gray-400 p-12 text-center"
                            >
                                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm mb-6">
                                    <Sparkles className="w-10 h-10 text-indigo-300" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 mb-2">AI Ready to Analyze</h3>
                                <p className="max-w-md mx-auto">Configure the parameters on the left to generate a comprehensive sales prediction model tailored to your product specs.</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default Predictions;
