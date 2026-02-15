import React, { useEffect } from 'react';
import usePredictionStore from '../../store/predictionStore';
import { useNavigate } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import { motion } from 'framer-motion';
import { ArrowLeft, Lightbulb, Zap, ArrowRight } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Recommendations = () => {
    const { predictionData } = usePredictionStore();
    const navigate = useNavigate();

    useEffect(() => {
        if (!predictionData) {
            navigate('/owner/predictions');
        }
    }, [predictionData, navigate]);

    if (!predictionData) return null;

    const { recommendations } = predictionData;

    const chartData = {
        labels: recommendations.actions.map((_, i) => `Action ${i + 1}`),
        datasets: [
            {
                label: 'Business Impact Score',
                data: recommendations.impact_scores,
                backgroundColor: recommendations.impact_scores.map(s =>
                    s > 80 ? 'rgba(34, 197, 94, 0.8)' :
                        s > 60 ? 'rgba(99, 102, 241, 0.8)' :
                            'rgba(245, 158, 11, 0.8)'
                ),
                borderRadius: 8,
            },
        ],
    };

    const options = {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false }
        },
        scales: {
            x: {
                max: 100,
                beginAtZero: true
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-4">
                <button onClick={() => navigate('/owner/predictions')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft className="w-6 h-6 text-gray-600" />
                </button>
                <h1 className="text-2xl font-bold text-gray-800">AI Strategic Recommendations</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-semibold text-gray-800 mb-6 flex items-center">
                        <Lightbulb className="w-5 h-5 text-yellow-500 mr-2" />
                        Actionable Insights
                    </h3>

                    <div className="space-y-4">
                        {recommendations.actions.map((action, index) => (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                key={index}
                                className="flex items-start p-4 bg-gray-50 rounded-xl hover:bg-indigo-50 transition-colors"
                            >
                                <div className="mt-1 mr-3 flex-shrink-0">
                                    <ArrowRight className="w-4 h-4 text-primary" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-gray-700 font-medium">{action}</p>
                                </div>
                                <div className="ml-3">
                                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${recommendations.impact_scores[index] > 80 ? 'bg-green-100 text-green-700' :
                                            recommendations.impact_scores[index] > 60 ? 'bg-indigo-100 text-indigo-700' :
                                                'bg-orange-100 text-orange-700'
                                        }`}>
                                        Impact {recommendations.impact_scores[index]}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-semibold text-gray-800 mb-6 flex items-center">
                        <Zap className="w-5 h-5 text-orange-500 mr-2" />
                        Estimated Business Impact
                    </h3>
                    <div className="h-80">
                        <Bar options={options} data={chartData} />
                    </div>
                    <p className="text-sm text-gray-500 mt-4">
                        Impact scores are calculated based on potential revenue uplift and operational efficiency gains.
                    </p>
                </div>

            </div>
        </div>
    );
};

export default Recommendations;
