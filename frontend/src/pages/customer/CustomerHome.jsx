import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
    Box,
    Container,
    Typography,
    Button,
    Grid,
    Card,
    CardMedia,
    CardContent,
    CardActionArea,
    CardActions,
    IconButton,
    Rating,
    Chip,
    Stack,
    useTheme,
    Paper
} from '@mui/material';
import { ArrowForward, Star, TrendingUp, AutoAwesome, Bolt } from '@mui/icons-material';

const HeroSection = () => {
    return (
        <Box
            sx={{
                position: 'relative',
                height: { xs: '60vh', md: '75vh' },
                width: '100%',
                borderRadius: { xs: 0, md: 4 },
                overflow: 'hidden',
                mb: 6,
                backgroundImage: 'url(https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070&auto=format&fit=crop)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}
        >
            <Box
                sx={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0) 100%)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    p: { xs: 3, md: 8 }
                }}
            >
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <Chip
                        label="New Collection 2024"
                        sx={{
                            bgcolor: 'rgba(255,255,255,0.2)',
                            backdropFilter: 'blur(10px)',
                            color: 'white',
                            mb: 2,
                            fontWeight: 600,
                            border: '1px solid rgba(255,255,255,0.3)'
                        }}
                    />
                    <Typography variant="h1" color="white" sx={{ fontSize: { xs: '2.5rem', md: '4.5rem' }, mb: 2, lineHeight: 1.1 }}>
                        Redefine Your <br />
                        <Box component="span" sx={{ fontStyle: 'italic', fontFamily: 'serif' }}>Style Statement</Box>
                    </Typography>
                    <Button
                        component={Link}
                        to="/customer/shop"
                        variant="contained"
                        size="large"
                        endIcon={<ArrowForward />}
                        sx={{
                            bgcolor: 'white',
                            color: 'text.primary',
                            px: 4,
                            py: 1.5,
                            fontSize: '1.1rem',
                            '&:hover': { bgcolor: 'grey.100' }
                        }}
                    >
                        Explore Collection
                    </Button>
                </motion.div>
            </Box>
        </Box>
    );
};

const CategoryStrip = () => {
    const navigate = useNavigate();
    const categories = [
        { name: "Men", img: "/static/images/Shirts.jpg" },
        { name: "Women", img: "/static/images/Sarees.jpg" },
        { name: "Ethnic", img: "/static/images/Ethnic%20Wear.jpg" },
        { name: "Casual", img: "/static/images/Casual%20Wear.jpg" },
        { name: "Accessories", img: "/static/images/Jeans.jpg" }
    ];

    const handleCategoryClick = (categoryName) => {
        if (['Men', 'Women', 'Unisex'].includes(categoryName)) {
            navigate(`/customer/shop?gender=${categoryName}`);
        } else {
            navigate(`/customer/shop?category=${categoryName}`);
        }
    };

    return (
        <Box sx={{ mb: 8 }}>
            <Stack direction="row" alignItems="center" spacing={2} mb={4}>
                <Typography variant="h4" component="h2" fontWeight="bold">Shop by <Box component="span" color="primary.main">Genres</Box></Typography>
                <Box sx={{ flexGrow: 1, height: 1, bgcolor: 'divider' }} />
            </Stack>

            <Box
                sx={{
                    display: 'flex',
                    gap: 3,
                    overflowX: 'auto',
                    pb: 2,
                    px: 1,
                    scrollSnapType: 'x mandatory',
                    '&::-webkit-scrollbar': { display: 'none' },
                    scrollbarWidth: 'none'
                }}
            >
                {categories.map((cat, idx) => (
                    <Card
                        key={idx}
                        component={motion.div}
                        whileHover={{ y: -8 }}
                        onClick={() => handleCategoryClick(cat.name)}
                        sx={{
                            minWidth: 220,
                            height: 320,
                            position: 'relative',
                            borderRadius: 4,
                            cursor: 'pointer',
                            scrollSnapAlign: 'start',
                            flexShrink: 0
                        }}
                    >
                        <CardMedia
                            component="img"
                            image={cat.img}
                            alt={cat.name}
                            sx={{ height: '100%', width: '100%' }}
                        />
                        <Box
                            sx={{
                                position: 'absolute',
                                inset: 0,
                                background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)',
                                display: 'flex',
                                alignItems: 'flex-end',
                                p: 3
                            }}
                        >
                            <Typography variant="h5" color="white" fontWeight="bold">{cat.name}</Typography>
                        </Box>
                    </Card>
                ))}
            </Box>
        </Box>
    );
};

const FeaturedProducts = () => {
    const [products, setProducts] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        api.get('products/').then(res => setProducts(res.data.slice(0, 4)));
    }, []);

    return (
        <Box sx={{ mb: 8 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-end" mb={4}>
                <Typography variant="h4" component="h2" fontWeight="bold">Trending Now</Typography>
                <Button endIcon={<ArrowForward />} onClick={() => navigate('/customer/shop')}>View All</Button>
            </Stack>

            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                        xs: 'repeat(1, 1fr)',
                        sm: 'repeat(2, 1fr)',
                        md: 'repeat(4, 1fr)'
                    },
                    gap: 3
                }}
            >
                {products.map((product) => (
                    <Card
                        key={product.id}
                        sx={{
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            position: 'relative',
                            borderRadius: 0, // Premium sharp corners or strict radius
                            bgcolor: 'transparent',
                            boxShadow: 'none',
                            cursor: 'pointer',
                            '&:hover .quick-view': { transform: 'translateY(0)', opacity: 1 },
                            '&:hover .product-image': { transform: 'scale(1.05)' }
                        }}
                        onClick={() => navigate(`/customer/product/${product.id}`)}
                    >
                        <Box sx={{ position: 'relative', width: '100%', paddingBottom: '100%', borderRadius: 2, overflow: 'hidden', bgcolor: 'grey.100', mb: 2 }}>
                            {/* Product Image */}
                            <Box
                                component="img"
                                src={product.image} // Assuming image URL is correct
                                className="product-image"
                                sx={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    transition: 'transform 0.6s ease'
                                }}
                            />

                            {!product.image && (
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        inset: 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        bgcolor: 'grey.100',
                                        color: 'text.disabled'
                                    }}
                                >
                                    <Typography variant="h3" fontWeight="bold">{product.name.charAt(0)}</Typography>
                                </Box>
                            )}

                            {/* Quick View Button - Fixed to Black */}
                            <Box
                                className="quick-view"
                                sx={{
                                    position: 'absolute',
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    p: 1.5,
                                    background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 100%)',
                                    transform: { xs: 'none', md: 'translateY(100%)' },
                                    opacity: { xs: 1, md: 0 },
                                    transition: 'all 0.3s ease',
                                    display: 'flex',
                                    justifyContent: 'center'
                                }}
                            >
                                <Button
                                    variant="contained"
                                    fullWidth
                                    sx={{
                                        bgcolor: 'black',
                                        color: 'white',
                                        fontWeight: 'bold',
                                        textTransform: 'none',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                                        '&:hover': { bgcolor: '#333', color: 'white' }
                                    }}
                                >
                                    Quick View
                                </Button>
                            </Box>

                            {/* Rating Badge */}
                            <Chip
                                label="4.8"
                                icon={<Star sx={{ fontSize: '1rem !important', color: '#fbbf24' }} />}
                                size="small"
                                sx={{ position: 'absolute', top: 12, right: 12, bgcolor: 'white', fontWeight: 'bold', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
                            />
                        </Box>

                        <CardContent sx={{ p: 0, flexGrow: 1 }}>
                            <Typography variant="body2" color="text.secondary" fontWeight="medium" sx={{ textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: 0.5, mb: 0.5 }}>
                                {product.garment_category_display || 'Collection'}
                            </Typography>
                            <Typography variant="h6" component="h3" fontWeight="bold" noWrap sx={{ fontSize: '1rem', mb: 0.5 }}>
                                {product.name}
                            </Typography>
                            <Stack direction="row" alignItems="center" justifyContent="space-between">
                                <Typography variant="h6" fontSize="1rem" fontWeight="bold" color="text.primary">
                                    ₹{product.price}
                                </Typography>
                            </Stack>
                        </CardContent>
                    </Card>
                ))}
            </Box>
        </Box>
    );
};

const AIPromo = () => (
    <Paper
        elevation={0}
        sx={{
            background: 'linear-gradient(135deg, #4f46e5 0%, #8b5cf6 100%)',
            borderRadius: 4,
            p: { xs: 4, md: 8 },
            mb: 8,
            color: 'white',
            position: 'relative',
            overflow: 'hidden'
        }}
    >
        <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 600 }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                <AutoAwesome sx={{ color: '#c4b5fd' }} />
                <Typography variant="overline" color="inherit" sx={{ letterSpacing: 2, fontWeight: 'bold', color: '#c4b5fd' }}>
                    AI Powered
                </Typography>
            </Stack>
            <Typography variant="h3" component="h2" mb={2} fontWeight="bold">
                Curated Just For You
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9, mb: 4, fontWeight: 'normal' }}>
                Our AI analyzes your style preferences to recommend outfits that match your unique taste perfectly.
            </Typography>
            <Button variant="contained" size="large" sx={{ bgcolor: 'white', color: 'primary.main', '&:hover': { bgcolor: 'grey.100' } }}>
                See Recommendations
            </Button>
        </Box>

        {/* Abstract Shapes */}
        <Box sx={{ position: 'absolute', top: -100, right: -100, width: 400, height: 400, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.1)', filter: 'blur(60px)' }} />
        <Box sx={{ position: 'absolute', bottom: -100, left: -100, width: 300, height: 300, borderRadius: '50%', bgcolor: 'rgba(236, 72, 153, 0.3)', filter: 'blur(60px)' }} />
    </Paper>
);

const CustomerHome = () => {
    return (
        <Container maxWidth="xl" sx={{ px: { xs: 2, md: 4 } }}>
            <HeroSection />
            <CategoryStrip />
            <AIPromo />
            <FeaturedProducts />
        </Container>
    );
};

export default CustomerHome;
