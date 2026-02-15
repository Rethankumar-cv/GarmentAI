import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useCartStore from '../../store/cartStore';
import {
    Box,
    Container,
    Grid,
    Typography,
    Paper,
    Stepper,
    Step,
    StepLabel,
    Button,
    TextField,
    Radio,
    RadioGroup,
    FormControlLabel,
    FormControl,
    FormLabel,
    Divider,
    Stack,
    CircularProgress,
    Card,
    CardContent
} from '@mui/material';
import {
    LocalShipping,
    CreditCard,
    CheckCircle,
    ArrowBack,
    ArrowForward
} from '@mui/icons-material';

const steps = ['Shipping Address', 'Payment Details', 'Review Order'];

const Checkout = () => {
    const navigate = useNavigate();
    const { cart, checkout, loading } = useCartStore();
    const [activeStep, setActiveStep] = useState(0);
    const [shippingData, setShippingData] = useState({
        firstName: '',
        lastName: '',
        address: '',
        city: '',
        zip: '',
        country: 'India'
    });
    const [paymentMethod, setPaymentMethod] = useState('card');

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shippingCost = subtotal > 1000 ? 0 : 150;
    const total = subtotal + shippingCost;

    useEffect(() => {
        if (cart.length === 0 && activeStep === 0) {
            // Redirect to shop if cart is empty, but maybe allow if just refreshed? 
            // Better to show empty message or redirect.
            navigate('/customer/cart');
        }
    }, [cart, navigate, activeStep]);

    const handleNext = () => {
        if (activeStep === steps.length - 1) {
            handlePlaceOrder();
        } else {
            setActiveStep((prev) => prev + 1);
        }
    };

    const handleBack = () => {
        setActiveStep((prev) => prev - 1);
    };

    const handlePlaceOrder = async () => {
        const success = await checkout();
        if (success) {
            // In a real app, maybe redirect to a success page with order ID
            // For now, redirect to dashboard or shop
            navigate('/customer/dashboard'); // Assuming we created this route
        } else {
            alert("Checkout failed. Please try again.");
        }
    };

    const handleInputChange = (e) => {
        setShippingData({ ...shippingData, [e.target.name]: e.target.value });
    };



    return (
        <Container maxWidth="lg" sx={{ py: 6 }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom align="center" sx={{ mb: 6 }}>Checkout</Typography>

            <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 8 }}>
                {steps.map((label) => (
                    <Step key={label}>
                        <StepLabel>{label}</StepLabel>
                    </Step>
                ))}
            </Stepper>

            <Grid container spacing={6} justifyContent="center">
                <Grid item xs={12} md={8}>
                    <Paper elevation={0} sx={{ p: { xs: 3, md: 5 }, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
                        {activeStep === 0 && (
                            <Grid container spacing={3}>
                                <Grid item xs={12} sm={6}>
                                    <TextField required fullWidth label="First Name" name="firstName" value={shippingData.firstName} onChange={handleInputChange} />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField required fullWidth label="Last Name" name="lastName" value={shippingData.lastName} onChange={handleInputChange} />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField required fullWidth label="Address Line 1" name="address" value={shippingData.address} onChange={handleInputChange} />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField required fullWidth label="City" name="city" value={shippingData.city} onChange={handleInputChange} />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField required fullWidth label="Zip / Postal Code" name="zip" value={shippingData.zip} onChange={handleInputChange} />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField required fullWidth label="Country" name="country" value={shippingData.country} onChange={handleInputChange} disabled />
                                </Grid>
                            </Grid>
                        )}
                        {activeStep === 1 && (
                            <FormControl component="fieldset" fullWidth>
                                <FormLabel component="legend" sx={{ mb: 2, fontWeight: 'bold' }}>Select Payment Method</FormLabel>
                                <RadioGroup value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                                    <Paper variant="outlined" sx={{ mb: 2, p: 2, borderRadius: 2, display: 'flex', alignItems: 'center', borderColor: paymentMethod === 'card' ? 'primary.main' : 'divider' }}>
                                        <FormControlLabel value="card" control={<Radio />} label="Credit / Debit Card" sx={{ flexGrow: 1 }} />
                                        <CreditCard color="action" />
                                    </Paper>
                                    <Paper variant="outlined" sx={{ mb: 2, p: 2, borderRadius: 2, display: 'flex', alignItems: 'center', borderColor: paymentMethod === 'upi' ? 'primary.main' : 'divider' }}>
                                        <FormControlLabel value="upi" control={<Radio />} label="UPI (Google Pay, PhonePe)" sx={{ flexGrow: 1 }} />
                                        {/* Icon for UPI */}
                                    </Paper>
                                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, display: 'flex', alignItems: 'center', borderColor: paymentMethod === 'cod' ? 'primary.main' : 'divider' }}>
                                        <FormControlLabel value="cod" control={<Radio />} label="Cash on Delivery" sx={{ flexGrow: 1 }} />
                                        <LocalShipping color="action" />
                                    </Paper>
                                </RadioGroup>

                                {paymentMethod === 'card' && (
                                    <Box sx={{ mt: 3 }}>
                                        <Grid container spacing={3}>
                                            <Grid item xs={12}>
                                                <TextField fullWidth label="Card Number" placeholder="0000 0000 0000 0000" />
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                                <TextField fullWidth label="Expiry Date" placeholder="MM/YY" />
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                                <TextField fullWidth label="CVV" type="password" />
                                            </Grid>
                                        </Grid>
                                    </Box>
                                )}
                            </FormControl>
                        )}
                        {activeStep === 2 && (
                            <Box>
                                <Typography variant="h6" fontWeight="bold" gutterBottom>Order Summary</Typography>
                                <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, mb: 4 }}>
                                    {cart.map((item) => (
                                        <Box key={item.id} sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                            <Typography variant="body2">{item.product_name} x {item.quantity}</Typography>
                                            <Typography variant="body2" fontWeight="bold">₹{(item.price * item.quantity).toFixed(2)}</Typography>
                                        </Box>
                                    ))}
                                    <Divider sx={{ my: 2 }} />
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography color="text.secondary">Subtotal</Typography>
                                        <Typography>₹{subtotal.toFixed(2)}</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography color="text.secondary">Shipping</Typography>
                                        <Typography>{shippingCost === 0 ? 'Free' : `₹${shippingCost}`}</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                                        <Typography variant="h6" fontWeight="bold">Total</Typography>
                                        <Typography variant="h6" fontWeight="bold" color="primary.main">₹{total.toFixed(2)}</Typography>
                                    </Box>
                                </Paper>

                                <Typography variant="h6" fontWeight="bold" gutterBottom>Shipping To</Typography>
                                <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                                    <Typography variant="subtitle1" fontWeight="bold">{shippingData.firstName} {shippingData.lastName}</Typography>
                                    <Typography variant="body2" color="text.secondary">{shippingData.address}</Typography>
                                    <Typography variant="body2" color="text.secondary">{shippingData.city}, {shippingData.zip}</Typography>
                                    <Typography variant="body2" color="text.secondary">{shippingData.country}</Typography>
                                </Paper>
                            </Box>
                        )}

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 6 }}>
                            <Button
                                disabled={activeStep === 0}
                                onClick={handleBack}
                                startIcon={<ArrowBack />}
                                sx={{ borderRadius: 2 }}
                            >
                                Back
                            </Button>
                            <Button
                                variant="contained"
                                onClick={handleNext}
                                disabled={loading}
                                endIcon={loading ? <CircularProgress size={20} color="inherit" /> : (activeStep === steps.length - 1 ? <CheckCircle /> : <ArrowForward />)}
                                sx={{ borderRadius: 2, px: 4, py: 1.5, fontWeight: 'bold' }}
                            >
                                {activeStep === steps.length - 1 ? (loading ? 'Processing...' : 'Place Order') : 'Next'}
                            </Button>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
};

export default Checkout;
