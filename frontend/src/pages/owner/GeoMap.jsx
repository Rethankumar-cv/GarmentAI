import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { ArrowLeft, MapPin, Navigation, Package, Truck, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Component to update map center dynamically
const MapUpdater = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        map.setView(center, 6);
    }, [center, map]);
    return null;
};

const GeoMap = () => {
    const navigate = useNavigate();
    const [selectedFabric, setSelectedFabric] = useState('Cotton');
    const [geoData, setGeoData] = useState(null);
    const [loading, setLoading] = useState(false);

    const fabrics = ["Cotton", "Silk", "Polyester", "Wool", "Linen", "Others"];

    useEffect(() => {
        const fetchGeoData = async () => {
            setLoading(true);
            try {
                const res = await api.get(`owner/geo-map/?fabric=${selectedFabric}`);
                setGeoData(res.data);
            } catch (err) {
                console.error("Failed to fetch geo data", err);
            } finally {
                setLoading(false);
            }
        };

        fetchGeoData();
    }, [selectedFabric]);

    const lat = geoData?.lat || 20.59;
    const lng = geoData?.lng || 78.96;
    const city = geoData?.city || 'Unknown Location';

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                    <button onClick={() => navigate('/owner/predictions')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft className="w-6 h-6 text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Smart Sourcing Intelligence</h1>
                        <p className="text-sm text-gray-500">Optimal fabric sourcing locations based on price & logistics.</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-gray-200 shadow-sm">
                    <Package className="w-5 h-5 text-indigo-600" />
                    <span className="text-sm font-medium text-gray-700">Select Fabric:</span>
                    <select
                        value={selectedFabric}
                        onChange={(e) => setSelectedFabric(e.target.value)}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2 outline-none"
                    >
                        {fabrics.map(f => (
                            <option key={f} value={f}>{f}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Details Panel */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="lg:col-span-1 space-y-6"
                >
                    {/* Location Card */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="font-semibold text-gray-800 mb-6 flex items-center">
                            <MapPin className="w-5 h-5 text-red-500 mr-2" />
                            Optimal Sourcing Hub
                        </h3>

                        <div className="space-y-4">
                            <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                                <p className="text-xs text-indigo-500 font-bold uppercase tracking-wider mb-1">Hub Location</p>
                                <p className="text-xl font-bold text-indigo-900">{city}</p>
                                <p className="text-sm text-indigo-700 mt-1">{geoData?.supplier}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                                    <p className="text-xs text-emerald-600 font-bold uppercase mb-1">Best Price</p>
                                    <p className="text-lg font-bold text-emerald-900">₹{geoData?.price_per_meter}/m</p>
                                </div>
                                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                                    <p className="text-xs text-blue-600 font-bold uppercase mb-1">Lead Time</p>
                                    <p className="text-lg font-bold text-blue-900 flex items-center gap-1">
                                        <Truck className="w-4 h-4" /> {geoData?.lead_time}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* AI Insight */}
                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-2xl shadow-lg text-white">
                        <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                            <Info className="w-5 h-5 text-yellow-400" />
                            AI Sourcing Insight
                        </h4>
                        <p className="text-gray-300 text-sm leading-relaxed">
                            {geoData?.insight || "Loading insights..."}
                        </p>
                        <div className="mt-4 pt-4 border-t border-gray-700 flex items-center justify-between text-xs text-gray-400">
                            <span>Sourcing Efficiency Score</span>
                            <span className="text-emerald-400 font-bold text-lg">94/100</span>
                        </div>
                    </div>
                </motion.div>

                {/* Map */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="lg:col-span-2 h-[500px] rounded-2xl overflow-hidden shadow-lg border border-gray-200 relative z-0"
                >
                    {loading && (
                        <div className="absolute inset-0 z-[1000] bg-white/50 backdrop-blur-sm flex items-center justify-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
                        </div>
                    )}
                    <MapContainer center={[lat, lng]} zoom={6} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <MapUpdater center={[lat, lng]} />
                        <Marker position={[lat, lng]}>
                            <Popup>
                                <div className="text-center">
                                    <strong className="text-indigo-600">{city}</strong><br />
                                    Primary {selectedFabric} Hub<br />
                                    <span className="text-xs text-gray-500">Lowest Price: ₹{geoData?.price_per_meter}</span>
                                </div>
                            </Popup>
                        </Marker>
                    </MapContainer>
                </motion.div>
            </div>
        </div>
    );
};

export default GeoMap;
