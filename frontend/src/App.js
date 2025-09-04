// frontend/src/App.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import EnhancedDashboard from './pages/EnhancedDashboard';
import CostAnalyticsPage from './pages/CostAnalyticsPage';
import CostReportsPage from './pages/CostReportsPage';
import AIReportsPage from './pages/AIReportsPage';
import UserManagement from './pages/UserManagement';
import AIAgentSettings from './pages/AIAgentSettings';
import AWSAccountsPage from './pages/AWSAccountsPage';
import ProfilePage from './pages/ProfilePage';
import DiagramPage from './pages/DiagramPage';
import { authService } from './services/authService';

// Create Auth Context
const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Theme configuration
const theme = createTheme({
  palette: {
    primary: {
      main: '#FF9900', // AWS Orange
      light: '#FFB84D',
      dark: '#E67E00',
      lighter: 'rgba(255, 153, 0, 0.1)',
    },
    secondary: {
      main: '#232F3E', // AWS Dark Blue
      light: '#4A5568',
      dark: '#1A202C',
    },
    background: {
      default: '#F7FAFC',
      paper: '#FFFFFF',
    },
    success: {
      main: '#38A169',
      lighter: 'rgba(56, 161, 105, 0.1)',
    },
    error: {
      main: '#E53E3E',
      lighter: 'rgba(229, 62, 62, 0.1)',
    },
    warning: {
      main: '#DD6B20',
      lighter: 'rgba(221, 107, 32, 0.1)',
    },
    info: {
      main: '#3182CE',
      lighter: 'rgba(49, 130, 206, 0.1)',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 600,
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          fontWeight: 500,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        },
      },
    },
  },
});

// Auth Provider Component
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.is_admin || false;

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const userData = await authService.getMe();
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);
      localStorage.setItem('token', response.access_token);
      setUser(response.user);
      setIsAuthenticated(true);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    user,
    isAuthenticated,
    isAdmin,
    login,
    logout,
    loading,
    checkAuthStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children, adminRequired = false }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>; // Or a proper loading component
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminRequired && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Layout>{children}</Layout>;
};

// Main App Component
function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <Router>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<LoginPage />} />
              
              {/* Protected Routes */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/enhanced-dashboard" 
                element={
                  <ProtectedRoute>
                    <EnhancedDashboard />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/cost-analytics" 
                element={
                  <ProtectedRoute>
                    <CostAnalyticsPage />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/cost-reports" 
                element={
                  <ProtectedRoute>
                    <CostReportsPage />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/ai-reports" 
                element={
                  <ProtectedRoute>
                    <AIReportsPage />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/aws-accounts" 
                element={
                  <ProtectedRoute>
                    <AWSAccountsPage />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/diagram" 
                element={
                  <ProtectedRoute>
                    <DiagramPage />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                } 
              />
              
              {/* Admin Only Routes */}
              <Route 
                path="/users" 
                element={
                  <ProtectedRoute adminRequired={true}>
                    <UserManagement />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/ai-agents" 
                element={
                  <ProtectedRoute adminRequired={true}>
                    <AIAgentSettings />
                  </ProtectedRoute>
                } 
              />
              
              {/* Default Redirects */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
