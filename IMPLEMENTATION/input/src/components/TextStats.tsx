import React from 'react';
import { Box, Chip, Stack } from '@mui/material';

interface TextStatsProps {
  text: string;
}

const TextStats: React.FC<TextStatsProps> = ({ text }) => {
  const stats = {
    characters: text.length,
    words: text.trim() ? text.trim().split(/\s+/).length : 0,
    lines: text.split('\n').length,
  };

  return (
    <Stack direction="row" spacing={2} sx={{ justifyContent: 'center', mt: 1 }}>
      <Chip
        label={`${stats.characters} characters`}
        size="small"
        variant="outlined"
        color="primary"
      />
      <Chip
        label={`${stats.words} words`}
        size="small"
        variant="outlined"
        color="primary"
      />
      <Chip
        label={`${stats.lines} lines`}
        size="small"
        variant="outlined"
        color="primary"
      />
    </Stack>
  );
};

export default TextStats;
