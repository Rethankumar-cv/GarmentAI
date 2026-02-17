import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Grid, Card, CardContent, Chip, Stepper, Step, StepLabel,
    Button, CircularProgress, Divider, Stack, IconButton, Collapse
} from '@mui/material';
import {
    LocalShipping, CheckCircle, AccessTime, Inventory as InventoryIcon,
    ExpandMore, ExpandLess, Refresh
} from '@mui/icons-material';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';
import { DEFAULT_PRODUCT_IMAGE } from '../../constants';

const STATUS_STEPS = ['Pending', 'Confirmed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];

const STATUS_COLORS = {
    'Pending': 'default',
    'Confirmed': 'info',
    'Packed': 'secondary',
    'Shipped': 'warning',
    'Out for Delivery': 'primary',
    'Delivered': 'success',
    'Cancelled': 'error'
};

const MyOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    // token not needed
    const [expandedId, setExpandedId] = useState(null);

    useEffect(() => {
        fetchOrders();
        // Poll every 10 seconds for real-time updates
        const interval = setInterval(fetchOrders, 10000);
        return () => clearInterval(interval);
    }, []);

    const fetchOrders = async () => {
        // Don't set loading on poll to avoid flicker, only on initial load
        if (orders.length === 0) setLoading(true);
        try {
            const response = await api.get('customer/orders/');
            setOrders(response.data);
        } catch (err) {
            console.error("Error fetching orders:", err);
        } finally {
            setLoading(false);
        }
    };

    const getActiveStep = (status) => {
        if (status === 'Cancelled') return -1;
        return STATUS_STEPS.indexOf(status);
    };

    const toggleExpand = (id) => {
        setExpandedId(expandedId === id ? null : id);
    };

    if (loading && orders.length === 0) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" fontWeight="bold">My Orders</Typography>
                <Button startIcon={<Refresh />} onClick={fetchOrders}>Refresh</Button>
            </Box>

            {orders.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <Typography color="text.secondary">No orders found.</Typography>
                    <Button variant="contained" sx={{ mt: 2 }} href="/customer/shop">
                        Start Shopping
                    </Button>
                </Paper>
            ) : (
                <Stack spacing={3}>
                    {orders.map((order) => (
                        <Card key={order.id} elevation={3} sx={{ borderRadius: 2 }}>
                            <CardContent>
                                <Grid container spacing={2} alignItems="center">
                                    {/* Product Image */}
                                    <Grid item xs={3} sm={2} md={1}>
                                        <Box
                                            component="img"
                                            src={order.product_image || DEFAULT_PRODUCT_IMAGE}
                                            alt={order.product_name}
                                            sx={{ width: '100%', borderRadius: 1, aspectRatio: '1/1', objectFit: 'cover', bgcolor: 'grey.100' }}
                                            onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_PRODUCT_IMAGE; }}
                                        />
                                    </Grid>

                                    {/* Order Details */}
                                    <Grid item xs={9} sm={6} md={4}>
                                        <Typography variant="h6" fontWeight="bold">{order.product_name}</Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Order #{order.id} • {new Date(order.created_at).toLocaleDateString()}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Qty: {order.quantity} • ₹{order.total_price}
                                        </Typography>
                                        <Typography variant="caption" sx={{ fontFamily: 'monospace', bgcolor: 'grey.100', px: 1, borderRadius: 1 }}>
                                            Tracking ID: {order.tracking_id || 'Generating...'}
                                        </Typography>
                                    </Grid>

                                    {/* Status Chip */}
                                    <Grid item xs={12} sm={4} md={3} sx={{ textAlign: { xs: 'left', sm: 'center' } }}>
                                        <Chip
                                            label={order.order_status}
                                            color={STATUS_COLORS[order.order_status] || 'default'}
                                            icon={order.order_status === 'Delivered' ? <CheckCircle /> : <LocalShipping />}
                                            variant="outlined"
                                        />
                                        {order.estimated_delivery && (
                                            <Typography variant="caption" display="block" sx={{ mt: 1, color: 'success.main' }}>
                                                Est. Delivery: {order.estimated_delivery}
                                            </Typography>
                                        )}
                                    </Grid>

                                    {/* Actions */}
                                    <Grid item xs={12} md={4} sx={{ textAlign: 'right' }}>
                                        <Button
                                            endIcon={expandedId === order.id ? <ExpandLess /> : <ExpandMore />}
                                            onClick={() => toggleExpand(order.id)}
                                        >
                                            Track Order
                                        </Button>
                                    </Grid>
                                </Grid>

                                {/* Expanded Tracker */}
                                <Collapse in={expandedId === order.id}>
                                    <Divider sx={{ my: 2 }} />
                                    <Box sx={{ width: '100%', py: 2 }}>
                                        {order.order_status === 'Cancelled' ? (
                                            <Alert severity="error">This order has been cancelled.</Alert>
                                        ) : (
                                            <Stepper activeStep={getActiveStep(order.order_status)} alternativeLabel>
                                                {STATUS_STEPS.map((label) => (
                                                    <Step key={label}>
                                                        <StepLabel>{label}</StepLabel>
                                                    </Step>
                                                ))}
                                            </Stepper>
                                        )}
                                    </Box>
                                    {order.status_history && order.status_history.length > 0 && (
                                        <Box sx={{ mt: 2, bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
                                            <Typography variant="subtitle2" gutterBottom>Update History</Typography>
                                            {order.status_history.map((entry, idx) => (
                                                <Box key={idx} sx={{ display: 'flex', gap: 2, mb: 1 }}>
                                                    <Typography variant="caption" color="text.secondary" sx={{ minWidth: 120 }}>
                                                        {new Date(entry.timestamp).toLocaleString()}
                                                    </Typography>
                                                    <Typography variant="caption">
                                                        {entry.note}
                                                    </Typography>
                                                </Box>
                                            ))}
                                        </Box>
                                    )}
                                </Collapse>
                            </CardContent>
                        </Card>
                    ))}
                </Stack>
            )}
        </Box>
    );
};

export default MyOrders;
