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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Pagination,
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
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handlePageChange = (event, page) => {
    setCurrentPage(page);
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      case 'processing':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle />;
      case 'failed':
        return <Error />;
      case 'processing':
        return <Speed />;
      default:
        return <Warning />;
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
    return new Date(dateString).toLocaleString();
  };

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const getSelectedAccountName = () => {
    const account = awsAccounts.find(acc => acc.id.toString() === selectedAccount);
    return account ? account.name : 'All Accounts';
  };

  return (
    <Container maxWidth="xl">
      <Fade in timeout={600}>
        <Box>
          {/* Header */}
          <Box sx={{ mb: 4 }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={8}>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                  AI Cost Analysis Reports
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Historical AI-powered cost optimization insights and recommendations
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
                  <Tooltip title="Refresh Reports">
                    <IconButton 
                      onClick={loadReports} 
                      disabled={loading}
                      sx={{ 
                        bgcolor: 'primary.main', 
                        color: 'white', 
                        '&:hover': { bgcolor: 'primary.dark' },
                        '&:disabled': { bgcolor: 'grey.300', color: 'grey.500' }
                      }}
                    >
                      <Refresh />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Grid>
            </Grid>
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
                        {totalCount}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Total Reports
                      </Typography>
                    </Box>
                    <Assessment sx={{ fontSize: 48, opacity: 0.8 }} />
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
                        {formatCurrency(reports.reduce((sum, r) => sum + r.estimated_savings, 0))}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Total Potential Savings
                      </Typography>
                    </Box>
                    <TrendingUp sx={{ fontSize: 48, opacity: 0.8 }} />
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
                        {reports.filter(r => r.report_status === 'completed').length}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Successful Reports
                      </Typography>
                    </Box>
                    <CheckCircle sx={{ fontSize: 48, opacity: 0.8 }} />
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
                        {reports.reduce((sum, r) => sum + r.tokens_used, 0).toLocaleString()}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.7 }}>
                        Total Tokens Used
                      </Typography>
                    </Box>
                    <Memory sx={{ fontSize: 48, opacity: 0.6 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Filters */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Filter by AWS Account</InputLabel>
                <Select
                  value={selectedAccount}
                  label="Filter by AWS Account"
                  onChange={(e) => handleAccountFilterChange(e.target.value)}
                  startAdornment={<FilterList sx={{ mr: 1, color: 'action.active' }} />}
                >
                  <MenuItem value="">
                    <em>All Accounts</em>
                  </MenuItem>
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

            <Grid item xs={12} sm={6} md={8}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                <Typography variant="body2" color="text.secondary">
                  Showing {reports.length} of {totalCount} reports
                  {selectedAccount && ` for ${getSelectedAccountName()}`}
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {/* Loading Indicator */}
          {loading && <LinearProgress sx={{ mb: 3 }} />}

          {/* Reports Table */}
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 0 }}>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell sx={{ fontWeight: 600, py: 2 }}>Report Details</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>AWS Account</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>AI Agent</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Analysis Period</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Metrics</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Generated</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reports.map((report) => (
                      <TableRow 
                        key={report.id}
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
                                bgcolor: 'primary.main',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mr: 2
                              }}
                            >
                              <SmartToy />
                            </Box>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                Report #{report.id}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                By {report.owner_name}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <CloudQueue sx={{ mr: 1, color: 'action.active' }} />
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {report.aws_account_name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                ID: {report.aws_account_id}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Psychology sx={{ mr: 1, color: 'action.active' }} />
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {report.ai_agent_name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {report.tokens_used.toLocaleString()} tokens
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <CalendarToday sx={{ mr: 1, color: 'action.active' }} />
                            <Box>
                              <Typography variant="body2">
                                {report.analysis_period_start}
                              </Typography>
                              <Typography variant="body2">
                                to {report.analysis_period_end}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                              {formatCurrency(report.estimated_savings)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatCurrency(report.total_cost_analyzed)} analyzed
                            </Typography>
                            <Box sx={{ mt: 1 }}>
                              <Chip 
                                label={`${report.services_analyzed} services`} 
                                size="small" 
                                variant="outlined"
                                sx={{ mr: 0.5 }}
                              />
                              <Chip 
                                label={`${report.rightsizing_opportunities} opportunities`} 
                                size="small" 
                                variant="outlined"
                              />
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={getStatusIcon(report.report_status)}
                            label={report.report_status.charAt(0).toUpperCase() + report.report_status.slice(1)}
                            color={getStatusColor(report.report_status)}
                            size="small"
                            variant="outlined"
                          />
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                            {report.generation_time_seconds}s
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {formatDateTime(report.created_at)}
                          </Typography>
                        </TableCell>
<TableCell>
  <Box sx={{ display: 'flex', gap: 1 }}>
    <Tooltip title="View Report">
      <IconButton 
        onClick={() => handleViewReport(report)}
        size="small"
        sx={{ color: 'primary.main' }}
      >
        <Visibility />
      </IconButton>
    </Tooltip>
    <Tooltip title="Export Report">
      <IconButton 
        onClick={() => handleExportReport(report)}
        size="small"
        sx={{ color: 'success.main' }}
      >
        <Download />
      </IconButton>
    </Tooltip>
  </Box>
</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Pagination */}
              {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <Pagination
                    count={totalPages}
                    page={currentPage}
                    onChange={handlePageChange}
                    color="primary"
                    size="large"
                    showFirstButton
                    showLastButton
                  />
                </Box>
              )}

              {/* Empty State */}
              {!loading && reports.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <Assessment sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    No Reports Found
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedAccount 
                      ? `No AI analysis reports found for ${getSelectedAccountName()}`
                      : 'No AI analysis reports have been generated yet'
                    }
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Report Details Dialog */}
          <Dialog 
            open={reportDialog} 
            onClose={() => setReportDialog(false)}
            maxWidth="lg"
            fullWidth
          >
            <DialogTitle sx={{ pb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <SmartToy sx={{ color: 'primary.main' }} />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    AI Cost Analysis Report #{selectedReport?.id}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Generated on {selectedReport && formatDateTime(selectedReport.created_at)}
                  </Typography>
                </Box>
              </Box>
            </DialogTitle>
            
            <DialogContent sx={{ pt: 2 }}>
              {selectedReport && (
                <Box>
                  {/* Report Metadata */}
                  <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Card sx={{ p: 2, bgcolor: 'primary.lighter' }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          AWS Account
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {selectedReport.aws_account_name}
                        </Typography>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Card sx={{ p: 2, bgcolor: 'success.lighter' }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Potential Savings
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: 'success.main' }}>
                          {formatCurrency(selectedReport.estimated_savings)}
                        </Typography>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Card sx={{ p: 2, bgcolor: 'info.lighter' }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Confidence Score
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: 'info.main' }}>
                          {(selectedReport.confidence_score * 100).toFixed(0)}%
                        </Typography>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Card sx={{ p: 2, bgcolor: 'warning.lighter' }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Tokens Used
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: 'warning.main' }}>
                          {selectedReport.tokens_used.toLocaleString()}
                        </Typography>
                      </Card>
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 3 }} />

                  {/* Analysis Details */}
                  <Accordion defaultExpanded>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        AI Recommendations
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
  },
  '& blockquote': {
    borderLeft: '4px solid',
    borderColor: 'primary.main',
    paddingLeft: 2,
    marginLeft: 0,
    marginRight: 0,
    fontStyle: 'italic',
    color: 'text.secondary'
  }
}}>
  <ReactMarkdown>
    {selectedReport.recommendations}
  </ReactMarkdown>
</Box>
                    </AccordionDetails>
                  </Accordion>

                  {/* Additional Metadata */}
                  <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
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
                          Services Analyzed
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {selectedReport.services_analyzed}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={4}>
                        <Typography variant="body2" color="text.secondary">
                          Rightsizing Opportunities
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {selectedReport.rightsizing_opportunities}
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
                          Generated By
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {selectedReport.owner_name}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                </Box>
              )}
            </DialogContent>
            
            <DialogActions sx={{ p: 3, pt: 2 }}>
              <Button onClick={() => setReportDialog(false)}>
                Close
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Fade>

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