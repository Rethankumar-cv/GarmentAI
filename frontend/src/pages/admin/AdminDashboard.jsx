import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
    Grid, Paper, Typography, Box, CircularProgress,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip
} from '@mui/material';
import {
    People, ShoppingBag, Receipt, AttachMoney, TrendingUp
} from '@mui/icons-material';
import { StatCard } from '../../components/common/OwnerComponentsMUI'; // Reusing the premium card component

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = localStorage.getItem('admin_token');
                if (!token) return;

                const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api/'}admin/stats/`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setStats(response.data);
            } catch (error) {
                console.error("Failed to fetch admin stats", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending': return { bgcolor: '#fef3c7', color: '#d97706' };
            case 'Confirmed': return { bgcolor: '#e0f2fe', color: '#0284c7' };
            case 'Shipped': return { bgcolor: '#ffedd5', color: '#ea580c' };
            case 'Out for Delivery': return { bgcolor: '#f3e8ff', color: '#9333ea' };
            case 'Delivered': return { bgcolor: '#ecfdf5', color: '#059669' };
            case 'Cancelled': return { bgcolor: '#fee2e2', color: '#dc2626' };
            default: return { bgcolor: '#f1f5f9', color: '#64748b' };
        }
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;

    return (
        <Box>
            <Typography variant="h4" fontWeight="800" sx={{ mb: 4, color: '#1e293b' }}>
                Admin Overview
            </Typography>

            {/* Stats Grid */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Total Users"
                        value={stats?.total_users || 0}
                        icon={People}
                        color="blue"
                        trend="up"
                        trendValue="Active"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Total Revenue"
                        value={`₹${stats?.total_revenue?.toLocaleString() || 0}`}
                        icon={AttachMoney}
                        color="green"
                        trend="up"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Total Orders"
                        value={stats?.total_orders || 0}
                        icon={Receipt}
                        color="indigo"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Products"
                        value={stats?.total_products || 0}
                        icon={ShoppingBag}
                        color="orange"
                    />
                </Grid>
            </Grid>

            {/* Recent Orders Table */}
            <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #e2e8f0' }}>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>
                    Recent Transactions
                </Typography>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 600, color: '#64748b' }}>Customer</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: '#64748b' }}>Product</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: '#64748b' }}>Amount</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: '#64748b' }}>Date</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: '#64748b' }}>Status</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {stats?.recent_orders?.map((order) => (
                                <TableRow key={order.id} hover>
                                    <TableCell sx={{ fontWeight: 500 }}>{order.customer__username}</TableCell>
                                    <TableCell>{order.product__name}</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>₹{order.total_price.toLocaleString()}</TableCell>
                                    <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={order.order_status || 'Pending'}
                                            size="small"
                                            sx={{
                                                ...getStatusColor(order.order_status),
                                                fontWeight: 600,
                                                borderRadius: '6px'
                                            }}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
};

export default AdminDashboard;
