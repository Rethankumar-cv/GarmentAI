import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import api from '../../services/api';
import { DEFAULT_PRODUCT_IMAGE } from '../../constants';
import {
    Box,
    Container,
    Grid,
    Typography,
    Paper,
    Avatar,
    Tab,
    Tabs,
    Button,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    ListItemIcon,
    Divider,
    Chip,
    Stack,
    TextField
} from '@mui/material';
import {
    Person,
    ShoppingBag,
    Favorite,
    Settings,
    Logout,
    LocalShipping,
    CheckCircle
} from '@mui/icons-material';

const OrderItem = ({ id, date, status, total, items, onTrack }) => (
    <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 2, overflow: 'hidden' }}>
        <Box sx={{ bgcolor: 'grey.50', p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
                <Typography variant="caption" color="text.secondary" display="block">ORDER PLACED</Typography>
                <Typography variant="body2" fontWeight="bold">{date}</Typography>
            </Box>
            <Box>
                <Typography variant="caption" color="text.secondary" display="block">TOTAL</Typography>
                <Typography variant="body2" fontWeight="bold">₹{total}</Typography>
            </Box>
            <Box>
                <Typography variant="caption" color="text.secondary" display="block">ORDER # {id}</Typography>
                <Box display="flex" alignItems="center" gap={0.5}>
                    <Typography
                        variant="body2"
                        color="primary"
                        fontWeight="bold"
                        sx={{ cursor: 'pointer' }}
                        onClick={onTrack}
                    >
                        View Details
                    </Typography>
                </Box>
            </Box>
        </Box>
        <Box sx={{ p: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Stack direction="row" alignItems="center" gap={1}>
                    <CheckCircle color="success" fontSize="small" />
                    <Typography variant="body2" fontWeight="bold">{status}</Typography>
                </Stack>
                <Button variant="outlined" size="small" onClick={onTrack}>Track Package</Button>
            </Stack>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
                {items.map((item, idx) => (
                    <Grid item key={idx} xs={12} sm={6}>
                        <Box display="flex" gap={2}>
                            <Box
                                component="img"
                                src={item.image || DEFAULT_PRODUCT_IMAGE}
                                sx={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 1, bgcolor: 'grey.100' }}
                                onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_PRODUCT_IMAGE; }}
                            />
                            <Box>
                                <Typography variant="body2" fontWeight="bold">{item.name}</Typography>
                                <Typography variant="caption" color="text.secondary">Qty: {item.qty}</Typography>
                            </Box>
                        </Box>
                    </Grid>
                ))}
            </Grid>
        </Box>
    </Paper>
);

const CustomerDashboard = () => {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState(0);

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (activeTab === 0 || activeTab === 2) {
            fetchOrders();
        }
    }, [activeTab]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            // Fetch purchases from the new list endpoint
            const res = await api.get('purchase/');
            // Group purchases by minute/second if needed, but for now treat each as an order
            // or we could assume the backend returns a list of purchases.
            // Let's map the Purchase model to the UI format.
            const mappedOrders = res.data.map(purchase => {
                const date = new Date(purchase.created_at).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'short', day: 'numeric'
                });
                return {
                    id: purchase.id,
                    date: date,
                    status: purchase.order_status,
                    total: purchase.total_price.toFixed(2),
                    items: [{
                        name: purchase.product_name || 'Product',
                        qty: purchase.quantity,
                        image: purchase.product_image // Assuming it's in the response
                    }]
                };
            });
            setOrders(mappedOrders);
        } catch (error) {
            console.error("Failed to fetch orders:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="xl" sx={{ py: 6, px: { xs: 2, md: 4 } }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ mb: 4 }}>My Account</Typography>

            <Grid container spacing={4}>
                {/* Sidebar */}
                <Grid item xs={12} md={3}>
                    <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
                        <Box sx={{ p: 3, textAlign: 'center', bgcolor: 'primary.main', color: 'white' }}>
                            <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 2, bgcolor: 'white', color: 'primary.main', fontSize: 32 }}>
                                {user?.name?.charAt(0) || <Person />}
                            </Avatar>
                            <Typography variant="h6" fontWeight="bold">{user?.name || 'User Name'}</Typography>
                            <Typography variant="body2" sx={{ opacity: 0.8 }}>{user?.email || 'user@example.com'}</Typography>
                        </Box>
                        <List component="nav">
                            <ListItem disablePadding>
                                <ListItemButton selected={activeTab === 0} onClick={() => setActiveTab(0)}>
                                    <ListItemIcon><ShoppingBag color={activeTab === 0 ? 'primary' : 'inherit'} /></ListItemIcon>
                                    <ListItemText primary="Orders" primaryTypographyProps={{ fontWeight: activeTab === 0 ? 'bold' : 'medium' }} />
                                </ListItemButton>
                            </ListItem>
                            <ListItem disablePadding>
                                <ListItemButton selected={activeTab === 1} onClick={() => setActiveTab(1)}>
                                    <ListItemIcon><Favorite color={activeTab === 1 ? 'primary' : 'inherit'} /></ListItemIcon>
                                    <ListItemText primary="Wishlist" primaryTypographyProps={{ fontWeight: activeTab === 1 ? 'bold' : 'medium' }} />
                                </ListItemButton>
                            </ListItem>
                            <ListItem disablePadding>
                                <ListItemButton selected={activeTab === 2} onClick={() => setActiveTab(2)}>
                                    <ListItemIcon><Person color={activeTab === 2 ? 'primary' : 'inherit'} /></ListItemIcon>
                                    <ListItemText primary="Profile" primaryTypographyProps={{ fontWeight: activeTab === 2 ? 'bold' : 'medium' }} />
                                </ListItemButton>
                            </ListItem>
                            <Divider sx={{ my: 1 }} />
                            <ListItem disablePadding>
                                <ListItemButton onClick={logout}>
                                    <ListItemIcon><Logout color="error" /></ListItemIcon>
                                    <ListItemText primary="Logout" primaryTypographyProps={{ color: 'error.main', fontWeight: 'bold' }} />
                                </ListItemButton>
                            </ListItem>
                        </List>
                    </Paper>
                </Grid>

                {/* Content */}
                <Grid item xs={12} md={9}>
                    {activeTab === 0 && (
                        <Box>
                            <Typography variant="h5" fontWeight="bold" mb={3}>Order History</Typography>
                            {loading ? (
                                <Typography>Loading orders...</Typography>
                            ) : orders.length > 0 ? (
                                orders.map((order) => (
                                    <OrderItem
                                        key={order.id}
                                        {...order}
                                        onTrack={() => navigate('/customer/orders')}
                                    />
                                ))
                            ) : (
                                <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.50', borderRadius: 3 }}>
                                    <Typography color="text.secondary">No orders found.</Typography>
                                    <Button variant="text" onClick={() => setActiveTab(1)}>Start Shopping</Button>
                                </Paper>
                            )}
                        </Box>
                    )}

                    {activeTab === 1 && (
                        <Box>
                            <Typography variant="h5" fontWeight="bold" mb={3}>My Wishlist</Typography>
                            <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3, bgcolor: 'grey.50' }}>
                                <Favorite sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                                <Typography color="text.secondary">Your wishlist is empty.</Typography>
                                <Button variant="text" color="primary">Explore Products</Button>
                            </Paper>
                        </Box>
                    )}

                    {activeTab === 2 && (
                        <Box>
                            <Typography variant="h5" fontWeight="bold" mb={3}>Personal Information</Typography>
                            <Paper elevation={0} sx={{ p: 4, border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 4 }}>
                                <Grid container spacing={3}>
                                    <Grid item xs={12} sm={6}>
                                        <TextField fullWidth label="Full Name" defaultValue={user?.name} variant="outlined" />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField fullWidth label="Email Address" defaultValue={user?.email} variant="outlined" disabled />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField fullWidth label="Phone Number" defaultValue="+91 98765 43210" variant="outlined" />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Button variant="contained" size="large">Save Changes</Button>
                                    </Grid>
                                </Grid>
                            </Paper>

                            <Typography variant="h6" fontWeight="bold" mb={2}>Recent Orders</Typography>
                            {orders.length > 0 ? (
                                <Box>
                                    {orders.slice(0, 1).map((order) => (
                                        <OrderItem key={order.id} {...order} />
                                    ))}
                                    <Button variant="text" onClick={() => setActiveTab(0)}>View All Orders</Button>
                                </Box>
                            ) : (
                                <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'grey.50', borderRadius: 3 }}>
                                    <Typography color="text.secondary">No recent orders.</Typography>
                                    <Button variant="text" onClick={() => setActiveTab(1)}>Start Shopping</Button>
                                </Paper>
                            )}
                        </Box>
                    )}
                </Grid>
            </Grid>
        </Container>
    );
};

export default CustomerDashboard;
