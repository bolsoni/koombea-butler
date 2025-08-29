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
  Slider,
  Switch,
  FormControlLabel,
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  SmartToy,
  Psychology,
  Settings,
  Star,
  StarBorder,
  Visibility,
  VisibilityOff,
  ContentCopy,
  CheckCircle,
  ErrorOutline,
  Warning,
  AutoAwesome,
  Terminal,
} from '@mui/icons-material';
import { authService } from '../services/authService';
import { useAuth } from '../App';

const AIAgentSettings = () => {
  const { user: currentUser } = useAuth();
  const [aiAgents, setAiAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [agentToDelete, setAgentToDelete] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    provider: 'anthropic',
    openai_api_key: '',
    anthropic_api_key: '',
    model: 'claude-3-5-sonnet-20241022',
    prompt_template: '',
    temperature: 0.7,
    max_tokens: 1000,
    is_active: true
  });
  
  const [dialogError, setDialogError] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  const availableModels = {
    openai: [
      { value: 'gpt-4', label: 'GPT-4 (Most Capable)' },
      { value: 'gpt-4-turbo', label: 'GPT-4 Turbo (Fast & Capable)' },
      { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (Fast & Cost-Effective)' },
    ],
    anthropic: [
      { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet (Best for Analysis)' },
      { value: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku (Fast & Efficient)' },
      { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus (Most Capable)' },
    ]
  };

  const defaultPrompts = {
    openai: `You are an AWS cost optimization expert. Analyze the provided AWS resources and deliver structured, quantified recommendations to reduce costs while maintaining performance and reliability.

ANALYSIS FOCUS AREAS:
1. RIGHTSIZING - Identify over-provisioned instances that can be downsized
2. RESERVED INSTANCES - Recommend Reserved Instance purchases for consistent workloads  
3. UNUSED RESOURCES - Find idle or underutilized resources that can be terminated
4. STORAGE OPTIMIZATION - Suggest more cost-effective storage classes and cleanup
5. NETWORK COSTS - Identify expensive data transfer patterns and optimization opportunities
6. SCHEDULING - Recommend start/stop schedules for non-production resources

OUTPUT FORMAT:
For each recommendation, provide:

RESOURCE: [Specific AWS resource affected]
CURRENT COST: [Estimated current monthly cost]
RECOMMENDATION: [Specific action to take]
ESTIMATED SAVINGS: [Expected monthly savings]
IMPLEMENTATION: [How to implement the change]
RISK LEVEL: [Low/Medium/High impact on operations]
PRIORITY: [High/Medium/Low based on savings potential]

IMPORTANT: Provide clear, quantified recommendations with specific dollar amounts and concrete action steps. Focus on measurable ROI and practical implementation.

AWS Resource Data: {resource_data}

Deliver actionable, prioritized recommendations with clear cost savings estimates and implementation steps.`,

    anthropic: `You are a seasoned AWS cost optimization consultant with deep expertise in cloud financial management. Analyze the provided AWS resource data and deliver comprehensive, strategic recommendations that balance cost reduction with operational excellence.

COMPREHENSIVE ANALYSIS APPROACH:

FOCUS AREAS FOR OPTIMIZATION:
1. RIGHTSIZING ANALYSIS - Examine usage patterns and identify over-provisioned instances
2. RESERVED INSTANCE STRATEGY - Evaluate long-term workload patterns for RI opportunities  
3. RESOURCE UTILIZATION REVIEW - Locate idle, underutilized, or forgotten resources
4. STORAGE ARCHITECTURE OPTIMIZATION - Recommend appropriate storage classes and lifecycle policies
5. NETWORK COST REDUCTION - Analyze data transfer patterns and suggest architectural improvements
6. OPERATIONAL SCHEDULING - Identify non-production workloads for automated start/stop schedules

RECOMMENDATION STRUCTURE:
Present each optimization opportunity with:

TARGET RESOURCE: [Specific AWS service or resource group]
FINANCIAL IMPACT: [Current monthly cost → Projected savings with percentages]
STRATEGIC RECOMMENDATION: [Detailed explanation of proposed optimization]
IMPLEMENTATION APPROACH: [Step-by-step implementation plan with timelines]
RISK ASSESSMENT: [Potential operational impacts and mitigation strategies]
BUSINESS JUSTIFICATION: [ROI analysis and long-term benefits]

ANALYSIS PRINCIPLES:
- Consider both immediate cost savings and long-term architectural improvements
- Balance cost optimization with performance, availability, and operational complexity
- Provide context for why each recommendation makes sense for the business
- Include implementation timeline and resource requirements
- Address potential risks and how to mitigate them

AWS Resource Data for Analysis: {resource_data}

Provide thoughtful, detailed recommendations that demonstrate deep understanding of AWS cost optimization while considering broader business context and operational impact.`
  };

  useEffect(() => {
    loadAIAgents();
  }, []);

  const loadAIAgents = async () => {
    try {
      setLoading(true);
      const agentsData = await authService.getAIAgents();
      setAiAgents(agentsData);
    } catch (err) {
      setError('Failed to load AI agents: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAgent = () => {
    setEditingAgent(null);
    setFormData({
      name: '',
      description: '',
      provider: 'anthropic',
      openai_api_key: '',
      anthropic_api_key: '',
      model: 'claude-3-5-sonnet-20241022',
      prompt_template: defaultPrompts.anthropic, 
      temperature: 0.7,
      max_tokens: 1000,
      is_active: true
    });
    setDialogError('');
    setDialogOpen(true);
  };

  const handleEditAgent = (agent) => {
    setEditingAgent(agent);
    setFormData({
      name: agent.name,
      description: agent.description || '',
      provider: agent.provider || 'openai',
      openai_api_key: '',
      anthropic_api_key: '',
      model: agent.model,
      prompt_template: agent.prompt_template,
      temperature: agent.temperature,
      max_tokens: agent.max_tokens,
      is_active: agent.is_active
    });
    setDialogError('');
    setDialogOpen(true);
  };

  const handleDeleteAgent = (agent) => {
    setAgentToDelete(agent);
    setDeleteDialogOpen(true);
  };

  const handleProviderChange = (provider) => {
    const defaultModels = {
      openai: 'gpt-4',
      anthropic: 'claude-3-5-sonnet-20241022'
    };
    
    setFormData(prev => ({
      ...prev,
      provider,
      model: defaultModels[provider],
      prompt_template: defaultPrompts[provider]
    }));
  };

  const handleSubmit = async () => {
    setFormLoading(true);
    setDialogError('');

    try {
      if (!formData.name || !formData.prompt_template) {
        throw new Error('Name and Prompt Template are required');
      }

      if (!editingAgent) {
        if (formData.provider === 'openai' && !formData.openai_api_key) {
          throw new Error('OpenAI API Key is required for OpenAI provider');
        }
        if (formData.provider === 'anthropic' && !formData.anthropic_api_key) {
          throw new Error('Anthropic API Key is required for Anthropic provider');
        }
      }

      if (editingAgent) {
        const updateData = {
          name: formData.name,
          description: formData.description,
          provider: formData.provider,
          model: formData.model,
          prompt_template: formData.prompt_template,
          temperature: formData.temperature,
          max_tokens: formData.max_tokens,
          is_active: formData.is_active
        };
        
        if (formData.openai_api_key) {
          updateData.openai_api_key = formData.openai_api_key;
        }
        if (formData.anthropic_api_key) {
          updateData.anthropic_api_key = formData.anthropic_api_key;
        }

        await authService.updateAIAgent(editingAgent.id, updateData);
        setSuccess('AI agent updated successfully');
      } else {
        await authService.createAIAgent(formData);
        setSuccess('AI agent created and validated successfully (minimal token usage)');
      }

      setDialogOpen(false);
      loadAIAgents();
    } catch (err) {
      setDialogError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await authService.deleteAIAgent(agentToDelete.id);
      setSuccess('AI agent deleted successfully');
      setDeleteDialogOpen(false);
      setAgentToDelete(null);
      loadAIAgents();
    } catch (err) {
      setError('Failed to delete AI agent: ' + err.message);
    }
  };

  const handleSetDefault = async (agentId) => {
    try {
      clearMessages();
      
      await authService.setDefaultAIAgent(agentId);
      
      setSuccess('Default AI agent updated successfully');
      
      await loadAIAgents();
    } catch (err) {
      setError('Failed to set default AI agent: ' + err.message);
      console.error('Set default error:', err);
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

  const getProviderStats = () => {
    const openaiCount = aiAgents.filter(a => a.provider === 'openai').length;
    const anthropicCount = aiAgents.filter(a => a.provider === 'anthropic').length;
    return { openaiCount, anthropicCount };
  };

  const getProviderIcon = (provider) => {
    return provider === 'anthropic' ? <Psychology /> : <Terminal />;
  };

  const getProviderColor = (provider) => {
    return provider === 'anthropic' ? '#FF6B35' : '#10A37F';
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4 }}>
          <LinearProgress />
          <Typography sx={{ mt: 2, textAlign: 'center' }}>
            Loading AI agents...
          </Typography>
        </Box>
      </Container>
    );
  }

  const { openaiCount, anthropicCount } = getProviderStats();

  return (
    <Container maxWidth="lg">
      <Fade in timeout={600}>
        <Box>
          <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                AI Agent Settings
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Configure OpenAI and Anthropic agents for AWS cost optimization analysis
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleCreateAgent}
              sx={{ 
                borderRadius: 2,
                px: 3,
                py: 1.5,
                fontWeight: 600
              }}
            >
              Add AI Agent
            </Button>
          </Box>

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

          {aiAgents.length === 0 && !error ? (
            <Card sx={{ borderRadius: 3, textAlign: 'center', py: 8 }}>
              <CardContent>
                <SmartToy sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" sx={{ mb: 1 }}>
                  No AI Agents Configured
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Create your first AI agent to enable intelligent AWS cost optimization analysis. 
                  Configure OpenAI or Anthropic models with custom prompts for automated insights and recommendations.
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={handleCreateAgent}
                  size="large"
                >
                  Add Your First AI Agent
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                            {aiAgents.length}
                          </Typography>
                          <Typography variant="body2" sx={{ opacity: 0.9 }}>
                            Total Agents
                          </Typography>
                        </Box>
                        <SmartToy sx={{ fontSize: 48, opacity: 0.8 }} />
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
                            {aiAgents.filter(a => a.is_active).length}
                          </Typography>
                          <Typography variant="body2" sx={{ opacity: 0.9 }}>
                            Active
                          </Typography>
                        </Box>
                        <AutoAwesome sx={{ fontSize: 48, opacity: 0.8 }} />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ background: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)', color: 'white' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                            {anthropicCount}
                          </Typography>
                          <Typography variant="body2" sx={{ opacity: 0.9 }}>
                            Anthropic
                          </Typography>
                        </Box>
                        <Psychology sx={{ fontSize: 48, opacity: 0.8 }} />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ background: 'linear-gradient(135deg, #10A37F 0%, #1A7F64 100%)', color: 'white' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                            {openaiCount}
                          </Typography>
                          <Typography variant="body2" sx={{ opacity: 0.9 }}>
                            OpenAI
                          </Typography>
                        </Box>
                        <Terminal sx={{ fontSize: 48, opacity: 0.8 }} />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Card sx={{ borderRadius: 3 }}>
                <CardContent sx={{ p: 0 }}>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ bgcolor: 'grey.50' }}>
                          <TableCell sx={{ fontWeight: 600, py: 2 }}>Configuration</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Provider</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Model</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Parameters</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Created</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {aiAgents.map((agent) => (
                          <TableRow 
                            key={agent.id}
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
                                    bgcolor: agent.is_default ? 'warning.main' : getProviderColor(agent.provider || 'openai'),
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    mr: 2
                                  }}
                                >
                                  {getProviderIcon(agent.provider || 'openai')}
                                </Box>
                                <Box>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                      {agent.name}
                                    </Typography>
                                    {agent.is_default && <Star sx={{ fontSize: 16, color: 'warning.main' }} />}
                                  </Box>
                                  <Typography variant="caption" color="text.secondary">
                                    {agent.description || 'No description'}
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={agent.provider || 'openai'}
                                sx={{ 
                                  backgroundColor: getProviderColor(agent.provider || 'openai'),
                                  color: 'white',
                                  textTransform: 'capitalize'
                                }}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={agent.model}
                                color="primary"
                                size="small"
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                Temp: {agent.temperature} | Tokens: {agent.max_tokens}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={agent.is_active ? 'Active' : 'Inactive'}
                                color={agent.is_active ? 'success' : 'default'}
                                size="small"
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary">
                                {new Date(agent.created_at).toLocaleDateString()}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <Tooltip title="Edit Agent">
                                  <IconButton 
                                    onClick={() => handleEditAgent(agent)}
                                    size="small"
                                    sx={{ color: 'primary.main' }}
                                  >
                                    <Edit />
                                  </IconButton>
                                </Tooltip>
                                {!agent.is_default && (
                                  <Tooltip title="Set as Default">
                                    <IconButton 
                                      onClick={() => {
                                        handleSetDefault(agent.id);
                                      }}
                                      size="small"
                                      sx={{ 
                                        color: 'warning.main',
                                        '&:hover': {
                                          backgroundColor: 'warning.lighter',
                                          transform: 'scale(1.1)'
                                        }
                                      }}
                                    >
                                      <StarBorder />
                                    </IconButton>
                                  </Tooltip>
                                )}
                                {agent.is_default && (
                                  <Tooltip title="This is the default agent">
                                    <IconButton 
                                      size="small"
                                      disabled
                                      sx={{ color: 'warning.main' }}
                                    >
                                      <Star />
                                    </IconButton>
                                  </Tooltip>
                                )}
                                <Tooltip title="Delete Agent">
                                  <IconButton 
                                    onClick={() => handleDeleteAgent(agent)}
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
            </>
          )}

          <Dialog 
            open={dialogOpen} 
            onClose={() => setDialogOpen(false)}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle sx={{ pb: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {editingAgent ? 'Edit AI Agent' : 'Create New AI Agent'}
              </Typography>
            </DialogTitle>
            
            <DialogContent sx={{ pt: 2 }}>
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
                    label="Configuration Name"
                    value={formData.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                    required
                    placeholder="e.g., Production Cost Optimizer"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6} sx={{ mt: 1 }}>
                  <FormControl fullWidth>
                    <InputLabel>AI Provider</InputLabel>
                    <Select
                      value={formData.provider}
                      label="AI Provider"
                      onChange={(e) => handleProviderChange(e.target.value)}
                    >
                      <MenuItem value="anthropic">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Psychology sx={{ color: '#FF6B35' }} />
                          Anthropic Claude (Recommended)
                        </Box>
                      </MenuItem>
                      <MenuItem value="openai">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Terminal sx={{ color: '#10A37F' }} />
                          OpenAI GPT
                        </Box>
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    value={formData.description}
                    onChange={(e) => handleFormChange('description', e.target.value)}
                    placeholder="Brief description of this AI agent configuration"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>AI Model</InputLabel>
                    <Select
                      value={formData.model}
                      label="AI Model"
                      onChange={(e) => handleFormChange('model', e.target.value)}
                    >
                      {availableModels[formData.provider].map((model) => (
                        <MenuItem key={model.value} value={model.value}>
                          {model.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={`${formData.provider === 'anthropic' ? 'Anthropic' : 'OpenAI'} API Key`}
                    type={showApiKey ? 'text' : 'password'}
                    value={formData.provider === 'anthropic' ? formData.anthropic_api_key : formData.openai_api_key}
                    onChange={(e) => handleFormChange(
                      formData.provider === 'anthropic' ? 'anthropic_api_key' : 'openai_api_key', 
                      e.target.value
                    )}
                    required={!editingAgent}
                    placeholder={editingAgent ? 'Leave empty to keep current key' : 
                      formData.provider === 'anthropic' ? 'sk-ant-api...' : 'sk-...'}
                    helperText={!editingAgent ? 'Your API key will be automatically validated when creating the agent (minimal token usage)' : ''}
                    InputProps={{
                      endAdornment: (
                        <IconButton
                          onClick={() => setShowApiKey(!showApiKey)}
                          edge="end"
                          size="small"
                        >
                          {showApiKey ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      )
                    }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Prompt Template"
                    value={formData.prompt_template}
                    onChange={(e) => handleFormChange('prompt_template', e.target.value)}
                    required
                    multiline
                    rows={8}
                    placeholder="Enter your cost optimization prompt template..."
                  />
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Button
                      size="small"
                      onClick={() => handleFormChange('prompt_template', defaultPrompts[formData.provider])}
                      disabled={formData.prompt_template === defaultPrompts[formData.provider]}
                    >
                      Use Default Template
                    </Button>
                    <Button
                      size="small"
                      onClick={() => copyToClipboard(formData.prompt_template)}
                    >
                      <ContentCopy sx={{ fontSize: 16, mr: 1 }} />
                      Copy
                    </Button>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography gutterBottom>
                    Temperature: {formData.temperature}
                  </Typography>
                  <Slider
                    value={formData.temperature}
                    onChange={(e, value) => handleFormChange('temperature', value)}
                    min={0}
                    max={2}
                    step={0.1}
                    marks={[
                      { value: 0, label: 'Focused' },
                      { value: 1, label: 'Balanced' },
                      { value: 2, label: 'Creative' }
                    ]}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Max Tokens"
                    type="number"
                    value={formData.max_tokens}
                    onChange={(e) => handleFormChange('max_tokens', parseInt(e.target.value))}
                    inputProps={{ min: 100, max: 4000 }}
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
                    label="Active Configuration"
                  />
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
                disabled={formLoading || !formData.name || !formData.prompt_template}
                sx={{ minWidth: 100 }}
              >
                {formLoading ? 'Creating & Validating...' : (editingAgent ? 'Update' : 'Create & Validate')}
              </Button>
            </DialogActions>
          </Dialog>

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
                  Are you sure you want to delete the AI agent <strong>{agentToDelete?.name}</strong>?
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                This action cannot be undone. All configurations and settings for this agent will be permanently removed.
              </Typography>
              {agentToDelete?.is_default && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  This is the default agent. Another agent will automatically become the new default.
                </Alert>
              )}
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
                Delete Agent
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Fade>
    </Container>
  );
};

export default AIAgentSettings;