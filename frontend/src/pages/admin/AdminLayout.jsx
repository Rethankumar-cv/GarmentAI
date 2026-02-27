import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
    Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
    Typography, IconButton, Avatar, useTheme, Tooltip
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    People as PeopleIcon,
    ShoppingBag as ProductIcon,
    Receipt as OrderIcon,
    Logout as LogoutIcon,
    ChevronLeft,
    ChevronRight,
    AdminPanelSettings,
    Assessment
} from '@mui/icons-material';

const drawerWidth = 260;
const collapsedWidth = 70;

const AdminLayout = () => {
    const theme = useTheme();
    const location = useLocation();
    const navigate = useNavigate();
    const [collapsed, setCollapsed] = useState(false);

    const handleLogout = () => {
        // Clear admin tokens
        localStorage.removeItem('admin_token');
        navigate('/');
    };

    const menuItems = [
        { text: 'Dashboard', icon: DashboardIcon, path: '/admin/dashboard' },
        { text: 'Users', icon: PeopleIcon, path: '/admin/users' },
        { text: 'Products', icon: ProductIcon, path: '/admin/products' },
        { text: 'Orders', icon: OrderIcon, path: '/admin/orders' },
        { text: 'MLOps', icon: Assessment, path: '/admin/ml-ops' },
    ];

    return (
        <Box sx={{ display: 'flex' }}>
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
                        bgcolor: '#0f172a', // Slate 900
                        color: '#f8fafc',
                        borderRight: '1px solid rgba(255,255,255,0.1)'
                    },
                }}
            >
                {/* Header */}
                <Box sx={{
                    height: 64,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: collapsed ? 'center' : 'space-between',
                    px: 2,
                    borderBottom: '1px solid rgba(255,255,255,0.1)'
                }}>
                    {!collapsed && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AdminPanelSettings sx={{ color: theme.palette.error.main }} />
                            <Typography variant="subtitle1" fontWeight="bold" sx={{ letterSpacing: 1 }}>
                                ADMIN
                            </Typography>
                        </Box>
                    )}
                    <IconButton onClick={() => setCollapsed(!collapsed)} sx={{ color: 'text.secondary' }}>
                        {collapsed ? <ChevronRight /> : <ChevronLeft />}
                    </IconButton>
                </Box>

                {/* Menu */}
                <List sx={{ px: 1, mt: 2 }}>
                    {menuItems.map((item) => {
                        const active = location.pathname === item.path;
                        return (
                            <ListItem key={item.text} disablePadding sx={{ display: 'block', mb: 0.5 }}>
                                <Tooltip title={collapsed ? item.text : ""} placement="right">
                                    <ListItemButton
                                        component={Link}
                                        to={item.path}
                                        sx={{
                                            minHeight: 48,
                                            justifyContent: collapsed ? 'center' : 'initial',
                                            px: 2.5,
                                            borderRadius: 2,
                                            bgcolor: active ? 'rgba(239, 68, 68, 0.15)' : 'transparent', // Red tint for admin
                                            color: active ? '#ef4444' : '#94a3b8',
                                            '&:hover': {
                                                bgcolor: 'rgba(255,255,255,0.05)',
                                                color: '#f1f5f9'
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
                                            <item.icon />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={item.text}
                                            sx={{ opacity: collapsed ? 0 : 1 }}
                                            primaryTypographyProps={{ fontWeight: active ? 600 : 400 }}
                                        />
                                    </ListItemButton>
                                </Tooltip>
                            </ListItem>
                        );
                    })}
                </List>

                {/* Footer */}
                <Box sx={{ mt: 'auto', p: 1 }}>
                    <ListItemButton
                        onClick={handleLogout}
                        sx={{
                            borderRadius: 2,
                            justifyContent: collapsed ? 'center' : 'initial',
                            color: '#cbd5e1',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' }
                        }}
                    >
                        <ListItemIcon sx={{ minWidth: 0, mr: collapsed ? 0 : 2, justifyContent: 'center', color: 'inherit' }}>
                            <LogoutIcon />
                        </ListItemIcon>
                        <ListItemText primary="Logout" sx={{ opacity: collapsed ? 0 : 1 }} />
                    </ListItemButton>
                </Box>
            </Drawer>

            <Box component="main" sx={{ flexGrow: 1, p: 3, bgcolor: '#f8fafc', minHeight: '100vh', overflow: 'auto' }}>
                <Outlet />
            </Box>
        </Box>
    );
};

export default AdminLayout;
