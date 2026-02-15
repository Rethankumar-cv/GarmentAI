import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
    Box, Paper, Typography, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Chip, Avatar, Tooltip, CircularProgress,
    IconButton, Snackbar, Alert
} from '@mui/material';
import { Assignment, LocalShipping, Delete, Visibility } from '@mui/icons-material';

const AdminOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

    const fetchOrders = async () => {
        const token = localStorage.getItem('admin_token');
        if (!token) return;
        try {
            const response = await axios.get('http://localhost:8000/api/admin/orders/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setOrders(response.data);
        } catch (error) {
            console.error("Failed to fetch orders", error);
            if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                localStorage.removeItem('admin_token');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this order record? This action cannot be undone.")) return;

        const token = localStorage.getItem('admin_token');
        try {
            await axios.delete(`http://localhost:8000/api/admin/orders/${id}/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setNotification({ open: true, message: 'Order deleted successfully', severity: 'success' });
            fetchOrders();
        } catch (error) {
            console.error("Failed to delete order", error);
            setNotification({ open: true, message: 'Failed to delete order', severity: 'error' });
        }
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>;

    return (
        <Box>
            <Typography variant="h4" fontWeight="800" sx={{ mb: 4, color: '#1e293b' }}>
                Order History
            </Typography>

            <Paper elevation={0} sx={{ borderRadius: 4, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                <TableContainer>
                    <Table>
                        <TableHead sx={{ bgcolor: '#f8fafc' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Order ID</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Customer</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Product</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Date</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Amount</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Status</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700, color: '#475569' }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {orders.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                                        <Typography color="text.secondary">No orders found.</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                orders.map((order) => (
                                    <TableRow key={order.id} hover>
                                        <TableCell>
                                            <Typography variant="body2" fontFamily="monospace" fontWeight={600}>
                                                #{order.id.toString().padStart(5, '0')}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <Avatar sx={{ width: 28, height: 28, bgcolor: '#e0e7ff', color: '#4f46e5', fontSize: 12 }}>
                                                    {order.customer[0].toUpperCase()}
                                                </Avatar>
                                                <Typography variant="body2">{order.customer}</Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                                                {order.product}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Qty: {order.quantity}
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={{ color: '#64748b' }}>
                                            {new Date(order.date).toLocaleDateString()}
                                            <Typography variant="caption" display="block" color="text.disabled">
                                                {new Date(order.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </Typography>
                                        </TableCell>
                                        <TableCell fontWeight={600}>₹{order.total_price.toLocaleString()}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label="Completed"
                                                size="small"
                                                icon={<LocalShipping sx={{ fontSize: '14px !important' }} />}
                                                sx={{
                                                    bgcolor: '#ecfdf5',
                                                    color: '#059669',
                                                    fontWeight: 600,
                                                    '& .MuiChip-icon': { color: 'inherit' }
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                                <Tooltip title="Delete">
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => handleDelete(order.id)}
                                                    >
                                                        <Delete fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            <Snackbar
                open={notification.open}
                autoHideDuration={6000}
                onClose={() => setNotification({ ...notification, open: false })}
            >
                <Alert severity={notification.severity} sx={{ width: '100%' }}>
                    {notification.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default AdminOrders;
