import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import {
    TrendingUp, Activity, Zap, Shield, AlertTriangle, CheckCircle
} from 'lucide-react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { PageHeader, StatCard } from '../../components/common/OwnerComponents';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const SalesPatterns = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get('owner/sales-patterns/');
                setData(res.data);
            } catch (err) {
                console.error("Failed to fetch sales patterns", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center h-64 items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
            </div>
        );
    }

    if (!data) return <div className="text-center py-12 text-gray-500">Failed to load patterns.</div>;

    const { metrics, chart, recommendations } = data;

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-blue-600 flex items-center gap-2">
                    <TrendingUp className="w-6 h-6" />
                    Garment Sales Pattern Intelligence
                </h1>
                <span className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm flex items-center gap-2">
                    <Zap className="w-4 h-4" /> AI Engine Active
                </span>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
                    <div className="flex justify-center mb-4"><TrendingUp className="w-8 h-8 text-blue-600" /></div>
                    <p className="text-sm text-gray-500 font-medium">Garment Trend</p>
                    <h3 className="text-xl font-bold text-gray-900 mt-1">{metrics.trend}</h3>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
                    <div className="flex justify-center mb-4"><Activity className="w-8 h-8 text-green-600" /></div>
                    <p className="text-sm text-gray-500 font-medium">Fabric Seasonality</p>
                    <h3 className="text-xl font-bold text-gray-900 mt-1">{metrics.seasonality}</h3>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
                    <div className="flex justify-center mb-4"><Zap className="w-8 h-8 text-red-500" /></div>
                    <p className="text-sm text-gray-500 font-medium">Demand Volatility</p>
                    <h3 className="text-xl font-bold text-gray-900 mt-1">{metrics.volatility_percent}%</h3>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
                    <div className="flex justify-center mb-4"><Shield className="w-8 h-8 text-yellow-500" /></div>
                    <p className="text-sm text-gray-500 font-medium">Forecast Confidence (%)</p>
                    <h3 className="text-xl font-bold text-gray-900 mt-1">{metrics.confidence_percent}%</h3>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-blue-600" />
                        Price vs Annual Sales
                    </h3>
                    <div className="h-80">
                        <Line
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                scales: {
                                    y: { beginAtZero: false, grid: { color: '#f3f4f6' } },
                                    x: { grid: { color: '#f3f4f6' } }
                                },
                                plugins: {
                                    legend: { display: false },
                                    tooltip: {
                                        callbacks: {
                                            label: (ctx) => `Sales: ${ctx.raw} units`
                                        }
                                    }
                                }
                            }}
                            data={{
                                labels: chart.prices,
                                datasets: [{
                                    label: 'Annual Sales',
                                    data: chart.sales,
                                    borderColor: '#6366f1',
                                    backgroundColor: 'rgba(99, 102, 241, 0.2)',
                                    fill: true,
                                    tension: 0.4,
                                    pointBackgroundColor: '#6366f1',
                                    pointBorderColor: '#fff',
                                    pointHoverBackgroundColor: '#fff',
                                    pointHoverBorderColor: '#6366f1'
                                }]
                            }}
                        />
                    </div>
                </div>

                {/* Risk Panel */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                        Volatility Risk
                    </h3>

                    <div className="relative pt-6 pb-2">
                        <div className="flex justify-between text-xs font-bold text-gray-400 mb-1">
                            <span>0%</span>
                            <span>100%</span>
                        </div>
                        <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-1000 ${metrics.risk_level.includes("High") ? 'bg-red-500' :
                                        metrics.risk_level.includes("Moderate") ? 'bg-yellow-500' : 'bg-green-500'
                                    }`}
                                style={{ width: `${Math.min(metrics.volatility_percent * 2, 100)}%` }}
                            ></div>
                        </div>
                        <div
                            className="absolute top-0 transform -translate-x-1/2 mt-1"
                            style={{ left: `${Math.min(metrics.volatility_percent * 2, 100)}%` }}
                        >
                            <span className="bg-emerald-600 text-white text-xs font-bold px-1.5 py-0.5 rounded shadow-sm">
                                {metrics.volatility_percent}
                            </span>
                        </div>
                    </div>

                    <div className="mt-6">
                        <span className="text-gray-500 font-medium">Risk Level: </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${metrics.risk_level.includes("High") ? 'bg-red-600' :
                                metrics.risk_level.includes("Moderate") ? 'bg-yellow-600' : 'bg-emerald-600'
                            }`}>
                            {metrics.risk_level}
                        </span>
                    </div>

                    <p className="text-sm text-gray-500 mt-4 leading-relaxed">
                        Risk calculated using garment demand volatility and fabric pricing sensitivity.
                    </p>
                </div>
            </div>

            {/* Recommendations */}
            <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 p-6 rounded-2xl shadow-lg text-white">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-300" />
                    Garment AI Recommendations
                </h3>
                <ul className="space-y-2">
                    {recommendations.map((rec, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-sm font-medium opacity-90">
                            <div className="mt-1.5 w-1.5 h-1.5 bg-white rounded-full flex-shrink-0" />
                            <span>{rec}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default SalesPatterns;
