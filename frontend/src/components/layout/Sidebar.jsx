import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    IconButton,
    Box,
    Typography,
    Divider,
    useTheme,
    Tooltip,
    Avatar
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    Inventory as InventoryIcon,
    Lightbulb as PredictionsIcon,
    TrendingUp as ForecastIcon,
    BarChart as SalesPatternsIcon,
    Map as GeoMapIcon,
    PieChart as DecisionSupportIcon,
    ChevronLeft,
    ChevronRight,
    Logout as LogoutIcon
} from '@mui/icons-material';
import useAuthStore from '../../store/authStore';

const drawerWidth = 280;
const collapsedWidth = 80;

const Sidebar = () => {
    const theme = useTheme();
    const location = useLocation();
    const navigate = useNavigate();
    const logout = useAuthStore((state) => state.logout);
    const [collapsed, setCollapsed] = useState(false);

    const links = [
        { name: 'Overview', path: '/owner/dashboard', icon: DashboardIcon },
        { name: 'Inventory', path: '/owner/inventory', icon: InventoryIcon },
        { divider: true },
        { name: 'Predictions', path: '/owner/predictions', icon: PredictionsIcon },
        { name: 'Forecast', path: '/owner/predictions/forecast', icon: ForecastIcon },
        { name: 'Sales Patterns', path: '/owner/predictions/sales-patterns', icon: SalesPatternsIcon },
        { name: 'Geo Map', path: '/owner/predictions/geo-map', icon: GeoMapIcon },
        { name: 'Decision Support', path: '/owner/predictions/decision-support', icon: DecisionSupportIcon },
    ];

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <Drawer
            variant="permanent"
            sx={{
                width: collapsed ? collapsedWidth : drawerWidth,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width: collapsed ? collapsedWidth : drawerWidth,
                    transition: theme.transitions.create('width', {
                        easing: theme.transitions.easing.sharp,
                        duration: theme.transitions.duration.enteringScreen,
                    }),
                    overflowX: 'hidden',
                    bgcolor: '#111827', // Slate 900
                    color: '#e2e8f0', // Slate 200
                    borderRight: '1px solid rgba(255, 255, 255, 0.08)'
                },
            }}
        >
            {/* Header */}
            <Box sx={{
                height: 72,
                display: 'flex',
                alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'space-between',
                px: 2,
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
                {!collapsed && (
                    <Typography variant="h6" fontWeight="bold" sx={{ letterSpacing: 1, color: '#fff' }}>
                        GARMENT<span style={{ color: theme.palette.primary.main }}>AI</span>
                    </Typography>
                )}
                {!collapsed ? (
                    <IconButton onClick={() => setCollapsed(true)} sx={{ color: 'text.secondary' }}>
                        <ChevronLeft />
                    </IconButton>
                ) : (
                    <IconButton onClick={() => setCollapsed(false)} sx={{ color: 'text.secondary' }}>
                        <ChevronRight />
                    </IconButton>
                )}
            </Box>

            {/* Navigation */}
            <List sx={{ flexGrow: 1, px: 1.5, py: 2 }}>
                {links.map((link, index) => {
                    if (link.divider) {
                        return !collapsed && <Divider key={index} sx={{ my: 2, borderColor: 'rgba(255, 255, 255, 0.08)' }} />;
                    }

                    const Icon = link.icon;
                    const isActive = location.pathname === link.path;

                    return (
                        <ListItem key={link.name} disablePadding sx={{ display: 'block', mb: 0.5 }}>
                            <Tooltip title={collapsed ? link.name : ""} placement="right">
                                <ListItemButton
                                    component={Link}
                                    to={link.path}
                                    sx={{
                                        minHeight: 48,
                                        justifyContent: collapsed ? 'center' : 'initial',
                                        px: 2.5,
                                        borderRadius: 3,
                                        bgcolor: isActive ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                                        color: isActive ? theme.palette.primary.main : '#94a3b8',
                                        '&:hover': {
                                            bgcolor: isActive ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                                            color: isActive ? theme.palette.primary.main : '#f8fafc',
                                        }
                                    }}
                                >
                                    <ListItemIcon
                                        sx={{
                                            minWidth: 0,
                                            mr: collapsed ? 0 : 2,
                                            justifyContent: 'center',
                                            color: 'inherit'
                                        }}
                                    >
                                        <Icon />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={link.name}
                                        sx={{
                                            opacity: collapsed ? 0 : 1,
                                            '& .MuiTypography-root': { fontWeight: isActive ? 600 : 500, fontSize: '0.95rem' }
                                        }}
                                    />
                                    {isActive && !collapsed && (
                                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: theme.palette.primary.main, ml: 1 }} />
                                    )}
                                </ListItemButton>
                            </Tooltip>
                        </ListItem>
                    );
                })}
            </List>

            {/* Footer / Logout */}
            <Box sx={{ p: 2, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <ListItemButton
                    onClick={handleLogout}
                    sx={{
                        minHeight: 48,
                        justifyContent: collapsed ? 'center' : 'initial',
                        px: 2.5,
                        borderRadius: 3,
                        color: '#94a3b8',
                        '&:hover': {
                            bgcolor: 'rgba(239, 68, 68, 0.1)',
                            color: '#ef4444',
                        }
                    }}
                >
                    <ListItemIcon
                        sx={{
                            minWidth: 0,
                            mr: collapsed ? 0 : 2,
                            justifyContent: 'center',
                            color: 'inherit'
                        }}
                    >
                        <LogoutIcon />
                    </ListItemIcon>
                    <ListItemText
                        primary="Sign Out"
                        sx={{
                            opacity: collapsed ? 0 : 1,
                            '& .MuiTypography-root': { fontWeight: 600 }
                        }}
                    />
                </ListItemButton>
            </Box>
        </Drawer>
    );
};

export default Sidebar;
