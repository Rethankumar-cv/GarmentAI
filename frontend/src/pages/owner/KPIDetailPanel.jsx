import React from 'react';
import {
    Drawer,
    Box,
    Typography,
    IconButton,
    Divider,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Chip,
    Button,
    Grid,
    Alert,
    AlertTitle,
    LinearProgress,
    useTheme,
    alpha
} from '@mui/material';
import {
    Close,
    TrendingUp,
    Inventory,
    People,
    ShoppingCart,
    Warning,
    ArrowForward
} from '@mui/icons-material';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const KPIDetailPanel = ({ selectedKPI, onClose, data }) => {
    const theme = useTheme();

    const renderContent = () => {
        switch (selectedKPI) {
            case 'revenue':
                return <RevenueDetails data={data} />;
            case 'orders':
                return <OrdersDetails data={data} />;
            case 'stock':
                return <StockDetails data={data} />;
            case 'customers':
                return <CustomerDetails data={data} />;
            default:
                return null;
        }
    };

    const getTitle = () => {
        switch (selectedKPI) {
            case 'revenue': return { title: 'Revenue Intelligence', icon: TrendingUp, color: 'primary' };
            case 'orders': return { title: 'Order Operations', icon: ShoppingCart, color: 'info' };
            case 'stock': return { title: 'Inventory Risk Analysis', icon: Warning, color: 'error' };
            case 'customers': return { title: 'Customer Insights', icon: People, color: 'secondary' };
            default: return { title: 'Analytics', icon: TrendingUp, color: 'default' };
        }
    };

    const { title, icon: Icon, color } = getTitle();

    return (
        <Drawer
            anchor="right"
            open={Boolean(selectedKPI)}
            onClose={onClose}
            PaperProps={{
                sx: {
                    width: { xs: '100%', sm: 600 },
                    p: 0,
                    borderTopLeftRadius: { sm: 16 },
                    borderBottomLeftRadius: { sm: 16 },
                    boxShadow: theme.shadows[8]
                }
            }}
        >
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                {/* Header */}
                <Box sx={{
                    p: 3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    bgcolor: alpha(theme.palette[color === 'default' ? 'primary' : color].main, 0.04)
                }}>
                    <Box sx={{ display: 'flex', items: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: `${color}.light`, color: `${color}.contrastText` }}>
                            <Icon />
                        </Avatar>
                        <Typography variant="h5" fontWeight="700">
                            {title}
                        </Typography>
                    </Box>
                    <IconButton onClick={onClose} size="large">
                        <Close />
                    </IconButton>
                </Box>

                {/* Content */}
                <Box sx={{ p: 3, overflowY: 'auto', flexGrow: 1 }}>
                    {renderContent()}
                </Box>
            </Box>
        </Drawer>
    );
};

// ================= SUB-COMPONENTS =================

const RevenueDetails = ({ data }) => {
    const theme = useTheme();
    const topProducts = data?.top_products || [];
    const chartData = {
        labels: data?.chart_data?.map(item => item.date) || [],
        datasets: [{
            label: 'Daily Revenue',
            data: data?.chart_data?.map(item => item.revenue) || [],
            borderColor: theme.palette.primary.main,
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
            fill: true,
            tension: 0.4
        }]
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Box sx={{
                p: .5,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
                height: 300
            }}>
                <Line
                    options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                            x: { grid: { display: false } },
                            y: { grid: { borderDash: [5, 5] } }
                        }
                    }}
                    data={chartData}
                />
            </Box>

            <Box>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Top Performing Products
                </Typography>
                <List disablePadding>
                    {topProducts.map((product, idx) => (
                        <ListItem
                            key={idx}
                            sx={{
                                mb: 1.5,
                                bgcolor: 'background.default',
                                borderRadius: 2,
                                border: `1px solid ${theme.palette.divider}`
                            }}
                        >
                            <ListItemText
                                primary={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Typography variant="body2" color="text.secondary" fontWeight="bold" minWidth={24}>
                                            #{idx + 1}
                                        </Typography>
                                        <Typography variant="subtitle1" fontWeight="600">
                                            {product.product__name}
                                        </Typography>
                                    </Box>
                                }
                                secondary={`${product.sales} units sold`}
                            />
                            <Typography variant="h6" color="primary" fontWeight="bold">
                                ₹{product.revenue.toLocaleString()}
                            </Typography>
                        </ListItem>
                    ))}
                </List>
            </Box>
        </Box>
    );
};

const OrdersDetails = ({ data }) => {
    const orders = data?.recent_orders || [];

    const getStatusColor = (status) => {
        if (status === 'Processing') return 'info';
        if (status === 'Shipped') return 'secondary';
        if (status === 'Delivered') return 'success';
        return 'default';
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Grid container spacing={2}>
                <Grid item xs={4}>
                    <Box sx={{ p: 2, bgcolor: 'info.light', borderRadius: 2, textAlign: 'center', color: 'info.contrastText' }}>
                        <Typography variant="h4" fontWeight="bold">
                            {orders.filter(o => o.status === 'Processing').length}
                        </Typography>
                        <Typography variant="caption" fontWeight="bold">Processing</Typography>
                    </Box>
                </Grid>
                <Grid item xs={4}>
                    <Box sx={{ p: 2, bgcolor: 'secondary.light', borderRadius: 2, textAlign: 'center', color: 'secondary.contrastText' }}>
                        <Typography variant="h4" fontWeight="bold">
                            {orders.filter(o => o.status === 'Shipped').length}
                        </Typography>
                        <Typography variant="caption" fontWeight="bold">Shipped</Typography>
                    </Box>
                </Grid>
                <Grid item xs={4}>
                    <Box sx={{ p: 2, bgcolor: 'success.light', borderRadius: 2, textAlign: 'center', color: 'success.contrastText' }}>
                        <Typography variant="h4" fontWeight="bold">
                            {orders.filter(o => o.status === 'Delivered').length}
                        </Typography>
                        <Typography variant="caption" fontWeight="bold">Delivered</Typography>
                    </Box>
                </Grid>
            </Grid>

            <Box>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Recent Orders Pipeline
                </Typography>
                <List disablePadding>
                    {orders.map((order) => (
                        <ListItem
                            key={order.id}
                            sx={{
                                mb: 1.5,
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 2,
                                display: 'block'
                            }}
                        >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Box>
                                    <Typography variant="subtitle2" fontWeight="bold">{order.product}</Typography>
                                    <Typography variant="caption" color="text.secondary">Customer: {order.customer}</Typography>
                                </Box>
                                <Chip
                                    label={order.status}
                                    color={getStatusColor(order.status)}
                                    size="small"
                                    variant="soft" // Using soft if available or filled
                                />
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="caption" color="text.secondary">{order.date}</Typography>
                                <Typography variant="subtitle2" fontWeight="bold">₹{order.amount.toLocaleString()}</Typography>
                            </Box>
                        </ListItem>
                    ))}
                </List>
            </Box>
        </Box>
    );
};

const StockDetails = ({ data }) => {
    const lowStock = data?.inventory_details || [];

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Alert severity="warning" icon={<Warning fontSize="inherit" />}>
                <AlertTitle>Restock Attention Needed</AlertTitle>
                There are <strong>{lowStock.length} items</strong> below safety stock levels. Immediate action recommended.
            </Alert>

            <List disablePadding>
                {lowStock.map((item) => (
                    <ListItem
                        key={item.id}
                        sx={{
                            mb: 1.5,
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 2,
                        }}
                    >
                        <ListItemText
                            primary={
                                <Typography fontWeight="bold">
                                    {item.name}
                                </Typography>
                            }
                            secondary={`Category: ${item.garment_category}`}
                        />
                        <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="h5" color="error" fontWeight="bold">
                                {item.stock}
                            </Typography>
                            <Typography variant="caption" color="error">
                                In Stock
                            </Typography>
                        </Box>
                    </ListItem>
                ))}
            </List>

            <Button
                variant="contained"
                color="error"
                size="large"
                fullWidth
                onClick={() => alert("Restock order has been generated and sent to suppliers.")}
                sx={{ borderRadius: 3, textTransform: 'none', py: 1.5 }}
            >
                Generate Restock Order
            </Button>
        </Box>
    );
};

const CustomerDetails = ({ data }) => {
    const theme = useTheme();
    const stats = data?.customer_stats || { total: 0, new_this_month: 0 };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Grid container spacing={2}>
                <Grid item xs={6}>
                    <Box sx={{ p: 3, bgcolor: 'background.default', borderRadius: 3, textAlign: 'center' }}>
                        <Typography variant="h4" fontWeight="bold" color="text.primary">
                            {stats.total}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Total Customers
                        </Typography>
                    </Box>
                </Grid>
                <Grid item xs={6}>
                    <Box sx={{ p: 3, bgcolor: alpha(theme.palette.secondary.main, 0.1), borderRadius: 3, textAlign: 'center' }}>
                        <Typography variant="h4" fontWeight="bold" color="secondary">
                            +{stats.new_this_month}
                        </Typography>
                        <Typography variant="body2" color="secondary">
                            New this Month
                        </Typography>
                    </Box>
                </Grid>
            </Grid>

            <Box sx={{ p: 3, border: `1px solid ${theme.palette.divider}`, borderRadius: 3 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Customer Retention
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, height: 12, bgcolor: theme.palette.grey[200], borderRadius: 6, overflow: 'hidden' }}>
                    <Box sx={{ width: '65%', height: '100%', bgcolor: 'primary.main' }} />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" color="text.secondary">Returning (65%)</Typography>
                    <Typography variant="caption" color="text.secondary">New (35%)</Typography>
                </Box>
            </Box>

            <Box>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Recent Growth Trend
                </Typography>
                <Box sx={{
                    height: 200,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'background.default',
                    borderRadius: 3,
                    border: `1px dashed ${theme.palette.divider}`,
                    color: 'text.disabled'
                }}>
                    Customer Growth Chart Placeholder
                </Box>
            </Box>
        </Box>
    );
};

export default KPIDetailPanel;
