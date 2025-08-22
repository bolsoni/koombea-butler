import React, { useState, useEffect } from 'react';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Alert,
  Box,
  Fade,
  Grid,
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  IconButton,
  InputAdornment,
  LinearProgress,
} from '@mui/material';
import {
  Person,
  Email,
  Schedule,
  AdminPanelSettings,
  Edit,
  Lock,
  Visibility,
  VisibilityOff,
  PhotoCamera,
  Save,
  Cancel,
} from '@mui/icons-material';
import { authService } from '../services/authService';
import { useAuth } from '../App';

const ProfilePage = () => {
  const { user: currentUser, login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Profile form states
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    timezone: 'UTC',
    avatar_url: ''
  });
  const [profileEditing, setProfileEditing] = useState(false);
  
  // Password change states
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    repeat_password: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    repeat: false
  });

  useEffect(() => {
    if (currentUser) {
      setProfileData({
        name: currentUser.name || '',
        email: currentUser.email || '',
        timezone: currentUser.timezone || 'UTC',
        avatar_url: currentUser.avatar_url || ''
      });
    }
  }, [currentUser]);

  const timezones = [
    'UTC',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Sao_Paulo',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Asia/Kolkata',
    'Australia/Sydney'
  ];

  const handleProfileSubmit = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await authService.updateProfile(profileData);
      setSuccess('Profile updated successfully');
      setProfileEditing(false);
      
      // Refresh user data
      const updatedUser = await authService.getMe();
      // You might want to update the user context here
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (passwordData.new_password !== passwordData.repeat_password) {
        throw new Error('New passwords do not match');
      }

      await authService.changePassword(passwordData);
      setSuccess('Password changed successfully');
      setPasswordDialogOpen(false);
      setPasswordData({
        current_password: '',
        new_password: '',
        repeat_password: ''
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePasswordChange = (field, value) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const getAvatarText = () => {
    return currentUser?.name?.charAt(0)?.toUpperCase() || 'U';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  const getTimeSince = (dateString) => {
    if (!dateString) return 'Never';
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
  };

  return (
    <Container maxWidth="lg">
      <Fade in timeout={600}>
        <Box>
          {/* Header */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              My Profile
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage your personal information and account settings
            </Typography>
          </Box>

          {/* Alerts */}
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

          <Grid container spacing={3}>
            {/* Profile Information Card */}
            <Grid item xs={12} md={8}>
              <Card sx={{ borderRadius: 3 }}>
                <CardContent sx={{ p: 4 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Profile Information
                    </Typography>
                    {!profileEditing ? (
                      <Button
                        variant="outlined"
                        startIcon={<Edit />}
                        onClick={() => setProfileEditing(true)}
                      >
                        Edit Profile
                      </Button>
                    ) : (
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="outlined"
                          startIcon={<Cancel />}
                          onClick={() => {
                            setProfileEditing(false);
                            // Reset form data
                            setProfileData({
                              name: currentUser.name || '',
                              email: currentUser.email || '',
                              timezone: currentUser.timezone || 'UTC',
                              avatar_url: currentUser.avatar_url || ''
                            });
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="contained"
                          startIcon={<Save />}
                          onClick={handleProfileSubmit}
                          disabled={loading}
                        >
                          Save Changes
                        </Button>
                      </Box>
                    )}
                  </Box>

                  {loading && <LinearProgress sx={{ mb: 2 }} />}

                  <Grid container spacing={3}>
                    {/* Avatar Section */}
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <Avatar
                          src={profileData.avatar_url}
                          sx={{
                            width: 80,
                            height: 80,
                            fontSize: '2rem',
                            fontWeight: 600,
                            bgcolor: 'primary.main',
                            mr: 3
                          }}
                        >
                          {getAvatarText()}
                        </Avatar>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {currentUser?.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {currentUser?.email}
                          </Typography>
                          {profileEditing && (
                            <Button
                              size="small"
                              startIcon={<PhotoCamera />}
                              onClick={() => {
                                // For now, just a simple prompt - in production you'd have file upload
                                const url = prompt('Enter avatar URL:');
                                if (url) handleProfileChange('avatar_url', url);
                              }}
                            >
                              Change Photo
                            </Button>
                          )}
                        </Box>
                      </Box>
                    </Grid>

                    {/* Form Fields */}
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Full Name"
                        value={profileData.name}
                        onChange={(e) => handleProfileChange('name', e.target.value)}
                        disabled={!profileEditing}
                        InputProps={{
                          startAdornment: <Person sx={{ mr: 1, color: 'action.active' }} />
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Email Address"
                        type="email"
                        value={profileData.email}
                        onChange={(e) => handleProfileChange('email', e.target.value)}
                        disabled={!profileEditing}
                        InputProps={{
                          startAdornment: <Email sx={{ mr: 1, color: 'action.active' }} />
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth disabled={!profileEditing}>
                        <InputLabel>Timezone</InputLabel>
                        <Select
                          value={profileData.timezone}
                          label="Timezone"
                          onChange={(e) => handleProfileChange('timezone', e.target.value)}
                          startAdornment={<Schedule sx={{ mr: 1, color: 'action.active' }} />}
                        >
                          {timezones.map((tz) => (
                            <MenuItem key={tz} value={tz}>
                              {tz}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Avatar URL"
                        value={profileData.avatar_url}
                        onChange={(e) => handleProfileChange('avatar_url', e.target.value)}
                        disabled={!profileEditing}
                        placeholder="https://example.com/avatar.jpg"
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Account Information & Actions */}
            <Grid item xs={12} md={4}>
              {/* Account Status */}
              <Card sx={{ borderRadius: 3, mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Account Status
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Role
                    </Typography>
                    <Chip
                      icon={currentUser?.is_admin ? <AdminPanelSettings /> : <Person />}
                      label={currentUser?.is_admin ? 'Administrator' : 'User'}
                      color={currentUser?.is_admin ? 'primary' : 'default'}
                      size="small"
                    />
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Account Type
                    </Typography>
                    <Chip
                      label={currentUser?.created_by_admin ? 'Admin Created' : 'System Account'}
                      variant="outlined"
                      size="small"
                    />
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Member Since
                    </Typography>
                    <Typography variant="body2">
                      {formatDate(currentUser?.created_at)}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Last Login
                    </Typography>
                    <Typography variant="body2">
                      {getTimeSince(currentUser?.last_login)}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Last Seen
                    </Typography>
                    <Typography variant="body2">
                      {getTimeSince(currentUser?.last_seen)}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>

              {/* Security Actions */}
              <Card sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Security
                  </Typography>
                  
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Lock />}
                    onClick={() => setPasswordDialogOpen(true)}
                    sx={{ mb: 2 }}
                  >
                    Change Password
                  </Button>

                  <Typography variant="caption" color="text.secondary">
                    Keep your account secure by using a strong, unique password and changing it regularly.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Password Change Dialog */}
          <Dialog 
            open={passwordDialogOpen} 
            onClose={() => setPasswordDialogOpen(false)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Change Password
              </Typography>
            </DialogTitle>
            
            <DialogContent sx={{ pt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Current Password"
                    type={showPasswords.current ? 'text' : 'password'}
                    value={passwordData.current_password}
                    onChange={(e) => handlePasswordChange('current_password', e.target.value)}
                    required
                    InputProps={{
                      startAdornment: <Lock sx={{ mr: 1, color: 'action.active' }} />,
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => togglePasswordVisibility('current')}
                            edge="end"
                            size="small"
                          >
                            {showPasswords.current ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="New Password"
                    type={showPasswords.new ? 'text' : 'password'}
                    value={passwordData.new_password}
                    onChange={(e) => handlePasswordChange('new_password', e.target.value)}
                    required
                    InputProps={{
                      startAdornment: <Lock sx={{ mr: 1, color: 'action.active' }} />,
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => togglePasswordVisibility('new')}
                            edge="end"
                            size="small"
                          >
                            {showPasswords.new ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Repeat New Password"
                    type={showPasswords.repeat ? 'text' : 'password'}
                    value={passwordData.repeat_password}
                    onChange={(e) => handlePasswordChange('repeat_password', e.target.value)}
                    required
                    InputProps={{
                      startAdornment: <Lock sx={{ mr: 1, color: 'action.active' }} />,
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => togglePasswordVisibility('repeat')}
                            edge="end"
                            size="small"
                          >
                            {showPasswords.repeat ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>
              </Grid>
            </DialogContent>
            
            <DialogActions sx={{ p: 3, pt: 2 }}>
              <Button 
                onClick={() => setPasswordDialogOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button 
                onClick={handlePasswordSubmit}
                variant="contained"
                disabled={loading}
                sx={{ minWidth: 100 }}
              >
                {loading ? 'Changing...' : 'Change Password'}
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Fade>
    </Container>
  );
};

export default ProfilePage;