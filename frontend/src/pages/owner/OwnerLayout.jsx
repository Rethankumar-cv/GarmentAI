import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import Navbar from '../../components/layout/Navbar';
import { Box, Toolbar } from '@mui/material';

const OwnerLayout = () => {
    return (
        <Box sx={{ display: 'flex', height: '100vh', bgcolor: 'background.default' }}>
            <Sidebar />
            <Box component="main" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <Navbar />
                <Box sx={{ flexGrow: 1, overflow: 'auto', p: 3 }}>
                    <Outlet />
                </Box>
            </Box>
        </Box>
    );
};

export default OwnerLayout;
