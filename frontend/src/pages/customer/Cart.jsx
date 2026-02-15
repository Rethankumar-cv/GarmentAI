import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useCartStore from '../../store/cartStore';
import { Link, useNavigate } from 'react-router-dom';
import {
    Box,
    Container,
    Grid,
    Typography,
    Button,
    IconButton,
    Card,
    CardContent,
    CardMedia,
    Divider,
    Paper,
    Stack,
    TextField,
    CircularProgress,
    Tooltip,
    useMediaQuery,
    useTheme
} from '@mui/material';
import {
    DeleteOutline,
    ShoppingBag,
    ArrowForward,
    Add,
    Remove,
    VerifiedUser,
    LocalOffer,
    ArrowBack
} from '@mui/icons-material';

const CartItem = ({ item, onRemove }) => (
    <Box
        component={motion.div}
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
        sx={{
            display: 'flex',
            py: 4,
            borderBottom: '1px solid',
            borderColor: 'divider',
            gap: 3,
            '&:last-child': { borderBottom: 'none' }
        }}
    >
        {/* Product Image */}
        <Box
            sx={{
                width: { xs: 100, sm: 140 },
                height: { xs: 100, sm: 140 }, // Square aspect ratio
                flexShrink: 0,
                bgcolor: 'grey.100',
                borderRadius: 2,
                overflow: 'hidden',
                position: 'relative'
            }}
        >
            <Box
                component="img"
                src={item.image} // Ensure image is passed, or fallback
                alt={item.product_name}
                sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => { e.target.style.display = 'none'; }}
            />
            {/* Fallback if Image Fails */}
            <Box
                sx={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'grey.100',
                    zIndex: -1
                }}
            >
                <Typography variant="h4" fontWeight="bold" color="grey.300">
                    {item.product_name?.charAt(0)}
                </Typography>
            </Box>
        </Box>

        {/* Details */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Box>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1.1rem', mb: 0.5 }}>
                        {item.product_name}
                    </Typography>
                    <Typography variant="h6" fontWeight="bold">
                        ₹{(item.price * item.quantity).toFixed(2)}
                    </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Size: M • Color: Black {/* Dynamic if available */}
                </Typography>
            </Box>

            <Box display="flex" justifyContent="space-between" alignItems="center">
                <Stack direction="row" alignItems="center" spacing={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 50 }}>
                    <IconButton size="small" disabled sx={{ color: 'text.primary' }}>
                        <Remove fontSize="small" />
                    </IconButton>
                    <Typography variant="body2" fontWeight="bold" sx={{ minWidth: 24, textAlign: 'center' }}>
                        {item.quantity}
                    </Typography>
                    <IconButton size="small" disabled sx={{ color: 'text.primary' }}>
                        <Add fontSize="small" />
                    </IconButton>
                </Stack>

                <Button
                    startIcon={<DeleteOutline />}
                    color="error"
                    size="small"
                    onClick={() => onRemove(item.id)}
                    sx={{ textTransform: 'none', color: 'text.secondary', '&:hover': { color: 'error.main' } }}
                >
                    Remove
                </Button>
            </Box>
        </Box>
    </Box>
);

const Cart = () => {
    const { cart, loading, fetchCart, removeFromCart, checkout } = useCartStore();
    const navigate = useNavigate();

    useEffect(() => {
        fetchCart();
    }, [fetchCart]);

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = subtotal > 1000 ? 0 : 150;
    const total = subtotal + shipping;

    const handleCheckout = () => {
        navigate('/customer/checkout');
    };

    if (loading && cart.length === 0) {
        return (
            <Box sx={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress color="inherit" />
            </Box>
        );
    }

    if (cart.length === 0) {
        return (
            <Container maxWidth="md" sx={{ textAlign: 'center', py: 15 }}>
                <Box sx={{ mb: 4 }}>
                    <ShoppingBag sx={{ fontSize: 80, color: 'grey.300' }} />
                </Box>
                <Typography variant="h3" fontWeight="bold" gutterBottom>
                    Your Bag is Empty
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 6, maxWidth: 500, mx: 'auto' }}>
                    It seems you haven't added any items yet. Explore our latest collection to find your perfect fit.
                </Typography>
                <Button
                    component={Link}
                    to="/customer/shop"
                    variant="contained"
                    size="large"
                    sx={{
                        bgcolor: 'black',
                        color: 'white',
                        px: 6,
                        py: 1.5,
                        borderRadius: 0,
                        fontWeight: 'bold',
                        '&:hover': { bgcolor: 'grey.900' }
                    }}
                >
                    Continue Shopping
                </Button>
            </Container>
        );
    }

    return (
        <Container maxWidth="xl" sx={{ py: 8, px: { xs: 2, md: 6 } }}>
            <Typography variant="h3" fontWeight="bold" gutterBottom sx={{ mb: 6 }}>
                Shopping Bag
            </Typography>

            <Grid container spacing={8}>
                {/* Cart Items List */}
                <Grid item xs={12} lg={8}>
                    <Box sx={{ mb: 2 }}>
                        <AnimatePresence>
                            {cart.map((item) => (
                                <CartItem key={item.id} item={item} onRemove={removeFromCart} />
                            ))}
                        </AnimatePresence>
                    </Box>
                    <Box sx={{ mt: 4 }}>
                        <Button
                            startIcon={<ArrowBack />}
                            component={Link}
                            to="/customer/shop"
                            color="inherit"
                            sx={{ textTransform: 'none', fontWeight: 'bold' }}
                        >
                            Continue Shopping
                        </Button>
                    </Box>
                </Grid>

                {/* Order Summary */}
                <Grid item xs={12} lg={4}>
                    <Box
                        sx={{
                            position: 'sticky',
                            top: 100,
                            bgcolor: 'grey.50',
                            p: 4,
                            borderRadius: 2
                        }}
                    >
                        <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ mb: 4 }}>
                            Order Summary
                        </Typography>

                        <Stack spacing={2} sx={{ mb: 4 }}>
                            <Box display="flex" justifyContent="space-between">
                                <Typography color="text.secondary">Subtotal</Typography>
                                <Typography fontWeight="medium">₹{subtotal.toFixed(2)}</Typography>
                            </Box>
                            <Box display="flex" justifyContent="space-between">
                                <Typography color="text.secondary">Shipping</Typography>
                                {shipping === 0 ? (
                                    <Typography color="success.main" fontWeight="bold">Free</Typography>
                                ) : (
                                    <Typography fontWeight="medium">₹{shipping}</Typography>
                                )}
                            </Box>
                            <Box display="flex" justifyContent="space-between">
                                <Typography color="text.secondary">Tax</Typography>
                                <Typography fontWeight="medium">Included</Typography>
                            </Box>
                        </Stack>

                        <Divider sx={{ mb: 3 }} />

                        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
                            <Typography variant="h6" fontWeight="bold">Total</Typography>
                            <Typography variant="h4" fontWeight="bold">
                                ₹{total.toFixed(2)}
                            </Typography>
                        </Box>

                        <Button
                            fullWidth
                            variant="contained"
                            size="large"
                            onClick={handleCheckout}
                            disabled={loading}
                            sx={{
                                py: 2,
                                bgcolor: 'black',
                                color: 'white',
                                borderRadius: 0,
                                fontSize: '1rem',
                                fontWeight: 'bold',
                                textTransform: 'none',
                                '&:hover': { bgcolor: 'grey.900' },
                                mb: 3
                            }}
                        >
                            {loading ? 'Processing...' : 'Proceed to Checkout'}
                        </Button>

                        <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} color="text.disabled">
                            <VerifiedUser fontSize="small" />
                            <Typography variant="caption" fontWeight="medium">Secure Checkout</Typography>
                        </Stack>
                    </Box>
                </Grid>
            </Grid>
        </Container>
    );
};

export default Cart;
