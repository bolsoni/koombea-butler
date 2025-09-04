// frontend/src/pages/DiagramPage.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Chip,
  Stack,
  Divider,
} from '@mui/material';
import {
  Code as CodeIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';

const DiagramPage = () => {
  const [diagramInput, setDiagramInput] = useState('');
  const [diagramType, setDiagramType] = useState('architecture');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [svgContent, setSvgContent] = useState('');

  // Default AWS architecture template based on the provided image
  const defaultArchitectureTemplate = `graph TD
    A[AWS Cloud] --> B[Region us-east-1]
    B --> C[VPC kunstrux-staging]
    
    C --> D[Availability Zone us-east-1a]
    C --> E[Availability Zone us-east-1b]
    C --> F[Public Subnet]
    
    D --> G[Private Subnet<br/>kunstrux-staging-private-us-east-1a<br/>10.20.0.0/20]
    E --> H[Private Subnet<br/>kunstrux-staging-private-us-east-1b<br/>10.20.16.0/20]
    
    G --> I[ECS workers]
    G --> J[Auto Scaling]
    H --> K[Auto Scaling]
    H --> L[ECS services]
    
    G --> M[EC2<br/>workers-node]
    H --> N[EC2<br/>service-node]
    
    C --> O[ECR<br/>kunstrux-staging]
    C --> P[RDS<br/>kunstrux-staging]
    C --> Q[Redis]
    C --> R[Amazon<br/>CloudWatch]
    
    F --> S[ELB<br/>kunstrux-staging-public]
    F --> T[Public Subnet<br/>kunstrux-staging-public-us-east-1a<br/>10.20.48.0/22]
    
    T --> U[api.staging.kunstrux.com]
    
    U --> V[Frontend]
    U --> W[Mobile]
    
    %% Styling
    classDef awsService fill:#FF9900,stroke:#232F3E,stroke-width:2px,color:#fff
    classDef subnet fill:#E8F5E8,stroke:#4CAF50,stroke-width:2px
    classDef ec2 fill:#FFE6CC,stroke:#FF9900,stroke-width:2px
    classDef database fill:#E3F2FD,stroke:#2196F3,stroke-width:2px
    classDef external fill:#F3E5F5,stroke:#9C27B0,stroke-width:2px
    
    class A,O,P,Q,R,S awsService
    class D,E,F,G,H,T subnet
    class I,J,K,L,M,N ec2
    class P,Q database
    class U,V,W external`;

  const templates = {
    architecture: {
      name: 'AWS Architecture',
      template: defaultArchitectureTemplate
    },
    flowchart: {
      name: 'Basic Flowchart',
      template: `graph TD
    A[Start] --> B{Decision?}
    B -->|Yes| C[Process 1]
    B -->|No| D[Process 2]
    C --> E[End]
    D --> E`
    },
    sequence: {
      name: 'Sequence Diagram',
      template: `sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant Database
    
    User->>Frontend: Request
    Frontend->>API: API Call
    API->>Database: Query
    Database-->>API: Result
    API-->>Frontend: Response
    Frontend-->>User: Display`
    },
    gitgraph: {
      name: 'Git Graph',
      template: `gitgraph
    commit
    branch develop
    checkout develop
    commit
    commit
    checkout main
    merge develop
    commit`
    }
  };

  useEffect(() => {
    // Set default template
    setDiagramInput(templates.architecture.template);
  }, []);

  const handleTemplateChange = (templateKey) => {
    setDiagramType(templateKey);
    setDiagramInput(templates[templateKey].template);
    setError(null);
    setIsPreviewMode(false);
    setSvgContent('');
  };

  const renderDiagram = async () => {
    if (!diagramInput.trim()) {
      setError('Please enter diagram code');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Rendering diagram...');
      
      // Try to dynamically import mermaid to avoid initialization issues
      const mermaid = await import('mermaid');
      
      // Configure mermaid
      mermaid.default.initialize({
        startOnLoad: false,
        theme: 'default',
        themeVariables: {
          primaryColor: '#FF9900',
          primaryTextColor: '#232F3E',
          primaryBorderColor: '#232F3E',
          lineColor: '#232F3E',
          secondaryColor: '#E8F5E8',
          tertiaryColor: '#F7F7F7'
        },
        flowchart: {
          useMaxWidth: true,
          htmlLabels: true,
          curve: 'basis'
        },
        securityLevel: 'loose'
      });

      // Generate unique ID
      const id = `diagram-${Date.now()}`;
      
      console.log('Calling mermaid.render with ID:', id);
      
      // Use render method
      const result = await mermaid.default.render(id, diagramInput);
      
      console.log('Mermaid render result:', result);
      
      if (result && result.svg) {
        setSvgContent(result.svg);
        setIsPreviewMode(true);
        console.log('Diagram rendered successfully');
      } else {
        throw new Error('No SVG returned from Mermaid');
      }
      
    } catch (err) {
      console.error('Rendering error:', err);
      setError(`Diagram Error: ${err.message || 'Failed to render diagram'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadDiagram = () => {
    if (!svgContent) {
      setError('No diagram to download');
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `diagram-${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(url);
      });
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgContent);
  };

  const resetDiagram = () => {
    setDiagramInput(templates[diagramType].template);
    setError(null);
    setIsPreviewMode(false);
    setSvgContent('');
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <TimelineIcon sx={{ color: 'primary.main' }} />
          Diagram Generator
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Create AWS architecture diagrams and flowcharts using Mermaid syntax
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Left Panel - Controls */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Diagram Controls
              </Typography>

              {/* Template Selection */}
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Template</InputLabel>
                <Select
                  value={diagramType}
                  label="Template"
                  onChange={(e) => handleTemplateChange(e.target.value)}
                >
                  {Object.entries(templates).map(([key, template]) => (
                    <MenuItem key={key} value={key}>
                      {template.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Action Buttons */}
              <Stack spacing={2}>
                <Button
                  variant="contained"
                  startIcon={<VisibilityIcon />}
                  onClick={renderDiagram}
                  disabled={isLoading}
                  fullWidth
                >
                  {isLoading ? 'Rendering...' : 'Generate Diagram'}
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={resetDiagram}
                  fullWidth
                >
                  Reset to Template
                </Button>



                {isPreviewMode && (
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={downloadDiagram}
                    fullWidth
                  >
                    Download PNG
                  </Button>
                )}
              </Stack>

              <Divider sx={{ my: 3 }} />

              {/* Quick Reference */}
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Quick Reference
              </Typography>
              <Stack spacing={1}>
                <Chip label="graph TD - Top Down Flow" size="small" variant="outlined" />
                <Chip label="graph LR - Left Right Flow" size="small" variant="outlined" />
                <Chip label="A[Rectangle]" size="small" variant="outlined" />
                <Chip label="B{Diamond}" size="small" variant="outlined" />
                <Chip label="C((Circle))" size="small" variant="outlined" />
                <Chip label="A --> B (Arrow)" size="small" variant="outlined" />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Panel - Editor and Preview */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                <CodeIcon />
                Mermaid Code Editor
              </Typography>

              {/* Error Display */}
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              {/* Code Editor */}
              <TextField
                fullWidth
                multiline
                rows={15}
                value={diagramInput}
                onChange={(e) => setDiagramInput(e.target.value)}
                placeholder="Enter your Mermaid diagram code here..."
                sx={{
                  mb: 2,
                  '& .MuiInputBase-input': {
                    fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                    fontSize: '0.875rem',
                  }
                }}
              />

              {/* Preview Area */}
              <Paper
                sx={{
                  p: 2,
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #e9ecef',
                  borderRadius: 1,
                  textAlign: 'center',
                  minHeight: 300,
                }}
              >
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                  Diagram Preview
                </Typography>
                
                {isPreviewMode && svgContent ? (
                  <Box
                    sx={{
                      '& svg': {
                        maxWidth: '100%',
                        height: 'auto',
                      },
                      backgroundColor: 'white',
                      borderRadius: 1,
                      p: 1,
                    }}
                    dangerouslySetInnerHTML={{ __html: svgContent }}
                  />
                ) : (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column',
                      minHeight: 250,
                      border: '2px dashed #dee2e6',
                      borderRadius: 1,
                    }}
                  >
                    <VisibilityIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                    <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                      Preview Area
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Click "Generate Diagram" to see your Mermaid diagram here
                    </Typography>
                  </Box>
                )}

                {/* Debug Info */}
                {isPreviewMode && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Diagram rendered successfully
                  </Typography>
                )}
              </Paper>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DiagramPage;
