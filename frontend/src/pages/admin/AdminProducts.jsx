import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
    Box, Paper, Typography, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, IconButton, Avatar,
    Chip, Button, Tooltip, CircularProgress, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, MenuItem, Grid,
    Snackbar, Alert
} from '@mui/material';
import { Delete, Edit, Add, Inventory } from '@mui/icons-material';

const AdminProducts = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

    // Form State
    const initialFormState = {
        name: '',
        price: '',
        stock: '',
        garment_category: 1,
        fabric_type: 1,
        outlet_id: 1,
        gender: 'Unisex',
        image: '',
        description: ''
    };
    const [formData, setFormData] = useState(initialFormState);

    const fetchProducts = async () => {
        const token = localStorage.getItem('admin_token');
        if (!token) return;
        try {
            const response = await axios.get('http://localhost:8000/api/admin/products/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setProducts(response.data);
        } catch (error) {
            console.error("Failed to fetch products", error);
            if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                localStorage.removeItem('admin_token');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleOpenDialog = (product = null) => {
        if (product) {
            setSelectedProduct(product);
            setFormData({
                name: product.name,
                price: product.price,
                stock: product.stock,
                garment_category: product.garment_category,
                fabric_type: product.fabric_type,
                outlet_id: product.outlet_id,
                gender: product.gender,
                image: product.image,
                description: product.description
            });
        } else {
            setSelectedProduct(null);
            setFormData(initialFormState);
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedProduct(null);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async () => {
        const token = localStorage.getItem('admin_token');
        try {
            if (selectedProduct) {
                // Update
                await axios.put(`http://localhost:8000/api/admin/products/detail/${selectedProduct.id}/`, formData, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setNotification({ open: true, message: 'Product updated successfully', severity: 'success' });
            } else {
                // Create
                await axios.post('http://localhost:8000/api/admin/products/', formData, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setNotification({ open: true, message: 'Product created successfully', severity: 'success' });
            }
            fetchProducts();
            handleCloseDialog();
        } catch (error) {
            console.error("Operation failed", error);
            setNotification({ open: true, message: 'Operation failed. Please check inputs.', severity: 'error' });
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this product?")) return;

        const token = localStorage.getItem('admin_token');
        try {
            await axios.delete(`http://localhost:8000/api/admin/products/detail/${id}/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setNotification({ open: true, message: 'Product deleted successfully', severity: 'success' });
            fetchProducts();
        } catch (error) {
            console.error("Failed to delete product", error);
            setNotification({ open: true, message: 'Failed to delete product', severity: 'error' });
        }
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>;

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4" fontWeight="800" sx={{ color: '#1e293b' }}>
                    Product Management
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => handleOpenDialog()}
                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                >
                    Add Product
                </Button>
            </Box>

            <Paper elevation={0} sx={{ borderRadius: 4, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                <TableContainer>
                    <Table>
                        <TableHead sx={{ bgcolor: '#f8fafc' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Product</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Category</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Price</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Stock</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Gender</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700, color: '#475569' }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {products.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                                        <Typography color="text.secondary">No products found.</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                products.map((product) => (
                                    <TableRow key={product.id} hover>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Avatar
                                                    src={product.image}
                                                    variant="rounded"
                                                    sx={{ width: 48, height: 48, bgcolor: '#f1f5f9' }}
                                                >
                                                    <Inventory color="disabled" />
                                                </Avatar>
                                                <Box>
                                                    <Typography fontWeight={600} variant="body2">{product.name}</Typography>
                                                    <Typography variant="caption" color="text.secondary">ID: {product.id}</Typography>
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Chip label={`Cat: ${product.garment_category}`} size="small" variant="outlined" />
                                        </TableCell>
                                        <TableCell fontWeight={600}>₹{product.price}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={product.stock > 0 ? `${product.stock} in stock` : "Out of Stock"}
                                                color={product.stock < 10 ? (product.stock === 0 ? 'error' : 'warning') : 'success'}
                                                size="small"
                                                variant="soft"
                                                sx={{
                                                    bgcolor: product.stock < 10 ? (product.stock === 0 ? '#fef2f2' : '#fffbeb') : '#ecfdf5',
                                                    color: product.stock < 10 ? (product.stock === 0 ? '#dc2626' : '#d97706') : '#059669',
                                                    fontWeight: 600
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell>{product.gender}</TableCell>
                                        <TableCell align="right">
                                            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                                <Tooltip title="Edit">
                                                    <IconButton size="small" color="primary" onClick={() => handleOpenDialog(product)}>
                                                        <Edit fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Delete">
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => handleDelete(product.id)}
                                                    >
                                                        <Delete fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* Create/Edit Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <DialogTitle fontWeight={700}>
                    {selectedProduct ? 'Edit Product' : 'Add New Product'}
                </DialogTitle>
                <DialogContent>
                    <Box component="form" sx={{ mt: 2 }}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth label="Product Name" name="name"
                                    value={formData.name} onChange={handleInputChange}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth label="Image URL" name="image"
                                    value={formData.image} onChange={handleInputChange}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField
                                    fullWidth label="Price" name="price" type="number"
                                    value={formData.price} onChange={handleInputChange}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField
                                    fullWidth label="Stock" name="stock" type="number"
                                    value={formData.stock} onChange={handleInputChange}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField
                                    fullWidth label="Category ID" name="garment_category" type="number"
                                    value={formData.garment_category} onChange={handleInputChange}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField
                                    fullWidth label="Fabric ID" name="fabric_type" type="number"
                                    value={formData.fabric_type} onChange={handleInputChange}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField
                                    fullWidth select label="Gender" name="gender"
                                    value={formData.gender} onChange={handleInputChange}
                                >
                                    <MenuItem value="Men">Men</MenuItem>
                                    <MenuItem value="Women">Women</MenuItem>
                                    <MenuItem value="Unisex">Unisex</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid item xs={6}>
                                <TextField
                                    fullWidth label="Outlet ID" name="outlet_id" type="number"
                                    value={formData.outlet_id} onChange={handleInputChange}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth multiline rows={3} label="Description" name="description"
                                    value={formData.description} onChange={handleInputChange}
                                />
                            </Grid>
                        </Grid>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={handleCloseDialog} color="inherit">Cancel</Button>
                    <Button onClick={handleSubmit} variant="contained">{selectedProduct ? 'Update' : 'Create'}</Button>
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

export default AdminProducts;
