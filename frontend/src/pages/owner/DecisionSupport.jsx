import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import usePredictionStore from '../../store/predictionStore';
import {
    TrendingUp, AlertTriangle, CheckCircle, BarChart2, PieChart,
    IndianRupee, Activity, ShoppingBag, Percent
} from 'lucide-react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { PageHeader } from '../../components/common/OwnerComponents';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

const DecisionSupport = () => {
    const [activeTab, setActiveTab] = useState('pricing'); // 'pricing' | 'recommendations'
    const { predictionData, formData } = usePredictionStore();
    const navigate = useNavigate();

    // Map `predictionData` dynamically into the format local variables expect
    const pricingData = predictionData ? {
        product_name: `${formData.fabric_type} ${formData.garment_category}`,
        pricing: {
            optimal_price: predictionData.pricing.optimal_price,
            elasticity: predictionData.pricing.elasticity,
            chart_labels: ['Current', 'Optimal'],
            chart_values: [predictionData.pricing.current_price, predictionData.pricing.optimal_price]
        },
        demand: {
            avg_monthly_demand: predictionData.demand_planning.avg_monthly_demand,
            annual_demand: predictionData.demand_planning.annual_demand,
            forecast_confidence: predictionData.demand_planning.forecast_confidence <= 1 ? predictionData.demand_planning.forecast_confidence : predictionData.demand_planning.forecast_confidence / 100
        },
        discount: {
            recommended_discount_percent: predictionData.discount_strategy.recommended_discount_percent,
            best_months: predictionData.discount_strategy.best_discount_months
        }
    } : null;

    const recData = predictionData ? {
        recommendations: predictionData.recommendations.actions,
        impact_scores: predictionData.recommendations.impact_scores,
        chart_data: {
            labels: predictionData.recommendations.actions.map((_, i) => `Action ${i + 1}`),
            data: predictionData.recommendations.impact_scores
        }
    } : null;

    const KPICard = ({ title, value, icon: Icon, color, subtext }) => (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start justify-between">
            <div>
                <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
                {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
            </div>
            <div className={`p-3 rounded-xl ${color} bg-opacity-10`}>
                <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
            </div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <PageHeader
                title="AI Decision Support"
                subtitle="Data-driven insights for pricing, demand, and strategic growth."
                action={
                    <div className="flex bg-gray-100 p-1 rounded-xl">
                        <button
                            onClick={() => setActiveTab('pricing')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'pricing' ? 'bg-amber-400 text-black shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                            Pricing & Fabric Demand
                        </button>
                        <button
                            onClick={() => setActiveTab('recommendations')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'recommendations' ? 'bg-amber-400 text-black shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                            Smart Recommendations
                        </button>
                    </div>
                }
            />

            {!predictionData ? (
                <div className="flex flex-col items-center justify-center py-24 text-gray-500 bg-white rounded-2xl shadow-sm border border-gray-100 m-8 animate-in fade-in">
                    <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6">
                        <AlertTriangle className="w-10 h-10 text-amber-500" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">Decision Engine Unavailable</h3>
                    <p className="mt-2 text-sm text-gray-500">Please run an AI Prediction first to calculate demand elasticity and insights.</p>
                    <button
                        onClick={() => navigate('/owner/predictions')}
                        className="mt-6 px-6 py-3 bg-amber-500 text-white font-medium rounded-xl hover:bg-amber-600 transition-colors shadow-sm"
                    >
                        Run AI Prediction
                    </button>
                </div>
            ) : (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {activeTab === 'pricing' && pricingData && (
                        pricingData.message ? (
                            <div className="flex flex-col items-center justify-center py-24 text-gray-500 bg-white rounded-2xl shadow-sm border border-gray-100 m-8">
                                <IndianRupee className="w-16 h-16 text-gray-300 mb-4" />
                                <h3 className="text-xl font-bold text-gray-800">{pricingData.message}</h3>
                                <p className="mt-2 text-sm text-gray-500">Please add some products to your inventory to unlock actionable insights.</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Detailed Analysis based on Product */}
                                {pricingData.product_name && (
                                    <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex items-center gap-3 text-indigo-800 text-sm">
                                        <Activity className="w-5 h-5" />
                                        <span>Analysis based on top product: <strong>{pricingData.product_name}</strong></span>
                                    </div>
                                )}

                                {/* KPIs */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <KPICard
                                        title="Optimal Garment Price"
                                        value={`₹ ${pricingData.pricing.optimal_price}`}
                                        icon={IndianRupee}
                                        color="bg-blue-600"
                                        subtext={`Elasticity: ${pricingData.pricing.elasticity}`}
                                    />
                                    <KPICard
                                        title="Avg Monthly Demand"
                                        value={pricingData.demand.avg_monthly_demand}
                                        icon={BarChart2}
                                        color="bg-emerald-600"
                                        subtext={`Annual: ${pricingData.demand.annual_demand}`}
                                    />
                                    <KPICard
                                        title="Recommended Discount"
                                        value={`${pricingData.discount.recommended_discount_percent}%`}
                                        icon={Percent}
                                        color="bg-purple-600"
                                        subtext={pricingData.discount.best_months?.length > 0 ? `Best Months: ${pricingData.discount.best_months.join(', ')}` : "No discount needed"}
                                    />
                                </div>

                                {/* Charts */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                        <h3 className="font-bold text-gray-800 mb-6">Garment Price Optimization</h3>
                                        <div className="h-64">
                                            <Bar
                                                options={{ responsive: true, maintainAspectRatio: false }}
                                                data={{
                                                    labels: pricingData.pricing.chart_labels,
                                                    datasets: [{
                                                        label: 'Price Points',
                                                        data: pricingData.pricing.chart_values,
                                                        backgroundColor: ['#6366f1', '#10b981'],
                                                        borderRadius: 8,
                                                    }]
                                                }}
                                            />
                                        </div>
                                        <div className="mt-4 flex justify-between text-xs text-gray-500">
                                            <span>Current Price</span>
                                            <span>Optimal Price</span>
                                        </div>
                                    </div>

                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                        <h3 className="font-bold text-gray-800 mb-6">Demand Forecast Confidence</h3>
                                        <div className="h-64 flex justify-center">
                                            <div className="w-64">
                                                <Doughnut
                                                    data={{
                                                        labels: ['Confidence', 'Uncertainty'],
                                                        datasets: [{
                                                            data: [pricingData.demand.forecast_confidence * 100, 100 - (pricingData.demand.forecast_confidence * 100)],
                                                            backgroundColor: ['#10b981', '#e5e7eb'],
                                                            borderWidth: 0
                                                        }]
                                                    }}
                                                    options={{ cutout: '70%' }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    )}

                    {activeTab === 'recommendations' && recData && (
                        recData.message ? (
                            <div className="flex flex-col items-center justify-center py-24 text-gray-500 bg-white rounded-2xl shadow-sm border border-gray-100 m-8">
                                <AlertTriangle className="w-16 h-16 text-gray-300 mb-4" />
                                <h3 className="text-xl font-bold text-gray-800">{recData.message}</h3>
                                <p className="mt-2 text-sm text-gray-500">Please add some products to your inventory to unlock smart recommendations.</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Strategy Actions */}
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                        <h3 className="font-bold text-lg text-gray-800 mb-6 flex items-center gap-2">
                                            <CheckCircle className="w-5 h-5 text-indigo-600" />
                                            Garment Strategy Actions
                                        </h3>
                                        <div className="space-y-4">
                                            {recData.recommendations.map((rec, idx) => (
                                                <div key={idx} className="flex gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                                                    <div className="mt-1">
                                                        <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-gray-700 text-sm font-medium leading-relaxed">{rec}</p>
                                                    </div>
                                                    <div>
                                                        <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-lg whitespace-nowrap">
                                                            Impact {recData.impact_scores[idx]}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Impact Chart */}
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                        <h3 className="font-bold text-lg text-gray-800 mb-6 flex items-center gap-2">
                                            <TrendingUp className="w-5 h-5 text-amber-500" />
                                            Estimated Business Impact
                                        </h3>
                                        <div className="h-80">
                                            <Bar
                                                options={{
                                                    responsive: true,
                                                    maintainAspectRatio: false,
                                                    scales: {
                                                        y: { beginAtZero: true, max: 100, grid: { display: true, borderDash: [2, 2] } },
                                                        x: { grid: { display: false } }
                                                    }
                                                }}
                                                data={recData.chart_data ? {
                                                    labels: recData.chart_data.labels,
                                                    datasets: [{
                                                        label: 'Impact Score',
                                                        data: recData.chart_data.data,
                                                        backgroundColor: [
                                                            '#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'
                                                        ],
                                                        borderRadius: 6,
                                                    }]
                                                } : { labels: [], datasets: [] }}
                                            />
                                        </div>
                                        <p className="text-sm text-gray-500 mt-4 text-center">
                                            Impact score reflects expected improvement in garment sales and inventory efficiency.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )
                    )}
                </div>
            )}
        </div>
    );
};

export default DecisionSupport;
