import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
  Tooltip,
  Collapse,
  Badge,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  People,
  Settings,
  Logout,
  CloudQueue,
  ChevronLeft,
  ChevronRight,
  ExpandLess,
  ExpandMore,
  AccountBox,
  AdminPanelSettings,
  Person,
  SmartToy,
  Analytics,
  Assessment,
  Timeline,
  PieChart,
  TableChart,
} from '@mui/icons-material';
import { useAuth } from '../App';

const drawerWidth = 280;
const collapsedDrawerWidth = 72;

const Layout = ({ children }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const { user, logout, isAdmin } = useAuth();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [drawerCollapsed, setDrawerCollapsed] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const [managementExpanded, setManagementExpanded] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleDrawerCollapse = () => {
    setDrawerCollapsed(!drawerCollapsed);
  };

  const handleUserMenuOpen = (event) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleUserMenuClose();
  };

  const handleManagementToggle = () => {
    setManagementExpanded(!managementExpanded);
  };

  const mainNavItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
    { text: 'AWS Accounts', icon: <CloudQueue />, path: '/aws-accounts' },
    { 
      text: 'Cost Analytics', 
      icon: <Analytics />, 
      path: '/cost-analytics'
    },
    { 
      text: 'Reports', 
      icon: <Assessment />, 
      path: '/ai-reports'
    },
    { 
    text: 'Diagram', 
    icon: <Timeline />, 
    path: '/diagram'
  },
 ];

  const managementItems = [
    ...(isAdmin ? [
      { text: 'User Management', icon: <People />, path: '/users' },
      { text: 'AI Agent Settings', icon: <SmartToy />, path: '/ai-agents' }
    ] : []),
  ];

  const getNavItemColor = (path) => {
    return location.pathname === path ? 'primary.main' : 'text.secondary';
  };

  const getNavItemBackground = (path) => {
    return location.pathname === path ? 'rgba(255, 153, 0, 0.1)' : 'transparent';
  };

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo */}
      <Box sx={{ 
        p: drawerCollapsed ? 1 : 2, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: drawerCollapsed ? 'center' : 'flex-start',
        minHeight: 64
      }}>
        <CloudQueue sx={{ 
          fontSize: 32, 
          color: 'primary.main',
          mr: drawerCollapsed ? 0 : 1
        }} />
        {!drawerCollapsed && (
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 700, 
              color: 'primary.main',
              fontSize: '1.25rem'
            }}
          >
            Koombea Butler
          </Typography>
        )}
      </Box>

      <Divider />

      {/* Main Navigation */}
      <List sx={{ flexGrow: 1, px: 1 }}>
        {mainNavItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
            <Tooltip 
              title={drawerCollapsed ? item.text : ''} 
              placement="right"
            >
              <ListItemButton
                onClick={() => navigate(item.path)}
                sx={{
                  borderRadius: 2,
                  backgroundColor: getNavItemBackground(item.path),
                  color: getNavItemColor(item.path),
                  '&:hover': {
                    backgroundColor: 'rgba(255, 153, 0, 0.08)',
                  },
                  justifyContent: drawerCollapsed ? 'center' : 'flex-start',
                  px: drawerCollapsed ? 0 : 2,
                  py: 1.5,
                }}
              >
                <ListItemIcon sx={{ 
                  color: 'inherit', 
                  minWidth: drawerCollapsed ? 'unset' : 40,
                  justifyContent: 'center'
                }}>
                  {item.icon}
                </ListItemIcon>
                {!drawerCollapsed && (
                  <ListItemText 
                    primary={item.text}
                    primaryTypographyProps={{
                      fontWeight: location.pathname === item.path ? 600 : 400,
                    }}
                  />
                )}
              </ListItemButton>
            </Tooltip>
          </ListItem>
        ))}

        {/* Management Section */}
        {managementItems.length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            
            {!drawerCollapsed ? (
              <ListItem disablePadding>
                <ListItemButton onClick={handleManagementToggle} sx={{ px: 2 }}>
                  <ListItemIcon>
                    <AdminPanelSettings />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Management" 
                    primaryTypographyProps={{ fontWeight: 500 }}
                  />
                  {managementExpanded ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>
              </ListItem>
            ) : (
              <Tooltip title="Management" placement="right">
                <ListItem disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton 
                    onClick={handleManagementToggle}
                    sx={{ 
                      borderRadius: 2,
                      justifyContent: 'center',
                      py: 1.5
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 'unset', justifyContent: 'center' }}>
                      <AdminPanelSettings />
                    </ListItemIcon>
                  </ListItemButton>
                </ListItem>
              </Tooltip>
            )}

            <Collapse in={managementExpanded || drawerCollapsed} timeout="auto" unmountOnExit>
              {managementItems.map((item) => (
                <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                  <Tooltip title={drawerCollapsed ? item.text : ''} placement="right">
                    <ListItemButton
                      onClick={() => navigate(item.path)}
                      sx={{
                        borderRadius: 2,
                        backgroundColor: getNavItemBackground(item.path),
                        color: getNavItemColor(item.path),
                        '&:hover': {
                          backgroundColor: 'rgba(255, 153, 0, 0.08)',
                        },
                        justifyContent: drawerCollapsed ? 'center' : 'flex-start',
                        px: drawerCollapsed ? 0 : 4,
                        py: 1.5,
                        ml: drawerCollapsed ? 0 : 2,
                      }}
                    >
                      <ListItemIcon sx={{ 
                        color: 'inherit', 
                        minWidth: drawerCollapsed ? 'unset' : 40,
                        justifyContent: 'center'
                      }}>
                        {item.icon}
                      </ListItemIcon>
                      {!drawerCollapsed && (
                        <ListItemText 
                          primary={item.text}
                          primaryTypographyProps={{
                            fontWeight: location.pathname === item.path ? 600 : 400,
                          }}
                        />
                      )}
                    </ListItemButton>
                  </Tooltip>
                </ListItem>
              ))}
            </Collapse>
          </>
        )}
      </List>

      {/* Collapse Toggle */}
      {!isMobile && (
        <Box sx={{ p: 1, borderTop: 1, borderColor: 'divider' }}>
          <Tooltip title={drawerCollapsed ? 'Expand' : 'Collapse'} placement="right">
            <IconButton 
              onClick={handleDrawerCollapse}
              sx={{ 
                width: '100%',
                borderRadius: 2,
                color: 'text.secondary'
              }}
            >
              {drawerCollapsed ? <ChevronRight /> : <ChevronLeft />}
            </IconButton>
          </Tooltip>
        </Box>
      )}
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { lg: `calc(100% - ${drawerCollapsed ? collapsedDrawerWidth : drawerWidth}px)` },
          ml: { lg: `${drawerCollapsed ? collapsedDrawerWidth : drawerWidth}px` },
          bgcolor: 'background.paper',
          color: 'text.primary',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { lg: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          {/* Page Title and Breadcrumb */}
          <Box sx={{ flexGrow: 1 }}>
            {location.pathname === '/cost-analytics' && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Analytics sx={{ color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Cost Analytics
                </Typography>
              </Box>
            )}
            {location.pathname === '/ai-reports' && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Assessment sx={{ color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  AI Reports
                </Typography>
              </Box>
            )}
          </Box>
          
          {/* User Menu */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              onClick={handleUserMenuOpen}
              sx={{ p: 0, position: 'relative' }}
            >
              <Avatar 
                src={user?.avatar_url}
                sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}
              >
                {user?.name?.charAt(0)?.toUpperCase()}
              </Avatar>
              {/* Online indicator */}
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  width: 12,
                  height: 12,
                  bgcolor: 'success.main',
                  borderRadius: '50%',
                  border: 2,
                  borderColor: 'background.paper',
                }}
              />
            </IconButton>
            
            <Menu
              anchorEl={userMenuAnchor}
              open={Boolean(userMenuAnchor)}
              onClose={handleUserMenuClose}
              sx={{ mt: 1 }}
            >
              <Box sx={{ px: 2, py: 1, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  {user?.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {user?.email}
                </Typography>
                {user?.is_admin && (
                  <Typography variant="caption" color="primary.main" sx={{ fontWeight: 500 }}>
                    Administrator
                  </Typography>
                )}
              </Box>
              
              <MenuItem onClick={() => { navigate('/profile'); handleUserMenuClose(); }}>
                <ListItemIcon>
                  <Person fontSize="small" />
                </ListItemIcon>
                My Profile
              </MenuItem>
              
              <MenuItem onClick={() => { navigate('/cost-analytics'); handleUserMenuClose(); }}>
                <ListItemIcon>
                  <Analytics fontSize="small" />
                </ListItemIcon>
                Cost Analytics
              </MenuItem>
              
              <MenuItem onClick={() => { navigate('/ai-reports'); handleUserMenuClose(); }}>
                <ListItemIcon>
                  <Assessment fontSize="small" />
                </ListItemIcon>
                AI Reports
              </MenuItem>
              
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <Logout fontSize="small" />
                </ListItemIcon>
                Sign Out
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Navigation Drawer */}
      <Box
        component="nav"
        sx={{ 
          width: { lg: drawerCollapsed ? collapsedDrawerWidth : drawerWidth }, 
          flexShrink: { lg: 0 } 
        }}
      >
        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', lg: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              bgcolor: 'background.paper',
              borderRight: 1,
              borderColor: 'divider',
            },
          }}
        >
          {drawerContent}
        </Drawer>

        {/* Desktop Drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', lg: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerCollapsed ? collapsedDrawerWidth : drawerWidth,
              bgcolor: 'background.paper',
              borderRight: 1,
              borderColor: 'divider',
              transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
            },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { 
            lg: `calc(100% - ${drawerCollapsed ? collapsedDrawerWidth : drawerWidth}px)` 
          },
          minHeight: '100vh',
          bgcolor: 'background.default',
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
};

export default Layout;
