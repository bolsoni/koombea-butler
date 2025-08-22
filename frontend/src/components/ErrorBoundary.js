import React from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Alert,
  Container,
} from '@mui/material';
import { Refresh, BugReport } from '@mui/icons-material';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console or error reporting service
    console.error('Error caught by boundary:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Report to error monitoring service (Sentry, etc.)
    if (process.env.NODE_ENV === 'production') {
      // reportError(error, errorInfo);
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Container maxWidth="md" sx={{ mt: 8 }}>
          <Card sx={{ borderRadius: 3, textAlign: 'center' }}>
            <CardContent sx={{ p: 6 }}>
              <BugReport sx={{ fontSize: 64, color: 'error.main', mb: 3 }} />
              
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
                Oops! Something went wrong
              </Typography>
              
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                We're sorry, but something unexpected happened. Our team has been notified.
              </Typography>

              <Alert severity="error" sx={{ mb: 4, textAlign: 'left' }}>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  {this.state.error && this.state.error.toString()}
                </Typography>
              </Alert>

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  startIcon={<Refresh />}
                  onClick={this.handleReload}
                >
                  Reload Page
                </Button>
                <Button
                  variant="outlined"
                  onClick={this.handleReset}
                >
                  Try Again
                </Button>
              </Box>

              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <Box sx={{ mt: 4, textAlign: 'left' }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Error Details (Development Mode):
                  </Typography>
                  <Alert severity="warning">
                    <pre style={{ fontSize: '12px', overflow: 'auto' }}>
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </Alert>
                </Box>
              )}
            </CardContent>
          </Card>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;