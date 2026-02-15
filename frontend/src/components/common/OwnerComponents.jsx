import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, HelpCircle } from 'lucide-react';

// ==================== WRAPPERS ====================

export const DashboardCard = ({ children, className = "", title, icon: Icon, action }) => (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden ${className}`}
    >
        {(title || Icon || action) && (
            <div className="px-6 py-4 border-b border-gray-50 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    {Icon && <Icon className="w-5 h-5 text-gray-400" />}
                    {title && <h3 className="font-semibold text-gray-800">{title}</h3>}
                </div>
                {action}
            </div>
        )}
        <div className="p-6">
            {children}
        </div>
    </motion.div>
);

export const PageHeader = ({ title, subtitle, action }) => (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{title}</h1>
            {subtitle && <p className="text-gray-500 mt-1">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
    </div>
);

// ==================== DATA DISPLAY ====================

export const StatCard = ({ title, value, trend, trendValue, icon: Icon, color = "indigo", subtext, onClick }) => {
    const isPositive = trend === 'up';
    const colorClasses = {
        indigo: 'bg-indigo-50 text-indigo-600',
        emerald: 'bg-emerald-50 text-emerald-600',
        blue: 'bg-blue-50 text-blue-600',
        purple: 'bg-purple-50 text-purple-600',
        orange: 'bg-orange-50 text-orange-600',
        red: 'bg-red-50 text-red-600',
    };

    return (
        <motion.div
            whileHover={{ y: -4 }}
            onClick={onClick ? onClick : undefined}
            className={`bg-white p-6 rounded-2xl shadow-sm border border-indigo-50/50 hover:shadow-md transition-all relative overflow-hidden ${onClick ? 'cursor-pointer' : ''}`}
        >
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-${color}-50 to-transparent rounded-bl-full opacity-50 -mr-4 -mt-4 transition-transform group-hover:scale-110`} />

            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
                    <Icon className="w-6 h-6" />
                </div>
                {trend && (
                    <div className={`flex items-center text-xs font-medium px-2 py-1 rounded-full ${isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                        {trendValue}
                    </div>
                )}
            </div>

            <div className="relative z-10">
                <h3 className="text-3xl font-bold text-gray-900 tracking-tight mb-1">{value}</h3>
                <p className="text-sm text-gray-500 font-medium">{title}</p>
                {subtext && <p className="text-xs text-gray-400 mt-2">{subtext}</p>}
            </div>
        </motion.div>
    );
};

export const AIInsightBadge = ({ type = "insight", text }) => {
    const styles = {
        insight: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-100", icon: "✨" },
        alert: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-100", icon: "⚠️" },
        success: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-100", icon: "🚀" },
    };
    const style = styles[type] || styles.insight;

    return (
        <div className={`flex items-start gap-3 p-4 rounded-xl border ${style.bg} ${style.border}`}>
            <span className="text-xl">{style.icon}</span>
            <p className={`text-sm font-medium ${style.text}`}>{text}</p>
        </div>
    );
};

// ==================== TABLES ====================

export const StatusPill = ({ status, type = "default" }) => {
    let style = "bg-gray-100 text-gray-600";

    // Inventory logic
    if (status === "In Stock" || (type === "stock" && status > 20)) style = "bg-emerald-100 text-emerald-700";
    else if (status === "Low Stock" || (type === "stock" && status <= 20 && status > 0)) style = "bg-amber-100 text-amber-700";
    else if (status === "Out of Stock" || (type === "stock" && status <= 0)) style = "bg-red-100 text-red-700";

    // Trend logic
    if (status === "Strong Upward") style = "bg-indigo-100 text-indigo-700";
    if (status === "Stable") style = "bg-blue-100 text-blue-700";

    return (
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${style}`}>
            {status}
        </span>
    );
};
