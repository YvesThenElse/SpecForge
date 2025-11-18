import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  CssBaseline,
  ThemeProvider,
  createTheme,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Grid,
  Alert,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import CheckIcon from '@mui/icons-material/Check';
import HelpIcon from '@mui/icons-material/Help';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import InputArea from './components/InputArea';
import SpecificationsList from './components/SpecificationsList';
import { QueueItem } from './components/QueueViewer';
import VantaBackground, { VantaEffect } from './components/VantaBackground';
import AnalysisBatchesViewer from './components/AnalysisBatchesViewer';
import DocumentationDialog from './components/DocumentationDialog';
import ApiService from './services/api';
import { Specification, InputType, AnalysisResponse } from './types';

const theme = createTheme({
  palette: {
    primary: {
      main: '#4CAF50',
    },
    secondary: {
      main: '#2196F3',
    },
  },
});

interface AnalysisBatch {
  id: string;
  timestamp: Date;
  text: string;
  specifications: Specification[];
  inputType: InputType;
}

function App() {
  const [projectPath, setProjectPath] = useState<string>('');
  const [projectInitialized, setProjectInitialized] = useState(false);
  const [specifications, setSpecifications] = useState<Specification[]>([]);
  const [backendStatus, setBackendStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [vantaEffect, setVantaEffect] = useState<VantaEffect>('cells');
  const [settingsAnchor, setSettingsAnchor] = useState<null | HTMLElement>(null);
  const [analysisBatches, setAnalysisBatches] = useState<AnalysisBatch[]>([]);
  const [documentationOpen, setDocumentationOpen] = useState(false);
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [tempProjectPath, setTempProjectPath] = useState('');
  const [totalTokens, setTotalTokens] = useState(0);
  const [totalCost, setTotalCost] = useState(0);

  useEffect(() => {
    checkBackendHealth();
    // Load project path from localStorage
    const savedPath = localStorage.getItem('specforge-project-path');
    if (savedPath) {
      loadProject(savedPath);
    }
  }, []);

  // Load Vanta effect from localStorage
  useEffect(() => {
    const savedEffect = localStorage.getItem('specforge-vanta-effect') as VantaEffect;
    if (savedEffect) {
      setVantaEffect(savedEffect);
    }
  }, []);

  // Save Vanta effect to localStorage
  useEffect(() => {
    localStorage.setItem('specforge-vanta-effect', vantaEffect);
  }, [vantaEffect]);

  const checkBackendHealth = async () => {
    try {
      const response = await fetch('http://localhost:3003/api/health');
      if (response.ok) {
        setBackendStatus('connected');
      } else {
        setBackendStatus('disconnected');
      }
    } catch (error) {
      setBackendStatus('disconnected');
    }
  };

  const loadProject = async (path: string) => {
    try {
      const info = await ApiService.getProjectInfo(path);
      setProjectPath(path);
      setProjectInitialized(info.validation.valid);
      localStorage.setItem('specforge-project-path', path);

      // Load specifications
      const specs = await ApiService.getAllSpecifications(path);
      setSpecifications(specs);
    } catch (error) {
      console.error('Failed to load project:', error);
      setProjectInitialized(false);
    }
  };

  const handleSelectProject = () => {
    setProjectDialogOpen(true);
  };

  const handleProjectPathConfirm = async () => {
    if (!tempProjectPath) {
      alert('Please enter a project path');
      return;
    }

    try {
      // Check if project exists and is initialized
      try {
        await loadProject(tempProjectPath);
        setProjectDialogOpen(false);
      } catch (error) {
        // Project not initialized, ask to initialize
        const shouldInit = window.confirm(
          'This directory is not a SpecForge project. Would you like to initialize it?'
        );

        if (shouldInit) {
          const projectName = prompt('Enter project name (optional):') || undefined;
          await ApiService.initializeProject(tempProjectPath, projectName);
          await loadProject(tempProjectPath);
          setProjectDialogOpen(false);
        }
      }
    } catch (error: any) {
      console.error('Error with project:', error);
      alert(`Error: ${error.message || 'Failed to load/initialize project'}`);
    }
  };

  const handleAddToQueue = (text: string, inputType: InputType, promptId?: string) => {
    if (!projectPath || !projectInitialized) {
      alert('Please select and initialize a project first');
      return;
    }

    const newItem: QueueItem = {
      id: `queue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text,
      inputType,
      projectPath,
      promptId,
      status: 'pending',
    };

    setQueueItems([...queueItems, newItem]);

    // Start processing if this is the only item or no items are currently processing
    const hasProcessing = queueItems.some(item => item.status === 'processing');
    if (!hasProcessing) {
      processNextInQueue([...queueItems, newItem]);
    }
  };

  const processNextInQueue = async (queue: QueueItem[]) => {
    const nextItem = queue.find(item => item.status === 'pending');
    if (!nextItem) return;

    // Mark as processing
    setQueueItems(prev =>
      prev.map(item =>
        item.id === nextItem.id
          ? { ...item, status: 'processing', progress: 0 }
          : item
      )
    );

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setQueueItems(prev =>
          prev.map(item =>
            item.id === nextItem.id && item.progress !== undefined && item.progress < 90
              ? { ...item, progress: item.progress + 10 }
              : item
          )
        );
      }, 500);

      // Perform analysis
      const result: AnalysisResponse = await ApiService.analyzeText(
        nextItem.text,
        nextItem.projectPath,
        nextItem.inputType,
        nextItem.promptId
      );

      clearInterval(progressInterval);

      // Update token usage
      if (result.tokenUsage) {
        setTotalTokens(prev => prev + result.tokenUsage!.totalTokens);
        setTotalCost(prev => prev + result.tokenUsage!.estimatedCost);
      }

      // Create analysis batch
      const batch: AnalysisBatch = {
        id: nextItem.id,
        timestamp: new Date(),
        text: nextItem.text,
        specifications: result.specifications,
        inputType: nextItem.inputType
      };

      // Add to batches (keep only last 3)
      setAnalysisBatches(prev => {
        const updated = [batch, ...prev];
        return updated.slice(0, 3);
      });

      // Update specifications list
      setSpecifications(prev => [...result.specifications, ...prev]);

      // Mark as completed
      setQueueItems(prev =>
        prev.map(item =>
          item.id === nextItem.id
            ? { ...item, status: 'completed', progress: 100, result }
            : item
        )
      );

      // Process next item in queue
      setTimeout(() => {
        processNextInQueue(prev.map(item =>
          item.id === nextItem.id
            ? { ...item, status: 'completed', progress: 100, result }
            : item
        ));
      }, 100);

    } catch (error: any) {
      console.error('Analysis failed:', error);

      // Mark as error
      setQueueItems(prev =>
        prev.map(item =>
          item.id === nextItem.id
            ? { ...item, status: 'error', error: error.message || 'Analysis failed' }
            : item
        )
      );

      // Continue with next item
      setTimeout(() => {
        processNextInQueue(queueItems);
      }, 100);
    }
  };

  const handleSettingsClick = (event: React.MouseEvent<HTMLElement>) => {
    setSettingsAnchor(event.currentTarget);
  };

  const handleSettingsClose = () => {
    setSettingsAnchor(null);
  };

  const handleVantaEffectChange = (effect: VantaEffect) => {
    setVantaEffect(effect);
    handleSettingsClose();
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <VantaBackground effect={vantaEffect} />

      <Box sx={{ minHeight: '100vh', position: 'relative', zIndex: 1 }}>
        <AppBar position="static" color="transparent" elevation={0} sx={{ backdropFilter: 'blur(10px)' }}>
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
              🖊️ SpecForge Input
            </Typography>

            {/* Backend Status */}
            <Box sx={{ mr: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: backendStatus === 'connected' ? 'success.main' : 'error.main',
                  animation: backendStatus === 'checking' ? 'pulse 1.5s ease-in-out infinite' : 'none',
                  '@keyframes pulse': {
                    '0%, 100%': { opacity: 1 },
                    '50%': { opacity: 0.5 },
                  },
                }}
              />
              <Typography variant="body2">
                {backendStatus === 'connected' ? 'Connected' : 'Disconnected'}
              </Typography>
            </Box>

            {/* Project Path */}
            <Button
              variant="outlined"
              startIcon={<FolderOpenIcon />}
              onClick={handleSelectProject}
              sx={{ mr: 2 }}
            >
              {projectPath ? projectPath.split(/[/\\]/).pop() : 'Select Project'}
            </Button>

            {/* Settings */}
            <IconButton onClick={handleSettingsClick} color="inherit">
              <SettingsIcon />
            </IconButton>

            {/* Help */}
            <IconButton onClick={() => setDocumentationOpen(true)} color="inherit">
              <HelpIcon />
            </IconButton>
          </Toolbar>

          {/* Project Status Alert */}
          {!projectInitialized && (
            <Alert severity="warning" sx={{ borderRadius: 0 }}>
              No project selected. Please select a project directory to start.
            </Alert>
          )}
        </AppBar>

        <Container maxWidth="xl" sx={{ mt: 4, pb: 4 }}>
          {/* Token Usage Summary */}
          {totalTokens > 0 && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Session Usage: {totalTokens.toLocaleString()} tokens • ${totalCost.toFixed(4)}
            </Alert>
          )}

          <Grid container spacing={3}>
            {/* Left Column: Input */}
            <Grid item xs={12} md={6}>
              <InputArea
                projectPath={projectPath}
                projectInitialized={projectInitialized}
                onAddToQueue={handleAddToQueue}
                queueItems={queueItems}
              />
            </Grid>

            {/* Right Column: Results */}
            <Grid item xs={12} md={6}>
              <SpecificationsList specifications={specifications} />
              <Box sx={{ mt: 2 }}>
                <AnalysisBatchesViewer batches={analysisBatches} />
              </Box>
            </Grid>
          </Grid>
        </Container>

        {/* Settings Menu */}
        <Menu
          anchorEl={settingsAnchor}
          open={Boolean(settingsAnchor)}
          onClose={handleSettingsClose}
        >
          <MenuItem disabled>
            <ListItemText primary="Background Effect" />
          </MenuItem>
          {(['cells', 'waves', 'fog', 'clouds', 'none'] as VantaEffect[]).map((effect) => (
            <MenuItem
              key={effect}
              onClick={() => handleVantaEffectChange(effect)}
              selected={vantaEffect === effect}
            >
              <ListItemIcon>
                {vantaEffect === effect && <CheckIcon fontSize="small" />}
              </ListItemIcon>
              <ListItemText primary={effect.charAt(0).toUpperCase() + effect.slice(1)} />
            </MenuItem>
          ))}
        </Menu>

        {/* Project Selection Dialog */}
        <Dialog open={projectDialogOpen} onClose={() => setProjectDialogOpen(false)}>
          <DialogTitle>Select Project Directory</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Project Path"
              type="text"
              fullWidth
              value={tempProjectPath}
              onChange={(e) => setTempProjectPath(e.target.value)}
              placeholder="C:\Users\yourname\projects\myproject"
              helperText="Enter the absolute path to your project directory"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setProjectDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleProjectPathConfirm} variant="contained">
              Confirm
            </Button>
          </DialogActions>
        </Dialog>

        {/* Documentation Dialog */}
        <DocumentationDialog
          open={documentationOpen}
          onClose={() => setDocumentationOpen(false)}
        />
      </Box>
    </ThemeProvider>
  );
}

export default App;
