import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import Navbar from '../../components/layout/Navbar';
import { Box, Container, Paper, BottomNavigation, BottomNavigationAction, Typography, useTheme, useMediaQuery } from '@mui/material';
import { Home, Store, ShoppingCart, Person } from '@mui/icons-material';

const CustomerLayout = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const navigate = useNavigate();
    const location = useLocation();

    // Map current path to bottom nav value
    const getBottomNavValue = () => {
        const path = location.pathname;
        if (path.includes('home')) return 0;
        if (path.includes('shop')) return 1;
        if (path.includes('cart')) return 2;
        return 0;
    };

    const [value, setValue] = useState(getBottomNavValue());

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'background.default' }}>
            <Navbar />

            <Box component="main" sx={{ flexGrow: 1, py: 4, mb: isMobile ? 7 : 0 }}>
                <Outlet />
            </Box>

            <Paper component="footer" square variant="outlined" sx={{ py: 3, bgcolor: 'background.paper', borderTop: '1px solid', borderColor: 'divider' }}>
                <Container maxWidth="lg">
                    <Typography variant="body2" color="text.secondary" align="center">
                        © {new Date().getFullYear()} GarmentInsights AI. All rights reserved.
                    </Typography>
                </Container>
            </Paper>

            {/* Mobile Bottom Navigation */}
            {isMobile && (
                <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000 }} elevation={3}>
                    <BottomNavigation
                        showLabels
                        value={value}
                        onChange={(event, newValue) => {
                            setValue(newValue);
                            if (newValue === 0) navigate('/customer/home');
                            if (newValue === 1) navigate('/customer/shop');
                            if (newValue === 2) navigate('/customer/cart');
                        }}
                    >
                        <BottomNavigationAction label="Home" icon={<Home />} />
                        <BottomNavigationAction label="Shop" icon={<Store />} />
                        <BottomNavigationAction label="Cart" icon={<ShoppingCart />} />
                    </BottomNavigation>
                </Paper>
            )}
        </Box>
    );
};

export default CustomerLayout;
