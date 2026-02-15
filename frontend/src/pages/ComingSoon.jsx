import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Rocket } from 'lucide-react';

const ComingSoon = ({ title }) => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white p-12 rounded-3xl shadow-xl max-w-lg w-full border border-gray-100"
            >
                <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-600">
                    <Rocket className="w-10 h-10" />
                </div>

                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    {title || "Coming Soon"}
                </h1>

                <p className="text-gray-500 mb-8">
                    We're working hard to bring you this page. Stay tuned for updates!
                </p>

                <button
                    onClick={() => navigate('/')}
                    className="flex items-center justify-center gap-2 w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" /> Back to Home
                </button>
            </motion.div>
        </div>
    );
};

export default ComingSoon;
