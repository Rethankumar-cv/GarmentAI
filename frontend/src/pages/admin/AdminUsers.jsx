import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
    Box, Paper, Typography, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Chip, IconButton, Avatar,
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    FormControl, InputLabel, Select, MenuItem, FormControlLabel, Switch,
    Alert, Snackbar
} from '@mui/material';
import { Delete, Edit, Block, CheckCircle } from '@mui/icons-material';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editOpen, setEditOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [formData, setFormData] = useState({ role: '', is_active: true });
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

    const fetchUsers = async () => {
        const token = localStorage.getItem('admin_token');
        if (!token) return;
        try {
            const response = await axios.get('http://localhost:8000/api/admin/users/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setUsers(response.data);
        } catch (error) {
            console.error("Failed to fetch users", error);
            if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                localStorage.removeItem('admin_token');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleEditClick = (user) => {
        setSelectedUser(user);
        setFormData({ role: user.role, is_active: user.is_active });
        setEditOpen(true);
    };

    const handleCloseEdit = () => {
        setEditOpen(false);
        setSelectedUser(null);
    };

    const handleSave = async () => {
        const token = localStorage.getItem('admin_token');
        try {
            await axios.put(`http://localhost:8000/api/admin/users/${selectedUser.id}/`, formData, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setNotification({ open: true, message: 'User updated successfully', severity: 'success' });
            fetchUsers();
            handleCloseEdit();
        } catch (error) {
            console.error("Failed to update user", error);
            setNotification({ open: true, message: 'Failed to update user', severity: 'error' });
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;

        const token = localStorage.getItem('admin_token');
        try {
            await axios.delete(`http://localhost:8000/api/admin/users/${id}/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setNotification({ open: true, message: 'User deleted successfully', severity: 'success' });
            fetchUsers();
        } catch (error) {
            console.error("Failed to delete user", error);
            setNotification({ open: true, message: 'Failed to delete user', severity: 'error' });
        }
    };

    const getRoleColor = (role) => {
        if (role === 'SUPER_ADMIN') return 'error';
        if (role === 'OWNER') return 'primary';
        return 'default';
    };

    return (
        <Box>
            <Typography variant="h4" fontWeight="800" sx={{ mb: 4, color: '#1e293b' }}>
                User Management
            </Typography>

            <Paper elevation={0} sx={{ borderRadius: 4, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                <TableContainer>
                    <Table>
                        <TableHead sx={{ bgcolor: '#f8fafc' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 700, color: '#475569' }}>User</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Role</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Email</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Date Joined</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Status</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700, color: '#475569' }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.id} hover>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Avatar sx={{ width: 32, height: 32, bgcolor: '#e2e8f0', color: '#64748b', fontSize: 14 }}>
                                                {user.username[0].toUpperCase()}
                                            </Avatar>
                                            <Typography fontWeight={600} variant="body2">{user.username}</Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={user.role}
                                            color={getRoleColor(user.role)}
                                            size="small"
                                            sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                                        />
                                    </TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell sx={{ color: '#64748b', fontSize: '0.875rem' }}>
                                        {new Date(user.date_joined).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={user.is_active ? "Active" : "Blocked"}
                                            size="small"
                                            icon={user.is_active ? <CheckCircle sx={{ fontSize: '14px !important' }} /> : <Block sx={{ fontSize: '14px !important' }} />}
                                            sx={{
                                                bgcolor: user.is_active ? '#ecfdf5' : '#fef2f2',
                                                color: user.is_active ? '#059669' : '#dc2626',
                                                fontWeight: 600,
                                                '& .MuiChip-icon': { color: 'inherit' }
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                            <IconButton size="small" color="primary" onClick={() => handleEditClick(user)}>
                                                <Edit fontSize="small" />
                                            </IconButton>
                                            <IconButton size="small" color="error" onClick={() => handleDelete(user.id)} disabled={user.role === 'SUPER_ADMIN'}>
                                                <Delete fontSize="small" />
                                            </IconButton>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* Edit User Dialog */}
            <Dialog open={editOpen} onClose={handleCloseEdit} maxWidth="sm" fullWidth>
                <DialogTitle fontWeight={700}>Edit User</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
                        <FormControl fullWidth>
                            <InputLabel>Role</InputLabel>
                            <Select
                                value={formData.role}
                                label="Role"
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            >
                                <MenuItem value="CUSTOMER">Customer</MenuItem>
                                <MenuItem value="OWNER">Boutique Owner</MenuItem>
                                <MenuItem value="SUPER_ADMIN">Super Admin</MenuItem>
                            </Select>
                        </FormControl>

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    color="success"
                                />
                            }
                            label={formData.is_active ? "Active User" : "Blocked User"}
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={handleCloseEdit} color="inherit">Cancel</Button>
                    <Button onClick={handleSave} variant="contained" color="primary">Save Changes</Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={notification.open}
                autoHideDuration={6000}
                onClose={() => setNotification({ ...notification, open: false })}
            >
                <Alert severity={notification.severity} sx={{ width: '100%' }}>
                    {notification.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default AdminUsers;
