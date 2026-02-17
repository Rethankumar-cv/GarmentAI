import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import {
    Plus, Edit2, Trash2, Search, Filter, Download, X, Save, AlertCircle,
    LayoutDashboard, List, BarChart3, Package, TrendingUp, AlertTriangle, CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader, StatusPill } from '../../components/common/OwnerComponents';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const KPICard = ({ title, value, icon: Icon, color, subtext }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start justify-between">
        <div>
            <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
            {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
            <Icon className="w-6 h-6 text-white" />
        </div>
    </div>
);

const Inventory = () => {
    const [activeTab, setActiveTab] = useState('list'); // 'list' | 'analytics'
    const [products, setProducts] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [analyticsLoading, setAnalyticsLoading] = useState(false);

    // List View State
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const initialFormState = {
        name: '',
        garment_category: 'Shirts',
        price: '',
        stock: '',
        image: '',
        description: '',
        gender: 'Unisex',
    };
    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        fetchProducts();
    }, []);

    useEffect(() => {
        if (activeTab === 'analytics' && !analytics) {
            fetchAnalytics();
        }
    }, [activeTab]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const response = await api.get('products/');
            setProducts(response.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchAnalytics = async () => {
        setAnalyticsLoading(true);
        try {
            const response = await api.get('owner/inventory-analytics/');
            setAnalytics(response.data);
        } catch (err) {
            console.error("Failed to fetch analytics", err);
        } finally {
            setAnalyticsLoading(false);
        }
    };

    // ... (Existing handlers for Add/Edit/Delete/Submit/Download) -> Keeping them
    const handleAddNew = () => {
        setSelectedProduct(null);
        setFormData(initialFormState);
        setError(null);
        setShowModal(true);
    };

    const handleEdit = (product) => {
        setSelectedProduct(product);
        setFormData({
            name: product.name,
            garment_category: product.garment_category_display || product.garment_category || 'Shirts',
            price: product.price,
            stock: product.stock,
            image: product.image || '',
            description: product.description || '',
            gender: product.gender || 'Unisex',
        });
        setError(null);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this product?")) return;
        try {
            await api.delete(`products/${id}/`);
            setProducts(products.filter(p => p.id !== id));
        } catch (err) {
            console.error("Failed to delete", err);
            alert("Failed to delete product");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        const garment_categories = {
            "Shirts": 0, "T-Shirts": 1, "Jeans": 2, "Jackets": 3, "Sweaters": 4,
            "Dresses": 5, "Skirts": 6, "Sarees": 7, "Ethnic Wear": 8, "Casual Wear": 9,
            "Formal Wear": 10, "Sports Wear": 11, "Others": 12
        };

        try {
            const payload = {
                name: formData.name,
                garment_category: garment_categories[formData.garment_category] || 12,
                fabric_type: 2,
                price: parseFloat(formData.price) || 0,
                stock: parseInt(formData.stock) || 0,
                outlet_id: 1,
                image: formData.image,
                description: formData.description,
                gender: formData.gender,
            };

            if (selectedProduct) {
                const response = await api.put(`products/${selectedProduct.id}/`, payload);
                setProducts(products.map(p => p.id === selectedProduct.id ? response.data : p));
            } else {
                const response = await api.post('products/', payload);
                setProducts([...products, response.data]);
            }
            setShowModal(false);
            // Invalidate analytics if data changes
            setAnalytics(null);
        } catch (err) {
            console.error("Submit failed", err);
            setError(err.response?.data?.error || "Operation failed.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDownload = () => {
        const headers = ["ID", "Name", "Category", "Price", "Stock", "Gender"];
        const csvContent = [
            headers.join(","),
            ...products.map(p => [p.id, `"${p.name}"`, p.garment_category, p.price, p.stock, p.gender].join(","))
        ].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", "inventory_report.csv");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.garment_category_display?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.garment_category?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Filter "Others" from displaying in chart if desired, or keep all
    const chartData = analytics ? {
        labels: analytics.fabric_analysis.labels,
        datasets: [{
            label: 'Current Stock',
            data: analytics.fabric_analysis.values,
            backgroundColor: 'rgba(79, 70, 229, 0.8)',
            borderRadius: 8,
        }]
    } : null;

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <PageHeader
                title="Inventory Management"
                subtitle="Track stock levels, AI predictions, and automated reorder points."
                action={
                    <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
                        <button
                            onClick={() => setActiveTab('list')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <List className="w-4 h-4" />
                            Product List
                        </button>
                        <button
                            onClick={() => setActiveTab('analytics')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'analytics' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <BarChart3 className="w-4 h-4" />
                            AI Intelligence
                        </button>
                    </div>
                }
            />

            {activeTab === 'analytics' ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {analyticsLoading ? (
                        <div className="h-64 flex items-center justify-center">
                            <div className="animate-spin text-indigo-600 w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
                        </div>
                    ) : analytics ? (
                        <>
                            {/* KPI Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <KPICard title="Daily Garment Sales" value={analytics.kpi.daily_sales} icon={TrendingUp} color="bg-blue-500" subtext="Predicted Avg" />
                                <KPICard title="Safety Stock" value={analytics.kpi.safety_stock} icon={Package} color="bg-emerald-500" subtext="Recommended Buffer" />
                                <KPICard title="Reorder Point" value={analytics.kpi.reorder_point} icon={AlertTriangle} color="bg-amber-500" subtext="Trigger Level" />
                                <KPICard title="EOQ (Garments)" value={analytics.kpi.eoq} icon={LayoutDashboard} color="bg-rose-500" subtext="Optimal Order Qty" />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Chart */}
                                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <BarChart3 className="w-5 h-5 text-indigo-600" />
                                        Fabric Type Inventory Analysis
                                    </h3>
                                    <div className="h-80">
                                        <Bar
                                            data={chartData}
                                            options={{
                                                responsive: true,
                                                maintainAspectRatio: false,
                                                plugins: { legend: { display: false } },
                                                scales: { y: { beginAtZero: true, grid: { display: false } }, x: { grid: { display: false } } }
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Reorder Decisions & Recommendations */}
                                <div className="space-y-6">
                                    {/* Auto Reorder Panel */}
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                            <TrendingUp className="w-5 h-5 text-rose-500" />
                                            Automated Reorder Decision
                                        </h3>

                                        <div className="space-y-4">
                                            <div>
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span className="text-gray-500">Stockout Risk</span>
                                                    <span className={`font-bold ${analytics.kpi.stockout_risk === 'High' ? 'text-red-500' : 'text-emerald-500'}`}>
                                                        {analytics.kpi.stockout_risk}
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-100 rounded-full h-2">
                                                    <div className={`h-full rounded-full ${analytics.kpi.stockout_risk === 'High' ? 'bg-red-500 w-3/4' : 'bg-emerald-500 w-1/4'}`}></div>
                                                </div>
                                            </div>

                                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-sm font-medium text-gray-600">Reorder Required</span>
                                                    {analytics.alerts.reorder_required ? (
                                                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-lg">YES</span>
                                                    ) : (
                                                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-lg">NO</span>
                                                    )}
                                                </div>
                                                {analytics.alerts.reorder_required && (
                                                    <p className="text-xs text-red-500 mt-1">
                                                        {analytics.alerts.reorder_count} items below threshold.
                                                    </p>
                                                )}
                                            </div>

                                            <p className="text-xs text-gray-400">
                                                AI evaluates fabric-wise demand, sales velocity, seasonality, and thresholds.
                                            </p>
                                        </div>
                                    </div>

                                    {/* AI Recommendations */}
                                    <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-6 rounded-2xl shadow-lg text-white">
                                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                            <CheckCircle className="w-5 h-5 text-indigo-200" />
                                            AI Recommendations
                                        </h3>
                                        <ul className="space-y-3">
                                            {analytics.recommendations.map((rec, idx) => (
                                                <li key={idx} className="text-sm text-indigo-100 flex items-start gap-2">
                                                    <span className="mt-1 block w-1.5 h-1.5 rounded-full bg-indigo-300 shrink-0"></span>
                                                    {rec}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-12 text-gray-500">Failed to load analytics.</div>
                    )}
                </div>
            ) : (
                /* LIST VIEW (Existing Table) */
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Search inventory..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleAddNew}
                                className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center hover:bg-indigo-700 transition-colors font-medium shadow-sm"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Product
                            </button>
                            <button
                                onClick={handleDownload}
                                className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-gray-200"
                            >
                                <Download className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50 text-gray-500 text-xs uppercase tracking-wider font-semibold">
                                <tr>
                                    <th className="px-6 py-4">Product Details</th>
                                    <th className="px-6 py-4">Category</th>
                                    <th className="px-6 py-4">Gender</th>
                                    <th className="px-6 py-4">Price</th>
                                    <th className="px-6 py-4">Stock Level</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredProducts.map((product) => (
                                    <motion.tr
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        key={product.id}
                                        className="hover:bg-indigo-50/30 transition-colors group"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className="w-10 h-10 rounded-lg bg-gray-100 mr-4 flex-shrink-0 flex items-center justify-center text-gray-400 overflow-hidden">
                                                    {product.image ? (
                                                        <img src={product.image} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-6 h-6 bg-indigo-100 rounded-md" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900">{product.name}</p>
                                                    <p className="text-xs text-gray-500">ID: #{product.id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-md font-medium">
                                                {product.garment_category_display || product.garment_category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{product.gender || 'Unisex'}</td>
                                        <td className="px-6 py-4 font-mono text-sm text-gray-700">₹{product.price}</td>
                                        <td className="px-6 py-4">
                                            <div className="w-32 bg-gray-100 rounded-full h-2 overflow-hidden mb-1">
                                                <div
                                                    className={`h-full rounded-full ${product.stock > 10 ? 'bg-emerald-500' : 'bg-red-500'}`}
                                                    style={{ width: `${Math.min(product.stock, 100)}%` }}
                                                />
                                            </div>
                                            <span className="text-xs text-gray-500">{product.stock} units</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusPill status={product.stock} type="stock" />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleEdit(product)}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(product.id)}
                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>

                        {filteredProducts.length === 0 && !loading && (
                            <div className="p-12 text-center text-gray-500">
                                <p>No products found matching your search.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Product Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto"
                        >
                            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 sticky top-0 z-10 backdrop-blur-md">
                                <h3 className="text-lg font-bold text-gray-800">
                                    {selectedProduct ? 'Edit Product' : 'Add New Product'}
                                </h3>
                                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                {error && (
                                    <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center">
                                        <AlertCircle className="w-4 h-4 mr-2" />
                                        {error}
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                        placeholder="e.g. Vintage Denim Jacket"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Product Image</label>
                                    <select
                                        name="image"
                                        value={formData.image}
                                        onChange={e => setFormData({ ...formData, image: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                    >
                                        <option value="">Auto-assign based on Category</option>
                                        {['Shirts', 'T-Shirts', 'Jeans', 'Jackets', 'Sweaters', 'Dresses', 'Skirts', 'Sarees', 'Ethnic Wear', 'Casual Wear', 'Formal Wear', 'Sports Wear', 'Others'].map(c => (
                                            <option key={c} value={`/static/images/${c}.jpg`}>{c} Image</option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-gray-400 mt-1">Select "Auto-assign" to use default category image.</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                        <select
                                            value={formData.garment_category}
                                            onChange={e => setFormData({ ...formData, garment_category: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                        >
                                            {['Shirts', 'T-Shirts', 'Jeans', 'Jackets', 'Sweaters', 'Dresses', 'Skirts', 'Sarees', 'Ethnic Wear', 'Casual Wear', 'Formal Wear', 'Sports Wear', 'Others'].map(c => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                                        <select
                                            value={formData.gender}
                                            onChange={e => setFormData({ ...formData, gender: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                        >
                                            {['Men', 'Women', 'Unisex'].map(g => (
                                                <option key={g} value={g}>{g}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            value={formData.price}
                                            onChange={e => setFormData({ ...formData, price: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            value={formData.stock}
                                            onChange={e => setFormData({ ...formData, stock: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none h-24 resize-none"
                                        placeholder="Product description..."
                                    />
                                </div>

                                <div className="pt-4 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center disabled:opacity-70"
                                    >
                                        <Save className="w-4 h-4 mr-2" />
                                        {submitting ? 'Saving...' : 'Save Product'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Inventory;
