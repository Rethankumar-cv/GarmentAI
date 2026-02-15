import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import useCartStore from '../../store/cartStore';
import {
    Box,
    Container,
    Grid,
    Typography,
    Card,
    CardMedia,
    CardContent,
    Button,
    IconButton,
    TextField,
    InputAdornment,
    Drawer,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Checkbox,
    FormControlLabel,
    FormGroup,
    Chip,
    Stack,
    CircularProgress,
    useMediaQuery,
    useTheme,
    Paper,
    Divider
} from '@mui/material';
import {
    Search,
    FilterList,
    Close,
    ExpandMore,
    FavoriteBorder,
    ShoppingBag,
    Star
} from '@mui/icons-material';

// --- Styled Components & Helpers ---

const FilterSection = ({ title, options, selected, onChange }) => (
    <Accordion defaultExpanded disableGutters elevation={0} sx={{ '&:before': { display: 'none' }, bgcolor: 'transparent', mb: 1 }}>
        <AccordionSummary expandIcon={<ExpandMore />} sx={{ px: 0, minHeight: 48, '& .MuiAccordionSummary-content': { margin: '10px 0' } }}>
            <Typography variant="subtitle1" fontWeight="bold" fontSize="0.95rem">{title}</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 0, pt: 0, pb: 2 }}>
            <FormGroup>
                {options.map((opt) => (
                    <FormControlLabel
                        key={opt}
                        control={
                            <Checkbox
                                checked={selected.includes(opt)}
                                onChange={() => onChange(opt)}
                                size="small"
                                color="primary"
                                sx={{ p: 0.5 }}
                            />
                        }
                        label={<Typography variant="body2" color="text.secondary">{opt}</Typography>}
                        sx={{ ml: 0, mr: 0, mb: 0.5, gap: 1 }}
                    />
                ))}
            </FormGroup>
        </AccordionDetails>
        <Divider sx={{ borderStyle: 'dashed' }} />
    </Accordion>
);

const ProductCard = ({ product }) => {
    const addToCart = useCartStore((state) => state.addToCart);
    const [isHovered, setIsHovered] = useState(false);
    const navigate = useNavigate();

    const handleAddToCart = async (e) => {
        e.stopPropagation();
        const result = await addToCart(product.id, 1);
        if (result.success) {
            console.log("Added to cart");
        } else {
            alert(`Failed: ${result.message}`);
        }
    };

    return (
        <Card
            component={motion.div}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            layout
            elevation={0}
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 0,
                bgcolor: 'transparent',
                position: 'relative',
                cursor: 'pointer',
                overflow: 'visible',
                '&:hover': {
                    '& .product-image': { transform: 'scale(1.05)' },
                    '& .add-to-cart-btn': { opacity: 1, transform: 'translateY(0)' }
                }
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => navigate(`/customer/product/${product.id}`)}
        >
            {/* Image Container - Fixed Aspect Ratio 1:1 (Square) */}
            <Box sx={{ position: 'relative', width: '100%', paddingBottom: '100%', overflow: 'hidden', borderRadius: 2, bgcolor: 'grey.100', mb: 2 }}>
                {product.image ? (
                    <Box
                        component="img"
                        src={product.image}
                        alt={product.name}
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
                ) : (
                    <Box
                        sx={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'text.disabled',
                            bgcolor: 'grey.100'
                        }}
                    >
                        <Typography variant="h3" fontWeight="bold" color="grey.300">{product.name.charAt(0)}</Typography>
                    </Box>
                )}

                {/* Badges */}
                {product.stock <= 5 && product.stock > 0 && (
                    <Chip label="Low Stock" color="warning" size="small" sx={{ position: 'absolute', top: 10, left: 10, fontWeight: 600, fontSize: '0.7rem', height: 24 }} />
                )}
                {product.stock === 0 && (
                    <Chip label="Sold Out" color="default" size="small" sx={{ position: 'absolute', top: 10, left: 10, fontWeight: 600, fontSize: '0.7rem', height: 24, bgcolor: 'rgba(0,0,0,0.7)', color: 'white' }} />
                )}

                {/* Wishlist Button */}
                <IconButton
                    size="small"
                    sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        bgcolor: 'rgba(255,255,255,0.8)',
                        backdropFilter: 'blur(4px)',
                        '&:hover': { bgcolor: 'white' }
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <FavoriteBorder fontSize="small" />
                </IconButton>

                {/* Quick Add Button */}
                <Box
                    className="add-to-cart-btn"
                    sx={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        p: 1.5,
                        background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 100%)',
                        display: 'flex',
                        justifyContent: 'center',
                        opacity: { xs: 1, md: 0 }, // Visible on mobile, hidden on desktop until hover
                        transform: { xs: 'none', md: 'translateY(10px)' },
                        transition: 'all 0.3s ease'
                    }}
                >
                    <Button
                        variant="contained"
                        fullWidth
                        onClick={handleAddToCart}
                        disabled={product.stock <= 0}
                        sx={{
                            bgcolor: 'white',
                            color: 'text.primary',
                            fontWeight: 'bold',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            '&:hover': { bgcolor: 'black', color: 'white' },
                            textTransform: 'none',
                            py: 1
                        }}
                    >
                        {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                    </Button>
                </Box>
            </Box>

            {/* Content */}
            <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                <Typography variant="caption" color="text.secondary" fontWeight="medium" sx={{ mb: 0.5, display: 'block', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {product.garment_category_display || 'General'}
                </Typography>
                <Typography
                    variant="body1"
                    fontWeight="bold"
                    sx={{
                        mb: 0.5,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 1,
                        WebkitBoxOrient: 'vertical',
                        lineHeight: 1.2
                    }}
                >
                    {product.name}
                </Typography>
                <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="body1" fontWeight="bold" color="text.primary">
                        ₹{product.price}
                    </Typography>
                    {product.price > 1000 && (
                        <Typography variant="body2" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                            ₹{Math.round(product.price * 1.2)}
                        </Typography>
                    )}
                    <Box sx={{ flexGrow: 1 }} />
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                        <Star sx={{ fontSize: 14, color: '#fbbf24' }} />
                        <Typography variant="caption" fontWeight="bold">4.5</Typography>
                    </Stack>
                </Stack>
            </CardContent>
        </Card>
    );
};

const CustomerShop = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();

    // Filter States
    const [selectedGender, setSelectedGender] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [selectedPriceRanges, setSelectedPriceRanges] = useState([]);
    const [selectedAvailability, setSelectedAvailability] = useState([]);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await api.get('products/');
                setProducts(response.data);
            } catch (error) {
                console.error('Error fetching products:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    // Initialize filters from URL
    useEffect(() => {
        const genderParam = searchParams.get('gender');
        if (genderParam) setSelectedGender([genderParam]);

        const categoryParam = searchParams.get('category');
        if (categoryParam) setSelectedCategories([categoryParam]);
    }, [searchParams]);

    const categories = [...new Set(products.map(p => p.garment_category_display).filter(Boolean))];

    const toggleFilter = (item, state, setState) => {
        setState(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
    };

    const clearFilters = () => {
        setSearch('');
        setSelectedCategories([]);
        setSelectedPriceRanges([]);
        setSelectedAvailability([]);
        setSelectedGender([]);
        setSearchParams({});
    };

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(p.garment_category_display);

        let matchesPrice = true;
        if (selectedPriceRanges.length > 0) {
            matchesPrice = selectedPriceRanges.some(range => {
                if (range === 'Under ₹1000') return p.price < 1000;
                if (range === '₹1000 - ₹2500') return p.price >= 1000 && p.price <= 2500;
                if (range === '₹2500+') return p.price > 2500;
                return false;
            });
        }

        const matchesGender = selectedGender.length === 0 || selectedGender.includes(p.gender) || (p.gender === 'Unisex');

        let matchesAvailability = true;
        if (selectedAvailability.length > 0) {
            matchesAvailability = selectedAvailability.some(status => {
                if (status === 'In Stock') return p.stock > 0;
                if (status === 'Out of Stock') return p.stock === 0;
                return false;
            });
        }

        return matchesSearch && matchesCategory && matchesPrice && matchesAvailability && matchesGender;
    });

    const FilterContent = () => (
        <Box sx={{ width: { xs: 280, md: '100%' }, pt: 1, pr: { md: 4 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" fontWeight="bold">Filters</Typography>
                {isMobile ? (
                    <IconButton onClick={() => setShowMobileFilters(false)}><Close /></IconButton>
                ) : (
                    <Button variant="text" size="small" onClick={clearFilters} color="secondary" sx={{ textTransform: 'none' }}>
                        Clear All
                    </Button>
                )}
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                <FilterSection
                    title="Gender"
                    options={['Men', 'Women', 'Unisex']}
                    selected={selectedGender}
                    onChange={(item) => toggleFilter(item, selectedGender, setSelectedGender)}
                />

                <FilterSection
                    title="Categories"
                    options={categories.length > 0 ? categories : ['Shirts', 'Pants', 'Dresses']}
                    selected={selectedCategories}
                    onChange={(item) => toggleFilter(item, selectedCategories, setSelectedCategories)}
                />

                <FilterSection
                    title="Price"
                    options={['Under ₹1000', '₹1000 - ₹2500', '₹2500+']}
                    selected={selectedPriceRanges}
                    onChange={(item) => toggleFilter(item, selectedPriceRanges, setSelectedPriceRanges)}
                />

                <FilterSection
                    title="Availability"
                    options={['In Stock', 'Out of Stock']}
                    selected={selectedAvailability}
                    onChange={(item) => toggleFilter(item, selectedAvailability, setSelectedAvailability)}
                />
            </Box>
        </Box>
    );

    return (
        <Container maxWidth="xl" sx={{ px: { xs: 2, md: 6 }, py: 4 }}>
            {/* Page Header */}
            <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'stretch', md: 'center' }} justifyContent="space-between" spacing={3} mb={5}>
                <Box>
                    <Typography variant="h3" fontWeight={800} letterSpacing="-0.02em" gutterBottom sx={{ fontSize: { xs: '2rem', md: '2.5rem' } }}>
                        Shop Collection
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600 }}>
                        Explore the latest trends and timeless essentials for your wardrobe.
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    {isMobile && (
                        <Button
                            variant="outlined"
                            startIcon={<FilterList />}
                            onClick={() => setShowMobileFilters(true)}
                            sx={{ flex: 1, height: 48, borderRadius: 2 }}
                        >
                            Filters
                        </Button>
                    )}
                    <TextField
                        placeholder="Search products..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        InputProps={{
                            startAdornment: (<InputAdornment position="start"><Search color="action" /></InputAdornment>),
                        }}
                        sx={{
                            width: { xs: '100%', md: 300 },
                            bgcolor: 'background.paper',
                            '& .MuiOutlinedInput-root': { borderRadius: 2, height: 48 }
                        }}
                    />
                </Box>
            </Stack>

            <Grid container spacing={4}>
                {/* Desktop Sticky Sidebar */}
                <Grid item md={3} lg={2.5} sx={{ display: { xs: 'none', md: 'block' } }}>
                    <Box sx={{ position: 'sticky', top: 100, maxHeight: 'calc(100vh - 120px)', overflowY: 'auto', pr: 1 }}>
                        <FilterContent />
                    </Box>
                </Grid>

                {/* Mobile Filter Drawer */}
                <Drawer
                    anchor="left"
                    open={showMobileFilters}
                    onClose={() => setShowMobileFilters(false)}
                    PaperProps={{ sx: { width: 280, p: 2 } }}
                >
                    <FilterContent />
                </Drawer>

                {/* Product Grid */}
                <Grid item xs={12} md={9} lg={9.5}>
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                <Typography variant="body2" color="text.secondary" fontWeight="bold">
                                    Showing {filteredProducts.length} Results
                                </Typography>
                                {/* Sorting could go here */}
                            </Box>

                            {filteredProducts.length > 0 ? (
                                <Box
                                    sx={{
                                        display: 'grid',
                                        gridTemplateColumns: {
                                            xs: 'repeat(1, 1fr)',
                                            sm: 'repeat(2, 1fr)',
                                            md: 'repeat(3, 1fr)',
                                            lg: 'repeat(4, 1fr)' // 4 columns on large screens
                                        },
                                        gap: 3
                                    }}
                                >
                                    <AnimatePresence>
                                        {filteredProducts.map((product) => (
                                            <ProductCard key={product.id} product={product} />
                                        ))}
                                    </AnimatePresence>
                                </Box>
                            ) : (
                                <Box sx={{ textAlign: 'center', py: 12, bgcolor: 'grey.50', borderRadius: 4 }}>
                                    <Typography variant="h6" color="text.secondary" gutterBottom>No products found matching your criteria.</Typography>
                                    <Button variant="outlined" onClick={clearFilters} sx={{ mt: 2 }}>Clear Filters</Button>
                                </Box>
                            )}
                        </Box>
                    )}
                </Grid>
            </Grid>
        </Container>
    );
};

export default CustomerShop;
