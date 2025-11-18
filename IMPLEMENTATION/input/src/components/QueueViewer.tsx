import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  LinearProgress,
  Stack,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import AutorenewIcon from '@mui/icons-material/Autorenew';

import { InputType, INPUT_TYPE_LABELS, INPUT_TYPE_ICONS } from '../types';

export interface QueueItem {
  id: string;
  text: string;
  inputType: InputType;
  projectPath: string;
  promptId?: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  position?: number;
  progress?: number;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  result?: any;
}

interface QueueViewerProps {
  items: QueueItem[];
  onCancel?: (itemId: string) => void;
  onRetry?: (itemId: string) => void;
}

const QueueViewer: React.FC<QueueViewerProps> = ({ items, onCancel, onRetry }) => {
  const processing = items.filter((item) => item.status === 'processing');
  const pending = items.filter((item) => item.status === 'pending');
  const errored = items.filter((item) => item.status === 'error');

  const totalItems = processing.length + pending.length + errored.length;

  if (totalItems === 0) {
    return null;
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing':
        return <AutorenewIcon sx={{ animation: 'spin 2s linear infinite' }} />;
      case 'pending':
        return <HourglassEmptyIcon />;
      case 'completed':
        return <CheckCircleIcon color="success" />;
      case 'error':
        return <ErrorIcon color="error" />;
      default:
        return null;
    }
  };

  const getElapsedTime = (startedAt?: Date) => {
    if (!startedAt) return '';
    const elapsed = Math.floor((Date.now() - startedAt.getTime()) / 1000);
    return `${elapsed}s`;
  };

  const truncateText = (text: string, maxLength: number = 60) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <Accordion defaultExpanded sx={{ boxShadow: 'none' }}>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{
          bgcolor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
          minHeight: 48,
          '&.Mui-expanded': {
            minHeight: 48,
          },
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="h6">📊 Analysis Queue</Typography>
          <Chip label={`${totalItems} items`} size="small" color="primary" />
          {processing.length > 0 && (
            <Chip label={`${processing.length} processing`} size="small" color="info" />
          )}
          {pending.length > 0 && (
            <Chip label={`${pending.length} pending`} size="small" color="warning" />
          )}
        </Stack>
      </AccordionSummary>

      <AccordionDetails sx={{ maxHeight: '300px', overflow: 'auto' }}>
        {/* Processing Items */}
        {processing.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="info.main" gutterBottom sx={{ fontWeight: 600 }}>
              🔄 Processing ({processing.length})
            </Typography>
            {processing.map((item) => (
              <Paper key={item.id} elevation={1} sx={{ p: 2, mb: 1, bgcolor: '#E3F2FD' }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  {getStatusIcon(item.status)}
                  <Chip
                    label={`${INPUT_TYPE_ICONS[item.inputType]} ${INPUT_TYPE_LABELS[item.inputType]}`}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                  <Typography variant="body2" sx={{ flexGrow: 1, fontWeight: 500 }}>
                    "{truncateText(item.text)}"
                  </Typography>
                  <Chip label={getElapsedTime(item.startedAt)} size="small" />
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={item.progress || 0}
                  sx={{ mb: 0.5 }}
                />
                <Typography variant="caption" color="text.secondary">
                  Progress: {item.progress || 0}%
                </Typography>
              </Paper>
            ))}
          </Box>
        )}

        {/* Pending Items */}
        {pending.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="warning.main" gutterBottom sx={{ fontWeight: 600 }}>
              ⏳ Pending ({pending.length})
            </Typography>
            {pending.map((item, index) => (
              <Paper key={item.id} elevation={1} sx={{ p: 2, mb: 1, bgcolor: '#FFF3E0' }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  {getStatusIcon(item.status)}
                  <Chip
                    label={`${INPUT_TYPE_ICONS[item.inputType]} ${INPUT_TYPE_LABELS[item.inputType]}`}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                  <Typography variant="body2" sx={{ flexGrow: 1 }}>
                    "{truncateText(item.text)}"
                  </Typography>
                  <Chip label={`#${index + 1} in queue`} size="small" variant="outlined" />
                  {onCancel && (
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => onCancel(item.id)}
                      title="Cancel"
                    >
                      <CancelIcon fontSize="small" />
                    </IconButton>
                  )}
                </Stack>
              </Paper>
            ))}
          </Box>
        )}

        {/* Error Items */}
        {errored.length > 0 && (
          <Box>
            <Typography variant="subtitle2" color="error.main" gutterBottom sx={{ fontWeight: 600 }}>
              ❌ Error ({errored.length})
            </Typography>
            {errored.map((item) => (
              <Paper key={item.id} elevation={1} sx={{ p: 2, mb: 1, bgcolor: '#FFEBEE' }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                  {getStatusIcon(item.status)}
                  <Chip
                    label={`${INPUT_TYPE_ICONS[item.inputType]} ${INPUT_TYPE_LABELS[item.inputType]}`}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                  <Typography variant="body2" sx={{ flexGrow: 1 }}>
                    "{truncateText(item.text)}"
                  </Typography>
                  {onRetry && (
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => onRetry(item.id)}
                      title="Retry"
                    >
                      <AutorenewIcon fontSize="small" />
                    </IconButton>
                  )}
                </Stack>
                <Typography variant="caption" color="error">
                  Error: {item.error || 'Unknown error'}
                </Typography>
              </Paper>
            ))}
          </Box>
        )}
      </AccordionDetails>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Accordion>
  );
};

export default QueueViewer;
