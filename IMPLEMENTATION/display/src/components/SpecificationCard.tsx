import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  Fade
} from '@mui/material';
import { Specification, SpecificationType, INPUT_TYPE_ICONS } from '../types';

interface SpecificationCardProps {
  specification: Specification;
}

const typeColors: Record<SpecificationType, string> = {
  [SpecificationType.USER_STORY]: '#2196F3',
  [SpecificationType.FUNCTIONAL]: '#4CAF50',
  [SpecificationType.SUCCESS_CRITERIA]: '#FF9800',
  [SpecificationType.NON_FUNCTIONAL]: '#9C27B0',
};

const priorityColors: Record<string, string> = {
  critical: '#F44336',
  high: '#FF9800',
  medium: '#2196F3',
  low: '#9E9E9E'
};

const statusColors: Record<string, string> = {
  draft: '#9E9E9E',
  proposed: '#2196F3',
  approved: '#4CAF50',
  implemented: '#00BCD4',
  rejected: '#F44336'
};

const SpecificationCard: React.FC<SpecificationCardProps> = ({ specification }) => {
  return (
    <Fade in timeout={500}>
      <Card
        elevation={3}
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: 6
          },
          borderLeft: `4px solid ${typeColors[specification.type]}`
        }}
      >
        <CardContent sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <Chip
              label={specification.id}
              size="small"
              sx={{
                backgroundColor: typeColors[specification.type],
                color: 'white',
                fontWeight: 'bold'
              }}
            />
            <Chip
              label={specification.type}
              size="small"
              variant="outlined"
              sx={{
                borderColor: typeColors[specification.type],
                color: typeColors[specification.type],
                fontWeight: 'bold'
              }}
            />
            <Chip
              label={specification.priority}
              size="small"
              sx={{
                backgroundColor: priorityColors[specification.priority] || '#757575',
                color: 'white'
              }}
            />
            <Chip
              label={specification.status}
              size="small"
              sx={{
                backgroundColor: statusColors[specification.status] || '#757575',
                color: 'white'
              }}
            />
          </Box>

          <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
            {specification.title}
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: 2,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {specification.description}
          </Typography>

          {specification.rationale && (
            <Box sx={{ mt: 2, p: 1, bgcolor: 'rgba(0, 0, 0, 0.03)', borderRadius: 1 }}>
              <Typography variant="caption" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                💡 {specification.rationale}
              </Typography>
            </Box>
          )}

          {specification.tags && specification.tags.length > 0 && (
            <Box sx={{ mt: 2, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {specification.tags.map((tag, index) => (
                <Chip
                  key={index}
                  label={tag}
                  size="small"
                  variant="outlined"
                  sx={{ height: '20px', fontSize: '0.7rem' }}
                />
              ))}
            </Box>
          )}

          <Box sx={{ mt: 2, pt: 1, borderTop: '1px solid rgba(0, 0, 0, 0.1)' }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              Version {specification.version} • Updated {new Date(specification.updatedAt).toLocaleDateString()}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Fade>
  );
};

export default SpecificationCard;
