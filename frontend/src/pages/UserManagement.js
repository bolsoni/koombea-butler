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
  FormControlLabel,
  Checkbox,
  Alert,
  Chip,
  Box,
  Fade,
  LinearProgress,
  Tooltip,
  Grid,
  Avatar,  // Add this line
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Person,
  AdminPanelSettings,
  Email,
  Lock,
  Visibility,
  VisibilityOff,
  FiberManualRecord,
} from '@mui/icons-material';
import { authService } from '../services/authService';
import { useAuth } from '../App';

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    repeat_password: '',
    is_admin: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersData = await authService.getUsers();
      setUsers(usersData);
    } catch (err) {
      setError('Failed to load users: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      repeat_password: '',
      is_admin: false
    });
    setDialogOpen(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      repeat_password: '',
      is_admin: user.is_admin
    });
    setDialogOpen(true);
  };

  const handleDeleteUser = (user) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async () => {
    setFormLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validation
      if (!formData.name || !formData.email) {
        throw new Error('Name and email are required');
      }

      if (!editingUser && (!formData.password || !formData.repeat_password)) {
        throw new Error('Password and repeat password are required for new users');
      }

      if (formData.password && formData.password !== formData.repeat_password) {
        throw new Error('Passwords do not match');
      }

      if (editingUser) {
        // Update user
        const updateData = {
          name: formData.name,
          email: formData.email,
          is_admin: formData.is_admin
        };
        
        if (formData.password) {
          updateData.password = formData.password;
          updateData.repeat_password = formData.repeat_password;
        }

        await authService.updateUser(editingUser.id, updateData);
        setSuccess('User updated successfully');
      } else {
        // Create user
        await authService.createUser(formData);
        setSuccess('User created successfully');
      }

      setDialogOpen(false);
      loadUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await authService.deleteUser(userToDelete.id);
      setSuccess('User deleted successfully');
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      loadUsers();
    } catch (err) {
      setError('Failed to delete user: ' + err.message);
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

  const isUserOnline = (lastSeen) => {
    if (!lastSeen) return false;
    const now = new Date();
    const lastSeenDate = new Date(lastSeen);
    const diffInMinutes = (now - lastSeenDate) / (1000 * 60);
    return diffInMinutes < 5; // Consider online if seen within 5 minutes
  };

  const getTimeSince = (dateString) => {
    if (!dateString) return 'Never';
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4 }}>
          <LinearProgress />
          <Typography sx={{ mt: 2, textAlign: 'center' }}>
            Loading users...
          </Typography>
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
                User Management
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Manage admin users and their permissions
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleCreateUser}
              sx={{ 
                borderRadius: 2,
                px: 3,
                py: 1.5,
                fontWeight: 600
              }}
            >
              Add User
            </Button>
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

          {/* Stats Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                        {users.length}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Total Users
                      </Typography>
                    </Box>
                    <Person sx={{ fontSize: 48, opacity: 0.8 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                        {users.filter(u => u.is_admin).length}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Administrators
                      </Typography>
                    </Box>
                    <AdminPanelSettings sx={{ fontSize: 48, opacity: 0.8 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                        {users.filter(u => isUserOnline(u.last_seen)).length}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Online Now
                      </Typography>
                    </Box>
                    <FiberManualRecord sx={{ fontSize: 48, opacity: 0.8 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', color: 'black' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                        {users.filter(u => u.is_active).length}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.7 }}>
                        Active Accounts
                      </Typography>
                    </Box>
                    <Person sx={{ fontSize: 48, opacity: 0.6 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Users Table */}
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 0 }}>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell sx={{ fontWeight: 600, py: 2 }}>User</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Last Seen</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Account Type</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Created</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow 
                        key={user.id}
                        sx={{ 
                          '&:hover': { bgcolor: 'grey.25' },
                          borderBottom: 1,
                          borderColor: 'divider'
                        }}
                      >
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box sx={{ position: 'relative', mr: 2 }}>
                              <Avatar
                                src={user.avatar_url}
                                sx={{
                                  width: 40,
                                  height: 40,
                                  bgcolor: 'primary.main',
                                  color: 'white',
                                  fontWeight: 600,
                                }}
                              >
                                {user.name.charAt(0).toUpperCase()}
                              </Avatar>
                              {/* Online indicator */}
                              {isUserOnline(user.last_seen) && (
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
                                    borderColor: 'white',
                                  }}
                                />
                              )}
                            </Box>
                            <Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {user.name}
                                </Typography>
                                {isUserOnline(user.last_seen) && (
                                  <FiberManualRecord 
                                    sx={{ fontSize: 8, color: 'success.main' }} 
                                  />
                                )}
                              </Box>
                              <Typography variant="caption" color="text.secondary">
                                {user.timezone || 'UTC'}
                              </Typography>
                              {user.id === currentUser.id && (
                                <Chip 
                                  label="You" 
                                  size="small" 
                                  color="primary" 
                                  variant="outlined"
                                  sx={{ ml: 1, height: 20 }}
                                />
                              )}
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{user.email}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={user.is_admin ? 'Administrator' : 'User'}
                            color={user.is_admin ? 'primary' : 'default'}
                            size="small"
                            icon={user.is_admin ? <AdminPanelSettings /> : <Person />}
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            <Chip
                              label={isUserOnline(user.last_seen) ? 'Online' : 'Offline'}
                              color={isUserOnline(user.last_seen) ? 'success' : 'default'}
                              size="small"
                              variant="outlined"
                            />
                            <Chip
                              label={user.is_active ? 'Active' : 'Inactive'}
                              color={user.is_active ? 'primary' : 'error'}
                              size="small"
                              variant="filled"
                            />
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {getTimeSince(user.last_seen)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={user.created_by_admin ? 'Admin Created' : 'System'}
                            color={user.created_by_admin ? 'info' : 'warning'}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {new Date(user.created_at).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="Edit User">
                              <IconButton 
                                onClick={() => handleEditUser(user)}
                                size="small"
                                sx={{ color: 'primary.main' }}
                              >
                                <Edit />
                              </IconButton>
                            </Tooltip>
                            {user.id !== currentUser.id && (
                              <Tooltip title="Delete User">
                                <IconButton 
                                  onClick={() => handleDeleteUser(user)}
                                  size="small"
                                  sx={{ color: 'error.main' }}
                                >
                                  <Delete />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          {/* User Form Dialog */}
          <Dialog 
            open={dialogOpen} 
            onClose={() => setDialogOpen(false)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle sx={{ pb: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {editingUser ? 'Edit User' : 'Add New User'}
              </Typography>
            </DialogTitle>
            
            <DialogContent sx={{ pt: 3 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} sx={{ mt: 1 }}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    value={formData.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                    required
                    InputProps={{
                      startAdornment: <Person sx={{ mr: 1, color: 'action.active' }} />
                    }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email Address"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleFormChange('email', e.target.value)}
                    required
                    InputProps={{
                      startAdornment: <Email sx={{ mr: 1, color: 'action.active' }} />
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={editingUser ? "New Password (optional)" : "Password"}
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleFormChange('password', e.target.value)}
                    required={!editingUser}
                    InputProps={{
                      startAdornment: <Lock sx={{ mr: 1, color: 'action.active' }} />,
                      endAdornment: (
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          size="small"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      )
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Repeat Password"
                    type={showRepeatPassword ? 'text' : 'password'}
                    value={formData.repeat_password}
                    onChange={(e) => handleFormChange('repeat_password', e.target.value)}
                    required={!editingUser || formData.password}
                    InputProps={{
                      startAdornment: <Lock sx={{ mr: 1, color: 'action.active' }} />,
                      endAdornment: (
                        <IconButton
                          onClick={() => setShowRepeatPassword(!showRepeatPassword)}
                          edge="end"
                          size="small"
                        >
                          {showRepeatPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      )
                    }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.is_admin}
                        onChange={(e) => handleFormChange('is_admin', e.target.checked)}
                        color="primary"
                      />
                    }
                    label="Administrator privileges"
                  />
                  <Typography variant="caption" color="text.secondary" display="block">
                    Administrators can manage users and access all system features
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
                disabled={formLoading}
                sx={{ minWidth: 100 }}
              >
                {formLoading ? 'Saving...' : (editingUser ? 'Update' : 'Create')}
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
              <Typography variant="body1">
                Are you sure you want to delete user <strong>{userToDelete?.name}</strong>? 
                This action cannot be undone.
              </Typography>
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
                Delete
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Fade>
    </Container>
  );
};

export default UserManagement;