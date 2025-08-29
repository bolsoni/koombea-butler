// frontend/src/pages/AIReportsPage.js
import React, { useState, useEffect } from 'react';
import {
  Container,
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
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  CircularProgress,
  Stack,
  Paper,
  Badge,
  Avatar,
} from '@mui/material';
import {
  Assessment,
  SmartToy,
  Person,
  CloudQueue,
  Timeline,
  AttachMoney,
  Speed,
  CheckCircle,
  Error,
  Warning,
  Visibility,
  Refresh,
  FilterList,
  ExpandMore,
  CalendarToday,
  TrendingUp,
  Psychology,
  Memory,
  Download,
  PictureAsPdf,
  Close,
  Schedule,
  Security,
  Insights,
  PlayArrow,
  TrendingDown,
} from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import { authService } from '../services/authService';
import { useAuth } from '../App';

const AIReportsPage = () => {
  const theme = useTheme();
  const { user: currentUser } = useAuth();
  
  // State management
  const [reports, setReports] = useState([]);
  const [awsAccounts, setAwsAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Pagination and filtering
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedAccount, setSelectedAccount] = useState('');
  const pageSize = 20;
  
  // Dialog states
  const [reportDialog, setReportDialog] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  
  const [exportDialog, setExportDialog] = useState(false);
  const [exportFormat, setExportFormat] = useState('pdf');
  const [exportLoading, setExportLoading] = useState(false);
  const [exportingReport, setExportingReport] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadReports();
  }, [currentPage, selectedAccount]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const accounts = await authService.getAWSAccounts();
      setAwsAccounts(accounts.filter(acc => acc.is_active));
    } catch (err) {
      setError('Failed to load AWS accounts: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadReports = async () => {
    try {
      setLoading(true);
      setError('');
      
      const reportsData = await authService.getAIReports(
        currentPage, 
        pageSize, 
        selectedAccount || null
      );
      
      setReports(reportsData.reports || []);
      setTotalPages(reportsData.total_pages || 1);
      setTotalCount(reportsData.total_count || 0);
    } catch (err) {
      setError('Failed to load reports: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAccountFilterChange = (accountId) => {
    setSelectedAccount(accountId);
    setCurrentPage(1);
  };

  const handleViewReport = (report) => {
    setSelectedReport(report);
    setReportDialog(true);
  };

  const handleExportReport = (report) => {
    setExportingReport(report);
    setExportDialog(true);
  };

  const handleExportConfirm = async () => {
    try {
      setExportLoading(true);
      
      await authService.exportAIReport(exportingReport.id, exportFormat);
      
      setExportDialog(false);
      setSuccess('Report exported successfully!');
    } catch (err) {
      setError('Failed to export report: ' + err.message);
    } finally {
      setExportLoading(false);
    }
  };

  // Helper functions
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'failed': return 'error';
      case 'processing': return 'warning';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle />;
      case 'failed': return <Error />;
      case 'processing': return <Speed />;
      default: return <Warning />;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  // Extract key insights from recommendations
  const extractKeyInsights = (recommendations) => {
    if (!recommendations) return [];
    
    const insights = [];
    const text = recommendations.toLowerCase();
    
    // Look for savings mentions
    const savingsMatch = text.match(/\$[\d,]+/g);
    if (savingsMatch) {
      insights.push({
        type: 'savings',
        value: savingsMatch[0],
        label: 'Potential Monthly Savings'
      });
    }
    
    // Look for instance mentions
    const instanceMatch = text.match(/(\d+)\s+(instance|resource|service)/g);
    if (instanceMatch) {
      insights.push({
        type: 'resources',
        value: instanceMatch[0].split(' ')[0],
        label: 'Resources Identified'
      });
    }
    
    return insights.slice(0, 3);
  };

  const ReportCard = ({ report }) => {
    const insights = extractKeyInsights(report.recommendations);
    
    return (
      <Card 
        sx={{ 
          mb: 3, 
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          transition: 'all 0.3s ease',
          '&:hover': {
            borderColor: 'primary.main',
            boxShadow: theme.shadows[8],
            transform: 'translateY(-2px)'
          }
        }}
      >
        <CardContent sx={{ p: 3 }}>
          {/* Header Row */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 3 }}>
            <Avatar
              sx={{
                width: 50,
                height: 50,
                bgcolor: 'primary.main',
                mr: 2,
                fontSize: '1.2rem'
              }}
            >
              <Psychology />
            </Avatar>
            
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mr: 2 }}>
                  {report.aws_account_name || `Account ${report.aws_account_id}`}
                </Typography>
                <Chip
                  icon={getStatusIcon(report.report_status)}
                  label={report.report_status}
                  color={getStatusColor(report.report_status)}
                  size="small"
                  variant="outlined"
                />
              </Box>
              
              <Typography variant="body2" color="text.secondary">
                Generated by {report.owner_name} • {formatDateTime(report.created_at)}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="View Details">
                <IconButton
                  onClick={() => handleViewReport(report)}
                  sx={{ color: 'primary.main' }}
                >
                  <Visibility />
                </IconButton>
              </Tooltip>
              <Tooltip title="Export Report">
                <IconButton
                  onClick={() => handleExportReport(report)}
                  sx={{ color: 'success.main' }}
                >
                  <Download />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Key Metrics Row */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.50' }}>
                <AttachMoney sx={{ color: 'success.main', fontSize: 24, mb: 1 }} />
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'success.main' }}>
                  {formatCurrency(report.estimated_savings)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Potential Savings
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'info.50' }}>
                <Assessment sx={{ color: 'info.main', fontSize: 24, mb: 1 }} />
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'info.main' }}>
                  {Math.round(report.confidence_score * 100)}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Confidence Score
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.50' }}>
                <CloudQueue sx={{ color: 'warning.main', fontSize: 24, mb: 1 }} />
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'warning.main' }}>
                  {report.services_analyzed}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Services Analyzed
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'secondary.50' }}>
                <Timeline sx={{ color: 'secondary.main', fontSize: 24, mb: 1 }} />
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'secondary.main' }}>
                  {report.rightsizing_opportunities}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Opportunities
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* Quick Insights */}
          {insights.length > 0 && (
            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Key Insights
              </Typography>
              <Stack direction="row" spacing={2} flexWrap="wrap">
                {insights.map((insight, index) => (
                  <Chip
                    key={index}
                    label={`${insight.value} ${insight.label}`}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Stack>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          AI Cost Reports
        </Typography>
        <Typography variant="body1" color="text.secondary">
          AI-powered cost optimization insights and recommendations
        </Typography>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" onClose={clearMessages} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" onClose={clearMessages} sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      {/* Controls */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Filter by AWS Account</InputLabel>
            <Select
              value={selectedAccount}
              label="Filter by AWS Account"
              onChange={(e) => handleAccountFilterChange(e.target.value)}
            >
              <MenuItem value="">All Accounts</MenuItem>
              {awsAccounts.map((account) => (
                <MenuItem key={account.id} value={account.id}>
                  {account.name} ({account.aws_account_id})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              startIcon={<Refresh />}
              onClick={loadReports}
              disabled={loading}
              variant="outlined"
            >
              Refresh
            </Button>
            <Typography variant="body2" color="text.secondary">
              {reports.length} of {totalCount} reports
            </Typography>
          </Box>
        </Grid>
      </Grid>

      {/* Loading */}
      {loading && <LinearProgress sx={{ mb: 3 }} />}

      {/* Reports List */}
      <Fade in={!loading}>
        <Box>
          {reports.length > 0 ? (
            reports.map((report) => (
              <ReportCard key={report.id} report={report} />
            ))
          ) : (
            <Paper sx={{ p: 8, textAlign: 'center' }}>
              <Assessment sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" sx={{ mb: 1 }}>
                No Reports Found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedAccount 
                  ? 'No reports found for the selected account'
                  : 'No AI reports have been generated yet'
                }
              </Typography>
            </Paper>
          )}
        </Box>
      </Fade>

      {/* Report Detail Dialog */}
      <Dialog
        open={reportDialog}
        onClose={() => setReportDialog(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3, maxHeight: '90vh' }
        }}
      >
        {selectedReport && (
          <>
            <DialogTitle sx={{ pb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    AI Cost Analysis Report
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedReport.aws_account_name} • {formatDateTime(selectedReport.created_at)}
                  </Typography>
                </Box>
                <IconButton onClick={() => setReportDialog(false)}>
                  <Close />
                </IconButton>
              </Box>
            </DialogTitle>

            <DialogContent>
              {/* Executive Summary */}
              <Paper sx={{ p: 3, mb: 3, bgcolor: 'primary.50' }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Executive Summary
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                        {formatCurrency(selectedReport.estimated_savings)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Monthly Savings Potential
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main' }}>
                        {Math.round(selectedReport.confidence_score * 100)}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Confidence Level
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
                        {selectedReport.services_analyzed}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Services Reviewed
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: 'secondary.main' }}>
                        {selectedReport.rightsizing_opportunities}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Optimization Opportunities
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>

              {/* AI Recommendations */}
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    AI-Generated Recommendations
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ 
                    bgcolor: 'grey.50', 
                    p: 3, 
                    borderRadius: 2,
                    '& h1, & h2, & h3, & h4, & h5, & h6': { 
                      fontWeight: 600, 
                      marginTop: 2, 
                      marginBottom: 1,
                      color: 'primary.main',
                      fontSize: { h1: '1.5rem', h2: '1.3rem', h3: '1.1rem', h4: '1rem', h5: '0.9rem', h6: '0.8rem' }
                    },
                    '& p': { 
                      marginBottom: 1.5,
                      lineHeight: 1.6,
                      fontSize: '0.9rem'
                    },
                    '& ul, & ol': { 
                      paddingLeft: 3,
                      marginBottom: 1.5
                    },
                    '& li': { 
                      marginBottom: 0.8,
                      fontSize: '0.9rem'
                    },
                    '& strong': { 
                      fontWeight: 600,
                      color: 'primary.main'
                    },
                    '& code': {
                      backgroundColor: 'primary.50',
                      padding: '2px 6px',
                      borderRadius: 1,
                      fontFamily: 'monospace',
                      fontSize: '0.85em',
                      border: '1px solid',
                      borderColor: 'primary.200'
                    }
                  }}>
                    <ReactMarkdown>
                      {selectedReport.recommendations}
                    </ReactMarkdown>
                  </Box>
                </AccordionDetails>
              </Accordion>

              {/* Report Metadata */}
              <Paper sx={{ mt: 3, p: 2, bgcolor: 'grey.50' }}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                  Report Details
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={4}>
                    <Typography variant="body2" color="text.secondary">
                      Analysis Period
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {selectedReport.analysis_period_start} to {selectedReport.analysis_period_end}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <Typography variant="body2" color="text.secondary">
                      Total Cost Analyzed
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {formatCurrency(selectedReport.total_cost_analyzed)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <Typography variant="body2" color="text.secondary">
                      Generation Time
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {selectedReport.generation_time_seconds}s
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <Typography variant="body2" color="text.secondary">
                      AI Agent
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {selectedReport.ai_agent_name || 'Default Agent'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <Typography variant="body2" color="text.secondary">
                      Tokens Used
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {selectedReport.tokens_used?.toLocaleString() || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <Typography variant="body2" color="text.secondary">
                      Generated By
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {selectedReport.owner_name}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </DialogContent>
            
            <DialogActions sx={{ p: 3, pt: 2 }}>
              <Button 
                onClick={() => handleExportReport(selectedReport)}
                startIcon={<Download />}
                variant="contained"
                sx={{ mr: 2 }}
              >
                Export Report
              </Button>
              <Button onClick={() => setReportDialog(false)}>
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={exportDialog} onClose={() => setExportDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Export Report</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Export Format</InputLabel>
              <Select
                value={exportFormat}
                label="Export Format"
                onChange={(e) => setExportFormat(e.target.value)}
              >
                <MenuItem value="pdf">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PictureAsPdf />
                    PDF Report
                  </Box>
                </MenuItem>
                <MenuItem value="json">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Assessment />
                    JSON Data
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>

            <Alert severity="info" sx={{ mb: 2 }}>
              Export will include all report data, recommendations, and metrics in the selected format.
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleExportConfirm} 
            variant="contained"
            disabled={exportLoading}
            startIcon={exportLoading ? <CircularProgress size={16} /> : <Download />}
          >
            {exportLoading ? 'Exporting...' : 'Export Report'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AIReportsPage;
