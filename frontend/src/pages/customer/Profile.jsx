import React, { useState } from 'react';
import useAuthStore from '../../store/authStore';
import {
    Box,
    Container,
    Grid,
    Typography,
    Paper,
    Avatar,
    Button,
    TextField,
    Divider,
    Chip
} from '@mui/material';
import { Person, Save } from '@mui/icons-material';

const Profile = () => {
    const { user } = useAuthStore();

    // Local state for form (in a real app, you'd fetch this or init from user object)
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: '+91 98765 43210' // Mock phone for now
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = () => {
        // Implement save logic here (API call)
        alert("Profile updated successfully! (Mock)");
    };

    return (
        <Container maxWidth="lg" sx={{ py: 6 }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ mb: 4 }}>My Profile</Typography>

            <Grid container spacing={4}>
                {/* Profile Card */}
                <Grid item xs={12} md={4}>
                    <Paper elevation={0} sx={{ p: 4, textAlign: 'center', border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                        <Avatar sx={{ width: 100, height: 100, mx: 'auto', mb: 2, bgcolor: 'primary.main', fontSize: 40 }}>
                            {user?.name?.charAt(0) || <Person />}
                        </Avatar>
                        <Typography variant="h6" fontWeight="bold">{user?.name || 'User Name'}</Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>{user?.email || 'user@example.com'}</Typography>
                        <Chip label="Customer" color="primary" size="small" sx={{ mt: 1 }} />
                    </Paper>
                </Grid>

                {/* Edit Details */}
                <Grid item xs={12} md={8}>
                    <Paper elevation={0} sx={{ p: 4, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                        <Typography variant="h6" fontWeight="bold" mb={3}>Personal Information</Typography>
                        <Grid container spacing={3}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Full Name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    variant="outlined"
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Email Address"
                                    name="email"
                                    value={formData.email}
                                    variant="outlined"
                                    disabled
                                    helperText="Email cannot be changed"
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Phone Number"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    variant="outlined"
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Divider sx={{ my: 2 }} />
                                <Button
                                    variant="contained"
                                    size="large"
                                    startIcon={<Save />}
                                    onClick={handleSave}
                                >
                                    Save Changes
                                </Button>
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
};

export default Profile;
