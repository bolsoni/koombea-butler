import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  LinearProgress,
  useTheme,
  IconButton,
  Tooltip,
  Grid,
  Alert,
  CircularProgress,
  Button,
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
  Divider,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  Refresh,
  Warning,
  CheckCircle,
  Info,
  Error,
  ExpandMore,
  Visibility,
  CloudQueue,
  Assessment,
  Savings,
  Timeline,
  AttachMoney,
  Speed,
  PieChart,
  ShowChart,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ComposedChart,
} from 'recharts';
import { authService } from '../services/authService';

// Real-time Cost Metric Widget
export const CostMetricWidget = ({ 
  title, 
  value, 
  change, 
  changeType = 'percentage', 
  icon, 
  color = 'primary',
  format = 'currency',
  subtitle,
  loading = false 
}) => {
  const theme = useTheme();
  
  const formatValue = (val) => {
    if (format === 'currency') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(val);
    }
    return val;
  };

  const getChangeIcon = () => {
    if (!change) return null;
    if (change > 0) return <TrendingUp sx={{ fontSize: 16 }} />;
    if (change < 0) return <TrendingDown sx={{ fontSize: 16 }} />;
    return <TrendingFlat sx={{ fontSize: 16 }} />;
  };

  const getChangeColor = () => {
    if (!change) return 'text.secondary';
    return change > 0 ? 'error.main' : 'success.main';
  };

  return (
    <Card sx={{ 
      height: '100%',
      background: `linear-gradient(135deg, ${theme.palette[color].main}15 0%, ${theme.palette[color].main}25 100%)`,
      border: 1,
      borderColor: `${theme.palette[color].main}30`,
    }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, color: `${color}.main`, mb: 1 }}>
              {loading ? <CircularProgress size={24} /> : formatValue(value)}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box sx={{ 
            width: 48, 
            height: 48, 
            borderRadius: 2, 
            bgcolor: `${color}.main`, 
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {icon}
          </Box>
        </Box>
        
        {change !== null && change !== undefined && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              color: getChangeColor(),
              bgcolor: `${change > 0 ? 'error' : 'success'}.lighter`,
              px: 1,
              py: 0.5,
              borderRadius: 1
            }}>
              {getChangeIcon()}
              <Typography variant="caption" sx={{ fontWeight: 600, ml: 0.5 }}>
                {changeType === 'percentage' ? 
                  `${change > 0 ? '+' : ''}${change.toFixed(1)}%` :
                  formatValue(Math.abs(change))
                }
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              vs previous period
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

// Service Cost Breakdown Widget
export const ServiceBreakdownWidget = ({ accountId, dateRange = '30days', height = 400 }) => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const theme = useTheme();

  const pieColors = ['#FF9900', '#232F3E', '#38A169', '#3182CE', '#DD6B20', '#E53E3E', '#805AD5', '#38B2AC'];

  useEffect(() => {
    if (accountId) {
      loadServiceData();
    }
  }, [accountId, dateRange]);

  const loadServiceData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { startDate, endDate } = getDateRanges(dateRange);
      const data = await authService.getServiceBreakdown(accountId, startDate, endDate);
      setServices(data.services || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getDateRanges = (range) => {
    const today = new Date();
    let startDate, endDate;

    switch (range) {
      case '7days':
        endDate = today.toISOString().split('T')[0];
        startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      case '30days':
        endDate = today.toISOString().split('T')[0];
        startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      default:
        endDate = today.toISOString().split('T')[0];
        startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    }

    return { startDate, endDate };
  };

  if (error) {
    return (
      <Card sx={{ height }}>
        <CardContent>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ height }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PieChart sx={{ color: 'primary.main' }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Service Costs
            </Typography>
          </Box>
          <Tooltip title="Refresh Data">
            <IconButton onClick={loadServiceData} disabled={loading} size="small">
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>

        {loading && <LinearProgress sx={{ mb: 2 }} />}

        <Box sx={{ height: height - 120 }}>
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Pie
                data={services.slice(0, 8)}
                cx="50%"
                cy="50%"
                outerRadius={Math.min((height - 120) / 3, 100)}
                dataKey="amount"
                label={(entry) => `${entry.service_name}: ${entry.percentage}%`}
              >
                {services.slice(0, 8).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={pieColors[index]} />
                ))}
              </Pie>
              <RechartsTooltip 
                formatter={(value) => [`$${value.toFixed(2)}`, 'Cost']} 
              />
            </RechartsPieChart>
          </ResponsiveContainer>
        </Box>

        <Box sx={{ maxHeight: 120, overflow: 'auto', mt: 1 }}>
          {services.slice(0, 5).map((service, index) => (
            <Box key={service.service_name} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
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
                {service.service_name}
              </Typography>
              <Typography variant="body2" fontWeight="medium" sx={{ fontSize: '0.8rem' }}>
                ${service.amount.toFixed(2)}
              </Typography>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

// Cost Trend Widget
export const CostTrendWidget = ({ accountId, dateRange = '30days', height = 400 }) => {
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const theme = useTheme();

  useEffect(() => {
    if (accountId) {
      loadTrendData();
    }
  }, [accountId, dateRange]);

  const loadTrendData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { startDate, endDate } = getDateRanges(dateRange);
      const data = await authService.getCostTrends(accountId, startDate, endDate, 'DAILY');
      setTrends(data.daily_costs || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getDateRanges = (range) => {
    const today = new Date();
    let startDate, endDate;

    switch (range) {
      case '7days':
        endDate = today.toISOString().split('T')[0];
        startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      case '30days':
        endDate = today.toISOString().split('T')[0];
        startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      default:
        endDate = today.toISOString().split('T')[0];
        startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    }

    return { startDate, endDate };
  };

  if (error) {
    return (
      <Card sx={{ height }}>
        <CardContent>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ height }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ShowChart sx={{ color: 'primary.main' }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Cost Trends
            </Typography>
          </Box>
          <Tooltip title="Refresh Data">
            <IconButton onClick={loadTrendData} disabled={loading} size="small">
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>

        {loading && <LinearProgress sx={{ mb: 2 }} />}

        <Box sx={{ height: height - 100 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <YAxis 
                tickFormatter={(value) => `$${value.toFixed(0)}`}
              />
              <RechartsTooltip 
                formatter={(value) => [`$${value.toFixed(2)}`, 'Daily Cost']}
                labelFormatter={(date) => `Date: ${new Date(date).toLocaleDateString()}`}
              />
              <Area 
                type="monotone" 
                dataKey="amount" 
                stroke={theme.palette.primary.main} 
                fill={theme.palette.primary.main}
                fillOpacity={0.6}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
};

// Recommendations Widget
export const RecommendationsWidget = ({ accountId, height = 400 }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (accountId) {
      loadRecommendations();
    }
  }, [accountId]);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await authService.getRightsizingRecommendations(accountId);
      setRecommendations(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getTotalSavings = () => {
    return recommendations.reduce((sum, rec) => sum + rec.estimated_monthly_savings, 0);
  };

  if (error) {
    return (
      <Card sx={{ height }}>
        <CardContent>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ height }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Savings sx={{ color: 'warning.main' }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Optimization Tips
            </Typography>
            <Chip 
              label={`$${getTotalSavings().toFixed(0)} potential savings`}
              color="warning"
              size="small"
            />
          </Box>
          <Tooltip title="Refresh Recommendations">
            <IconButton onClick={loadRecommendations} disabled={loading} size="small">
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>

        {loading && <LinearProgress sx={{ mb: 2 }} />}

        <Box sx={{ height: height - 100, overflow: 'auto' }}>
          {recommendations.length === 0 ? (
            <Alert severity="info">
              No optimization recommendations available at this time.
            </Alert>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Resource</TableCell>
                    <TableCell>Current</TableCell>
                    <TableCell>Recommended</TableCell>
                    <TableCell align="right">Savings</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recommendations.slice(0, 10).map((rec, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>
                          {rec.resource_id}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={rec.current_instance_type} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Chip label={rec.recommended_instance_type} size="small" color="primary" />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 500, color: 'success.main' }}>
                          ${rec.estimated_monthly_savings.toFixed(0)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

// Cost Comparison Widget
export const CostComparisonWidget = ({ accountId, dateRange = '30days', height = 300 }) => {
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (accountId) {
      loadComparisonData();
    }
  }, [accountId, dateRange]);

  const loadComparisonData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { startDate, endDate, prevStartDate, prevEndDate } = getDateRanges(dateRange);
      const data = await authService.getCostComparison(accountId, startDate, endDate, prevStartDate, prevEndDate);
      setComparison(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getDateRanges = (range) => {
    const today = new Date();
    let startDate, endDate, prevStartDate, prevEndDate;

    switch (range) {
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
      default:
        endDate = today.toISOString().split('T')[0];
        startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        prevEndDate = startDate;
        prevStartDate = new Date(new Date(startDate).getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
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

  if (error) {
    return (
      <Card sx={{ height }}>
        <CardContent>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ height }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Assessment sx={{ color: 'info.main' }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Period Comparison
            </Typography>
          </Box>
          <Tooltip title="Refresh Comparison">
            <IconButton onClick={loadComparisonData} disabled={loading} size="small">
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>

        {loading && <LinearProgress sx={{ mb: 2 }} />}

        {comparison && (
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Previous
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {formatCurrency(comparison.previous_period.total_cost)}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={4}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'primary.lighter', borderRadius: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Current
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                  {formatCurrency(comparison.current_period.total_cost)}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={4}>
              <Box sx={{ 
                textAlign: 'center', 
                p: 2, 
                bgcolor: comparison.change_amount > 0 ? 'error.lighter' : 'success.lighter', 
                borderRadius: 2 
              }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Change
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                  {comparison.change_amount > 0 ? (
                    <TrendingUp sx={{ color: 'error.main', fontSize: 20 }} />
                  ) : comparison.change_amount < 0 ? (
                    <TrendingDown sx={{ color: 'success.main', fontSize: 20 }} />
                  ) : (
                    <TrendingFlat sx={{ color: 'info.main', fontSize: 20 }} />
                  )}
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: 600, 
                      color: comparison.change_amount > 0 ? 'error.main' : 
                             comparison.change_amount < 0 ? 'success.main' : 'info.main' 
                    }}
                  >
                    {formatPercentage(comparison.change_percentage)}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        )}
      </CardContent>
    </Card>
  );
};

// Account Summary Widget
export const AccountSummaryWidget = ({ accountId, height = 250 }) => {
  const [accountData, setAccountData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (accountId) {
      loadAccountData();
    }
  }, [accountId]);

  const loadAccountData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const accounts = await authService.getAWSAccounts();
      const account = accounts.find(acc => acc.id === accountId);
      setAccountData(account);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <Card sx={{ height }}>
        <CardContent>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ height }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <CloudQueue sx={{ color: 'primary.main' }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Account Overview
          </Typography>
        </Box>

        {loading && <LinearProgress sx={{ mb: 2 }} />}

        {accountData && (
          <Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                {accountData.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                Account ID: {accountData.aws_account_id}
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Region
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {accountData.default_region}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Status
                </Typography>
                <Chip 
                  label={accountData.is_active ? 'Active' : 'Inactive'}
                  color={accountData.is_active ? 'success' : 'default'}
                  size="small"
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  Description
                </Typography>
                <Typography variant="body2">
                  {accountData.description || 'No description provided'}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};