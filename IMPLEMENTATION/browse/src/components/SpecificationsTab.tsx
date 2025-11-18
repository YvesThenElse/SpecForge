import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Stack,
  Chip,
  Typography,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import RefreshIcon from '@mui/icons-material/Refresh';
import { Specification, SpecificationType, INPUT_TYPE_ICONS, INPUT_TYPE_LABELS } from '../types';

interface SpecificationsTabProps {
  projectPath: string;
  specifications: Specification[];
  onRefresh: () => void;
}

const TYPE_COLORS: Record<SpecificationType, string> = {
  [SpecificationType.USER_STORY]: '#2196F3',
  [SpecificationType.FUNCTIONAL]: '#4CAF50',
  [SpecificationType.SUCCESS_CRITERIA]: '#FF9800',
  [SpecificationType.NON_FUNCTIONAL]: '#9C27B0',
};

const PRIORITY_COLORS: Record<string, string> = {
  critical: '#F44336',
  high: '#FF9800',
  medium: '#2196F3',
  low: '#4CAF50',
};

const STATUS_COLORS: Record<string, string> = {
  draft: '#9E9E9E',
  proposed: '#2196F3',
  approved: '#4CAF50',
  implemented: '#00BCD4',
  rejected: '#F44336',
};

const SpecificationsTab: React.FC<SpecificationsTabProps> = ({
  projectPath,
  specifications,
  onRefresh
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<SpecificationType[]>([]);
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  const filteredSpecifications = useMemo(() => {
    return specifications.filter((spec) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          spec.id.toLowerCase().includes(query) ||
          spec.title.toLowerCase().includes(query) ||
          spec.description.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Type filter
      if (selectedTypes.length > 0 && !selectedTypes.includes(spec.type)) {
        return false;
      }

      // Priority filter
      if (selectedPriority && spec.priority !== selectedPriority) {
        return false;
      }

      // Status filter
      if (selectedStatus && spec.status !== selectedStatus) {
        return false;
      }

      return true;
    });
  }, [specifications, searchQuery, selectedTypes, selectedPriority, selectedStatus]);

  const handleTypeChange = (event: SelectChangeEvent<SpecificationType[]>) => {
    const value = event.target.value;
    setSelectedTypes(typeof value === 'string' ? [] : value);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedTypes([]);
    setSelectedPriority('');
    setSelectedStatus('');
  };

  const stats = useMemo(() => {
    const byType: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    const byStatus: Record<string, number> = {};

    specifications.forEach((spec) => {
      byType[spec.type] = (byType[spec.type] || 0) + 1;
      byPriority[spec.priority] = (byPriority[spec.priority] || 0) + 1;
      byStatus[spec.status] = (byStatus[spec.status] || 0) + 1;
    });

    return { byType, byPriority, byStatus };
  }, [specifications]);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header and Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack spacing={2}>
          <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
            <Typography variant="h6">
              📋 Specifications ({filteredSpecifications.length} of {specifications.length})
            </Typography>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={onRefresh}
              size="small"
            >
              Refresh
            </Button>
          </Stack>

          {/* Stats */}
          <Stack direction="row" spacing={2} flexWrap="wrap">
            {Object.entries(stats.byType).map(([type, count]) => (
              <Chip
                key={type}
                label={`${INPUT_TYPE_ICONS[type.toLowerCase() === 'user_story' ? 'userStory' : type.toLowerCase() === 'success_criteria' ? 'successCriteria' : type.toLowerCase() === 'non_functional' ? 'nonFunctional' : 'functional']} ${type}: ${count}`}
                size="small"
                sx={{
                  bgcolor: TYPE_COLORS[type as SpecificationType],
                  color: 'white'
                }}
              />
            ))}
          </Stack>

          {/* Search and Filters */}
          <Stack direction="row" spacing={2}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search specifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <ClearIcon
                      sx={{ cursor: 'pointer' }}
                      onClick={() => setSearchQuery('')}
                    />
                  </InputAdornment>
                ),
              }}
            />

            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Type</InputLabel>
              <Select
                multiple
                value={selectedTypes}
                label="Type"
                onChange={handleTypeChange}
                renderValue={(selected) =>
                  selected.length === 0 ? 'All' : `${selected.length} selected`
                }
              >
                {Object.values(SpecificationType).map((type) => (
                  <MenuItem key={type} value={type}>
                    {INPUT_TYPE_ICONS[type.toLowerCase() === 'user_story' ? 'userStory' : type.toLowerCase() === 'success_criteria' ? 'successCriteria' : type.toLowerCase() === 'non_functional' ? 'nonFunctional' : 'functional']} {type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Priority</InputLabel>
              <Select
                value={selectedPriority}
                label="Priority"
                onChange={(e) => setSelectedPriority(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="critical">Critical</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="low">Low</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={selectedStatus}
                label="Status"
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="proposed">Proposed</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="implemented">Implemented</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="outlined"
              onClick={handleClearFilters}
              size="small"
            >
              Clear
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* Specifications Grid */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        <Grid container spacing={2}>
          {filteredSpecifications.map((spec) => (
            <Grid item xs={12} sm={6} md={4} key={spec.id}>
              <Card sx={{ height: '100%', borderLeft: `4px solid ${TYPE_COLORS[spec.type]}` }}>
                <CardContent>
                  <Stack spacing={1}>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      <Chip
                        label={spec.id}
                        size="small"
                        sx={{
                          bgcolor: TYPE_COLORS[spec.type],
                          color: 'white',
                          fontWeight: 'bold'
                        }}
                      />
                      <Chip
                        label={spec.type}
                        size="small"
                        variant="outlined"
                        sx={{ borderColor: TYPE_COLORS[spec.type] }}
                      />
                      <Chip
                        label={spec.priority}
                        size="small"
                        sx={{ bgcolor: PRIORITY_COLORS[spec.priority], color: 'white' }}
                      />
                      <Chip
                        label={spec.status}
                        size="small"
                        sx={{ bgcolor: STATUS_COLORS[spec.status], color: 'white' }}
                      />
                    </Stack>

                    <Typography variant="subtitle1" fontWeight="bold">
                      {spec.title}
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                      {spec.description}
                    </Typography>

                    {spec.rationale && (
                      <Typography variant="caption" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                        💡 {spec.rationale}
                      </Typography>
                    )}

                    {spec.tags && spec.tags.length > 0 && (
                      <Stack direction="row" spacing={0.5} flexWrap="wrap">
                        {spec.tags.map((tag, index) => (
                          <Chip
                            key={index}
                            label={tag}
                            size="small"
                            variant="outlined"
                            sx={{ height: '20px', fontSize: '0.7rem' }}
                          />
                        ))}
                      </Stack>
                    )}

                    <Typography variant="caption" color="text.secondary">
                      v{spec.version} • Updated {new Date(spec.updatedAt).toLocaleDateString()}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {filteredSpecifications.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              No specifications found. {searchQuery || selectedTypes.length > 0 || selectedPriority || selectedStatus ? 'Try adjusting your filters.' : 'Use the Input interface to create specifications.'}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default SpecificationsTab;
