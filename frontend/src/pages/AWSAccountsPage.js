import React, { useState, useEffect } from 'react';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Chip,
  Box,
  Fade,
  LinearProgress,
  Tooltip,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Switch,
  FormControlLabel,
  CircularProgress,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  CloudQueue,
  Visibility,
  VisibilityOff,
  ContentCopy,
  CheckCircle,
  ErrorOutline,
  Warning,
  AWS,
  Lock,
  VpnKey,
  Public,
} from '@mui/icons-material';
import { authService } from '../services/authService';
import { useAuth } from '../App';

// Debug: Check if authService is properly imported
console.log('AuthService imported:', authService);
console.log('AuthService methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(authService)));

const AWSAccountsPage = () => {
  const { user: currentUser } = useAuth();
  const [awsAccounts, setAwsAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    aws_account_id: '',
    access_key_id: '',
    secret_access_key: '',
    default_region: 'us-east-1',
    is_active: true
  });
  
  // Separate error states for dialog and main page
  const [dialogError, setDialogError] = useState('');
  
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  const awsRegions = [
    { value: 'us-east-1', label: 'US East (N. Virginia)' },
    { value: 'us-east-2', label: 'US East (Ohio)' },
    { value: 'us-west-1', label: 'US West (N. California)' },
    { value: 'us-west-2', label: 'US West (Oregon)' },
    { value: 'eu-west-1', label: 'Europe (Ireland)' },
    { value: 'eu-west-2', label: 'Europe (London)' },
    { value: 'eu-central-1', label: 'Europe (Frankfurt)' },
    { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
    { value: 'ap-southeast-2', label: 'Asia Pacific (Sydney)' },
    { value: 'ap-northeast-1', label: 'Asia Pacific (Tokyo)' },
    { value: 'sa-east-1', label: 'South America (São Paulo)' },
  ];

  useEffect(() => {
    // Debug authService
    console.log('authService:', authService);
    console.log('getAWSAccounts method:', authService?.getAWSAccounts);
    
    loadAWSAccounts();
  }, []);

  const loadAWSAccounts = async () => {
    try {
      setLoading(true);
      setError(''); // Clear any previous errors
      
      // Check if authService and getAWSAccounts method exist
      if (!authService || typeof authService.getAWSAccounts !== 'function') {
        throw new Error('AWS Accounts service is not available. Please refresh the page.');
      }
      
      const accountsData = await authService.getAWSAccounts();
      setAwsAccounts(accountsData || []); // Ensure it's always an array
    } catch (err) {
      console.error('Error loading AWS accounts:', err);
      setError('Failed to load AWS accounts: ' + err.message);
      setAwsAccounts([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = () => {
    setEditingAccount(null);
    setFormData({
      name: '',
      description: '',
      aws_account_id: '',
      access_key_id: '',
      secret_access_key: '',
      default_region: 'us-east-1',
      is_active: true
    });
    setDialogError(''); // Clear dialog errors
    setDialogOpen(true);
  };

  const handleEditAccount = (account) => {
    setEditingAccount(account);
    setFormData({
      name: account.name,
      description: account.description || '',
      aws_account_id: account.aws_account_id,
      access_key_id: account.access_key_id,
      secret_access_key: '', // Don't populate for security
      default_region: account.default_region,
      is_active: account.is_active
    });
    setDialogError(''); // Clear dialog errors
    setDialogOpen(true);
  };

  const handleDeleteAccount = (account) => {
    setAccountToDelete(account);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async () => {
    setFormLoading(true);
    setDialogError(''); // Clear previous dialog errors

    try {
      // Validation
      if (!formData.name || !formData.aws_account_id || !formData.access_key_id) {
        throw new Error('Name, AWS Account ID, and Access Key ID are required');
      }

      if (!editingAccount && !formData.secret_access_key) {
        throw new Error('Secret Access Key is required for new accounts');
      }

      // Validate AWS Account ID format (12 digits)
      if (!/^\d{12}$/.test(formData.aws_account_id)) {
        throw new Error('AWS Account ID must be exactly 12 digits');
      }

      // Validate Access Key ID format
      if (!/^AKIA[0-9A-Z]{16}$/.test(formData.access_key_id)) {
        throw new Error('Access Key ID format is invalid (should start with AKIA)');
      }

      if (editingAccount) {
        // Update account
        const updateData = {
          name: formData.name,
          description: formData.description,
          aws_account_id: formData.aws_account_id,
          access_key_id: formData.access_key_id,
          default_region: formData.default_region,
          is_active: formData.is_active
        };
        
        // Only include secret key if provided
        if (formData.secret_access_key) {
          updateData.secret_access_key = formData.secret_access_key;
        }

        await authService.updateAWSAccount(editingAccount.id, updateData);
        setSuccess('AWS account updated successfully');
      } else {
        // Create account - backend will validate credentials
        await authService.createAWSAccount(formData);
        setSuccess('AWS account added and validated successfully');
      }

      setDialogOpen(false);
      loadAWSAccounts();
    } catch (err) {
      setDialogError(err.message); // Set error in dialog instead of main page
    } finally {
      setFormLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await authService.deleteAWSAccount(accountToDelete.id);
      setSuccess('AWS account deleted successfully');
      setDeleteDialogOpen(false);
      setAccountToDelete(null);
      loadAWSAccounts();
    } catch (err) {
      setError('Failed to delete AWS account: ' + err.message);
    }
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const clearDialogError = () => {
    setDialogError('');
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setSuccess('Copied to clipboard!');
  };

  const formatAccountId = (accountId) => {
    // Format as XXX-XXX-XXX-XXX for better readability
    return accountId.replace(/(\d{3})(\d{3})(\d{3})(\d{3})/, '$1-$2-$3-$4');
  };

  const getStatusColor = (isActive) => {
    return isActive ? 'success' : 'default';
  };

  const getRegionFlag = (region) => {
    const regionMap = {
      'us-east-1': '🇺🇸',
      'us-east-2': '🇺🇸',
      'us-west-1': '🇺🇸',
      'us-west-2': '🇺🇸',
      'eu-west-1': '🇮🇪',
      'eu-west-2': '🇬🇧',
      'eu-central-1': '🇩🇪',
      'ap-southeast-1': '🇸🇬',
      'ap-southeast-2': '🇦🇺',
      'ap-northeast-1': '🇯🇵',
      'sa-east-1': '🇧🇷',
    };
    return regionMap[region] || '🌍';
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4 }}>
          <LinearProgress />
          <Typography sx={{ mt: 2, textAlign: 'center' }}>
            Loading AWS accounts...
          </Typography>
        </Box>
      </Container>
    );
  }

  // Show error state with option to retry
  if (error && awsAccounts.length === 0) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4 }}>
          <Alert 
            severity="error" 
            sx={{ mb: 3, borderRadius: 2 }}
            action={
              <Button color="inherit" size="small" onClick={loadAWSAccounts}>
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
          
          {/* Show empty state */}
          <Card sx={{ borderRadius: 3, textAlign: 'center', py: 8 }}>
            <CardContent>
              <CloudQueue sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" sx={{ mb: 1 }}>
                No AWS Accounts Found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Add your first AWS account to start monitoring costs
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleCreateAccount}
              >
                Add AWS Account
              </Button>
            </CardContent>
          </Card>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Fade in timeout={600}>
        <Box>
          {/* Header */}
          <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                AWS Accounts
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Manage your AWS accounts for cost monitoring and optimization
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleCreateAccount}
              sx={{ 
                borderRadius: 2,
                px: 3,
                py: 1.5,
                fontWeight: 600
              }}
            >
              Add AWS Account
            </Button>
          </Box>

          {/* Main Page Alerts */}
          {error && (
            <Alert 
              severity="error" 
              sx={{ mb: 3, borderRadius: 2 }} 
              onClose={clearMessages}
            >
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert 
              severity="success" 
              sx={{ mb: 3, borderRadius: 2 }} 
              onClose={clearMessages}
            >
              {success}
            </Alert>
          )}

          {/* Stats Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={4}>
              <Card sx={{ background: 'linear-gradient(135deg, #FF9900 0%, #FFB84D 100%)', color: 'white' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                        {awsAccounts.length}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Total Accounts
                      </Typography>
                    </Box>
                    <CloudQueue sx={{ fontSize: 48, opacity: 0.8 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                        {awsAccounts.filter(a => a.is_active).length}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Active
                      </Typography>
                    </Box>
                    <CheckCircle sx={{ fontSize: 48, opacity: 0.8 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={12} md={4}>
              <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                        {new Set(awsAccounts.map(a => a.default_region)).size}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Regions
                      </Typography>
                    </Box>
                    <Public sx={{ fontSize: 48, opacity: 0.8 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* AWS Accounts Table */}
          {awsAccounts.length === 0 && !error ? (
            // Empty state when no accounts but no error
            <Card sx={{ borderRadius: 3, textAlign: 'center', py: 8 }}>
              <CardContent>
                <CloudQueue sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" sx={{ mb: 1 }}>
                  No AWS Accounts Yet
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Add your first AWS account to start monitoring costs and get optimization recommendations
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={handleCreateAccount}
                  size="large"
                >
                  Add Your First AWS Account
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 0 }}>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'grey.50' }}>
                        <TableCell sx={{ fontWeight: 600, py: 2 }}>Account</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Account ID</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Region</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Access Key</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Created</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {awsAccounts.map((account) => (
                        <TableRow 
                          key={account.id}
                          sx={{ 
                            '&:hover': { bgcolor: 'grey.25' },
                            borderBottom: 1,
                            borderColor: 'divider'
                          }}
                        >
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Box
                                sx={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: 2,
                                  bgcolor: account.is_active ? 'primary.main' : 'grey.400',
                                  color: 'white',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  mr: 2
                                }}
                              >
                                <CloudQueue />
                              </Box>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {account.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {account.description || 'No description'}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                {formatAccountId(account.aws_account_id)}
                              </Typography>
                              <IconButton 
                                size="small" 
                                onClick={() => copyToClipboard(account.aws_account_id)}
                                sx={{ opacity: 0.7 }}
                              >
                                <ContentCopy sx={{ fontSize: 14 }} />
                              </IconButton>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography sx={{ fontSize: '1.2rem' }}>
                                {getRegionFlag(account.default_region)}
                              </Typography>
                              <Typography variant="body2">
                                {account.default_region}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                {account.access_key_id.substring(0, 8)}...
                              </Typography>
                              <IconButton 
                                size="small" 
                                onClick={() => copyToClipboard(account.access_key_id)}
                                sx={{ opacity: 0.7 }}
                              >
                                <ContentCopy sx={{ fontSize: 14 }} />
                              </IconButton>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={account.is_active ? 'Active' : 'Inactive'}
                              color={getStatusColor(account.is_active)}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {new Date(account.created_at).toLocaleDateString()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Tooltip title="Edit Account">
                                <IconButton 
                                  onClick={() => handleEditAccount(account)}
                                  size="small"
                                  sx={{ color: 'primary.main' }}
                                >
                                  <Edit />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete Account">
                                <IconButton 
                                  onClick={() => handleDeleteAccount(account)}
                                  size="small"
                                  sx={{ color: 'error.main' }}
                                >
                                  <Delete />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          )}

          {/* Create/Edit Account Dialog */}
          <Dialog 
            open={dialogOpen} 
            onClose={() => setDialogOpen(false)}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle sx={{ pb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                {editingAccount ? 'Edit AWS Account' : 'Add New AWS Account'}
              </Typography>
            </DialogTitle>
            
            <DialogContent sx={{ pt: 3 }}>
              {/* Dialog-specific error alert */}
              {dialogError && (
                <Alert 
                  severity="error" 
                  sx={{ mb: 3, borderRadius: 2 }} 
                  onClose={clearDialogError}
                >
                  {dialogError}
                </Alert>
              )}

              {formLoading && <LinearProgress sx={{ mb: 2 }} />}
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} sx={{ mt: 1 }}>
                  <TextField
                    fullWidth
                    label="Account Name"
                    value={formData.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                    required
                    placeholder="e.g., Production Account"
                    InputProps={{
                      startAdornment: <CloudQueue sx={{ mr: 1, color: 'action.active' }} />
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6} sx={{ mt: 1 }}>
                  <TextField
                    fullWidth
                    label="AWS Account ID"
                    value={formData.aws_account_id}
                    onChange={(e) => handleFormChange('aws_account_id', e.target.value)}
                    required
                    placeholder="123456789012"
                    helperText="12-digit AWS account identifier"
                    inputProps={{ maxLength: 12 }}
                    InputProps={{
                      startAdornment: <VpnKey sx={{ mr: 1, color: 'action.active' }} />
                    }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    value={formData.description}
                    onChange={(e) => handleFormChange('description', e.target.value)}
                    placeholder="Brief description of this AWS account"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Access Key ID"
                    value={formData.access_key_id}
                    onChange={(e) => handleFormChange('access_key_id', e.target.value)}
                    required
                    placeholder="AKIA..."
                    helperText="AWS IAM access key ID"
                    InputProps={{
                      startAdornment: <Lock sx={{ mr: 1, color: 'action.active' }} />
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Default Region</InputLabel>
                    <Select
                      value={formData.default_region}
                      label="Default Region"
                      onChange={(e) => handleFormChange('default_region', e.target.value)}
                      startAdornment={<Public sx={{ mr: 1, color: 'action.active' }} />}
                    >
                      {awsRegions.map((region) => (
                        <MenuItem key={region.value} value={region.value}>
                          {getRegionFlag(region.value)} {region.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Secret Access Key"
                    type={showSecretKey ? 'text' : 'password'}
                    value={formData.secret_access_key}
                    onChange={(e) => handleFormChange('secret_access_key', e.target.value)}
                    required={!editingAccount}
                    placeholder={editingAccount ? 'Leave empty to keep current key' : 'Enter secret access key'}
                    helperText={!editingAccount ? 'Your credentials will be validated and encrypted' : 'Only provide if you want to update the secret key'}
                    InputProps={{
                      startAdornment: <Lock sx={{ mr: 1, color: 'action.active' }} />,
                      endAdornment: (
                        <IconButton
                          onClick={() => setShowSecretKey(!showSecretKey)}
                          edge="end"
                          size="small"
                        >
                          {showSecretKey ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      )
                    }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.is_active}
                        onChange={(e) => handleFormChange('is_active', e.target.checked)}
                        color="primary"
                      />
                    }
                    label="Active Account"
                  />
                  <Typography variant="caption" display="block" color="text.secondary">
                    Inactive accounts will not be monitored for costs
                  </Typography>
                </Grid>
              </Grid>
            </DialogContent>
            
            <DialogActions sx={{ p: 3, pt: 2 }}>
              <Button 
                onClick={() => setDialogOpen(false)}
                disabled={formLoading}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit}
                variant="contained"
                disabled={formLoading || !formData.name || !formData.aws_account_id || !formData.access_key_id}
                sx={{ minWidth: 120 }}
              >
                {formLoading ? 'Validating...' : (editingAccount ? 'Update' : 'Add & Validate')}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <Dialog 
            open={deleteDialogOpen} 
            onClose={() => setDeleteDialogOpen(false)}
            maxWidth="sm"
          >
            <DialogTitle>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Confirm Deletion
              </Typography>
            </DialogTitle>
            
            <DialogContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Warning sx={{ color: 'warning.main', mr: 2 }} />
                <Typography variant="body1">
                  Are you sure you want to delete the AWS account <strong>{accountToDelete?.name}</strong>?
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                This action cannot be undone. All cost data and configurations for this account will be permanently removed.
              </Typography>
              <Alert severity="warning" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Account ID:</strong> {accountToDelete?.aws_account_id}
                </Typography>
              </Alert>
            </DialogContent>
            
            <DialogActions sx={{ p: 3, pt: 2 }}>
              <Button onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleConfirmDelete}
                variant="contained"
                color="error"
              >
                Delete Account
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Fade>
    </Container>
  );
};

export default AWSAccountsPage;