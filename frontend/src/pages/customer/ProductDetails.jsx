import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import useCartStore from '../../store/cartStore';
import { motion } from 'framer-motion';
import { DEFAULT_PRODUCT_IMAGE } from '../../constants';
import {
    Box,
    Container,
    Grid,
    Typography,
    Button,
    IconButton,
    Chip,
    Rating,
    Divider,
    Paper,
    Tab,
    Tabs,
    Stack,
    CircularProgress,
    Alert,
    useMediaQuery,
    useTheme
} from '@mui/material';
import {
    Star,
    LocalShipping,
    VerifiedUser,
    Cached,
    ShoppingBag,
    FavoriteBorder,
    Share,
    Add,
    Remove,
    ArrowBack
} from '@mui/icons-material';

const ProductDetails = () => {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const addToCart = useCartStore((state) => state.addToCart);
    const [activeSize, setActiveSize] = useState('M');
    const [quantity, setQuantity] = useState(1);
    const [activeTab, setActiveTab] = useState(0);

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                // Optimistically trying detailed fetch:
                try {
                    const res = await api.get(`products/${id}/`);
                    setProduct(res.data);
                } catch (e) {
                    // Fallback if detail endpoint not ready, fetch all
                    const res = await api.get('products/');
                    const found = res.data.find(p => p.id === parseInt(id));
                    setProduct(found);
                }
            } catch (error) {
                console.error("Failed to load product", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id]);

    const handleAddToCart = async () => {
        if (!product) return;
        const result = await addToCart(product.id, quantity);
        if (result.success) {
            // Ideally use a Snackbar here
            console.log("Added to cart!");
        } else {
            alert(result.message);
        }
    };

    if (loading) return (
        <Box sx={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CircularProgress />
        </Box>
    );

    if (!product) return (
        <Box sx={{ minHeight: '50vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
            <Typography variant="h5">Product not found</Typography>
            <Button component={Link} to="/customer/shop" variant="contained">Back to Shop</Button>
        </Box>
    );

    return (
        <Container maxWidth="xl" sx={{ py: 4, px: { xs: 2, md: 4 } }}>
            <Button
                component={Link}
                to="/customer/shop"
                startIcon={<ArrowBack />}
                sx={{ mb: 4, color: 'text.secondary' }}
            >
                Back to Shop
            </Button>

            <Grid container spacing={6}>
                {/* Image Gallery */}
                <Grid item xs={12} md={6}>
                    <Box sx={{ position: 'sticky', top: 100 }}>
                        <Paper
                            elevation={0}
                            sx={{
                                width: '100%',
                                paddingTop: '133%', // 3:4 Aspect Ratio
                                bgcolor: 'grey.100',
                                borderRadius: 4,
                                position: 'relative',
                                overflow: 'hidden',
                                mb: 2
                            }}
                        >
                            <Box
                                component="img"
                                src={product.image || DEFAULT_PRODUCT_IMAGE}
                                alt={product.name}
                                sx={{
                                    position: 'absolute',
                                    inset: 0,
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover'
                                }}
                                onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_PRODUCT_IMAGE; }}
                            />
                        </Paper>

                        <Grid container spacing={2}>
                            {[1, 2, 3, 4].map((i) => (
                                <Grid item xs={3} key={i}>
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            paddingTop: '100%',
                                            bgcolor: 'grey.100',
                                            borderRadius: 2,
                                            cursor: 'pointer',
                                            border: i === 1 ? '2px solid' : 'none',
                                            borderColor: 'primary.main'
                                        }}
                                    />
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                </Grid>

                {/* Product Info */}
                <Grid item xs={12} md={6}>
                    <Box>
                        <Stack direction="row" justifyContent="space-between" alignItems="start" mb={2}>
                            <Typography variant="subtitle2" color="primary.main" fontWeight="bold" sx={{ bgcolor: 'primary.50', px: 1.5, py: 0.5, borderRadius: 10, textTransform: 'uppercase' }}>
                                {product.garment_category_display || 'New Arrival'}
                            </Typography>
                            <Box>
                                <IconButton><Share /></IconButton>
                                <IconButton color="primary"><FavoriteBorder /></IconButton>
                            </Box>
                        </Stack>

                        <Typography variant="h3" fontWeight="bold" gutterBottom>
                            {product.name}
                        </Typography>

                        <Stack direction="row" alignItems="center" spacing={2} mb={3}>
                            <Typography variant="h4" color="primary.main" fontWeight="bold">
                                ₹{product.price}
                            </Typography>
                            <Stack direction="row" alignItems="center" sx={{ bgcolor: 'warning.light', color: 'warning.contrastText', px: 1, py: 0.5, borderRadius: 1 }}>
                                <Star fontSize="small" />
                                <Typography variant="subtitle2" fontWeight="bold" ml={0.5}>4.8 (120)</Typography>
                            </Stack>
                        </Stack>

                        <Typography variant="body1" color="text.secondary" paragraph>
                            Experience premium quality with this expertly crafted garment. Designed for modern lifestyles, combining comfort with cutting-edge fashion trends.
                        </Typography>

                        <Divider sx={{ my: 3 }} />

                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Select Size</Typography>
                        <Stack direction="row" spacing={2} mb={4}>
                            {['XS', 'S', 'M', 'L', 'XL'].map((size) => (
                                <Button
                                    key={size}
                                    variant={activeSize === size ? "contained" : "outlined"}
                                    onClick={() => setActiveSize(size)}
                                    sx={{
                                        minWidth: 48,
                                        height: 48,
                                        borderRadius: 2,
                                        borderColor: activeSize === size ? 'primary.main' : 'divider',
                                        color: activeSize === size ? 'common.white' : 'text.primary',
                                        boxShadow: activeSize === size ? 4 : 0
                                    }}
                                >
                                    {size}
                                </Button>
                            ))}
                        </Stack>

                        <Stack direction="row" spacing={2} mb={4}>
                            <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, display: 'flex', alignItems: 'center' }}>
                                <IconButton onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1}><Remove /></IconButton>
                                <Typography sx={{ px: 2, fontWeight: 'bold' }}>{quantity}</Typography>
                                <IconButton onClick={() => setQuantity(quantity + 1)}><Add /></IconButton>
                            </Box>
                            <Button
                                variant="contained"
                                size="large"
                                startIcon={<ShoppingBag />}
                                fullWidth
                                onClick={handleAddToCart}
                                disabled={product.stock <= 0}
                                sx={{ borderRadius: 3, fontWeight: 'bold', fontSize: '1.1rem' }}
                            >
                                {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                            </Button>
                        </Stack>

                        <Grid container spacing={2} sx={{ mt: 2 }}>
                            <Grid item xs={4}>
                                <Stack alignItems="center" spacing={1}>
                                    <LocalShipping color="primary" fontSize="large" />
                                    <Box textAlign="center">
                                        <Typography variant="subtitle2" fontWeight="bold">Free Shipping</Typography>
                                        <Typography variant="caption" color="text.secondary">On orders over ₹999</Typography>
                                    </Box>
                                </Stack>
                            </Grid>
                            <Grid item xs={4}>
                                <Stack alignItems="center" spacing={1}>
                                    <Cached color="primary" fontSize="large" />
                                    <Box textAlign="center">
                                        <Typography variant="subtitle2" fontWeight="bold">Easy Returns</Typography>
                                        <Typography variant="caption" color="text.secondary">14-day policy</Typography>
                                    </Box>
                                </Stack>
                            </Grid>
                            <Grid item xs={4}>
                                <Stack alignItems="center" spacing={1}>
                                    <VerifiedUser color="primary" fontSize="large" />
                                    <Box textAlign="center">
                                        <Typography variant="subtitle2" fontWeight="bold">Secure</Typography>
                                        <Typography variant="caption" color="text.secondary">100% Protected</Typography>
                                    </Box>
                                </Stack>
                            </Grid>
                        </Grid>
                    </Box>
                </Grid>
            </Grid>

            {/* Product Details Tabs */}
            <Box sx={{ mt: 10, mb: 6 }}>
                <Paper variant="outlined" sx={{ borderRadius: 4, overflow: 'hidden' }}>
                    <Tabs
                        value={activeTab}
                        onChange={(e, v) => setActiveTab(v)}
                        variant="fullWidth"
                        textColor="primary"
                        indicatorColor="primary"
                        sx={{ bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider' }}
                    >
                        <Tab label="Description" sx={{ fontWeight: 'bold', py: 3 }} />
                        <Tab label="Reviews" sx={{ fontWeight: 'bold', py: 3 }} />
                        <Tab label="Shipping & Returns" sx={{ fontWeight: 'bold', py: 3 }} />
                    </Tabs>
                    <Box sx={{ p: 4 }}>
                        {activeTab === 0 && (
                            <Typography color="text.secondary" lineHeight={1.8}>
                                {product.description || "Every detail of this garment has been meticulously crafted to ensure the highest quality. From the selection of premium fabrics to the precision of the stitching, we've designed this piece to offer both style and durability."}
                            </Typography>
                        )}
                        {activeTab === 1 && <Typography color="text.secondary">Customer reviews will appear here.</Typography>}
                        {activeTab === 2 && <Typography color="text.secondary">Shipping and return policy details.</Typography>}
                    </Box>
                </Paper>
            </Box>

            {/* Mobile Fixed Bottom Bar */}
            {isMobile && (
                <Paper
                    elevation={4}
                    sx={{
                        position: 'fixed',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        p: 2,
                        zIndex: 1000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}
                >
                    <Box>
                        <Typography variant="caption" color="text.secondary">Total Price</Typography>
                        <Typography variant="h6" fontWeight="bold">₹{product.price}</Typography>
                    </Box>
                    <Button
                        variant="contained"
                        onClick={handleAddToCart}
                        disabled={product.stock <= 0}
                        sx={{ px: 4, borderRadius: 2 }}
                    >
                        Add to Cart
                    </Button>
                </Paper>
            )}
        </Container>
    );
};

export default ProductDetails;
