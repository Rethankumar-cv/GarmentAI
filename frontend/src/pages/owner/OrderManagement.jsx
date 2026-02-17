import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Chip, Button, MenuItem, FormControl, Select, InputLabel, Grid, TextField,
    CircularProgress, Alert, Snackbar
} from '@mui/material';
import {
    FilterList, Search, LocalShipping, CheckCircle, Cancel, AccessTime,
    Inventory as InventoryIcon
} from '@mui/icons-material';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';

// Status Configuration
const STATUS_COLORS = {
    'Pending': 'default',
    'Confirmed': 'info',
    'Packed': 'secondary',
    'Shipped': 'warning',
    'Out for Delivery': 'primary',
    'Delivered': 'success',
    'Cancelled': 'error'
};

const STATUS_OPTIONS = [
    'Pending', 'Confirmed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'
];

const OrderManagement = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterStatus, setFilterStatus] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    // token not needed as api interceptor handles it

    // Notification State
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const response = await api.get('owner/orders/');
            setOrders(response.data);
            setError(null);
        } catch (err) {
            console.error("Error fetching orders:", err);
            setError("Failed to load orders.");
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (orderId, newStatus) => {
        try {
            await api.patch(`owner/orders/${orderId}/`,
                { order_status: newStatus }
            );

            // Update local state
            setOrders(orders.map(order =>
                order.id === orderId ? { ...order, order_status: newStatus } : order
            ));

            setNotification({ open: true, message: `Order #${orderId} status updated to ${newStatus}`, severity: 'success' });
        } catch (err) {
            console.error("Update failed:", err);
            setNotification({ open: true, message: "Failed to update status", severity: 'error' });
        }
    };

    const filteredOrders = orders.filter(order => {
        const matchesStatus = filterStatus === 'All' || order.order_status === filterStatus;
        const matchesSearch =
            (order.customer_username && order.customer_username.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (order.product_name && order.product_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (order.tracking_id && order.tracking_id.toLowerCase().includes(searchQuery.toLowerCase())) ||
            String(order.id).includes(searchQuery);
        return matchesStatus && matchesSearch;
    });

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Delivered': return <CheckCircle fontSize="small" />;
            case 'Cancelled': return <Cancel fontSize="small" />;
            case 'Shipped': return <LocalShipping fontSize="small" />;
            case 'Pending': return <AccessTime fontSize="small" />;
            default: return <InventoryIcon fontSize="small" />;
        }
    };

    return (
        <Box sx={{ p: 0 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4" fontWeight="bold" sx={{ color: 'text.primary' }}>
                    Order Management
                </Typography>
                <Button
                    variant="outlined"
                    startIcon={<FilterList />}
                    onClick={fetchOrders}
                >
                    Refresh
                </Button>
            </Box>

            {/* Filters */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={4}>
                        <TextField
                            fullWidth
                            placeholder="Search Order ID, Customer, or Product..."
                            variant="outlined"
                            size="small"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            InputProps={{
                                startAdornment: <Search sx={{ color: 'text.secondary', mr: 1 }} />
                            }}
                        />
                    </Grid>
                    <Grid item xs={6} md={3}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Status Filter</InputLabel>
                            <Select
                                value={filterStatus}
                                label="Status Filter"
                                onChange={(e) => setFilterStatus(e.target.value)}
                            >
                                <MenuItem value="All">All Statuses</MenuItem>
                                {STATUS_OPTIONS.map(status => (
                                    <MenuItem key={status} value={status}>{status}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>
            </Paper>

            {/* Orders Table */}
            <TableContainer component={Paper} elevation={2}>
                <Table>
                    <TableHead sx={{ bgcolor: 'action.hover' }}>
                        <TableRow>
                            <TableCell><strong>Order ID</strong></TableCell>
                            <TableCell><strong>Date</strong></TableCell>
                            <TableCell><strong>Customer</strong></TableCell>
                            <TableCell><strong>Product</strong></TableCell>
                            <TableCell><strong>Amount</strong></TableCell>
                            <TableCell><strong>Status</strong></TableCell>
                            <TableCell align="right"><strong>Update Status</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                                    <CircularProgress />
                                </TableCell>
                            </TableRow>
                        ) : filteredOrders.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                                    <Typography color="text.secondary">No orders found.</Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredOrders.map((order) => (
                                <TableRow key={order.id} hover>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight="bold">#{order.id}</Typography>
                                        <Typography variant="caption" color="text.secondary">{order.tracking_id || 'No Track ID'}</Typography>
                                    </TableCell>
                                    <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                                    <TableCell>{order.customer_username || 'Unknown'}</TableCell>
                                    <TableCell>
                                        <Typography variant="body2">{order.product_name}</Typography>
                                        <Typography variant="caption" color="text.secondary">Qty: {order.quantity}</Typography>
                                    </TableCell>
                                    <TableCell>₹{order.total_price}</TableCell>
                                    <TableCell>
                                        <Chip
                                            icon={getStatusIcon(order.order_status)}
                                            label={order.order_status}
                                            color={STATUS_COLORS[order.order_status] || 'default'}
                                            size="small"
                                            variant="outlined"
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <FormControl size="small" sx={{ minWidth: 140 }}>
                                            <Select
                                                value={order.order_status}
                                                displayEmpty
                                                onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                                                sx={{ fontSize: '0.875rem' }}
                                                variant="standard"
                                                disableUnderline
                                            >
                                                {STATUS_OPTIONS.map(status => (
                                                    <MenuItem key={status} value={status}>
                                                        {status}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <Snackbar
                open={notification.open}
                autoHideDuration={6000}
                onClose={() => setNotification({ ...notification, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert onClose={() => setNotification({ ...notification, open: false })} severity={notification.severity} sx={{ width: '100%' }}>
                    {notification.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default OrderManagement;
