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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  ButtonGroup,
  Divider,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
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
  Download,
  Print,
  Email,
  Share,
  FilterList,
  ExpandMore,
  GetApp,
  Description,
  TableChart,
  BarChart,
  ShowChart,
  PictureAsPdf,
  InsertDriveFile,
  Schedule,
  Insights,
  Compare,
  Storage,
  Memory,
  NetworkCheck,
  Security,
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
  BarChart as RechartsBarChart,
  Bar,
  Legend,
  AreaChart,
  Area,
  ComposedChart,
  Treemap,
  ScatterChart,
  Scatter,
} from 'recharts';
import { authService } from '../services/authService';

const CostReportsPage = () => {
  const theme = useTheme();
  const [awsAccounts, setAwsAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [reportType, setReportType] = useState('comprehensive');
  const [dateRange, setDateRange] = useState('30days');
  const [granularity, setGranularity] = useState('DAILY');
  const [groupBy, setGroupBy] = useState('SERVICE');
  
  // Data states
  const [reportData, setReportData] = useState({
    summary: null,
    trends: [],
    breakdown: [],
    comparison: null,
    recommendations: [],
    forecast: [],
    statistics: null,
  });
  
  // UI states
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [error, setError] = useState(null);
  const [exportDialog, setExportDialog] = useState(false);
  const [reportScheduleDialog, setReportScheduleDialog] = useState(false);
  
  // Export states
  const [exportFormat, setExportFormat] = useState('pdf');
  const [exportLoading, setExportLoading] = useState(false);

  const chartColors = {
    primary: theme.palette.primary.main,
    secondary: theme.palette.secondary.main,
    success: theme.palette.success.main,
    warning: theme.palette.warning.main,
    error: theme.palette.error.main,
    info: theme.palette.info.main,
  };

  const pieColors = ['#FF9900', '#232F3E', '#38A169', '#3182CE', '#DD6B20', '#E53E3E', '#805AD5', '#38B2AC', '#F56565', '#48BB78'];

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedAccount && selectedAccount !== '') {
      loadReportData();
    }
  }, [selectedAccount, dateRange, granularity, groupBy, reportType]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      const accounts = await authService.getAWSAccounts();
      const activeAccounts = accounts.filter(acc => acc.is_active);
      setAwsAccounts(activeAccounts);
      
      if (activeAccounts.length > 0) {
        setSelectedAccount(activeAccounts[0].id.toString());
      }
    } catch (err) {
      setError('Failed to load AWS accounts: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadReportData = async () => {
    if (!selectedAccount || selectedAccount === '') return;
    
    try {
      setReportLoading(true);
      setError(null);

      const accountId = parseInt(selectedAccount);
      const { startDate, endDate, prevStartDate, prevEndDate } = getDateRanges();

      // Load comprehensive report data
      const dataPromises = [
        authService.getCostTrends(accountId, startDate, endDate, granularity),
        authService.getDetailedCostData(accountId, startDate, endDate, groupBy, granularity),
        authService.getCostComparison(accountId, startDate, endDate, prevStartDate, prevEndDate),
        authService.getRightsizingRecommendations(accountId),
        authService.getCostStatistics(accountId, startDate, endDate),
        authService.getMonthlyCostSummary(accountId, 6),
      ];

      // Add forecast if supported
      if (reportType === 'comprehensive' || reportType === 'forecast') {
        const forecastEndDate = new Date();
        forecastEndDate.setMonth(forecastEndDate.getMonth() + 1);
        dataPromises.push(
          authService.getCostForecast(accountId, endDate, forecastEndDate.toISOString().split('T')[0])
        );
      }

      const results = await Promise.allSettled(dataPromises);
      
      const newReportData = {
        summary: null,
        trends: results[0].status === 'fulfilled' ? results[0].value.daily_costs || [] : [],
        breakdown: results[1].status === 'fulfilled' ? results[1].value.groups || [] : [],
        comparison: results[2].status === 'fulfilled' ? results[2].value : null,
        recommendations: results[3].status === 'fulfilled' ? results[3].value || [] : [],
        statistics: results[4].status === 'fulfilled' ? results[4].value : null,
        monthlySummary: results[5].status === 'fulfilled' ? results[5].value.monthly_data || [] : [],
        forecast: results[6] && results[6].status === 'fulfilled' ? results[6].value.forecast_data || [] : [],
      };

      // Calculate summary
      const totalCost = newReportData.trends.reduce((sum, item) => sum + item.amount, 0);
      const totalSavings = newReportData.recommendations.reduce((sum, rec) => sum + rec.estimated_monthly_savings, 0);
      
      newReportData.summary = {
        accountId: selectedAccount,
        period: `${startDate} to ${endDate}`,
        totalCost,
        totalSavings,
        serviceCount: newReportData.breakdown.length,
        recommendationCount: newReportData.recommendations.length,
        generatedAt: new Date(),
      };

      setReportData(newReportData);

    } catch (err) {
      setError('Failed to load report data: ' + err.message);
      console.error('Report data loading error:', err);
    } finally {
      setReportLoading(false);
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

  const handleExportReport = async () => {
    try {
      setExportLoading(true);
      const accountId = parseInt(selectedAccount);
      const { startDate, endDate } = getDateRanges();
      
      await authService.exportCostData(accountId, startDate, endDate, groupBy);
      setExportDialog(false);
    } catch (err) {
      setError('Failed to export report: ' + err.message);
    } finally {
      setExportLoading(false);
    }
  };

  const handlePrintReport = () => {
    window.print();
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
                Cost Reports & Analytics
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Comprehensive AWS cost reporting with export capabilities
              </Typography>
            </Box>

            <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                No AWS Accounts Found
              </Typography>
              <Typography variant="body2">
                Add your AWS accounts to generate comprehensive cost reports and analytics.
              </Typography>
            </Alert>
          </Box>
        </Fade>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Fade in timeout={600}>
        <Box>
          {/* Header */}
          <Box sx={{ mb: 4 }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={8}>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                  Cost Reports & Analytics
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Comprehensive AWS cost reporting with detailed insights and export capabilities
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
                  <Button
                    variant="outlined"
                    startIcon={<Download />}
                    onClick={() => setExportDialog(true)}
                    disabled={reportLoading || !selectedAccount}
                  >
                    Export
                  </Button>
                  
                  <Button
                    variant="outlined"
                    startIcon={<Print />}
                    onClick={handlePrintReport}
                    disabled={reportLoading || !selectedAccount}
                  >
                    Print
                  </Button>
                  
                  <Button
                    variant="outlined"
                    startIcon={<Schedule />}
                    onClick={() => setReportScheduleDialog(true)}
                    disabled={reportLoading || !selectedAccount}
                  >
                    Schedule
                  </Button>
                  
                  <Tooltip title="Refresh Report">
                    <IconButton 
                      onClick={loadReportData} 
                      disabled={reportLoading || !selectedAccount}
                      sx={{ bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' } }}
                    >
                      <Refresh />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Grid>
            </Grid>
          </Box>

          {/* Controls */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>AWS Account</InputLabel>
                <Select
                  value={selectedAccount}
                  label="AWS Account"
                  onChange={(e) => setSelectedAccount(e.target.value)}
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

            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Report Type</InputLabel>
                <Select
                  value={reportType}
                  label="Report Type"
                  onChange={(e) => setReportType(e.target.value)}
                >
                  <MenuItem value="comprehensive">Comprehensive</MenuItem>
                  <MenuItem value="summary">Executive Summary</MenuItem>
                  <MenuItem value="detailed">Detailed Analysis</MenuItem>
                  <MenuItem value="forecast">Cost Forecast</MenuItem>
                  <MenuItem value="optimization">Optimization Report</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Time Range</InputLabel>
                <Select
                  value={dateRange}
                  label="Time Range"
                  onChange={(e) => setDateRange(e.target.value)}
                >
                  <MenuItem value="7days">Last 7 days</MenuItem>
                  <MenuItem value="30days">Last 30 days</MenuItem>
                  <MenuItem value="90days">Last 90 days</MenuItem>
                  <MenuItem value="thisMonth">This month</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Granularity</InputLabel>
                <Select
                  value={granularity}
                  label="Granularity"
                  onChange={(e) => setGranularity(e.target.value)}
                >
                  <MenuItem value="DAILY">Daily</MenuItem>
                  <MenuItem value="MONTHLY">Monthly</MenuItem>
                  <MenuItem value="YEARLY">Yearly</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Group By</InputLabel>
                <Select
                  value={groupBy}
                  label="Group By"
                  onChange={(e) => setGroupBy(e.target.value)}
                >
                  <MenuItem value="SERVICE">Service</MenuItem>
                  <MenuItem value="REGION">Region</MenuItem>
                  <MenuItem value="INSTANCE_TYPE">Instance Type</MenuItem>
                  <MenuItem value="USAGE_TYPE">Usage Type</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={1}>
              <Button
                variant="contained"
                fullWidth
                onClick={loadReportData}
                disabled={reportLoading || !selectedAccount}
                sx={{ height: '100%' }}
              >
                {reportLoading ? <CircularProgress size={20} /> : 'Generate'}
              </Button>
            </Grid>
          </Grid>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {!selectedAccount ? (
            <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
              Please select an AWS account to generate reports.
            </Alert>
          ) : (
            <>
              {/* Loading Indicator */}
              {reportLoading && <LinearProgress sx={{ mb: 3 }} />}

              {/* Report Summary */}
              {reportData.summary && (
                <Card sx={{ mb: 4, border: 2, borderColor: 'primary.main' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Description sx={{ color: 'primary.main', fontSize: 32 }} />
                        <Box>
                          <Typography variant="h5" sx={{ fontWeight: 600 }}>
                            {reportType.charAt(0).toUpperCase() + reportType.slice(1)} Cost Report
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {getSelectedAccountName()} • {reportData.summary.period}
                          </Typography>
                        </Box>
                      </Box>
                      <Chip 
                        label={`Generated: ${reportData.summary.generatedAt.toLocaleString()}`}
                        color="primary"
                        variant="outlined"
                      />
                    </Box>

                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'primary.lighter', borderRadius: 2 }}>
                          <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                            {formatCurrency(reportData.summary.totalCost)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Total Cost
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.lighter', borderRadius: 2 }}>
                          <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                            {formatCurrency(reportData.summary.totalSavings)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Potential Savings
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'info.lighter', borderRadius: 2 }}>
                          <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main' }}>
                            {reportData.summary.serviceCount}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Services Used
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'warning.lighter', borderRadius: 2 }}>
                          <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
                            {reportData.summary.recommendationCount}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Recommendations
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              )}

              {/* Report Tabs */}
              <Card>
                <Tabs 
                  value={activeTab} 
                  onChange={(e, newValue) => setActiveTab(newValue)}
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{ borderBottom: 1, borderColor: 'divider' }}
                >
                  <Tab icon={<ShowChart />} label="Cost Trends" />
                  <Tab icon={<PieChart />} label="Breakdown" />
                  <Tab icon={<Compare />} label="Comparison" />
                  <Tab icon={<Savings />} label="Recommendations" />
                  <Tab icon={<Timeline />} label="Forecast" />
                  <Tab icon={<TableChart />} label="Data Table" />
                </Tabs>

                <CardContent sx={{ p: 3 }}>
                  {/* Cost Trends Tab */}
                  {activeTab === 0 && (
                    <Box>
                      <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                        Cost Trends Analysis
                      </Typography>
                      <ResponsiveContainer width="100%" height={500}>
                        <ComposedChart data={reportData.trends}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="date" 
                            tickFormatter={(value) => new Date(value).toLocaleDateString()}
                          />
                          <YAxis tickFormatter={(value) => `$${value.toFixed(0)}`} />
                          <RechartsTooltip 
                            formatter={(value) => [`$${value.toFixed(2)}`, 'Cost']}
                            labelFormatter={(date) => `Date: ${new Date(date).toLocaleDateString()}`}
                          />
                          <Legend />
                          <Area 
                            type="monotone" 
                            dataKey="amount" 
                            fill={chartColors.primary}
                            fillOpacity={0.3}
                            stroke={chartColors.primary}
                            strokeWidth={2}
                            name="Daily Cost"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="amount" 
                            stroke={chartColors.secondary}
                            strokeWidth={3}
                            dot={{ r: 4 }}
                            name="Trend Line"
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </Box>
                  )}

                  {/* Breakdown Tab */}
                  {activeTab === 1 && (
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={8}>
                        <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                          Cost Breakdown by {groupBy}
                        </Typography>
                        <ResponsiveContainer width="100%" height={400}>
                          <RechartsBarChart data={reportData.breakdown.slice(0, 15)}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="key" 
                              angle={-45}
                              textAnchor="end"
                              height={100}
                            />
                            <YAxis tickFormatter={(value) => `$${value.toFixed(0)}`} />
                            <RechartsTooltip formatter={(value) => [`$${value.toFixed(2)}`, 'Cost']} />
                            <Bar dataKey="amount" fill={chartColors.info} />
                          </RechartsBarChart>
                        </ResponsiveContainer>
                      </Grid>

                      <Grid item xs={12} md={4}>
                        <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                          Top 10 by Cost
                        </Typography>
                        <ResponsiveContainer width="100%" height={400}>
                          <RechartsPieChart>
                            <Pie
                              data={reportData.breakdown.slice(0, 10)}
                              cx="50%"
                              cy="50%"
                              outerRadius={120}
                              dataKey="amount"
                              label={(entry) => `${entry.percentage}%`}
                            >
                              {reportData.breakdown.slice(0, 10).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={pieColors[index]} />
                              ))}
                            </Pie>
                            <RechartsTooltip formatter={(value) => [`$${value.toFixed(2)}`, 'Cost']} />
                          </RechartsPieChart>
                        </ResponsiveContainer>
                      </Grid>
                    </Grid>
                  )}

                  {/* Comparison Tab */}
                  {activeTab === 2 && reportData.comparison && (
                    <Box>
                      <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                        Period-over-Period Comparison
                      </Typography>
                      <Grid container spacing={3}>
                        <Grid item xs={12} md={4}>
                          <Card sx={{ p: 3, textAlign: 'center', bgcolor: 'grey.50' }}>
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                              Previous Period
                            </Typography>
                            <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                              {formatCurrency(reportData.comparison.previous_period.total_cost)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {reportData.comparison.previous_period.start_date} to {reportData.comparison.previous_period.end_date}
                            </Typography>
                          </Card>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Card sx={{ p: 3, textAlign: 'center', bgcolor: 'primary.lighter' }}>
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                              Current Period
                            </Typography>
                            <Typography variant="h3" sx={{ fontWeight: 700, mb: 1, color: 'primary.main' }}>
                              {formatCurrency(reportData.comparison.current_period.total_cost)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {reportData.comparison.current_period.start_date} to {reportData.comparison.current_period.end_date}
                            </Typography>
                          </Card>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Card sx={{ 
                            p: 3, 
                            textAlign: 'center', 
                            bgcolor: reportData.comparison.change_amount > 0 ? 'error.lighter' : 'success.lighter' 
                          }}>
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                              Change
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
                              {reportData.comparison.change_amount > 0 ? (
                                <TrendingUp sx={{ color: 'error.main', fontSize: 32 }} />
                              ) : (
                                <TrendingDown sx={{ color: 'success.main', fontSize: 32 }} />
                              )}
                              <Typography 
                                variant="h3" 
                                sx={{ 
                                  fontWeight: 700, 
                                  color: reportData.comparison.change_amount > 0 ? 'error.main' : 'success.main' 
                                }}
                              >
                                {formatCurrency(Math.abs(reportData.comparison.change_amount))}
                              </Typography>
                            </Box>
                            <Typography 
                              variant="h6" 
                              sx={{ 
                                color: reportData.comparison.change_amount > 0 ? 'error.main' : 'success.main',
                                fontWeight: 600
                              }}
                            >
                              {formatPercentage(reportData.comparison.change_percentage)}
                            </Typography>
                          </Card>
                        </Grid>
                      </Grid>
                    </Box>
                  )}

                  {/* Recommendations Tab */}
                  {activeTab === 3 && (
                    <Box>
                      <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                        Cost Optimization Recommendations
                      </Typography>
                      {reportData.recommendations.length > 0 ? (
                        <TableContainer component={Paper}>
                          <Table>
                            <TableHead>
                              <TableRow>
                                <TableCell>Resource</TableCell>
                                <TableCell>Type</TableCell>
                                <TableCell>Current</TableCell>
                                <TableCell>Recommended</TableCell>
                                <TableCell align="right">Monthly Savings</TableCell>
                                <TableCell>Confidence</TableCell>
                                <TableCell>Impact</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {reportData.recommendations.map((rec, index) => (
                                <TableRow key={index}>
                                  <TableCell>
                                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                      {rec.resource_id}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Chip label={rec.resource_type} size="small" />
                                  </TableCell>
                                  <TableCell>
                                    <Chip label={rec.current_instance_type} size="small" variant="outlined" />
                                  </TableCell>
                                  <TableCell>
                                    <Chip label={rec.recommended_instance_type} size="small" color="primary" />
                                  </TableCell>
                                  <TableCell align="right">
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
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
                                  <TableCell>
                                    <Typography variant="body2" color="text.secondary">
                                      Low Risk
                                    </Typography>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      ) : (
                        <Alert severity="info">
                          No optimization recommendations available for this account and time period.
                        </Alert>
                      )}
                    </Box>
                  )}

                  {/* Forecast Tab */}
                  {activeTab === 4 && (
                    <Box>
                      <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                        Cost Forecast
                      </Typography>
                      {reportData.forecast.length > 0 ? (
                        <ResponsiveContainer width="100%" height={500}>
                          <ComposedChart data={reportData.forecast}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="date" 
                              tickFormatter={(value) => new Date(value).toLocaleDateString()}
                            />
                            <YAxis tickFormatter={(value) => `$${value.toFixed(0)}`} />
                            <RechartsTooltip 
                              formatter={(value, name) => [`$${value.toFixed(2)}`, name]}
                              labelFormatter={(date) => `Date: ${new Date(date).toLocaleDateString()}`}
                            />
                            <Legend />
                            <Area 
                              type="monotone" 
                              dataKey="confidence_interval_upper" 
                              stackId="1"
                              stroke="none"
                              fill={chartColors.warning}
                              fillOpacity={0.2}
                              name="Upper Confidence"
                            />
                            <Area 
                              type="monotone" 
                              dataKey="confidence_interval_lower" 
                              stackId="1"
                              stroke="none"
                              fill="white"
                              name="Lower Confidence"
                            />
                            <Line 
                              type="monotone" 
                              dataKey="forecasted_cost" 
                              stroke={chartColors.primary}
                              strokeWidth={3}
                              name="Forecasted Cost"
                            />
                          </ComposedChart>
                        </ResponsiveContainer>
                      ) : (
                        <Alert severity="info">
                          Cost forecast data is not available for this account.
                        </Alert>
                      )}
                    </Box>
                  )}

                  {/* Data Table Tab */}
                  {activeTab === 5 && (
                    <Box>
                      <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                        Detailed Cost Data
                      </Typography>
                      <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
                        <Table stickyHeader>
                          <TableHead>
                            <TableRow>
                              <TableCell>Date</TableCell>
                              <TableCell align="right">Cost (USD)</TableCell>
                              <TableCell align="right">Daily Change</TableCell>
                              <TableCell>Status</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {reportData.trends.map((trend, index) => {
                              const prevCost = index > 0 ? reportData.trends[index - 1].amount : trend.amount;
                              const change = trend.amount - prevCost;
                              const changePercent = prevCost > 0 ? (change / prevCost) * 100 : 0;
                              
                              return (
                                <TableRow key={trend.date}>
                                  <TableCell>
                                    {new Date(trend.date).toLocaleDateString()}
                                  </TableCell>
                                  <TableCell align="right" sx={{ fontWeight: 500 }}>
                                    {formatCurrency(trend.amount)}
                                  </TableCell>
                                  <TableCell align="right">
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                      {change > 0 ? (
                                        <TrendingUp sx={{ color: 'error.main', fontSize: 16, mr: 0.5 }} />
                                      ) : change < 0 ? (
                                        <TrendingDown sx={{ color: 'success.main', fontSize: 16, mr: 0.5 }} />
                                      ) : (
                                        <TrendingFlat sx={{ color: 'info.main', fontSize: 16, mr: 0.5 }} />
                                      )}
                                      <Typography 
                                        variant="body2" 
                                        sx={{ 
                                          color: change > 0 ? 'error.main' : change < 0 ? 'success.main' : 'info.main' 
                                        }}
                                      >
                                        {change !== 0 ? formatPercentage(changePercent) : '0.0%'}
                                      </Typography>
                                    </Box>
                                  </TableCell>
                                  <TableCell>
                                    <Chip 
                                      label={
                                        trend.amount > 1000 ? 'High' : 
                                        trend.amount > 500 ? 'Medium' : 'Low'
                                      }
                                      size="small"
                                      color={
                                        trend.amount > 1000 ? 'error' : 
                                        trend.amount > 500 ? 'warning' : 'success'
                                      }
                                      variant="outlined"
                                    />
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {/* Export Dialog */}
          <Dialog open={exportDialog} onClose={() => setExportDialog(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Export Cost Report</DialogTitle>
            <DialogContent>
              <Box sx={{ mt: 2 }}>
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel>Export Format</InputLabel>
                  <Select
                    value={exportFormat}
                    label="Export Format"
                    onChange={(e) => setExportFormat(e.target.value)}
                  >
                    <MenuItem value="csv">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <InsertDriveFile />
                        CSV - Comma Separated Values
                      </Box>
                    </MenuItem>
                    <MenuItem value="pdf">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PictureAsPdf />
                        PDF - Portable Document Format
                      </Box>
                    </MenuItem>
                    <MenuItem value="json">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Description />
                        JSON - JavaScript Object Notation
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>

                <Alert severity="info" sx={{ mb: 2 }}>
                  Export will include all data from the current report configuration including cost trends, 
                  breakdown analysis, and optimization recommendations.
                </Alert>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setExportDialog(false)}>Cancel</Button>
              <Button 
                onClick={handleExportReport} 
                variant="contained"
                disabled={exportLoading}
                startIcon={exportLoading ? <CircularProgress size={16} /> : <Download />}
              >
                {exportLoading ? 'Exporting...' : 'Export Report'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Schedule Dialog */}
          <Dialog open={reportScheduleDialog} onClose={() => setReportScheduleDialog(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Schedule Automated Reports</DialogTitle>
            <DialogContent>
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  Automated report scheduling is coming soon! This feature will allow you to:
                </Typography>
                <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                  <li>Schedule daily, weekly, or monthly reports</li>
                  <li>Email reports to stakeholders automatically</li>
                  <li>Set custom report templates and filters</li>
                  <li>Configure cost threshold alerts</li>
                </ul>
              </Alert>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setReportScheduleDialog(false)}>Close</Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Fade>
    </Container>
  );
};

export default CostReportsPage;