import React from 'react';
import { Paper, Box, Typography, Chip, useTheme, Avatar } from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

// ==================== PREMIUM DASHBOARD COMPONENTS ====================

export const DashboardCard = ({ children, title, icon: Icon, action, className = "" }) => {
    const theme = useTheme();

    return (
        <Paper
            elevation={0}
            className={className}
            sx={{
                p: 3, // 24px internal padding
                borderRadius: '16px',
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)', // Soft shadow
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0px 12px 30px rgba(0, 0, 0, 0.08)',
                }
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    {Icon && (
                        <Avatar
                            sx={{
                                bgcolor: `${theme.palette.primary.main}15`,
                                color: theme.palette.primary.main,
                                width: 32,
                                height: 32
                            }}
                        >
                            <Icon sx={{ fontSize: 18 }} />
                        </Avatar>
                    )}
                    <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem', letterSpacing: '-0.02em' }}>
                        {title}
                    </Typography>
                </Box>
                {action}
            </Box>
            <Box sx={{ flexGrow: 1 }}>
                {children}
            </Box>
        </Paper>
    );
};

export const StatCard = ({ title, value, trend, trendValue, icon: Icon, color = "indigo", subtext, onClick }) => {
    const isPositive = trend === 'up';
    const theme = useTheme();

    // Map color strings to theme colors if needed, or use specific hexes
    const colorMap = {
        indigo: theme.palette.primary.main,
        blue: '#3b82f6',
        green: '#10b981',
        emerald: '#10b981',
        red: '#ef4444',
        purple: '#8b5cf6',
        orange: '#f97316'
    };

    const accentColor = colorMap[color] || theme.palette.primary.main;

    return (
        <Paper
            elevation={0}
            onClick={onClick}
            sx={{
                p: 2.5,
                borderRadius: '16px',
                border: '1px solid',
                borderColor: 'divider',
                cursor: onClick ? 'pointer' : 'default',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease-in-out',
                bgcolor: 'background.paper',
                boxShadow: '0px 2px 10px rgba(0,0,0,0.02)',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: `0px 12px 24px -10px ${accentColor}40`, // Colored shadow glow
                    borderColor: accentColor,
                }
            }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Avatar
                    variant="rounded"
                    sx={{
                        bgcolor: `${accentColor}15`,
                        color: accentColor,
                        width: 44,
                        height: 44,
                        borderRadius: '12px'
                    }}
                >
                    <Icon fontSize="small" />
                </Avatar>

                {trendValue && (
                    <Chip
                        label={trendValue}
                        size="small"
                        icon={isPositive ? <TrendingUp sx={{ fontSize: '14px !important' }} /> : <TrendingDown sx={{ fontSize: '14px !important' }} />}
                        sx={{
                            height: 24,
                            bgcolor: isPositive ? '#ecfdf5' : '#fef2f2',
                            color: isPositive ? '#059669' : '#dc2626',
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            border: '1px solid',
                            borderColor: isPositive ? '#d1fae5' : '#fee2e2',
                            '& .MuiChip-icon': { color: 'inherit' }
                        }}
                    />
                )}
            </Box>

            <Box>
                <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5, letterSpacing: '-0.03em', color: 'text.primary' }}>
                    {value}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                    {title}
                </Typography>
                {subtext && (
                    <Typography variant="caption" sx={{ color: 'text.disabled', mt: 0.5, display: 'block' }}>
                        {subtext}
                    </Typography>
                )}
            </Box>
        </Paper>
    );
};

export const AIInsightBadge = ({ type, text }) => {
    // Types: 'insight' (blue/indigo), 'alert' (red/orange), 'success' (green)
    const styles = {
        insight: { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe', icon: '💡' }, // Blue
        alert: { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca', icon: '⚠️' }, // Red
        success: { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0', icon: '🚀' }, // Green
    };

    const style = styles[type] || styles.insight;

    return (
        <Box
            sx={{
                display: 'flex',
                gap: 2,
                p: 2,
                borderRadius: '12px',
                bgcolor: style.bg,
                border: '1px solid',
                borderColor: style.border,
                alignItems: 'flex-start'
            }}
        >
            <Typography sx={{ fontSize: '1.2rem', lineHeight: 1 }}>{style.icon}</Typography>
            <Typography variant="body2" sx={{ color: style.color, fontWeight: 500, lineHeight: 1.6 }}>
                {text}
            </Typography>
        </Box>
    );
};


export const PageHeader = ({ title, subtitle, action }) => {
    return (
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 2 }}>
            <Box>
                <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.03em', mb: 1 }}>
                    {title}
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 600 }}>
                    {subtitle}
                </Typography>
            </Box>
            {action && (
                <Box>
                    {action}
                </Box>
            )}
        </Box>
    );
};

export const StatusPill = ({ status, type = 'default' }) => {
    // Simple status pill for tables/lists
    let color = 'default';
    let label = status;

    if (type === 'stock') {
        const stock = parseInt(status);
        if (stock === 0) { color = 'error'; label = 'Out of Stock'; }
        else if (stock < 10) { color = 'warning'; label = 'Low Stock'; }
        else { color = 'success'; label = 'In Stock'; }
    }

    return (
        <Chip
            label={label}
            color={color}
            size="small"
            variant="outlined"
            sx={{ fontWeight: 600, borderRadius: '6px' }}
        />
    );
};
