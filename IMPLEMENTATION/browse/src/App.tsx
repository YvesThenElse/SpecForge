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
  Tabs,
  Tab,
  Button,
  Alert,
  Chip,
  Stack,
  CircularProgress,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import SearchIcon from '@mui/icons-material/Search';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import { io, Socket } from 'socket.io-client';
import SpecificationsTab from './components/SpecificationsTab';
import TokenUsageTab from './components/TokenUsageTab';
import ExportTab from './components/ExportTab';
import MarkdownEditorTab from './components/MarkdownEditorTab';
import ApiService from './services/api';
import { Specification } from './types';

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

const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:3003';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`browse-tabpanel-${index}`}
      aria-labelledby={`browse-tab-${index}`}
      style={{ height: '100%', display: value === index ? 'flex' : 'none', flexDirection: 'column' }}
      {...other}
    >
      {value === index && <Box sx={{ py: 3, flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>{children}</Box>}
    </div>
  );
}

function App() {
  const [projectPath, setProjectPath] = useState<string>('');
  const [projectInitialized, setProjectInitialized] = useState(false);
  const [specifications, setSpecifications] = useState<Specification[]>([]);
  const [currentTab, setCurrentTab] = useState(0);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [tempProjectPath, setTempProjectPath] = useState('');

  // Initialize WebSocket connection
  useEffect(() => {
    const newSocket = io(WS_URL);

    newSocket.on('connect', () => {
      console.log('WebSocket connected');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    });

    newSocket.on('specification:created', (specification: Specification) => {
      console.log('New specification created:', specification);
      setSpecifications((prev) => [specification, ...prev]);
    });

    newSocket.on('specification:updated', (specification: Specification) => {
      console.log('Specification updated:', specification);
      setSpecifications((prev) =>
        prev.map((spec) => (spec.id === specification.id ? specification : spec))
      );
    });

    newSocket.on('specification:deleted', (specificationId: string) => {
      console.log('Specification deleted:', specificationId);
      setSpecifications((prev) => prev.filter((spec) => spec.id !== specificationId));
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  // Check backend health
  useEffect(() => {
    checkBackendHealth();
  }, []);

  // Load project path from localStorage
  useEffect(() => {
    const savedPath = localStorage.getItem('browse-project-path');
    if (savedPath) {
      loadProject(savedPath);
    }
  }, []);

  const checkBackendHealth = async () => {
    try {
      await ApiService.healthCheck();
      setBackendStatus('connected');
    } catch (error) {
      setBackendStatus('disconnected');
    }
  };

  const loadProject = async (path: string) => {
    setIsLoading(true);
    try {
      const info = await ApiService.getProjectInfo(path);
      setProjectPath(path);
      setProjectInitialized(info.validation.valid);
      localStorage.setItem('browse-project-path', path);

      const specs = await ApiService.getAllSpecifications(path);
      setSpecifications(specs);
    } catch (error) {
      console.error('Failed to load project:', error);
      setProjectInitialized(false);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSpecifications = async () => {
    if (!projectPath) return;
    try {
      const specs = await ApiService.getAllSpecifications(projectPath);
      setSpecifications(specs);
    } catch (error) {
      console.error('Failed to load specifications:', error);
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
      await loadProject(tempProjectPath);
      setProjectDialogOpen(false);
    } catch (error: any) {
      const shouldInit = window.confirm(
        'This directory is not a SpecForge project. Would you like to initialize it?'
      );

      if (shouldInit) {
        try {
          const projectName = prompt('Enter project name (optional):') || undefined;
          await ApiService.initializeProject(tempProjectPath, projectName);
          await loadProject(tempProjectPath);
          setProjectDialogOpen(false);
        } catch (initError: any) {
          alert(`Failed to initialize project: ${initError.message || 'Unknown error'}`);
        }
      }
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  if (isLoading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <CircularProgress />
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ToastContainer position="bottom-right" autoClose={3000} />
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <AppBar position="static">
          <Toolbar>
            <SearchIcon sx={{ mr: 2 }} />
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              📋 SpecForge Browse - Specification Management
            </Typography>

            <Stack direction="row" spacing={2} alignItems="center">
              {isConnected ? (
                <Chip
                  label="🟢 Connected"
                  size="small"
                  sx={{ bgcolor: '#4CAF50', color: 'white', fontWeight: 'bold' }}
                />
              ) : (
                <Chip
                  label="🔴 Disconnected"
                  size="small"
                  sx={{ bgcolor: '#F44336', color: 'white', fontWeight: 'bold' }}
                />
              )}

              <Button
                variant="outlined"
                startIcon={<FolderOpenIcon />}
                onClick={handleSelectProject}
                sx={{ color: 'white', borderColor: 'white' }}
              >
                {projectPath ? projectPath.split(/[/\\]/).pop() : 'Select Project'}
              </Button>
            </Stack>
          </Toolbar>

          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            textColor="inherit"
            indicatorColor="secondary"
            variant="scrollable"
            scrollButtons="auto"
            sx={{ borderTop: '1px solid rgba(255, 255, 255, 0.12)' }}
          >
            <Tab label="📋 Specifications" />
            <Tab label="📝 Plan" />
            <Tab label="✅ Tasks" />
            <Tab label="🔨 Implement" />
            <Tab label="🪙 Token Usage" />
            <Tab label="📤 Export" />
          </Tabs>
        </AppBar>

        <Container maxWidth={false} sx={{ flexGrow: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {backendStatus === 'disconnected' && (
            <Alert severity="error" sx={{ mt: 2, flexShrink: 0 }}>
              Cannot connect to backend server. Please make sure it's running on http://localhost:3003
            </Alert>
          )}

          {!projectPath && (
            <Alert severity="info" sx={{ mt: 2, flexShrink: 0 }}>
              No project selected. Please select a SpecForge project directory to get started.
            </Alert>
          )}

          {!projectInitialized && projectPath && (
            <Alert severity="warning" sx={{ mt: 2, flexShrink: 0 }}>
              Project not properly initialized. Please initialize it first.
            </Alert>
          )}

          {projectInitialized && projectPath && (
            <>
              <TabPanel value={currentTab} index={0}>
                <SpecificationsTab
                  projectPath={projectPath}
                  specifications={specifications}
                  onRefresh={loadSpecifications}
                />
              </TabPanel>

              <TabPanel value={currentTab} index={1}>
                <MarkdownEditorTab
                  projectPath={projectPath}
                  fileName="plan"
                  title="📝 Project Plan"
                  description="High-level project plan and timeline (speckit.plan)"
                />
              </TabPanel>

              <TabPanel value={currentTab} index={2}>
                <MarkdownEditorTab
                  projectPath={projectPath}
                  fileName="tasks"
                  title="✅ Implementation Tasks"
                  description="Detailed task breakdown and checklist (speckit.tasks)"
                />
              </TabPanel>

              <TabPanel value={currentTab} index={3}>
                <MarkdownEditorTab
                  projectPath={projectPath}
                  fileName="implement"
                  title="🔨 Implementation Notes"
                  description="Technical implementation details and notes (speckit.implement)"
                />
              </TabPanel>

              <TabPanel value={currentTab} index={4}>
                <TokenUsageTab projectPath={projectPath} />
              </TabPanel>

              <TabPanel value={currentTab} index={5}>
                <ExportTab projectPath={projectPath} specifications={specifications} />
              </TabPanel>
            </>
          )}
        </Container>
      </Box>

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
            placeholder="C:\\Users\\yourname\\projects\\myproject"
            helperText="Enter the absolute path to your SpecForge project directory"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProjectDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleProjectPathConfirm} variant="contained">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
}

export default App;
