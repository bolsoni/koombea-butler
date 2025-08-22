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
  ButtonGroup,
  Switch,
  FormControlLabel,
  Skeleton,
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
  Assessment,
  Timeline,
  PieChart,
  Speed,
  Insights,
  NotificationsActive,
  FilterList,
  ViewModule,
  ViewList,
  Settings,
  AutorenewRounded,
} from '@mui/icons-material';
import { authService } from '../services/authService';
import {
  CostMetricWidget,
  ServiceBreakdownWidget,
  CostTrendWidget,
  RecommendationsWidget,
  CostComparisonWidget,
  AccountSummaryWidget,
} from '../components/CostWidgets';

const EnhancedDashboard = () => {
  const theme = useTheme();
  const [awsAccounts, setAwsAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [dateRange, setDateRange] = useState('30days');
  const [viewMode, setViewMode] = useState('widgets'); // 'widgets' or 'compact'
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(300000); // 5 minutes
  
  // Real-time data states
  const [dashboardMetrics, setDashboardMetrics] = useState({
    totalCost: 0,
    avgDailyCost: 0,
    activeServices: 0,
    recommendations: 0,
    potentialSavings: 0,
    costChange: 0,
  });
  
  const [loading, setLoading] = useState(true);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedAccount && selectedAccount !== '') {
      loadDashboardMetrics();
    }
  }, [selectedAccount, dateRange]);

  useEffect(() => {
    let interval;
    if (autoRefresh && selectedAccount) {
      interval = setInterval(() => {
        loadDashboardMetrics(true); // Silent refresh
      }, refreshInterval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, refreshInterval, selectedAccount, dateRange]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      const accounts = await authService.getAWSAccounts();
      const activeAccounts = accounts.filter(acc => acc.is_active);
      setAwsAccounts(activeAccounts);
      
      // Auto-select first active account
      if (activeAccounts.length > 0) {
        setSelectedAccount(activeAccounts[0].id.toString());
      }
    } catch (err) {
      setError('Failed to load AWS accounts: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardMetrics = async (silent = false) => {
    if (!selectedAccount || selectedAccount === '') return;
    
    try {
      if (!silent) setMetricsLoading(true);
      setError(null);

      const accountId = parseInt(selectedAccount);
      const { startDate, endDate, prevStartDate, prevEndDate } = getDateRanges();

      // Load multiple data sources in parallel
      const [
        trendsData,
        servicesData,
        comparisonData,
        recommendationsData,
        statisticsData
      ] = await Promise.allSettled([
        authService.getCostTrends(accountId, startDate, endDate, 'DAILY'),
        authService.getServiceBreakdown(accountId, startDate, endDate),
        authService.getCostComparison(accountId, startDate, endDate, prevStartDate, prevEndDate),
        authService.getRightsizingRecommendations(accountId),
        authService.getCostStatistics(accountId, startDate, endDate)
      ]);

      // Process results and calculate metrics
      let totalCost = 0;
      let avgDailyCost = 0;
      let activeServices = 0;
      let recommendations = 0;
      let potentialSavings = 0;
      let costChange = 0;

      if (trendsData.status === 'fulfilled' && trendsData.value.daily_costs) {
        totalCost = trendsData.value.daily_costs.reduce((sum, item) => sum + item.amount, 0);
        avgDailyCost = totalCost / trendsData.value.daily_costs.length;
      }

      if (servicesData.status === 'fulfilled' && servicesData.value.services) {
        activeServices = servicesData.value.services.length;
      }

      if (recommendationsData.status === 'fulfilled' && recommendationsData.value) {
        recommendations = recommendationsData.value.length;
        potentialSavings = recommendationsData.value.reduce((sum, rec) => sum + rec.estimated_monthly_savings, 0);
      }

      if (comparisonData.status === 'fulfilled' && comparisonData.value) {
        costChange = comparisonData.value.change_percentage;
      }

      setDashboardMetrics({
        totalCost,
        avgDailyCost,
        activeServices,
        recommendations,
        potentialSavings,
        costChange,
      });

      setLastUpdated(new Date());

    } catch (err) {
      if (!silent) {
        setError('Failed to load dashboard metrics: ' + err.message);
      }
      console.error('Dashboard metrics loading error:', err);
    } finally {
      if (!silent) setMetricsLoading(false);
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
      case '90days':
        endDate = today.toISOString().split('T')[0];
        startDate = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        prevEndDate = startDate;
        prevStartDate = new Date(new Date(startDate).getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
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
        startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        prevEndDate = startDate;
        prevStartDate = new Date(new Date(startDate).getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    }

    return { startDate, endDate, prevStartDate, prevEndDate };
  };

  const getSelectedAccountName = () => {
    const account = awsAccounts.find(acc => acc.id.toString() === selectedAccount);
    return account ? account.name : 'Select Account';
  };

  const handleManualRefresh = () => {
    loadDashboardMetrics();
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
                Real-time Cost Dashboard
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Monitor AWS costs with live updates and intelligent insights
              </Typography>
            </Box>

            <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                No AWS Accounts Found
              </Typography>
              <Typography variant="body2">
                Add your AWS accounts to start monitoring costs in real-time with Cost Explorer integration.
              </Typography>
            </Alert>

            <Card sx={{ textAlign: 'center', py: 8 }}>
              <CardContent>
                <Analytics sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Real-time Cost Intelligence
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Connect your AWS accounts for live cost monitoring and AI-powered optimization
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
          {/* Header with Controls */}
          <Box sx={{ mb: 4 }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={6}>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                  Real-time Cost Dashboard
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="body1" color="text.secondary">
                    Live AWS cost monitoring and optimization insights
                  </Typography>
                  {lastUpdated && (
                    <Chip 
                      label={`Updated: ${lastUpdated.toLocaleTimeString()}`}
                      size="small"
                      variant="outlined"
                      color="success"
                    />
                  )}
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'flex-start', md: 'flex-end' }, flexWrap: 'wrap' }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={autoRefresh}
                        onChange={(e) => setAutoRefresh(e.target.checked)}
                        size="small"
                      />
                    }
                    label="Auto-refresh"
                    sx={{ mr: 2 }}
                  />
                  
                  <ButtonGroup size="small" variant="outlined">
                    <Button
                      onClick={() => setViewMode('widgets')}
                      variant={viewMode === 'widgets' ? 'contained' : 'outlined'}
                      startIcon={<ViewModule />}
                    >
                      Widgets
                    </Button>
                    <Button
                      onClick={() => setViewMode('compact')}
                      variant={viewMode === 'compact' ? 'contained' : 'outlined'}
                      startIcon={<ViewList />}
                    >
                      Compact
                    </Button>
                  </ButtonGroup>
                  
                  <Tooltip title="Refresh Dashboard">
                    <IconButton 
                      onClick={handleManualRefresh} 
                      disabled={metricsLoading}
                      sx={{ bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' } }}
                    >
                      {autoRefresh ? <AutorenewRounded /> : <Refresh />}
                    </IconButton>
                  </Tooltip>
                </Box>
              </Grid>
            </Grid>
          </Box>

          {/* Controls Row */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth size="small">
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
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Time Range</InputLabel>
                <Select
                  value={dateRange}
                  label="Time Range"
                  onChange={(e) => setDateRange(e.target.value)}
                  startAdornment={<DateRange sx={{ mr: 1, color: 'action.active' }} />}
                >
                  <MenuItem value="7days">Last 7 days</MenuItem>
                  <MenuItem value="30days">Last 30 days</MenuItem>
                  <MenuItem value="90days">Last 90 days</MenuItem>
                  <MenuItem value="thisMonth">This month</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Refresh Interval</InputLabel>
                <Select
                  value={refreshInterval}
                  label="Refresh Interval"
                  onChange={(e) => setRefreshInterval(e.target.value)}
                  disabled={!autoRefresh}
                  startAdornment={<Speed sx={{ mr: 1, color: 'action.active' }} />}
                >
                  <MenuItem value={60000}>1 minute</MenuItem>
                  <MenuItem value={300000}>5 minutes</MenuItem>
                  <MenuItem value={600000}>10 minutes</MenuItem>
                  <MenuItem value={1800000}>30 minutes</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <Button
                variant="outlined"
                startIcon={<Insights />}
                onClick={() => window.open('/cost-analytics', '_blank')}
                fullWidth
                size="small"
              >
                Advanced Analytics
              </Button>
            </Grid>
          </Grid>

          {/* Important Notice */}
          <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
            <Typography variant="body2">
              <strong>Real-time Monitoring:</strong> Data refreshes every {refreshInterval / 60000} minutes when auto-refresh is enabled. 
              Cost Explorer data is fetched from us-east-1 region.
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
              Please select an AWS account to view real-time cost data.
            </Alert>
          ) : (
            <>
              {/* Loading Indicator */}
              {metricsLoading && <LinearProgress sx={{ mb: 3 }} />}

              {/* Real-time Metrics */}
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={2.4}>
                  <CostMetricWidget
                    title="Total Cost"
                    value={dashboardMetrics.totalCost}
                    change={dashboardMetrics.costChange}
                    icon={<AccountBalance />}
                    color="primary"
                    loading={metricsLoading}
                    subtitle={`${dateRange} period`}
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={2.4}>
                  <CostMetricWidget
                    title="Avg Daily Cost"
                    value={dashboardMetrics.avgDailyCost}
                    icon={<Timeline />}
                    color="info"
                    loading={metricsLoading}
                    subtitle="Per day average"
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={2.4}>
                  <CostMetricWidget
                    title="Active Services"
                    value={dashboardMetrics.activeServices}
                    icon={<Assessment />}
                    color="success"
                    format="number"
                    loading={metricsLoading}
                    subtitle="Services in use"
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={2.4}>
                  <CostMetricWidget
                    title="Potential Savings"
                    value={dashboardMetrics.potentialSavings}
                    icon={<Savings />}
                    color="warning"
                    loading={metricsLoading}
                    subtitle="Monthly potential"
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={2.4}>
                  <CostMetricWidget
                    title="Optimization Tips"
                    value={dashboardMetrics.recommendations}
                    icon={<CheckCircle />}
                    color="secondary"
                    format="number"
                    loading={metricsLoading}
                    subtitle="Available recommendations"
                  />
                </Grid>
              </Grid>

              {/* Dashboard Content */}
              {viewMode === 'widgets' ? (
                /* Widget View */
                <>
                  <Grid container spacing={3} sx={{ mb: 4 }}>
                    {/* Account Summary */}
                    <Grid item xs={12} md={4}>
                      <AccountSummaryWidget 
                        accountId={parseInt(selectedAccount)} 
                        height={300}
                      />
                    </Grid>

                    {/* Cost Comparison */}
                    <Grid item xs={12} md={4}>
                      <CostComparisonWidget 
                        accountId={parseInt(selectedAccount)} 
                        dateRange={dateRange}
                        height={300}
                      />
                    </Grid>

                    {/* Service Breakdown */}
                    <Grid item xs={12} md={4}>
                      <ServiceBreakdownWidget 
                        accountId={parseInt(selectedAccount)} 
                        dateRange={dateRange}
                        height={300}
                      />
                    </Grid>
                  </Grid>

                  <Grid container spacing={3}>
                    {/* Cost Trends */}
                    <Grid item xs={12} md={8}>
                      <CostTrendWidget 
                        accountId={parseInt(selectedAccount)} 
                        dateRange={dateRange}
                        height={500}
                      />
                    </Grid>

                    {/* Recommendations */}
                    <Grid item xs={12} md={4}>
                      <RecommendationsWidget 
                        accountId={parseInt(selectedAccount)} 
                        height={500}
                      />
                    </Grid>
                  </Grid>
                </>
              ) : (
                /* Compact View */
                <Grid container spacing={2}>
                  <Grid item xs={12} md={8}>
                    <CostTrendWidget 
                      accountId={parseInt(selectedAccount)} 
                      dateRange={dateRange}
                      height={350}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <ServiceBreakdownWidget 
                      accountId={parseInt(selectedAccount)} 
                      dateRange={dateRange}
                      height={350}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <CostComparisonWidget 
                      accountId={parseInt(selectedAccount)} 
                      dateRange={dateRange}
                      height={250}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <RecommendationsWidget 
                      accountId={parseInt(selectedAccount)} 
                      height={250}
                    />
                  </Grid>
                </Grid>
              )}

              {/* No Data Message */}
              {!metricsLoading && selectedAccount && dashboardMetrics.totalCost === 0 && (
                <Alert severity="info" sx={{ mt: 3, borderRadius: 2 }}>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    No Cost Data Available
                  </Typography>
                  <Typography variant="body2">
                    This could be because:
                  </Typography>
                  <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                    <li>The account is new and doesn't have cost data yet</li>
                    <li>Cost Explorer data is not yet available (typically available within 24 hours)</li>
                    <li>The selected date range has no AWS usage</li>
                    <li>Cost Explorer permissions are not properly configured</li>
                  </ul>
                  <Typography variant="body2">
                    Try selecting a different date range or ensure Cost Explorer is enabled for this account.
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

export default EnhancedDashboard;