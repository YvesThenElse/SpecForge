import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import { Specification, INPUT_TYPE_LABELS, INPUT_TYPE_ICONS } from '../types';

interface SpecificationsListProps {
  specifications: Specification[];
}

const typeColors: Record<string, string> = {
  USER_STORY: '#2196F3',
  FUNCTIONAL: '#4CAF50',
  SUCCESS_CRITERIA: '#FF9800',
  NON_FUNCTIONAL: '#9C27B0',
};

const priorityColors: Record<string, string> = {
  critical: '#f44336',
  high: '#ff9800',
  medium: '#2196f3',
  low: '#4caf50',
};

const SpecificationsList: React.FC<SpecificationsListProps> = ({ specifications }) => {
  return (
    <Paper sx={{ p: 2, bgcolor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)' }}>
      <Typography variant="h6" gutterBottom>
        📋 Extracted Specifications
      </Typography>

      {specifications.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No specifications yet. Analyze some text to get started.
        </Typography>
      ) : (
        <List>
          {specifications.map((spec, index) => (
            <React.Fragment key={spec.id}>
              {index > 0 && <Divider />}
              <ListItem alignItems="flex-start">
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                        {spec.id}
                      </Typography>
                      <Chip
                        label={spec.type}
                        size="small"
                        sx={{
                          bgcolor: typeColors[spec.type] || '#757575',
                          color: 'white',
                          fontWeight: 'bold',
                        }}
                      />
                      <Chip
                        label={spec.priority}
                        size="small"
                        variant="outlined"
                        sx={{
                          borderColor: priorityColors[spec.priority],
                          color: priorityColors[spec.priority],
                        }}
                      />
                      <Chip
                        label={spec.status}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  }
                  secondary={
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                        {spec.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {spec.description}
                      </Typography>
                      {spec.rationale && (
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', fontStyle: 'italic' }}>
                          Rationale: {spec.rationale}
                        </Typography>
                      )}
                      {spec.tokenUsage && (
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                          📊 {spec.tokenUsage.totalTokens} tokens • ${spec.tokenUsage.estimatedCost.toFixed(4)}
                        </Typography>
                      )}
                    </Box>
                  }
                />
              </ListItem>
            </React.Fragment>
          ))}
        </List>
      )}
    </Paper>
  );
};

export default SpecificationsList;
