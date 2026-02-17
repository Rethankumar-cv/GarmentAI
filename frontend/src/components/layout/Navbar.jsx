import React, { useEffect, useState } from 'react';
import useAuthStore from '../../store/authStore';
import useCartStore from '../../store/cartStore';
import { useNavigate } from 'react-router-dom';
import {
    AppBar,
    Toolbar,
    Typography,
    IconButton,
    InputBase,
    Badge,
    Avatar,
    Menu,
    MenuItem,
    Box,
    Container,
    Button,
    useScrollTrigger,
    Slide
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import {
    Search as SearchIcon,
    ShoppingBag,
    Notifications,
    Person,
    Logout,
    Menu as MenuIcon,
    AdminPanelSettings
} from '@mui/icons-material';

// Styled Search Component
const Search = styled('div')(({ theme }) => ({
    position: 'relative',
    borderRadius: theme.shape.borderRadius,
    backgroundColor: alpha(theme.palette.common.black, 0.04),
    '&:hover': {
        backgroundColor: alpha(theme.palette.common.black, 0.06),
    },
    marginRight: theme.spacing(2),
    marginLeft: 0,
    width: '100%',
    [theme.breakpoints.up('sm')]: {
        marginLeft: theme.spacing(3),
        width: 'auto',
    },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
    padding: theme.spacing(0, 2),
    height: '100%',
    position: 'absolute',
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: theme.palette.text.secondary,
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
    color: 'inherit',
    '& .MuiInputBase-input': {
        padding: theme.spacing(1, 1, 1, 0),
        paddingLeft: `calc(1em + ${theme.spacing(4)})`,
        transition: theme.transitions.create('width'),
        width: '100%',
        [theme.breakpoints.up('md')]: {
            width: '30ch',
        },
    },
}));

function HideOnScroll(props) {
    const { children, window } = props;
    const trigger = useScrollTrigger({ target: window ? window() : undefined });
    return (
        <Slide appear={false} direction="down" in={!trigger}>
            {children}
        </Slide>
    );
}

const Navbar = (props) => {
    const { user, role, logout } = useAuthStore();
    const { cart, fetchCart } = useCartStore();
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = useState(null);

    useEffect(() => {
        if (user) fetchCart();
    }, [user, fetchCart]);

    const handleMenu = (event) => setAnchorEl(event.currentTarget);
    const handleClose = () => setAnchorEl(null);
    const handleLogout = () => {
        handleClose();
        logout();
        navigate('/login');
    };

    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <HideOnScroll {...props}>
            <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                <Container maxWidth="xl">
                    <Toolbar disableGutters sx={{ minHeight: 72 }}>
                        {/* Logo */}
                        <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', mr: 2 }} onClick={() => navigate('/customer/home')}>
                            <Box
                                sx={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 3,
                                    background: 'linear-gradient(135deg, #4f46e5 0%, #8b5cf6 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    fontSize: '1.2rem',
                                    mr: 1.5,
                                    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
                                }}
                            >
                                G
                            </Box>
                            <Typography variant="h6" noWrap sx={{ fontWeight: 800, letterSpacing: '-0.5px' }}>
                                Fashion<span style={{ color: '#4f46e5' }}>Store</span>
                            </Typography>
                        </Box>

                        {/* Desktop Navigation Links */}
                        <Box sx={{ flexGrow: 1, display: { xs: 'none', md: role === 'OWNER' ? 'none' : 'flex' }, gap: 1 }}>
                            {['Home', 'Shop', 'Men', 'Women', 'Orders'].map((page) => (
                                <Button
                                    key={page}
                                    onClick={() => {
                                        if (page === 'Home') navigate('/customer/home');
                                        else if (page === 'Orders') navigate('/customer/orders');
                                        else if (['Men', 'Women'].includes(page)) navigate(`/customer/shop?category=${page.toLowerCase()}`);
                                        else navigate('/customer/shop');
                                    }}
                                    sx={{ color: 'text.secondary', fontWeight: 600, '&:hover': { color: 'primary.main', bgcolor: 'action.hover' } }}
                                >
                                    {page}
                                </Button>
                            ))}
                        </Box>

                        {/* Search Bar */}
                        <Box sx={{ display: { xs: 'none', md: role === 'OWNER' ? 'none' : 'block' } }}>
                            <Search>
                                <SearchIconWrapper>
                                    <SearchIcon />
                                </SearchIconWrapper>
                                <StyledInputBase placeholder="Search for products..." inputProps={{ 'aria-label': 'search' }} />
                            </Search>
                        </Box>

                        {/* Icons */}
                        <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
                            {role !== 'OWNER' && (
                                <IconButton onClick={() => navigate('/customer/cart')} color="inherit">
                                    <Badge badgeContent={totalItems} color="secondary">
                                        <ShoppingBag />
                                    </Badge>
                                </IconButton>
                            )}

                            <IconButton color="inherit" sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>
                                <Badge variant="dot" color="error">
                                    <Notifications />
                                </Badge>
                            </IconButton>

                            <IconButton onClick={handleMenu} sx={{ p: 0, ml: 1 }}>
                                <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40, fontSize: '1rem' }}>
                                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                                </Avatar>
                            </IconButton>

                            <Menu
                                id="menu-appbar"
                                anchorEl={anchorEl}
                                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                keepMounted
                                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                                open={Boolean(anchorEl)}
                                onClose={handleClose}
                                PaperProps={{
                                    elevation: 0,
                                    sx: {
                                        overflow: 'visible',
                                        filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                                        mt: 1.5,
                                        '&:before': {
                                            content: '""',
                                            display: 'block',
                                            position: 'absolute',
                                            top: 0,
                                            right: 14,
                                            width: 10,
                                            height: 10,
                                            bgcolor: 'background.paper',
                                            transform: 'translateY(-50%) rotate(45deg)',
                                            zIndex: 0,
                                        },
                                    },
                                }}
                            >
                                {role === 'OWNER' && (
                                    <MenuItem onClick={() => { handleClose(); navigate('/owner/dashboard'); }}>
                                        <ShoppingBag sx={{ mr: 2, color: 'text.secondary' }} /> Owner Dashboard
                                    </MenuItem>
                                )}
                                {role !== 'OWNER' && (
                                    <MenuItem onClick={() => { handleClose(); navigate('/customer/orders'); }}>
                                        <ShoppingBag sx={{ mr: 2, color: 'text.secondary' }} /> My Orders
                                    </MenuItem>
                                )}
                                {role !== 'OWNER' && (
                                    <MenuItem onClick={() => { handleClose(); navigate('/customer/profile'); }}>
                                        <Person sx={{ mr: 2, color: 'text.secondary' }} /> My Profile
                                    </MenuItem>
                                )}
                                <MenuItem onClick={() => { handleClose(); navigate('/admin/login'); }}>
                                    <AdminPanelSettings sx={{ mr: 2, color: 'text.secondary' }} /> Admin Access
                                </MenuItem>
                                <MenuItem onClick={handleLogout}>
                                    <Logout sx={{ mr: 2, color: 'error.main' }} /> Logout
                                </MenuItem>
                            </Menu>
                        </Box>
                    </Toolbar>
                </Container>
            </AppBar>
        </HideOnScroll>
    );
};

export default Navbar;
