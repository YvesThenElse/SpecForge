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
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Alert,
  Chip,
  CircularProgress,
  Stack,
  Paper,
  IconButton,
  Menu,
  ListItemIcon,
  ListItemText,
  Checkbox,
  SelectChangeEvent,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Select
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import CheckIcon from '@mui/icons-material/Check';
import HelpIcon from '@mui/icons-material/Help';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { io, Socket } from 'socket.io-client';
import SpecificationCard from './components/SpecificationCard';
import VantaBackground, { VantaEffect } from './components/VantaBackground';
import DocumentationDialog from './components/DocumentationDialog';
import ApiService from './services/api';
import { Specification, SpecificationType, INPUT_TYPE_ICONS, INPUT_TYPE_LABELS, SPECIFICATION_TYPE_ICONS } from './types';

const theme = createTheme({
  palette: {
    primary: {
      main: '#2196F3',
    },
    secondary: {
      main: '#4CAF50',
    },
  },
});

const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:3003';

// Specification type colors
const TYPE_COLORS: Record<SpecificationType, string> = {
  [SpecificationType.USER_STORY]: '#2196F3',
  [SpecificationType.FUNCTIONAL]: '#4CAF50',
  [SpecificationType.SUCCESS_CRITERIA]: '#FF9800',
  [SpecificationType.NON_FUNCTIONAL]: '#9C27B0',
};

function App() {
  const [projectPath, setProjectPath] = useState<string>('');
  const [projectName, setProjectName] = useState<string>('');
  const [projectInitialized, setProjectInitialized] = useState(false);
  const [specifications, setSpecifications] = useState<Specification[]>([]);
  const [filteredSpecifications, setFilteredSpecifications] = useState<Specification[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<SpecificationType[]>([
    SpecificationType.USER_STORY,
    SpecificationType.FUNCTIONAL,
    SpecificationType.SUCCESS_CRITERIA,
    SpecificationType.NON_FUNCTIONAL
  ]);
  const [newSpecificationIds, setNewSpecificationIds] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'type' | 'priority'>('type');
  const [columnsPerRow, setColumnsPerRow] = useState<4 | 6 | 8>(4);
  const [vantaEffect, setVantaEffect] = useState<VantaEffect>('cells');
  const [settingsAnchor, setSettingsAnchor] = useState<null | HTMLElement>(null);
  const [documentationOpen, setDocumentationOpen] = useState(false);
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
      setNewSpecificationIds((prev) => new Set(prev).add(specification.id));

      setTimeout(() => {
        setNewSpecificationIds((prev) => {
          const next = new Set(prev);
          next.delete(specification.id);
          return next;
        });
      }, 5000);
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

    // Listen for active project changes
    newSocket.on('project:activated', (project: { path: string; name: string } | null) => {
      console.log('Active project changed:', project);
      if (project) {
        loadProject(project.path, project.name);
      } else {
        setProjectPath('');
        setProjectName('');
        setProjectInitialized(false);
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  // Load project path from localStorage
  useEffect(() => {
    const savedPath = localStorage.getItem('display-project-path');
    if (savedPath) {
      loadProject(savedPath);
    }
  }, []);

  // Subscribe to project updates
  useEffect(() => {
    if (socket && projectPath && projectInitialized) {
      // Note: Backend will need to emit events using internal projectId from .specforge
      // For now, we can subscribe using a hash of the path or just receive all events
      loadSpecifications();
    }
  }, [socket, projectPath, projectInitialized]);

  // Load and restore selected types from localStorage
  useEffect(() => {
    if (projectPath) {
      const saved = localStorage.getItem(`display-selected-types-${projectPath}`);
      if (saved) {
        try {
          setSelectedTypes(JSON.parse(saved));
        } catch (e) {
          setSelectedTypes([
            SpecificationType.USER_STORY,
            SpecificationType.FUNCTIONAL,
            SpecificationType.SUCCESS_CRITERIA,
            SpecificationType.NON_FUNCTIONAL
          ]);
        }
      }
    }
  }, [projectPath]);

  // Save selected types to localStorage
  useEffect(() => {
    if (projectPath && selectedTypes.length > 0) {
      localStorage.setItem(
        `display-selected-types-${projectPath}`,
        JSON.stringify(selectedTypes)
      );
    }
  }, [selectedTypes, projectPath]);

  // Load Vanta effect from localStorage
  useEffect(() => {
    const savedEffect = localStorage.getItem('display-vanta-effect') as VantaEffect;
    if (savedEffect) {
      setVantaEffect(savedEffect);
    }
  }, []);

  // Save Vanta effect to localStorage
  useEffect(() => {
    localStorage.setItem('display-vanta-effect', vantaEffect);
  }, [vantaEffect]);

  // Load columns per row from localStorage
  useEffect(() => {
    const savedColumns = localStorage.getItem('display-columns-per-row');
    if (savedColumns) {
      setColumnsPerRow(parseInt(savedColumns) as 4 | 6 | 8);
    }
  }, []);

  // Save columns per row to localStorage
  useEffect(() => {
    localStorage.setItem('display-columns-per-row', String(columnsPerRow));
  }, [columnsPerRow]);

  // Filter and sort specifications
  useEffect(() => {
    let filtered = selectedTypes.length === 0
      ? specifications
      : specifications.filter((spec) => selectedTypes.includes(spec.type));

    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'type':
          return a.type.localeCompare(b.type);
        case 'priority':
          const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
          return (priorityOrder[a.priority as keyof typeof priorityOrder] || 99) -
                 (priorityOrder[b.priority as keyof typeof priorityOrder] || 99);
        default:
          return 0;
      }
    });

    setFilteredSpecifications(sorted);
  }, [specifications, selectedTypes, sortBy]);

  const loadProject = async (path: string, name?: string) => {
    setIsLoading(true);
    try {
      const info = await ApiService.getProjectInfo(path);
      setProjectPath(path);
      setProjectName(name || path.split(/[/\\]/).pop() || 'Unknown Project');
      setProjectInitialized(info.validation.valid);
      localStorage.setItem('display-project-path', path);

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
    } catch (error) {
      alert('Failed to load project. Make sure it is initialized.');
    }
  };

  const handleTypeChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    const newTypes = (typeof value === 'string' ? value.split(',') : value) as SpecificationType[];
    setSelectedTypes(newTypes);
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
      <VantaBackground effect={vantaEffect} color="#2196F3" />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'relative', zIndex: 1 }}>
        <AppBar position="static" color="transparent" elevation={0} sx={{ backdropFilter: 'blur(10px)' }}>
          <Toolbar>
            <VisibilityIcon sx={{ mr: 2 }} />
            <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
              👁️ SpecForge Display - Real-time Visualization
            </Typography>

            <Stack direction="row" spacing={1} alignItems="center">
              {/* Backend Connection Status */}
              <Chip
                label={`Backend: ${isConnected ? 'Connected' : 'Disconnected'}`}
                color={isConnected ? 'success' : 'error'}
                size="small"
                sx={{
                  fontWeight: 'bold',
                  bgcolor: isConnected ? 'success.main' : 'error.main',
                  color: 'white'
                }}
              />

              {/* Project Connection Status */}
              <Chip
                label={projectInitialized && projectName ? `Project: ${projectName}` : 'No Project'}
                color={projectInitialized ? 'primary' : 'default'}
                size="small"
                onClick={handleSelectProject}
                icon={<FolderOpenIcon />}
                sx={{
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  bgcolor: projectInitialized ? 'primary.main' : 'grey.500',
                  color: 'white',
                  '&:hover': {
                    bgcolor: projectInitialized ? 'primary.dark' : 'grey.600',
                  }
                }}
              />

              <IconButton
                color="inherit"
                onClick={handleSettingsClick}
                title="Settings"
              >
                <SettingsIcon />
              </IconButton>

              <IconButton
                color="inherit"
                onClick={() => setDocumentationOpen(true)}
                title="Documentation"
              >
                <HelpIcon />
              </IconButton>
            </Stack>
          </Toolbar>

          {!projectInitialized && projectPath && (
            <Alert severity="warning" sx={{ borderRadius: 0 }}>
              Project not properly initialized. Please initialize it using the Input interface.
            </Alert>
          )}
        </AppBar>

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

        <Container maxWidth="xl" sx={{ flexGrow: 1, py: 3 }}>
          {projectInitialized && (
            <Paper elevation={2} sx={{ px: 3, py: 1.5, mb: 3, bgcolor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)' }}>
              <Stack direction="row" spacing={3} alignItems="center" justifyContent="space-between">
                <Stack direction="row" spacing={3} alignItems="center">
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h5" color="primary" fontWeight="bold">
                      {specifications.length}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" fontSize="0.7rem">
                      Total Specifications
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h5" color="success.main" fontWeight="bold">
                      {filteredSpecifications.length}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" fontSize="0.7rem">
                      Showing
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h5" color="secondary.main" fontWeight="bold">
                      {selectedTypes.length}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" fontSize="0.7rem">
                      Active Types
                    </Typography>
                  </Box>
                </Stack>

                <Box sx={{ flexGrow: 1 }} />

                <Stack direction="row" spacing={2}>
                  <FormControl size="small" sx={{ minWidth: 250 }}>
                    <InputLabel>Type</InputLabel>
                    <Select
                      multiple
                      value={selectedTypes}
                      label="Type"
                      onChange={handleTypeChange}
                      renderValue={(selected) => {
                        if (selected.length === 0) return 'All Types';
                        if (selected.length === 1) {
                          return `${SPECIFICATION_TYPE_ICONS[selected[0]]} ${selected[0]}`;
                        }
                        return `${selected.length} types selected`;
                      }}
                    >
                      {Object.values(SpecificationType).map((type) => (
                        <MenuItem key={type} value={type}>
                          <Checkbox checked={selectedTypes.indexOf(type) > -1} size="small" />
                          <ListItemText
                            primary={
                              <Stack direction="row" spacing={1} alignItems="center">
                                <span style={{ fontSize: '1.2rem' }}>
                                  {SPECIFICATION_TYPE_ICONS[type]}
                                </span>
                                <Typography variant="body2">
                                  <strong>{type}</strong>
                                </Typography>
                              </Stack>
                            }
                          />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl size="small" sx={{ minWidth: 180 }}>
                    <InputLabel>Sort By</InputLabel>
                    <Select
                      value={sortBy}
                      label="Sort By"
                      onChange={(e) => setSortBy(e.target.value as any)}
                    >
                      <MenuItem value="newest">📅 Newest First</MenuItem>
                      <MenuItem value="oldest">📅 Oldest First</MenuItem>
                      <MenuItem value="type">🏷️ By Type</MenuItem>
                      <MenuItem value="priority">⭐ By Priority</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl size="small" sx={{ minWidth: 140 }}>
                    <InputLabel>Columns</InputLabel>
                    <Select
                      value={columnsPerRow}
                      label="Columns"
                      onChange={(e) => setColumnsPerRow(e.target.value as 4 | 6 | 8)}
                    >
                      <MenuItem value={4}>4 Columns</MenuItem>
                      <MenuItem value={6}>6 Columns</MenuItem>
                      <MenuItem value={8}>8 Columns</MenuItem>
                    </Select>
                  </FormControl>
                </Stack>
              </Stack>
            </Paper>
          )}

          {!projectPath && (
            <Alert severity="info" sx={{ bgcolor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)' }}>
              No project selected. Please select a SpecForge project directory to start.
            </Alert>
          )}

          {projectPath && projectInitialized && (
            <>
              {filteredSpecifications.length === 0 && specifications.length > 0 && (
                <Alert severity="warning" sx={{ mb: 2, bgcolor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)' }}>
                  No specifications match the selected filters. Try selecting more types.
                </Alert>
              )}

              {specifications.length === 0 && (
                <Alert severity="info" sx={{ bgcolor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)' }}>
                  No specifications yet. Use the Input interface to create specifications and they will appear here in real-time.
                </Alert>
              )}

              <Grid container spacing={columnsPerRow >= 6 ? 2 : 3}>
                {filteredSpecifications.map((specification) => (
                  <Grid
                    item
                    xs={12}
                    sm={columnsPerRow === 8 ? 3 : columnsPerRow === 6 ? 4 : 6}
                    md={columnsPerRow === 8 ? 1.5 : columnsPerRow === 6 ? 2 : 3}
                    lg={columnsPerRow === 8 ? 1.5 : columnsPerRow === 6 ? 2 : 3}
                    key={specification.id}
                  >
                    <SpecificationCard specification={specification} />
                  </Grid>
                ))}
              </Grid>
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

      <DocumentationDialog
        open={documentationOpen}
        onClose={() => setDocumentationOpen(false)}
      />

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </ThemeProvider>
  );
}

export default App;
