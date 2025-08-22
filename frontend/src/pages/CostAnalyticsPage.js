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
  Tabs,
  Tab,
  ButtonGroup,
  Divider,
  CircularProgress,
  styled,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
  Download,
  Insights,
  FilterList,
  SwapHoriz,
  TrendingFlat,
  Map,
  Memory,
  Storage,
  NetworkCheck,
  Close,
  PictureAsPdf,
  InsertDriveFile,
  Description,
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
  Treemap,
  RadialBarChart,
  RadialBar,
} from 'recharts';
import ReactMarkdown from 'react-markdown';
import { authService } from '../services/authService';

// Custom styled components for better UX
const StyledAnalysisButton = styled(Button)(({ theme, active }) => ({
  borderRadius: 16,
  padding: '12px 24px',
  fontWeight: 600,
  fontSize: '0.95rem',
  textTransform: 'none',
  minWidth: 140,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  border: '2px solid transparent',
  position: 'relative',
  overflow: 'hidden',
  
  ...(active ? {
    background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
    color: 'white',
    boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)',
    transform: 'translateY(-2px)',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'linear-gradient(45deg, rgba(255,255,255,0.1) 30%, rgba(255,255,255,0.2) 90%)',
      opacity: 0,
      transition: 'opacity 0.3s ease',
    },
    '&:hover::before': {
      opacity: 1,
    },
    '&:hover': {
      background: 'linear-gradient(45deg, #5a6fd8 30%, #6a4190 90%)',
      transform: 'translateY(-3px)',
      boxShadow: '0 12px 35px rgba(102, 126, 234, 0.4)',
    },
  } : {
    background: 'rgba(102, 126, 234, 0.08)',
    color: theme.palette.text.primary,
    border: '2px solid rgba(102, 126, 234, 0.2)',
    '&:hover': {
      background: 'rgba(102, 126, 234, 0.15)',
      borderColor: 'rgba(102, 126, 234, 0.4)',
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 15px rgba(102, 126, 234, 0.2)',
    },
  }),
}));

const MetricCard = styled(Card)(({ theme, gradientColors }) => ({
  height: '100%',
  minHeight: 160,
  background: `linear-gradient(135deg, ${gradientColors[0]} 0%, ${gradientColors[1]} 100%)`,
  color: 'white',
  borderRadius: 16,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  border: 'none',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(45deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
    opacity: 0,
    transition: 'opacity 0.3s ease',
  },
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 16px 48px rgba(0, 0, 0, 0.2)',
    '&::before': {
      opacity: 1,
    },
  },
}));

const CostAnalyticsPage = () => {
  const theme = useTheme();
  const [awsAccounts, setAwsAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [dateRange, setDateRange] = useState('30days');
  const [granularity, setGranularity] = useState('DAILY');
  const [groupBy, setGroupBy] = useState('SERVICE');
  
  // AI Agent states
  const [availableAgents, setAvailableAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [agentsLoading, setAgentsLoading] = useState(false);
  
  // Data states
  const [costTrends, setCostTrends] = useState([]);
  const [serviceBreakdown, setServiceBreakdown] = useState([]);
  const [regionBreakdown, setRegionBreakdown] = useState([]);
  const [costComparison, setCostComparison] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [monthlySummary, setMonthlySummary] = useState([]);
  const [costStatistics, setCostStatistics] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [costLoading, setCostLoading] = useState(false);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [exportDialog, setExportDialog] = useState(false);
  const [exportFormat, setExportFormat] = useState('csv');
  const [exportLoading, setExportLoading] = useState(false);

  // Chart colors
  const chartColors = {
    primary: theme.palette.primary.main,
    secondary: theme.palette.secondary.main,
    success: theme.palette.success.main,
    warning: theme.palette.warning.main,
    error: theme.palette.error.main,
    info: theme.palette.info.main,
  };

  const pieColors = ['#FF9900', '#232F3E', '#38A169', '#3182CE', '#DD6B20', '#E53E3E', '#805AD5', '#38B2AC', '#F56565', '#48BB78'];

  // Metric card gradient configurations
  const metricGradients = [
    ['#667eea', '#764ba2'], // Total Cost
    ['#f093fb', '#f5576c'], // Active Services
    ['#4facfe', '#00f2fe'], // Recommendations
    ['#fa709a', '#fee140'], // Data Points
  ];

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadAvailableAgents();
  }, []);

  useEffect(() => {
    if (selectedAccount && selectedAccount !== '') {
      loadAllCostData();
    }
  }, [selectedAccount, dateRange, granularity]);

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

  const loadAvailableAgents = async () => {
    try {
      setAgentsLoading(true);
      const agents = await authService.getAvailableAIAgents();
      setAvailableAgents(agents);
      
      // Auto-select default agent
      const defaultAgent = agents.find(agent => agent.is_default);
      if (defaultAgent) {
        setSelectedAgent(defaultAgent.id.toString());
      } else if (agents.length > 0) {
        setSelectedAgent(agents[0].id.toString());
      }
    } catch (err) {
      console.error('Failed to load AI agents:', err);
    } finally {
      setAgentsLoading(false);
    }
  };

  const loadAllCostData = async () => {
    if (!selectedAccount || selectedAccount === '') return;
    
    try {
      setCostLoading(true);
      setError(null);

      const accountId = parseInt(selectedAccount);
      const { startDate, endDate, prevStartDate, prevEndDate } = getDateRanges();

      // Load all data in parallel
      const [
        trendsData,
        servicesData,
        regionData,
        comparisonData,
        recommendationsData,
        monthlyData,
        statsData
      ] = await Promise.allSettled([
        authService.getCostTrends(accountId, startDate, endDate, granularity),
        authService.getServiceBreakdown(accountId, startDate, endDate),
        authService.getCostByRegion(accountId, startDate, endDate),
        authService.getCostComparison(accountId, startDate, endDate, prevStartDate, prevEndDate),
        authService.getRightsizingRecommendations(accountId),
        authService.getMonthlyCostSummary(accountId, 6),
        authService.getCostStatistics(accountId, startDate, endDate)
      ]);

      // Handle results
      if (trendsData.status === 'fulfilled') {
        setCostTrends(trendsData.value.daily_costs || []);
      }
      if (servicesData.status === 'fulfilled') {
        setServiceBreakdown(servicesData.value.services || []);
      }
      if (regionData.status === 'fulfilled') {
        console.log('Raw region data:', regionData.value);
        
        const rawRegions = regionData.value.groups || [];
        
        const transformedRegions = rawRegions.map(region => ({
          region_name: region.key,
          amount: region.amount,
          percentage: region.percentage,
          unit: region.unit || 'USD'
        }));
        
        console.log('Transformed regions:', transformedRegions);
        setRegionBreakdown(transformedRegions);
      } else {
        console.error('Region data failed:', regionData.reason);
        setRegionBreakdown([]);
      }
      if (comparisonData.status === 'fulfilled') {
        setCostComparison(comparisonData.value);
      }
      if (recommendationsData.status === 'fulfilled') {
        setRecommendations(recommendationsData.value || []);
      }
      if (monthlyData.status === 'fulfilled') {
        setMonthlySummary(monthlyData.value.monthly_data || []);
      }
      if (statsData.status === 'fulfilled') {
        setCostStatistics(statsData.value);
      }

    } catch (err) {
      setError('Failed to load cost data: ' + err.message);
      console.error('Cost data loading error:', err);
    } finally {
      setCostLoading(false);
    }
  };

  const loadAIInsights = async () => {
    if (!selectedAccount || selectedAccount === '' || !selectedAgent) return;
    
    try {
      setInsightsLoading(true);
      const accountId = parseInt(selectedAccount);
      const { startDate, endDate } = getDateRanges();
      
      const insights = await authService.getCostOptimizationInsights(
        accountId, 
        startDate, 
        endDate, 
        parseInt(selectedAgent)
      );
      setAiInsights(insights);
    } catch (err) {
      setError('Failed to generate AI insights: ' + err.message);
    } finally {
      setInsightsLoading(false);
    }
  };

  const closeAIInsights = () => {
    setAiInsights(null);
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

  const getTotalCost = () => {
    return costTrends.reduce((sum, item) => sum + item.amount, 0);
  };

  const exportData = async () => {
    setExportDialog(true);
  };

  const handleExportReport = async () => {
    try {
      setExportLoading(true);
      const accountId = parseInt(selectedAccount);
      const { startDate, endDate } = getDateRanges();
      
      await authService.exportCostData(accountId, startDate, endDate, groupBy, exportFormat);
      setExportDialog(false);
    } catch (err) {
      setError('Failed to export data: ' + err.message);
    } finally {
      setExportLoading(false);
    }
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
                Advanced Cost Analytics
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Comprehensive AWS cost analysis powered by Cost Explorer
              </Typography>
            </Box>

            <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                No AWS Accounts Found
              </Typography>
              <Typography variant="body2">
                Add your AWS accounts to unlock advanced cost analytics. Cost Explorer integration provides deep insights into your AWS spending patterns.
              </Typography>
            </Alert>

            <Card sx={{ textAlign: 'center', py: 8 }}>
              <CardContent>
                <Analytics sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Advanced Cost Intelligence
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Connect your AWS accounts to unlock AI-powered cost optimization insights
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
          {/* Enhanced Header with Better Visual Hierarchy */}
          <Box sx={{ mb: 4 }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={8}>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                  Advanced Cost Analytics
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Comprehensive AWS cost analysis and optimization insights
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
                  <Tooltip title={`Generate AI Insights using ${availableAgents.find(a => a.id.toString() === selectedAgent)?.name || 'AI Agent'}`}>
                    <Button
                      variant="contained"
                      startIcon={<Insights />}
                      onClick={loadAIInsights}
                      disabled={insightsLoading || !selectedAccount || !selectedAgent}
                      sx={{ 
                        borderRadius: 2,
                        px: 3,
                        py: 1.5,
                        fontWeight: 600,
                        background: 'linear-gradient(45deg, #FF9900 30%, #FFB84D 90%)',
                        '&:hover': {
                          background: 'linear-gradient(45deg, #E67E00 30%, #FF9900 90%)',
                        },
                      }}
                    >
                      {insightsLoading ? <CircularProgress size={16} color="inherit" /> : 'AI Insights'}
                    </Button>
                  </Tooltip>
                  
                  <Tooltip title="Export Data">
                    <Button
                      variant="outlined"
                      startIcon={<Download />}
                      onClick={exportData}
                      disabled={costLoading || !selectedAccount}
                      size="large"
                    >
                      Export
                    </Button>
                  </Tooltip>
                  
                  <Tooltip title="Refresh Data">
                    <IconButton 
                      onClick={loadAllCostData} 
                      disabled={costLoading || !selectedAccount}
                      sx={{ 
                        bgcolor: 'primary.main', 
                        color: 'white', 
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        '&:hover': { bgcolor: 'primary.dark' },
                        '&:disabled': {
                          bgcolor: 'grey.300',
                          color: 'grey.500'
                        }
                      }}
                    >
                      <Refresh />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Grid>
            </Grid>
          </Box>

          {/* Improved Controls Layout with Visual Grouping */}
          <Card sx={{ mb: 4, borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              {/* Account & AI Configuration Section */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'primary.main' }}>
                  <CloudQueue sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Account & AI Configuration
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6} md={4}>
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

                  <Grid item xs={12} sm={6} md={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>AI Agent</InputLabel>
                      <Select
                        value={selectedAgent}
                        label="AI Agent"
                        onChange={(e) => setSelectedAgent(e.target.value)}
                        disabled={agentsLoading}
                      >
                        {availableAgents.map((agent) => (
                          <MenuItem key={agent.id} value={agent.id.toString()}>
                            <Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {agent.name}
                                </Typography>
                                {agent.is_default && (
                                  <Chip label="Default" size="small" color="primary" />
                                )}
                              </Box>
                              <Typography variant="caption" color="text.secondary">
                                {agent.model} • {agent.description || 'No description'}
                              </Typography>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Analysis Parameters Section */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'info.main' }}>
                  <Timeline sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Analysis Parameters
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6} md={3}>
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

                  <Grid item xs={12} sm={6} md={3}>
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

                  <Grid item xs={12} sm={6} md={3}>
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

                  <Grid item xs={12} sm={6} md={3}>
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={loadAllCostData}
                      disabled={costLoading || !selectedAccount}
                      sx={{ 
                        height: '40px',
                        borderRadius: 2,
                        fontWeight: 600
                      }}
                    >
                      {costLoading ? <CircularProgress size={20} color="inherit" /> : 'Analyze'}
                    </Button>
                  </Grid>
                </Grid>
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Enhanced Analysis View Selection */}
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'secondary.main' }}>
                  <Assessment sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Analysis View
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <StyledAnalysisButton
                    startIcon={<Timeline />}
                    onClick={() => setActiveTab(0)}
                    active={activeTab === 0}
                  >
                    Trends Analysis
                  </StyledAnalysisButton>
                  <StyledAnalysisButton
                    startIcon={<PieChart />}
                    onClick={() => setActiveTab(1)}
                    active={activeTab === 1}
                  >
                    Cost Breakdown
                  </StyledAnalysisButton>
                  <StyledAnalysisButton
                    startIcon={<Analytics />}
                    onClick={() => setActiveTab(2)}
                    active={activeTab === 2}
                  >
                    Deep Analysis
                  </StyledAnalysisButton>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Important Notice */}
          <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
            <Typography variant="body2">
              <strong>Cost Explorer Integration:</strong> Data is fetched from AWS Cost Explorer API (us-east-1 only). 
              Ensure your AWS credentials have the necessary Cost Explorer permissions.
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
              Please select an AWS account to view detailed cost analytics.
            </Alert>
          ) : (
            <>
              {/* Loading Indicator */}
              {costLoading && <LinearProgress sx={{ mb: 3 }} />}

              {/* AI Insights Section */}
              {aiInsights && (
                <Card sx={{ mb: 3, border: 2, borderColor: 'primary.main' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Insights sx={{ color: 'primary.main' }} />
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          AI-Powered Cost Optimization Insights
                        </Typography>
                        <Chip 
                          label={availableAgents.find(a => a.id.toString() === selectedAgent)?.name || 'AI Agent'} 
                          size="small" 
                          color="primary" 
                          variant="outlined" 
                        />
                      </Box>
                      <Tooltip title="Close Insights">
                        <IconButton 
                          onClick={closeAIInsights}
                          size="small"
                          sx={{ color: 'text.secondary' }}
                        >
                          <Close />
                        </IconButton>
                      </Tooltip>
                    </Box>
<Box sx={{ 
  '& h1, & h2, & h3, & h4, & h5, & h6': { 
    fontWeight: 600, 
    marginTop: 2, 
    marginBottom: 1,
    color: 'text.primary'
  },
  '& p': { 
    marginBottom: 1,
    lineHeight: 1.6
  },
  '& ul, & ol': { 
    paddingLeft: 2,
    marginBottom: 1
  },
  '& li': { 
    marginBottom: 0.5
  },
  '& strong': { 
    fontWeight: 600,
    color: 'primary.main'
  },
  '& code': {
    backgroundColor: 'grey.100',
    padding: '2px 4px',
    borderRadius: 1,
    fontFamily: 'monospace',
    fontSize: '0.9em'
  }
}}>
  <ReactMarkdown>
    {aiInsights.recommendations || 'No specific recommendations available for this period.'}
  </ReactMarkdown>
</Box>
                  </CardContent>
                </Card>
              )}

              {/* Enhanced Summary Stats with Consistent Heights */}
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <MetricCard gradientColors={metricGradients[0]}>
                    <CardContent sx={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      justifyContent: 'space-between',
                      height: '100%',
                      minHeight: 140
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                            {formatCurrency(getTotalCost())}
                          </Typography>
                          <Typography variant="body2" sx={{ opacity: 0.9 }}>
                            Total Cost
                          </Typography>
                        </Box>
                        <AccountBalance sx={{ fontSize: 48, opacity: 0.8 }} />
                      </Box>
                      {costComparison && (
                        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
                          {costComparison.change_percentage > 0 ? (
                            <TrendingUp sx={{ fontSize: 16, mr: 1 }} />
                          ) : costComparison.change_percentage < 0 ? (
                            <TrendingDown sx={{ fontSize: 16, mr: 1 }} />
                          ) : (
                            <TrendingFlat sx={{ fontSize: 16, mr: 1 }} />
                          )}
                          <Typography variant="caption">
                            {formatPercentage(costComparison.change_percentage)} vs previous period
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                  </MetricCard>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <MetricCard gradientColors={metricGradients[1]}>
                    <CardContent sx={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      justifyContent: 'space-between',
                      height: '100%',
                      minHeight: 140
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                            {serviceBreakdown.length}
                          </Typography>
                          <Typography variant="body2" sx={{ opacity: 0.9 }}>
                            Active Services
                          </Typography>
                        </Box>
                        <Memory sx={{ fontSize: 48, opacity: 0.8 }} />
                      </Box>
                      <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
                        <CheckCircle sx={{ fontSize: 16, mr: 1 }} />
                        <Typography variant="caption">
                          Top: {serviceBreakdown[0]?.service_name || 'N/A'}
                        </Typography>
                      </Box>
                    </CardContent>
                  </MetricCard>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <MetricCard gradientColors={metricGradients[2]}>
                    <CardContent sx={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      justifyContent: 'space-between',
                      height: '100%',
                      minHeight: 140
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                            {recommendations.length}
                          </Typography>
                          <Typography variant="body2" sx={{ opacity: 0.9 }}>
                            Recommendations
                          </Typography>
                        </Box>
                        <Savings sx={{ fontSize: 48, opacity: 0.8 }} />
                      </Box>
                      <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
                        <Warning sx={{ fontSize: 16, mr: 1 }} />
                        <Typography variant="caption">
                          {recommendations.reduce((sum, rec) => sum + rec.estimated_monthly_savings, 0).toFixed(0)} USD potential savings
                        </Typography>
                      </Box>
                    </CardContent>
                  </MetricCard>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <MetricCard gradientColors={metricGradients[3]}>
                    <CardContent sx={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      justifyContent: 'space-between',
                      height: '100%',
                      minHeight: 140
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                            {costTrends.length}
                          </Typography>
                          <Typography variant="body2" sx={{ opacity: 0.9 }}>
                            Data Points
                          </Typography>
                        </Box>
                        <Timeline sx={{ fontSize: 48, opacity: 0.8 }} />
                      </Box>
                      <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
                        <Assessment sx={{ fontSize: 16, mr: 1 }} />
                        <Typography variant="caption">
                          {granularity.toLowerCase()} granularity
                        </Typography>
                      </Box>
                    </CardContent>
                  </MetricCard>
                </Grid>
              </Grid>

              {/* Tab Content */}
              {activeTab === 0 && (
                /* Trends Tab */
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Card sx={{ height: 600 }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                          Cost Trends Analysis - {getSelectedAccountName()}
                        </Typography>
                        <ResponsiveContainer width="100%" height={500}>
                          <ComposedChart data={costTrends}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="date" 
                              tickFormatter={(value) => new Date(value).toLocaleDateString()}
                            />
                            <YAxis 
                              yAxisId="cost"
                              tickFormatter={(value) => `$${value.toFixed(0)}`}
                            />
                            <RechartsTooltip 
                              formatter={(value, name) => [`$${value.toFixed(2)}`, 'Cost']}
                              labelFormatter={(date) => `Date: ${new Date(date).toLocaleDateString()}`}
                            />
                            <Legend />
                            <Area 
                              yAxisId="cost"
                              type="monotone" 
                              dataKey="amount" 
                              fill={chartColors.primary}
                              fillOpacity={0.3}
                              stroke={chartColors.primary}
                              strokeWidth={2}
                              name="Daily Cost"
                            />
                            <Line 
                              yAxisId="cost"
                              type="monotone" 
                              dataKey="amount" 
                              stroke={chartColors.secondary}
                              strokeWidth={3}
                              dot={{ r: 4 }}
                              name="Cost Trend"
                            />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              )}

              {activeTab === 1 && (
                /* Breakdown Tab */
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Card sx={{ height: 500 }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                          Service Cost Distribution
                        </Typography>
                        <ResponsiveContainer width="100%" height={350}>
                          <RechartsPieChart>
                            <Pie
                              data={serviceBreakdown.slice(0, 8)}
                              cx="50%"
                              cy="50%"
                              outerRadius={120}
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
                        <Box sx={{ mt: 2, maxHeight: 80, overflow: 'auto' }}>
                          {serviceBreakdown.slice(0, 5).map((item, index) => (
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

                  <Grid item xs={12} md={6}>
                    <Card sx={{ height: 500 }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                          Regional Cost Distribution
                        </Typography>
                        <ResponsiveContainer width="100%" height={350}>
                          <BarChart data={regionBreakdown.slice(0, 10)}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="region_name" 
                              angle={-45}
                              textAnchor="end"
                              height={80}
                            />
                            <YAxis tickFormatter={(value) => `$${value.toFixed(0)}`} />
                            <RechartsTooltip formatter={(value) => [`$${value.toFixed(2)}`, 'Cost']} />
                            <Bar dataKey="amount" fill={chartColors.info} />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                          Detailed Cost Breakdown
                        </Typography>
                        <TableContainer sx={{ maxHeight: 400 }}>
                          <Table stickyHeader>
                            <TableHead>
                              <TableRow>
                                <TableCell>Service/Resource</TableCell>
                                <TableCell align="right">Cost</TableCell>
                                <TableCell align="right">Percentage</TableCell>
                                <TableCell align="right">Change</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {serviceBreakdown.map((service, index) => (
                                <TableRow key={service.service_name}>
                                  <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                      <Box 
                                        sx={{ 
                                          width: 12, 
                                          height: 12, 
                                          bgcolor: pieColors[index % pieColors.length], 
                                          borderRadius: '50%',
                                          mr: 2 
                                        }} 
                                      />
                                      {service.service_name}
                                    </Box>
                                  </TableCell>
                                  <TableCell align="right" sx={{ fontWeight: 500 }}>
                                    {formatCurrency(service.amount)}
                                  </TableCell>
                                  <TableCell align="right">
                                    <Chip 
                                      label={`${service.percentage}%`} 
                                      size="small" 
                                      color="primary"
                                      variant="outlined"
                                    />
                                  </TableCell>
                                  <TableCell align="right">
                                    <Chip 
                                      label="N/A" 
                                      size="small" 
                                      variant="outlined"
                                    />
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              )}

              {activeTab === 2 && (
                /* Analysis Tab */
                <Grid container spacing={3}>
                  {/* Cost Comparison */}
                  {costComparison && (
                    <Grid item xs={12}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                            Period-over-Period Analysis
                          </Typography>
                          <Grid container spacing={3}>
                            <Grid item xs={12} md={4}>
                              <Box sx={{ textAlign: 'center', p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
                                <Typography variant="h6" color="text.secondary" gutterBottom>
                                  Previous Period
                                </Typography>
                                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                                  {formatCurrency(costComparison.previous_period.total_cost)}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {costComparison.previous_period.start_date} to {costComparison.previous_period.end_date}
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={12} md={4}>
                              <Box sx={{ textAlign: 'center', p: 3, bgcolor: 'primary.lighter', borderRadius: 2 }}>
                                <Typography variant="h6" color="text.secondary" gutterBottom>
                                  Current Period
                                </Typography>
                                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: 'primary.main' }}>
                                  {formatCurrency(costComparison.current_period.total_cost)}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {costComparison.current_period.start_date} to {costComparison.current_period.end_date}
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={12} md={4}>
                              <Box sx={{ 
                                textAlign: 'center', 
                                p: 3, 
                                bgcolor: costComparison.change_amount > 0 ? 'error.lighter' : 'success.lighter', 
                                borderRadius: 2 
                              }}>
                                <Typography variant="h6" color="text.secondary" gutterBottom>
                                  Change
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
                                  {costComparison.change_amount > 0 ? (
                                    <TrendingUp sx={{ color: 'error.main', fontSize: 32 }} />
                                  ) : costComparison.change_amount < 0 ? (
                                    <TrendingDown sx={{ color: 'success.main', fontSize: 32 }} />
                                  ) : (
                                    <TrendingFlat sx={{ color: 'info.main', fontSize: 32 }} />
                                  )}
                                  <Typography 
                                    variant="h4" 
                                    sx={{ 
                                      fontWeight: 700, 
                                      color: costComparison.change_amount > 0 ? 'error.main' : 
                                             costComparison.change_amount < 0 ? 'success.main' : 'info.main' 
                                    }}
                                  >
                                    {formatCurrency(Math.abs(costComparison.change_amount))}
                                  </Typography>
                                </Box>
                                <Typography 
                                  variant="h6" 
                                  sx={{ 
                                    color: costComparison.change_amount > 0 ? 'error.main' : 
                                           costComparison.change_amount < 0 ? 'success.main' : 'info.main',
                                    fontWeight: 600
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
                  )}

                  {/* Recommendations */}
                  {recommendations.length > 0 && (
                    <Grid item xs={12}>
                      <Accordion defaultExpanded>
                        <AccordionSummary 
                          expandIcon={<ExpandMore />}
                          sx={{ bgcolor: 'warning.lighter' }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Savings sx={{ color: 'warning.main' }} />
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              Cost Optimization Recommendations ({recommendations.length})
                            </Typography>
                            <Chip 
                              label={`$${recommendations.reduce((sum, rec) => sum + rec.estimated_monthly_savings, 0).toFixed(0)} potential monthly savings`}
                              color="warning"
                              size="small"
                            />
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                          <TableContainer component={Paper} elevation={0}>
                            <Table>
                              <TableHead>
                                <TableRow>
                                  <TableCell>Resource ID</TableCell>
                                  <TableCell>Type</TableCell>
                                  <TableCell>Current</TableCell>
                                  <TableCell>Recommended</TableCell>
                                  <TableCell align="right">Monthly Savings</TableCell>
                                  <TableCell>Confidence</TableCell>
                                  <TableCell>Actions</TableCell>
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
                                      <ButtonGroup size="small">
                                        <Tooltip title="View Details">
                                          <IconButton size="small">
                                            <Assessment />
                                          </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Apply Recommendation">
                                          <IconButton size="small" color="primary">
                                            <CheckCircle />
                                          </IconButton>
                                        </Tooltip>
                                      </ButtonGroup>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </AccordionDetails>
                      </Accordion>
                    </Grid>
                  )}

                  {/* Monthly Summary */}
                  {monthlySummary.length > 0 && (
                    <Grid item xs={12}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                            6-Month Cost Trend
                          </Typography>
                          <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={monthlySummary}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="month" />
                              <YAxis tickFormatter={(value) => `$${value.toFixed(0)}k`} />
                              <RechartsTooltip formatter={(value) => [`$${value.toFixed(2)}`, 'Monthly Cost']} />
                              <Area 
                                type="monotone" 
                                dataKey="total_cost" 
                                stroke={chartColors.primary} 
                                fill={chartColors.primary}
                                fillOpacity={0.6}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    </Grid>
                  )}
                </Grid>
              )}

              {/* No Data Message */}
              {!costLoading && selectedAccount && costTrends.length === 0 && (
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

          {/* Export Dialog */}
          <Dialog open={exportDialog} onClose={() => setExportDialog(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Export Cost Data</DialogTitle>
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
                  Export will include all cost data from the selected account and date range, 
                  grouped by {groupBy.toLowerCase().replace('_', ' ')}.
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
                {exportLoading ? 'Exporting...' : 'Export Data'}
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Fade>
    </Container>
  );
};

export default CostAnalyticsPage;