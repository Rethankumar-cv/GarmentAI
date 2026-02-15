import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import {
    Container,
    Grid,
    Box,
    Button,
    CircularProgress,
    useTheme
} from '@mui/material';
import {
    AttachMoney,
    ShoppingCart,
    Warning,
    TrendingUp,
    People,
    Inventory,
    ArrowForward
} from '@mui/icons-material';
import { LineChart } from '@mui/x-charts/LineChart';
import { useNavigate } from 'react-router-dom';
import { DashboardCard, StatCard, AIInsightBadge, PageHeader } from '../../components/common/OwnerComponentsMUI';
import KPIDetailPanel from './KPIDetailPanel';

const OwnerDashboard = () => {
    const theme = useTheme();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedKPI, setSelectedKPI] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const response = await api.get('dashboard/owner/');
                setData(response.data);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const handleGenerateReport = async () => {
        try {
            const response = await api.get('owner/export-report/');
            console.log("Report Data:", response.data);
            alert(`Report Generated Successfully!\n\nSummary:\nRevenue: ₹${response.data.summary.total_revenue}\nOrders: ${response.data.summary.total_orders}\n\n(Report file would be downloaded here in production)`);
        } catch (error) {
            console.error("Error generating report:", error);
            alert("Failed to generate report. Please try again.");
        }
    };

    if (loading) return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
            <CircularProgress size={60} thickness={4} />
        </Box>
    );

    // Prepare data for MUI X Chart
    const chartLabels = data?.chart_data?.map(item => item.date) || [];
    const chartRevenue = data?.chart_data?.map(item => item.revenue) || [];

    return (
        <Container maxWidth="xl" sx={{ py: 4 }} disableGutters>
            {/* 1. Header Section */}
            <Box sx={{ px: 3, mb: 4 }}>
                <PageHeader
                    title="Business Overview"
                    subtitle="Performance metrics and AI-driven insights for today."
                    action={
                        <Button
                            variant="contained"
                            onClick={handleGenerateReport}
                            endIcon={<ArrowForward />}
                            sx={{
                                borderRadius: '10px',
                                textTransform: 'none',
                                fontWeight: 600,
                                px: 3,
                                py: 1.2,
                                boxShadow: theme.shadows[2],
                                bgcolor: theme.palette.primary.main,
                                '&:hover': {
                                    bgcolor: theme.palette.primary.dark,
                                    boxShadow: theme.shadows[4]
                                }
                            }}
                        >
                            Generate Report
                        </Button>
                    }
                />
            </Box>

            <Box sx={{ px: 3 }}>
                {/* 2. KPI Grid (Strict 4 columns) */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard
                            title="Total Revenue"
                            value={`₹${data?.total_revenue?.toLocaleString() || 0}`}
                            trend="up"
                            trendValue="+12.5%"
                            icon={AttachMoney}
                            color="indigo"
                            subtext="vs last month"
                            onClick={() => setSelectedKPI('revenue')}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard
                            title="Active Orders"
                            value={data?.total_orders || 0}
                            trend="up"
                            trendValue="+3.2%"
                            icon={ShoppingCart}
                            color="blue"
                            subtext="Processing now"
                            onClick={() => setSelectedKPI('orders')}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard
                            title="Stock Alerts"
                            value={data?.low_stock_alerts || 0}
                            trend="down"
                            trendValue={data?.low_stock_alerts > 0 ? "Critical" : "Healthy"}
                            icon={Warning}
                            color={data?.low_stock_alerts > 0 ? "red" : "emerald"}
                            subtext="Items below safety stock"
                            onClick={() => setSelectedKPI('stock')}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard
                            title="Customer Growth"
                            value={data?.customer_stats?.total || "2,543"}
                            trend="up"
                            trendValue="+18.4%"
                            icon={People}
                            color="purple"
                            subtext="Total Users"
                            onClick={() => setSelectedKPI('customers')}
                        />
                    </Grid>
                </Grid>

                {/* 3. Main Analytics Grid (Chart + Insights) */}
                <Grid container spacing={3} alignItems="stretch">
                    {/* Revenue Chart - 8 Columns */}
                    <Grid item xs={12} lg={8}>
                        <DashboardCard title="Revenue Trend" icon={TrendingUp}>
                            <Box sx={{ width: '100%', height: 400 }}>
                                <LineChart
                                    height={400} // Explicit height fixes cut-off issue
                                    series={[
                                        {
                                            data: chartRevenue,
                                            label: 'Revenue',
                                            area: true,
                                            color: theme.palette.primary.main,
                                            showMark: false,
                                            curve: "catmullRom",
                                            valueFormatter: (v) => `₹${v.toLocaleString()}`
                                        },
                                    ]}
                                    xAxis={[{
                                        scaleType: 'point',
                                        data: chartLabels,
                                        tickLabelStyle: { fontSize: 12, fill: theme.palette.text.secondary }
                                    }]}
                                    yAxis={[{
                                        tickLabelStyle: { fontSize: 12, fill: theme.palette.text.secondary }
                                    }]}
                                    sx={{
                                        '.MuiLineElement-root': {
                                            strokeWidth: 3,
                                            filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.1))'
                                        },
                                        '.MuiAreaElement-series-auto-generated-id-0': {
                                            fill: `url(#gradient-${theme.palette.primary.main})`,
                                            opacity: 0.3
                                        },
                                    }}
                                    grid={{ vertical: false, horizontal: true }}
                                    margin={{ left: 60, right: 20, top: 20, bottom: 30 }}
                                    slotProps={{
                                        legend: { hidden: true }
                                    }}
                                >
                                    <defs>
                                        <linearGradient id={`gradient-${theme.palette.primary.main}`} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor={theme.palette.primary.main} stopOpacity={0.3} />
                                            <stop offset="100%" stopColor={theme.palette.primary.main} stopOpacity={0.0} />
                                        </linearGradient>
                                    </defs>
                                </LineChart>
                            </Box>
                        </DashboardCard>
                    </Grid>

                    {/* Insights Panel - 4 Columns */}
                    <Grid item xs={12} lg={4}>
                        <DashboardCard
                            title="AI Insights"
                            icon={Inventory}
                            action={
                                <Button
                                    size="small"
                                    sx={{ textTransform: 'none', fontWeight: 600 }}
                                    onClick={() => navigate('/owner/predictions/recommendations')}
                                >
                                    View All
                                </Button>
                            }
                        >
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%', overflowY: 'auto' }}>
                                {data?.insights?.map((insight, index) => (
                                    <AIInsightBadge
                                        key={index}
                                        type={insight.type}
                                        text={insight.text}
                                    />
                                ))}
                                {(!data?.insights || data.insights.length === 0) && (
                                    <AIInsightBadge type="insight" text="No pending insights." />
                                )}
                            </Box>
                        </DashboardCard>
                    </Grid>
                </Grid>
            </Box>

            <KPIDetailPanel
                selectedKPI={selectedKPI}
                onClose={() => setSelectedKPI(null)}
                data={data}
            />
        </Container>
    );
};

export default OwnerDashboard;
