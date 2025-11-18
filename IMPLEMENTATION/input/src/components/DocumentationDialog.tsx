import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Tabs,
  Tab,
  Box,
  Typography,
  Paper,
  Chip,
  Divider,
  Stack,
  List,
  ListItem,
  Link
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DescriptionIcon from '@mui/icons-material/Description';
import InfoIcon from '@mui/icons-material/Info';
import { INPUT_TYPE_LABELS, INPUT_TYPE_DESCRIPTIONS, INPUT_TYPE_ICONS, SpecificationType } from '../types';

interface DocumentationDialogProps {
  open: boolean;
  onClose: () => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

const specificationTypes = [
  {
    type: SpecificationType.USER_STORY,
    inputType: 'userStory' as const,
    color: '#2196F3',
    description: 'Describes features from the user\'s perspective using the "As a..., I want..., so that..." format',
    whenToUse: 'Use when capturing user-facing functionality and the value it provides. User stories focus on the WHO, WHAT, and WHY of a feature.',
    example: 'As a user, I want to log in with my email and password so that I can access my personalized dashboard.'
  },
  {
    type: SpecificationType.FUNCTIONAL,
    inputType: 'functional' as const,
    color: '#4CAF50',
    description: 'Defines what the system must DO - specific actions, features, and behaviors',
    whenToUse: 'Use when specifying precise system behavior, data processing, business logic, or feature implementation details.',
    example: 'The system shall validate email addresses using RFC 5322 standard format before allowing user registration.'
  },
  {
    type: SpecificationType.SUCCESS_CRITERIA,
    inputType: 'successCriteria' as const,
    color: '#FF9800',
    description: 'Defines measurable conditions that must be met for a feature or requirement to be considered complete',
    whenToUse: 'Use when establishing acceptance criteria, test conditions, or measurable outcomes for features.',
    example: 'Login process completes in under 2 seconds for 95% of requests, with proper error messages displayed for invalid credentials.'
  },
  {
    type: SpecificationType.NON_FUNCTIONAL,
    inputType: 'nonFunctional' as const,
    color: '#9C27B0',
    description: 'Specifies quality attributes: performance, security, usability, reliability, maintainability, etc.',
    whenToUse: 'Use when defining system qualities rather than specific behaviors. NFRs describe HOW WELL the system performs.',
    example: 'The application must support 10,000 concurrent users with 99.9% uptime and maintain response times under 200ms.'
  }
];

const DocumentationDialog: React.FC<DocumentationDialogProps> = ({ open, onClose }) => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '80vh' }
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="h5" component="div" sx={{ flexGrow: 1 }}>
          📚 SpecForge Documentation
        </Typography>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Divider />

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} centered>
          <Tab icon={<DescriptionIcon />} label="Specification Types" />
          <Tab icon={<InfoIcon />} label="About" />
        </Tabs>
      </Box>

      <DialogContent>
        {/* Tab 1: Specification Types */}
        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" gutterBottom>
            Specification Types in SpecForge
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Based on GitHub's spec-kit methodology for specification-driven development
          </Typography>

          <Stack spacing={3}>
            {specificationTypes.map((spec) => (
              <Paper key={spec.type} elevation={2} sx={{ p: 3, borderLeft: `4px solid ${spec.color}` }}>
                <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ mb: 2 }}>
                  <Box sx={{ fontSize: '3rem' }}>{INPUT_TYPE_ICONS[spec.inputType]}</Box>
                  <Box sx={{ flexGrow: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                      <Chip
                        label={spec.type}
                        sx={{ bgcolor: spec.color, color: 'white', fontWeight: 'bold' }}
                      />
                      <Typography variant="h6">{INPUT_TYPE_LABELS[spec.inputType]}</Typography>
                    </Stack>
                    <Typography variant="body1" paragraph>
                      {spec.description}
                    </Typography>

                    <Paper sx={{ p: 2, bgcolor: 'background.default', mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                        When to use:
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {spec.whenToUse}
                      </Typography>
                    </Paper>

                    <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                        Example:
                      </Typography>
                      <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                        "{spec.example}"
                      </Typography>
                    </Paper>
                  </Box>
                </Stack>
              </Paper>
            ))}
          </Stack>

          <Divider sx={{ my: 3 }} />

          <Paper sx={{ p: 2, bgcolor: '#E3F2FD' }}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
              📁 File Storage
            </Typography>
            <Typography variant="body2" paragraph>
              Specifications are stored in markdown files within your project directory:
            </Typography>
            <List dense>
              <ListItem sx={{ py: 0.5 }}>
                <Typography variant="body2" component="code" sx={{ bgcolor: 'white', px: 1, py: 0.5, borderRadius: 0.5 }}>
                  speckit.specify
                </Typography>
                <Typography variant="body2" sx={{ ml: 1 }}>
                  - Contains USER_STORY, FUNCTIONAL, and SUCCESS_CRITERIA
                </Typography>
              </ListItem>
              <ListItem sx={{ py: 0.5 }}>
                <Typography variant="body2" component="code" sx={{ bgcolor: 'white', px: 1, py: 0.5, borderRadius: 0.5 }}>
                  speckit.constitution
                </Typography>
                <Typography variant="body2" sx={{ ml: 1 }}>
                  - Contains NON_FUNCTIONAL requirements
                </Typography>
              </ListItem>
            </List>
          </Paper>
        </TabPanel>

        {/* Tab 2: About */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            About SpecForge
          </Typography>
          <Typography variant="body1" paragraph>
            SpecForge is a specification management tool based on GitHub's spec-kit methodology.
            It helps teams capture, organize, and manage software specifications using a simple,
            file-based approach.
          </Typography>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            Key Features
          </Typography>
          <List>
            <ListItem>
              <Typography variant="body2">
                📝 <strong>Markdown-based</strong> - Specifications stored as readable markdown files
              </Typography>
            </ListItem>
            <ListItem>
              <Typography variant="body2">
                🤖 <strong>AI-powered</strong> - Automatic specification extraction from natural language
              </Typography>
            </ListItem>
            <ListItem>
              <Typography variant="body2">
                📁 <strong>File-based</strong> - No database required, works with any directory
              </Typography>
            </ListItem>
            <ListItem>
              <Typography variant="body2">
                🔄 <strong>Real-time</strong> - Live updates across multiple users via WebSocket
              </Typography>
            </ListItem>
            <ListItem>
              <Typography variant="body2">
                📊 <strong>Token tracking</strong> - Monitor AI usage and costs
              </Typography>
            </ListItem>
          </List>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" gutterBottom>
            Workflow
          </Typography>
          <Stack spacing={2}>
            <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                1. Select or Initialize Project
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Choose a directory and initialize it as a SpecForge project. This creates the necessary
                speckit.* files using templates from GitHub's spec-kit repository.
              </Typography>
            </Paper>

            <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                2. Choose Specification Type
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Select the appropriate type (User Story, Functional, Success Criteria, or Non-Functional)
                for the text you're analyzing.
              </Typography>
            </Paper>

            <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                3. Analyze Text
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Enter your requirements in natural language. The AI will extract structured specifications
                and save them to the appropriate markdown file.
              </Typography>
            </Paper>

            <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                4. Review and Export
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Review extracted specifications, make edits if needed, and export to various formats
                for documentation or sharing with stakeholders.
              </Typography>
            </Paper>
          </Stack>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" gutterBottom>
            Learn More
          </Typography>
          <Typography variant="body2" paragraph>
            For more information about the spec-kit methodology, visit:
          </Typography>
          <Link href="https://github.com/github/spec-kit" target="_blank" rel="noopener">
            https://github.com/github/spec-kit
          </Link>
        </TabPanel>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentationDialog;
