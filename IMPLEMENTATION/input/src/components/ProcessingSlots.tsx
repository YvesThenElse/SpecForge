import React from 'react';
import {
  Box,
  LinearProgress,
  Typography,
  Stack,
  Chip,
  Paper
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { QueueItem } from './QueueViewer';

interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCost: number;
}

interface ProcessingSlotsProps {
  items: QueueItem[];
  totalTokens?: number;
  totalCost?: number;
}

const ProcessingSlots: React.FC<ProcessingSlotsProps> = ({ items, totalTokens = 0, totalCost = 0 }) => {
  // Get the processing items (max 3)
  const processingItems = items.filter(item => item.status === 'processing' || item.status === 'pending').slice(0, 3);

  // Create array of 3 slots
  const slots = Array.from({ length: 3 }, (_, index) => {
    const item = processingItems[index];
    return {
      index,
      item,
      isEmpty: !item
    };
  });

  const truncateText = (text: string, maxLength: number = 30) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'processing':
        return '#1976d2';
      case 'pending':
        return '#ff9800';
      case 'completed':
        return '#4caf50';
      case 'error':
        return '#f44336';
      default:
        return '#e0e0e0';
    }
  };

  return (
    <Box sx={{ mt: 2, p: 1.5, bgcolor: 'rgba(0, 0, 0, 0.02)', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
        <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
          Processing Queue
        </Typography>
        {totalTokens > 0 && (
          <>
            <Chip
              label={`${totalTokens.toLocaleString()} tokens`}
              size="small"
              sx={{ height: '18px', fontSize: '0.65rem' }}
            />
            <Chip
              label={`$${totalCost.toFixed(4)}`}
              size="small"
              color="warning"
              sx={{ height: '18px', fontSize: '0.65rem' }}
            />
          </>
        )}
      </Stack>

      <Stack spacing={0.75}>
        {slots.map((slot) => (
          <Box
            key={slot.index}
            sx={{
              p: 0.75,
              borderRadius: 0.5,
              bgcolor: slot.isEmpty ? 'rgba(0, 0, 0, 0.03)' : 'background.paper',
              border: '1px solid',
              borderColor: slot.isEmpty ? 'transparent' : 'divider',
              opacity: slot.isEmpty ? 0.4 : 1,
              transition: 'all 0.2s ease'
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
              <Box
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  bgcolor: getStatusColor(slot.item?.status),
                  flexShrink: 0
                }}
              />
              <Typography
                variant="caption"
                sx={{
                  flexGrow: 1,
                  fontSize: '0.7rem',
                  color: slot.isEmpty ? 'text.disabled' : 'text.primary',
                  fontWeight: slot.item?.status === 'processing' ? 600 : 400
                }}
              >
                {slot.item ? (
                  <>
                    {slot.item.status === 'processing' && '⚡ '}
                    {slot.item.status === 'pending' && '⏳ '}
                    {truncateText(slot.item.text, 35)}
                  </>
                ) : (
                  `Slot ${slot.index + 1} - Available`
                )}
              </Typography>
              {slot.item?.status === 'completed' && (
                <CheckCircleIcon sx={{ fontSize: 14, color: 'success.main' }} />
              )}
              {slot.item?.status === 'error' && (
                <ErrorIcon sx={{ fontSize: 14, color: 'error.main' }} />
              )}
            </Stack>

            {slot.item && (slot.item.status === 'processing' || slot.item.status === 'pending') && (
              <LinearProgress
                variant={slot.item.status === 'processing' ? 'determinate' : 'indeterminate'}
                value={slot.item.progress || 0}
                sx={{
                  height: 3,
                  borderRadius: 1,
                  bgcolor: 'rgba(0, 0, 0, 0.1)',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: getStatusColor(slot.item.status)
                  }
                }}
              />
            )}
            {slot.isEmpty && (
              <Box sx={{ height: 3, bgcolor: 'rgba(0, 0, 0, 0.05)', borderRadius: 1 }} />
            )}
          </Box>
        ))}
      </Stack>
    </Box>
  );
};

export default ProcessingSlots;
