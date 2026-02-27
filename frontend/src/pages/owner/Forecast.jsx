import React, { useEffect } from 'react';
import usePredictionStore from '../../store/predictionStore';
import { useNavigate } from 'react-router-dom';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, TrendingUp, BarChart } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement);

const Forecast = () => {
    const { predictionData } = usePredictionStore();
    const navigate = useNavigate();

    if (!predictionData) {
        return (
            <div className="flex flex-col items-center justify-center py-32 text-gray-500 bg-white rounded-2xl shadow-sm border border-gray-100 max-w-4xl mx-auto">
                <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
                    <BarChart className="w-10 h-10 text-indigo-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Detailed Forecast Unavailable</h3>
                <p className="max-w-md mx-auto text-center text-gray-500 mb-8">You need to run an AI prediction model first to view the 12-month metrics.</p>
                <button
                    onClick={() => navigate('/owner/predictions')}
                    className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
                >
                    Run AI Prediction
                </button>
            </div>
        );
    }

    const { forecast, demand_planning } = predictionData;

    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const barData = {
        labels,
        datasets: [{
            label: 'Monthly Sales',
            data: forecast,
            backgroundColor: forecast.map(v => Math.max(...forecast) === v ? '#16a34a' : '#6366f1'),
            borderRadius: 6,
        }],
    };

    const lineData = {
        labels,
        datasets: [{
            label: 'Sales Trend',
            data: forecast,
            borderColor: '#22c55e',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            fill: true,
            tension: 0.4,
        }],
    };

    const seasonalityData = {
        labels,
        datasets: [{
            data: forecast,
            backgroundColor: [
                '#6366f1', '#22c55e', '#3b82f6', '#f59e0b',
                '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6',
                '#f97316', '#06b6d4', '#eab308', '#84cc16'
            ],
            borderWidth: 0,
        }],
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-4">
                <button onClick={() => navigate('/owner/predictions')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft className="w-6 h-6 text-gray-600" />
                </button>
                <h1 className="text-2xl font-bold text-gray-800">12-Month Detailed Forecast</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
                    <Calendar className="w-8 h-8 text-primary mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">Avg Monthly Demand</p>
                    <h3 className="text-2xl font-bold text-gray-800 mt-1">{demand_planning.avg_monthly_demand}</h3>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
                    <BarChart className="w-8 h-8 text-green-500 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">Total Annual Sales</p>
                    <h3 className="text-2xl font-bold text-gray-800 mt-1">{demand_planning.annual_demand}</h3>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
                    <TrendingUp className="w-8 h-8 text-orange-500 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">Peak Month</p>
                    <h3 className="text-2xl font-bold text-gray-800 mt-1">{labels[forecast.indexOf(Math.max(...forecast))]}</h3>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-semibold text-gray-800 mb-6">Monthly Sales Distribution</h3>
                    <div className="h-72">
                        <Bar options={{ responsive: true, maintainAspectRatio: false }} data={barData} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-semibold text-gray-800 mb-6">Seasonality Contribution</h3>
                    <div className="h-64 flex justify-center">
                        <div className="w-64">
                            <Doughnut options={{ responsive: true, maintainAspectRatio: false, cutout: '70%' }} data={seasonalityData} />
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-3 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-semibold text-gray-800 mb-6">Sales Trend Curve</h3>
                    <div className="h-64">
                        <Line options={{ responsive: true, maintainAspectRatio: false }} data={lineData} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Forecast;
