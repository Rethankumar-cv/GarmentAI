import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Grid, Card, CardContent, CircularProgress, Alert,
    Chip, Divider, Paper, useTheme, List, ListItem
} from '@mui/material';
import {
    Assessment, Storage, Warning, CheckCircle, ErrorOutline,
    Timeline, ShowChart, Dataset
} from '@mui/icons-material';

const AdminMLOps = () => {
    const theme = useTheme();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchMLOpsData = async () => {
            try {
                const token = localStorage.getItem('token');

                // Construct the base URL robustly.
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

                const response = await fetch(`${apiUrl}/api/admin/ml-observability/`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error(`Failed to fetch MLOps data: ${response.status} ${response.statusText}`);
                }

                const json = await response.json();
                console.log("MLOps Dashboard Data:", json);

                // If it's returning the direct schema object
                setData(json);

            } catch (err) {
                console.error("Error fetching ML Observability data:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchMLOpsData();

        // Optional: Refresh data every 30 seconds
        const intervalId = setInterval(fetchMLOpsData, 30000);
        return () => clearInterval(intervalId);
    }, []);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress size={60} thickness={4} sx={{ color: theme.palette.primary.main }} />
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
                Error loading MLOps Dashboard: {error}
            </Alert>
        );
    }

    if (!data) return null;

    // Destructure based on the known schema
    const { pipeline, models, drift, performance, alerts, s3, dataset } = data;

    // Helper functions for formatting
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString([], {
            dateStyle: 'short', timeStyle: 'short'
        });
    };

    const getStatusChip = (status) => {
        const isSuccess = status === 'success' || status === 'ok' || status === true;
        return (
            <Chip
                size="small"
                icon={isSuccess ? <CheckCircle fontSize="small" /> : <ErrorOutline fontSize="small" />}
                label={String(status).toUpperCase()}
                color={isSuccess ? "success" : "error"}
                variant="outlined"
            />
        );
    };

    return (
        <Box sx={{ p: { xs: 1, md: 3 } }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                <Typography variant="h4" fontWeight="700" color="text.primary">
                    <Assessment sx={{ mr: 1, verticalAlign: 'middle', fontSize: 36, color: theme.palette.primary.main }} />
                    MLOps Observability
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Last Updated: {formatDate(data.generated_at)}
                </Typography>
            </Box>

            {/* Top Level Alerts Summary */}
            {alerts && alerts.summary && alerts.summary.total_alerts > 0 && (
                <Alert
                    severity={alerts.summary.critical > 0 ? "error" : "warning"}
                    sx={{ mb: 4, borderRadius: 2, alignItems: 'center' }}
                >
                    <Typography variant="subtitle1" fontWeight="bold">
                        Pipeline Alerts Detected
                    </Typography>
                    <Typography variant="body2">
                        {alerts.summary.unacknowledged} unacknowledged issues found. Last alert: {formatDate(alerts.summary.last_alert)}
                    </Typography>
                </Alert>
            )}

            <Grid container spacing={3}>
                {/* Infrastructure & Pipeline Card */}
                <Grid item xs={12} md={6} lg={4}>
                    <Card sx={{ height: '100%', borderRadius: 3, boxShadow: theme.shadows[2] }}>
                        <CardContent>
                            <Box display="flex" alignItems="center" mb={2}>
                                <Storage color="primary" sx={{ mr: 1 }} />
                                <Typography variant="h6" fontWeight="bold">Data Pipeline</Typography>
                            </Box>
                            <Divider sx={{ mb: 2 }} />

                            <Box display="flex" justifyContent="space-between" mb={1.5}>
                                <Typography color="text.secondary" variant="body2">Last Run:</Typography>
                                <Typography variant="body2" fontWeight="medium">{formatDate(pipeline?.last_run)}</Typography>
                            </Box>
                            <Box display="flex" justifyContent="space-between" mb={1.5}>
                                <Typography color="text.secondary" variant="body2">Status:</Typography>
                                {getStatusChip(pipeline?.status)}
                            </Box>
                            <Box display="flex" justifyContent="space-between" mb={1.5}>
                                <Typography color="text.secondary" variant="body2">Rows Processed:</Typography>
                                <Typography variant="body2" fontWeight="medium">
                                    {pipeline?.rows_processed?.toLocaleString()} / {pipeline?.raw_rows?.toLocaleString()}
                                </Typography>
                            </Box>
                            <Box display="flex" justifyContent="space-between" mb={1.5}>
                                <Typography color="text.secondary" variant="body2">Duration:</Typography>
                                <Typography variant="body2" fontWeight="medium">{pipeline?.duration_seconds}s</Typography>
                            </Box>
                            <Box display="flex" justifyContent="space-between" mt={3} p={1.5} bgcolor="rgba(0,0,0,0.02)" borderRadius={2}>
                                <Typography color="text.secondary" variant="body2" fontWeight="bold">S3 Storage:</Typography>
                                <Box display="flex" alignItems="center" gap={1}>
                                    {getStatusChip(s3?.ok)}
                                    <Typography variant="caption">{s3?.bucket} ({s3?.region})</Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Model Registry & Performance Card */}
                <Grid item xs={12} md={6} lg={4}>
                    <Card sx={{ height: '100%', borderRadius: 3, boxShadow: theme.shadows[2] }}>
                        <CardContent>
                            <Box display="flex" alignItems="center" mb={2}>
                                <ShowChart color="secondary" sx={{ mr: 1 }} />
                                <Typography variant="h6" fontWeight="bold">Model Registry</Typography>
                            </Box>
                            <Divider sx={{ mb: 2 }} />

                            <Box mb={2}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Active Versions</Typography>
                                {models?.active_versions && Object.entries(models.active_versions).map(([model, version]) => (
                                    <Box key={model} display="flex" justifyContent="space-between" mb={0.5}>
                                        <Typography variant="body2">{model.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}:</Typography>
                                        <Chip label={version} size="small" variant="filled" color="primary" sx={{ height: 20 }} />
                                    </Box>
                                ))}
                            </Box>

                            <Divider sx={{ my: 2 }} />
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Demand Model Performance</Typography>
                                <Grid container spacing={1}>
                                    <Grid item xs={4}>
                                        <Paper elevation={0} sx={{ p: 1, bgcolor: 'rgba(0,0,0,0.03)', textAlign: 'center', borderRadius: 2 }}>
                                            <Typography variant="caption" color="text.secondary" display="block">RMSE</Typography>
                                            <Typography variant="body2" fontWeight="bold">{performance?.demand_model_rmse?.toFixed(2) || 'N/A'}</Typography>
                                        </Paper>
                                    </Grid>
                                    <Grid item xs={4}>
                                        <Paper elevation={0} sx={{ p: 1, bgcolor: 'rgba(0,0,0,0.03)', textAlign: 'center', borderRadius: 2 }}>
                                            <Typography variant="caption" color="text.secondary" display="block">MAE</Typography>
                                            <Typography variant="body2" fontWeight="bold">{performance?.demand_model_mae?.toFixed(2) || 'N/A'}</Typography>
                                        </Paper>
                                    </Grid>
                                    <Grid item xs={4}>
                                        <Paper elevation={0} sx={{ p: 1, bgcolor: 'rgba(0,0,0,0.03)', textAlign: 'center', borderRadius: 2 }}>
                                            <Typography variant="caption" color="text.secondary" display="block">R²</Typography>
                                            <Typography variant="body2" fontWeight="bold">{performance?.demand_model_r2?.toFixed(3) || 'N/A'}</Typography>
                                        </Paper>
                                    </Grid>
                                </Grid>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Data Drift Card */}
                <Grid item xs={12} md={6} lg={4}>
                    <Card sx={{ height: '100%', borderRadius: 3, boxShadow: theme.shadows[2] }}>
                        <CardContent>
                            <Box display="flex" alignItems="center" mb={2}>
                                <Timeline color="warning" sx={{ mr: 1 }} />
                                <Typography variant="h6" fontWeight="bold">Data Drift Analysis</Typography>
                            </Box>
                            <Divider sx={{ mb: 2 }} />

                            <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                                <Box>
                                    <Typography color="text.secondary" variant="body2">Drift Score</Typography>
                                    <Typography variant="h4" fontWeight="bold" color={drift?.drift_detected ? 'error.main' : 'success.main'}>
                                        {drift?.drift_score?.toFixed(4) || "0.00"}
                                    </Typography>
                                </Box>
                                <Box textAlign="right">
                                    <Typography color="text.secondary" variant="body2" gutterBottom>Status</Typography>
                                    {getStatusChip(drift?.status)}
                                </Box>
                            </Box>

                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Feature Variances</Typography>
                            <Box sx={{ maxHeight: 180, overflowY: 'auto', pr: 1 }}>
                                {drift?.feature_scores && Object.entries(drift.feature_scores).map(([feature, score]) => (
                                    <Box key={feature} display="flex" justifyContent="space-between" mb={1}>
                                        <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{feature.replace('_', ' ')}</Typography>
                                        <Typography variant="body2" fontWeight="medium" sx={{ fontSize: '0.8rem' }}>{score.toFixed(3)}</Typography>
                                    </Box>
                                ))}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Dataset Summary & Recent Alerts */}
                <Grid item xs={12} lg={6}>
                    <Card sx={{ height: '100%', borderRadius: 3, boxShadow: theme.shadows[2] }}>
                        <CardContent>
                            <Box display="flex" alignItems="center" mb={2}>
                                <Dataset color="info" sx={{ mr: 1 }} />
                                <Typography variant="h6" fontWeight="bold">Dataset Overview</Typography>
                            </Box>
                            <Divider sx={{ mb: 2 }} />

                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Typography color="text.secondary" variant="body2">Total Products</Typography>
                                    <Typography variant="h6" fontWeight="medium">{dataset?.products?.toLocaleString()}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography color="text.secondary" variant="body2">Total Customers</Typography>
                                    <Typography variant="h6" fontWeight="medium">{dataset?.customers?.toLocaleString()}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography color="text.secondary" variant="body2" mt={1}>Date Range</Typography>
                                    <Typography variant="body2" fontWeight="medium">
                                        {dataset?.date_range?.from} — {dataset?.date_range?.to}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} lg={6}>
                    <Card sx={{ height: '100%', borderRadius: 3, boxShadow: theme.shadows[2], overflow: 'hidden' }}>
                        <CardContent sx={{ pb: 1 }}>
                            <Box display="flex" alignItems="center" mb={2}>
                                <Warning color="error" sx={{ mr: 1 }} />
                                <Typography variant="h6" fontWeight="bold">Recent Warnings</Typography>
                            </Box>
                            <Divider sx={{ mb: 0 }} />
                        </CardContent>

                        <List sx={{ width: '100%', bgcolor: 'background.paper', p: 0, maxHeight: 220, overflow: 'auto' }}>
                            {alerts?.recent && alerts.recent.length > 0 ? (
                                alerts.recent.map((alert, idx) => (
                                    <React.Fragment key={alert.id || idx}>
                                        <ListItem alignItems="flex-start" sx={{ py: 1.5, px: 2 }}>
                                            <Box display="flex" width="100%" flexDirection="column">
                                                <Box display="flex" justifyContent="space-between" width="100%">
                                                    <Typography component="span" variant="subtitle2" color="error.main" fontWeight="bold">
                                                        [{alert.type}]
                                                    </Typography>
                                                    <Typography component="span" variant="caption" color="text.secondary">
                                                        {formatDate(alert.timestamp)}
                                                    </Typography>
                                                </Box>
                                                <Typography component="span" variant="body2" color="text.primary" sx={{ mt: 0.5 }}>
                                                    {alert.message}
                                                </Typography>
                                                {alert.metadata && alert.metadata.filename && (
                                                    <Typography component="span" variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                                                        File: {alert.metadata.filename}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </ListItem>
                                        {idx < alerts.recent.length - 1 && <Divider component="li" />}
                                    </React.Fragment>
                                ))
                            ) : (
                                <Box p={3} textAlign="center">
                                    <CheckCircle color="success" sx={{ fontSize: 40, mb: 1, opacity: 0.5 }} />
                                    <Typography variant="body2" color="text.secondary">No recent warnings found.</Typography>
                                </Box>
                            )}
                        </List>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default AdminMLOps;
