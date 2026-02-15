import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Box, Paper, Typography, TextField, Button, Alert,
    InputAdornment, IconButton, Container
} from '@mui/material';
import { Visibility, VisibilityOff, AdminPanelSettings } from '@mui/icons-material';

const AdminLogin = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Using direct axios call to the new admin endpoint
            const response = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api/'}admin/login/`, formData);

            if (response.data.access) {
                // Store token differently to avoid conflict with user session if testing on same browser
                localStorage.setItem('admin_token', response.data.access);
                navigate('/admin/dashboard');
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.error || "Login failed. Check internet or credentials.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="xs" sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Paper elevation={3} sx={{ p: 4, width: '100%', borderRadius: 4, textAlign: 'center' }}>
                <Box sx={{ mb: 3, display: 'inline-flex', p: 2, bgcolor: 'error.light', borderRadius: '50%', color: 'error.main' }}>
                    <AdminPanelSettings sx={{ fontSize: 40 }} />
                </Box>
                <Typography variant="h5" fontWeight="800" gutterBottom>
                    Admin Portal
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                    Restricted access. Authorized personnel only.
                </Typography>

                {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

                <form onSubmit={handleSubmit}>
                    <TextField
                        fullWidth
                        label="Username"
                        name="username"
                        variant="outlined"
                        value={formData.username}
                        onChange={handleChange}
                        sx={{ mb: 2.5 }}
                        required
                    />
                    <TextField
                        fullWidth
                        label="Password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        variant="outlined"
                        value={formData.password}
                        onChange={handleChange}
                        sx={{ mb: 3 }}
                        required
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            )
                        }}
                    />
                    <Button
                        fullWidth
                        type="submit"
                        variant="contained"
                        color="error"
                        size="large"
                        disabled={loading}
                        sx={{
                            py: 1.5,
                            fontWeight: 'bold',
                            borderRadius: 2,
                            textTransform: 'none',
                            fontSize: '1rem'
                        }}
                    >
                        {loading ? 'Authenticating...' : 'Access Dashboard'}
                    </Button>
                </form>
            </Paper>
        </Container>
    );
};

export default AdminLogin;
