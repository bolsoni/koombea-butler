import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  LinearProgress,
  Alert,
  Fade,
  useTheme,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AccountBalance,
  Savings,
  CloudQueue,
  Analytics,
  Warning,
  CheckCircle,
  Refresh,
  DateRange,
  CompareArrows,
  ExpandMore,
  Assessment,
  Timeline,
  PieChart,
  TableChart,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
  AreaChart,
  Area,
  ComposedChart,
} from 'recharts';
import { authService } from '../services/authService';

const Dashboard = () => {
  const theme = useTheme();
  const [awsAccounts, setAwsAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [costTrends, setCostTrends] = useState([]);
  const [serviceBreakdown, setServiceBreakdown] = useState([]);
  const [costComparison, setCostComparison] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [costLoading, setCostLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('7days');

  // Chart colors
  const chartColors = {
    primary: theme.palette.primary.main,
    secondary: theme.palette.secondary.main,
    success: theme.palette.success.main,
    warning: theme.palette.warning.main,
    error: theme.palette.error.main,
    info: theme.palette.info.main,
  };

  const pieColors = ['#FF9900', '#232F3E', '#38A169', '#3182CE', '#DD6B20', '#E53E3E', '#805AD5', '#38B2AC'];

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedAccount && selectedAccount !== '') {
      loadCostData();
    }
  }, [selectedAccount, dateRange]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      const accounts = await authService.getAWSAccounts();
      setAwsAccounts(accounts.filter(acc => acc.is_active));
      
      // Auto-select first active account
      if (accounts.length > 0) {
        const firstActive = accounts.find(acc => acc.is_active);
        if (firstActive) {
          setSelectedAccount(firstActive.id.toString());
        }
      }
    } catch (err) {
      setError('Failed to load AWS accounts: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadCostData = async () => {
    if (!selectedAccount || selectedAccount === '') return;
    
    try {
      setCostLoading(true);
      setError(null);

      const accountId = parseInt(selectedAccount);
      const { startDate, endDate, prevStartDate, prevEndDate } = getDateRanges();

      // Load cost trends
      const trendsData = await authService.getCostTrends(accountId, startDate, endDate, 'DAILY');
      setCostTrends(trendsData.daily_costs || []);

      // Load service breakdown
      const servicesData = await authService.getServiceBreakdown(accountId, startDate, endDate);
      setServiceBreakdown(servicesData.services || []);

      // Load cost comparison
      const comparisonData = await authService.getCostComparison(
        accountId, 
        startDate, 
        endDate, 
        prevStartDate, 
        prevEndDate
      );
      setCostComparison(comparisonData);

      // Load recommendations
      const recommendationsData = await authService.getRightsizingRecommendations(accountId);
      setRecommendations(recommendationsData || []);

    } catch (err) {
      setError('Failed to load cost data: ' + err.message);
      console.error('Cost data loading error:', err);
    } finally {
      setCostLoading(false);
    }
  };

  const getDateRanges = () => {
    const today = new Date();
    let startDate, endDate, prevStartDate, prevEndDate;

    switch (dateRange) {
      case '7days':
        endDate = today.toISOString().split('T')[0];
        startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        prevEndDate = startDate;
        prevStartDate = new Date(new Date(startDate).getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      case '30days':
        endDate = today.toISOString().split('T')[0];
        startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        prevEndDate = startDate;
        prevStartDate = new Date(new Date(startDate).getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      case 'thisMonth':
        const firstDayThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        startDate = firstDayThisMonth.toISOString().split('T')[0];
        endDate = today.toISOString().split('T')[0];
        
        const firstDayLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastDayLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        prevStartDate = firstDayLastMonth.toISOString().split('T')[0];
        prevEndDate = lastDayLastMonth.toISOString().split('T')[0];
        break;
      default:
        endDate = today.toISOString().split('T')[0];
        startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        prevEndDate = startDate;
        prevStartDate = new Date(new Date(startDate).getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    }

    return { startDate, endDate, prevStartDate, prevEndDate };
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatPercentage = (value) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getSelectedAccountName = () => {
    const account = awsAccounts.find(acc => acc.id.toString() === selectedAccount);
    return account ? account.name : 'Select Account';
  };

  const getTotalCost = () => {
    return costTrends.reduce((sum, item) => sum + item.amount, 0);
  };

  const getAverageDailyCost = () => {
    if (costTrends.length === 0) return 0;
    return getTotalCost() / costTrends.length;
  };

  if (loading) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ mt: 4 }}>
          <LinearProgress />
          <Typography sx={{ mt: 2, textAlign: 'center' }}>
            Loading AWS accounts...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (awsAccounts.length === 0) {
    return (
      <Container maxWidth="xl">
        <Fade in timeout={600}>
          <Box>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                Cost Analytics Dashboard
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Real-time AWS cost optimization insights powered by Cost Explorer
              </Typography>
            </Box>

            <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                No AWS Accounts Found
              </Typography>
              <Typography variant="body2">
                Add your AWS accounts to start analyzing costs. Cost Explorer data is only available in the us-east-1 region.
              </Typography>
            </Alert>

            <Card sx={{ textAlign: 'center', py: 8 }}>
              <CardContent>
                <CloudQueue sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Get Started with Cost Analytics
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Connect your AWS accounts to unlock powerful cost insights
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<CloudQueue />}
                  href="/aws-accounts"
                  size="large"
                >
                  Add AWS Accounts
                </Button>
              </CardContent>
            </Card>
          </Box>
        </Fade>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Fade in timeout={600}>
        <Box>
          {/* Header with Account Selection */}
          <Box sx={{ mb: 4 }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={6}>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                  Cost Analytics Dashboard
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Real-time AWS cost optimization insights powered by Cost Explorer
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
                  <FormControl sx={{ minWidth: 200 }}>
                    <InputLabel>AWS Account</InputLabel>
                    <Select
                      value={selectedAccount}
                      label="AWS Account"
                      onChange={(e) => setSelectedAccount(e.target.value)}
                      startAdornment={<CloudQueue sx={{ mr: 1, color: 'action.active' }} />}
                    >
                      {awsAccounts.map((account) => (
                        <MenuItem key={account.id} value={account.id.toString()}>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {account.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {account.aws_account_id}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl sx={{ minWidth: 140 }}>
                    <InputLabel>Time Range</InputLabel>
                    <Select
                      value={dateRange}
                      label="Time Range"
                      onChange={(e) => setDateRange(e.target.value)}
                      startAdornment={<DateRange sx={{ mr: 1, color: 'action.active' }} />}
                    >
                      <MenuItem value="7days">Last 7 days</MenuItem>
                      <MenuItem value="30days">Last 30 days</MenuItem>
                      <MenuItem value="thisMonth">This month</MenuItem>
                    </Select>
                  </FormControl>

                  <Tooltip title="Refresh Data">
                    <IconButton 
                      onClick={loadCostData} 
                      disabled={costLoading || !selectedAccount}
                      sx={{ bgcolor: 'primary.main', color: 'white', width: 48, height: 48, borderRadius: '50%', '&:hover': { bgcolor: 'primary.dark' }, '&:disabled': { bgcolor: 'grey.300', color: 'grey.500' } }}
                    >
                      <Refresh />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Grid>
            </Grid>
          </Box>

          {/* Important Notice */}
          <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
            <Typography variant="body2">
              <strong>Note:</strong> AWS Cost Explorer data is only available in the us-east-1 region. 
              Make sure your AWS accounts have the necessary permissions to access Cost Explorer APIs.
            </Typography>
          </Alert>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {!selectedAccount ? (
            <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
              Please select an AWS account to view cost data.
            </Alert>
          ) : (
            <>
              {/* Loading Indicator */}
              {costLoading && <LinearProgress sx={{ mb: 3 }} />}

              {/* Key Metrics Cards */}
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ 
                    height: '100%', 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
                    color: 'white' 
                  }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                            {formatCurrency(getTotalCost())}
                          </Typography>
                          <Typography variant="body2" sx={{ opacity: 0.9 }}>
                            Total Cost ({dateRange})
                          </Typography>
                        </Box>
                        <AccountBalance sx={{ fontSize: 48, opacity: 0.8 }} />
                      </Box>
                      {costComparison && (
                        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
                          {costComparison.change_percentage > 0 ? (
                            <TrendingUp sx={{ fontSize: 16, mr: 1 }} />
                          ) : (
                            <TrendingDown sx={{ fontSize: 16, mr: 1 }} />
                          )}
                          <Typography variant="caption">
                            {formatPercentage(costComparison.change_percentage)} vs previous period
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ 
                    height: '100%', 
                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', 
                    color: 'white' 
                  }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                            {formatCurrency(getAverageDailyCost())}
                          </Typography>
                          <Typography variant="body2" sx={{ opacity: 0.9 }}>
                            Avg Daily Cost
                          </Typography>
                        </Box>
                        <Timeline sx={{ fontSize: 48, opacity: 0.8 }} />
                      </Box>
                      <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
                        <Analytics sx={{ fontSize: 16, mr: 1 }} />
                        <Typography variant="caption">
                          Based on {costTrends.length} days of data
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ 
                    height: '100%', 
                    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', 
                    color: 'white' 
                  }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                            {serviceBreakdown.length}
                          </Typography>
                          <Typography variant="body2" sx={{ opacity: 0.9 }}>
                            Active Services
                          </Typography>
                        </Box>
                        <PieChart sx={{ fontSize: 48, opacity: 0.8 }} />
                      </Box>
                      <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
                        <CheckCircle sx={{ fontSize: 16, mr: 1 }} />
                        <Typography variant="caption">
                          Top service: {serviceBreakdown[0]?.service_name || 'N/A'}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ 
                    height: '100%', 
                    background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', 
                    color: 'white' 
                  }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                            {recommendations.length}
                          </Typography>
                          <Typography variant="body2" sx={{ opacity: 0.9 }}>
                            Optimization Tips
                          </Typography>
                        </Box>
                        <Savings sx={{ fontSize: 48, opacity: 0.8 }} />
                      </Box>
                      <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
                        <Warning sx={{ fontSize: 16, mr: 1 }} />
                        <Typography variant="caption">
                          Potential savings available
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Charts Section */}
              <Grid container spacing={3} sx={{ mb: 4 }}>
                {/* Cost Trends Chart */}
                <Grid item xs={12} lg={8}>
                  <Card sx={{ height: 500 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          Cost Trends - {getSelectedAccountName()}
                        </Typography>
                        <Chip 
                          label={`${costTrends.length} data points`} 
                          color="primary" 
                          variant="outlined"
                          size="small"
                        />
                      </Box>
                      <ResponsiveContainer width="100%" height={400}>
                        <AreaChart data={costTrends}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="date" 
                            tickFormatter={(value) => new Date(value).toLocaleDateString()}
                          />
                          <YAxis 
                            tickFormatter={(value) => `$${value.toFixed(0)}`}
                          />
                          <RechartsTooltip 
                            formatter={(value, name) => [`$${value.toFixed(2)}`, 'Daily Cost']}
                            labelFormatter={(date) => `Date: ${new Date(date).toLocaleDateString()}`}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="amount" 
                            stroke={chartColors.primary} 
                            fill={chartColors.primary}
                            fillOpacity={0.6}
                            strokeWidth={2}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Service Distribution */}
                <Grid item xs={12} lg={4}>
                  <Card sx={{ height: 500 }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                        Service Cost Distribution
                      </Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <RechartsPieChart>
                          <Pie
                            data={serviceBreakdown.slice(0, 8)} // Top 8 services
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            dataKey="amount"
                            label={(entry) => `${entry.service_name}: ${entry.percentage}%`}
                          >
                            {serviceBreakdown.slice(0, 8).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={pieColors[index]} />
                            ))}
                          </Pie>
                          <RechartsTooltip formatter={(value) => [`$${value.toFixed(2)}`, 'Cost']} />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                      <Box sx={{ mt: 2, maxHeight: 120, overflow: 'auto' }}>
                        {serviceBreakdown.slice(0, 8).map((item, index) => (
                          <Box key={item.service_name} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Box 
                              sx={{ 
                                width: 12, 
                                height: 12, 
                                bgcolor: pieColors[index], 
                                borderRadius: '50%',
                                mr: 1 
                              }} 
                            />
                            <Typography variant="body2" sx={{ flexGrow: 1, fontSize: '0.8rem' }}>
                              {item.service_name}
                            </Typography>
                            <Typography variant="body2" fontWeight="medium" sx={{ fontSize: '0.8rem' }}>
                              {formatCurrency(item.amount)}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Cost Comparison Section */}
              {costComparison && (
                <Grid container spacing={3} sx={{ mb: 4 }}>
                  <Grid item xs={12}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                          Period Comparison
                        </Typography>
                        <Grid container spacing={3}>
                          <Grid item xs={12} md={4}>
                            <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                Previous Period
                              </Typography>
                              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                                {formatCurrency(costComparison.previous_period.total_cost)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {costComparison.previous_period.start_date} to {costComparison.previous_period.end_date}
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'primary.lighter', borderRadius: 2 }}>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                Current Period
                              </Typography>
                              <Typography variant="h5" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                {formatCurrency(costComparison.current_period.total_cost)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {costComparison.current_period.start_date} to {costComparison.current_period.end_date}
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <Box sx={{ 
                              textAlign: 'center', 
                              p: 2, 
                              bgcolor: costComparison.change_amount > 0 ? 'error.lighter' : 'success.lighter', 
                              borderRadius: 2 
                            }}>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                Change
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                {costComparison.change_amount > 0 ? (
                                  <TrendingUp sx={{ color: 'error.main' }} />
                                ) : (
                                  <TrendingDown sx={{ color: 'success.main' }} />
                                )}
                                <Typography 
                                  variant="h5" 
                                  sx={{ 
                                    fontWeight: 600, 
                                    color: costComparison.change_amount > 0 ? 'error.main' : 'success.main' 
                                  }}
                                >
                                  {formatCurrency(Math.abs(costComparison.change_amount))}
                                </Typography>
                              </Box>
                              <Typography 
                                variant="caption" 
                                sx={{ 
                                  color: costComparison.change_amount > 0 ? 'error.main' : 'success.main',
                                  fontWeight: 500
                                }}
                              >
                                {formatPercentage(costComparison.change_percentage)}
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              )}

              {/* Recommendations Section */}
              {recommendations.length > 0 && (
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Accordion defaultExpanded>
                      <AccordionSummary 
                        expandIcon={<ExpandMore />}
                        sx={{ bgcolor: 'primary.lighter' }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Savings sx={{ color: 'primary.main' }} />
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            Rightsizing Recommendations ({recommendations.length})
                          </Typography>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <TableContainer component={Paper} elevation={0}>
                          <Table>
                            <TableHead>
                              <TableRow>
                                <TableCell>Resource ID</TableCell>
                                <TableCell>Current Type</TableCell>
                                <TableCell>Recommended Type</TableCell>
                                <TableCell>Monthly Savings</TableCell>
                                <TableCell>Confidence</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {recommendations.map((rec, index) => (
                                <TableRow key={index}>
                                  <TableCell>
                                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                      {rec.resource_id}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Chip label={rec.current_instance_type} size="small" />
                                  </TableCell>
                                  <TableCell>
                                    <Chip label={rec.recommended_instance_type} size="small" color="primary" />
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2" sx={{ fontWeight: 500, color: 'success.main' }}>
                                      {formatCurrency(rec.estimated_monthly_savings)}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Chip 
                                      label={rec.confidence_level} 
                                      size="small"
                                      color={
                                        rec.confidence_level === 'HIGH' ? 'success' : 
                                        rec.confidence_level === 'MEDIUM' ? 'warning' : 'default'
                                      }
                                    />
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </AccordionDetails>
                    </Accordion>
                  </Grid>
                </Grid>
              )}

              {/* No Data Message */}
              {!costLoading && selectedAccount && costTrends.length === 0 && (
                <Alert severity="info" sx={{ mt: 3, borderRadius: 2 }}>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    No cost data available for the selected period
                  </Typography>
                  <Typography variant="body2">
                    This could be because the account is new, or Cost Explorer data is not yet available. 
                    Cost data typically becomes available within 24 hours of AWS usage.
                  </Typography>
                </Alert>
              )}
            </>
          )}
        </Box>
      </Fade>
    </Container>
  );
};

export default Dashboard;