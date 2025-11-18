import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Button,
  TextField,
  Alert,
  Stack,
  Typography,
  CircularProgress
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import RefreshIcon from '@mui/icons-material/Refresh';
import ApiService from '../services/api';

interface MarkdownEditorTabProps {
  projectPath: string;
  fileName: 'plan' | 'tasks' | 'implement';
  title: string;
  description: string;
}

const MarkdownEditorTab: React.FC<MarkdownEditorTabProps> = ({
  projectPath,
  fileName,
  title,
  description
}) => {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadContent();
  }, [projectPath, fileName]);

  const loadContent = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await ApiService.readMarkdownFile(projectPath, fileName);
      setContent(result.content);
      setHasChanges(false);
    } catch (error: any) {
      console.error(`Failed to load ${fileName}:`, error);
      setError(`Failed to load file: ${error.message || 'Unknown error'}`);
      setContent('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await ApiService.writeMarkdownFile(projectPath, fileName, content);
      setSuccessMessage('File saved successfully!');
      setHasChanges(false);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      console.error(`Failed to save ${fileName}:`, error);
      setError(`Failed to save file: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleContentChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(event.target.value);
    setHasChanges(true);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h6" gutterBottom>
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadContent}
              disabled={isSaving}
            >
              Reload
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </Stack>
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {successMessage && (
          <Alert severity="success" sx={{ mt: 2 }}>
            {successMessage}
          </Alert>
        )}

        {hasChanges && (
          <Alert severity="info" sx={{ mt: 2 }}>
            You have unsaved changes
          </Alert>
        )}
      </Paper>

      <Paper sx={{ flexGrow: 1, p: 2, display: 'flex', flexDirection: 'column' }}>
        <TextField
          multiline
          fullWidth
          value={content}
          onChange={handleContentChange}
          placeholder={`Enter markdown content for ${fileName}...`}
          variant="outlined"
          sx={{
            flexGrow: 1,
            '& .MuiInputBase-root': {
              height: '100%',
              alignItems: 'flex-start'
            },
            '& .MuiInputBase-input': {
              height: '100% !important',
              overflow: 'auto !important',
              fontFamily: 'monospace',
              fontSize: '14px',
              lineHeight: 1.6
            }
          }}
        />
      </Paper>

      <Paper sx={{ p: 2, mt: 2 }}>
        <Typography variant="caption" color="text.secondary">
          File: <code>speckit.{fileName}</code> • Project: {projectPath.split(/[/\\]/).pop()}
        </Typography>
      </Paper>
    </Box>
  );
};

export default MarkdownEditorTab;
