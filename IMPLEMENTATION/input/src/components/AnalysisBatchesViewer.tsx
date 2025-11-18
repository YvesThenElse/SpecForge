import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Stack,
  Divider
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Specification, InputType } from '../types';

export interface AnalysisBatch {
  id: string;
  timestamp: Date;
  text: string;
  specifications: Specification[];
  inputType: InputType;
}

interface AnalysisBatchesViewerProps {
  batches: AnalysisBatch[];
}

const AnalysisBatchesViewer: React.FC<AnalysisBatchesViewerProps> = ({ batches }) => {
  const [expanded, setExpanded] = useState<string | false>(false);

  const handleChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return date.toLocaleString();
  };

  const truncateText = (text: string, maxLength: number = 60) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (batches.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'white' }}>
        <CheckCircleIcon sx={{ color: 'white' }} />
        Previous Analyses ({batches.length})
      </Typography>

      {batches.map((batch, index) => (
        <Accordion
          key={batch.id}
          expanded={expanded === batch.id}
          onChange={handleChange(batch.id)}
          sx={{ mb: 1 }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{
              bgcolor: '#F1F8E9',
              '&:hover': { bgcolor: '#DCEDC8' }
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%' }}>
              <Chip
                label={`#${batches.length - index}`}
                size="small"
                color="success"
                sx={{ fontWeight: 'bold' }}
              />
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  "{truncateText(batch.text, 50)}"
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatDate(batch.timestamp)}
                </Typography>
              </Box>
              <Chip
                label={`${batch.specifications.length} specifications`}
                size="small"
                color="success"
                variant="outlined"
              />
            </Stack>
          </AccordionSummary>

          <AccordionDetails>
            <Box sx={{ p: 1 }}>
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                Extracted Specifications:
              </Typography>

              {batch.specifications.map((spec, idx) => (
                <Paper key={idx} elevation={1} sx={{ p: 2, mb: 1, bgcolor: 'background.default' }}>
                  <Stack direction="row" spacing={2} alignItems="start">
                    <Chip
                      label={spec.type}
                      size="small"
                      color="primary"
                      sx={{ fontWeight: 'bold' }}
                    />
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {spec.id}: {spec.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                        {spec.description}
                      </Typography>
                      {spec.rationale && (
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', fontStyle: 'italic' }}>
                          💡 {spec.rationale}
                        </Typography>
                      )}
                    </Box>
                    <Chip
                      label={spec.priority}
                      size="small"
                      variant="outlined"
                    />
                  </Stack>
                </Paper>
              ))}

              <Divider sx={{ my: 2 }} />

              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Original text:
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, p: 1, bgcolor: 'background.default', borderRadius: 1, fontSize: '0.875rem' }}>
                {batch.text}
              </Typography>
            </Box>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
};

export default AnalysisBatchesViewer;
