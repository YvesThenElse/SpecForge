import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Chip
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { InputType, INPUT_TYPE_LABELS, INPUT_TYPE_DESCRIPTIONS, INPUT_TYPE_ICONS } from '../types';
import ProcessingSlots from './ProcessingSlots';
import QueueViewer, { QueueItem } from './QueueViewer';
import TextStats from './TextStats';

interface InputAreaProps {
  projectPath: string;
  projectInitialized: boolean;
  onAddToQueue: (text: string, inputType: InputType, promptId?: string) => void;
  queueItems: QueueItem[];
}

const InputArea: React.FC<InputAreaProps> = ({
  projectPath,
  projectInitialized,
  onAddToQueue,
  queueItems
}) => {
  const [text, setText] = useState('');
  const [inputType, setInputType] = useState<InputType>('userStory');

  const handleAnalyze = () => {
    if (!text.trim()) {
      alert('Please enter some text to analyze');
      return;
    }

    if (!projectInitialized) {
      alert('Please select and initialize a project first');
      return;
    }

    onAddToQueue(text.trim(), inputType);
    // Don't clear text yet - let user decide
  };

  const handleClear = () => {
    setText('');
  };

  const isProcessing = queueItems.some(item => item.status === 'processing');

  return (
    <Stack spacing={2}>
      <Paper sx={{ p: 2, bgcolor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)' }}>
        <Typography variant="h6" gutterBottom>
          ✍️ Input Text
        </Typography>

        {/* Specification Type Selector */}
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Specification Type</InputLabel>
          <Select
            value={inputType}
            label="Specification Type"
            onChange={(e) => setInputType(e.target.value as InputType)}
          >
            {(Object.keys(INPUT_TYPE_LABELS) as InputType[]).map((type) => (
              <MenuItem key={type} value={type}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>{INPUT_TYPE_ICONS[type]}</span>
                  <Box>
                    <Typography variant="body1">{INPUT_TYPE_LABELS[type]}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {INPUT_TYPE_DESCRIPTIONS[type]}
                    </Typography>
                  </Box>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Current Selection Display */}
        <Box sx={{ mb: 2 }}>
          <Chip
            label={`${INPUT_TYPE_ICONS[inputType]} ${INPUT_TYPE_LABELS[inputType]}`}
            color="primary"
            sx={{ fontWeight: 'bold' }}
          />
        </Box>

        {/* Text Input */}
        <TextField
          fullWidth
          multiline
          rows={10}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`Enter your ${INPUT_TYPE_LABELS[inputType].toLowerCase()} here...\n\nExample for User Story:\n"As a user, I want to log in to the system so that I can access my personal dashboard."\n\nExample for Functional Requirement:\n"The system shall validate user credentials against the database."`}
          variant="outlined"
          disabled={!projectInitialized}
        />

        {/* Actions */}
        <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              onClick={handleAnalyze}
              disabled={!text.trim() || !projectInitialized || isProcessing}
              startIcon={<SendIcon />}
            >
              {isProcessing ? 'Processing...' : 'Analyze'}
            </Button>
            <Button
              variant="outlined"
              onClick={handleClear}
              disabled={!text}
            >
              Clear
            </Button>
          </Box>

          {!projectInitialized && (
            <Typography variant="caption" color="error">
              Project not initialized
            </Typography>
          )}
        </Box>
      </Paper>

      {/* Text Stats */}
      {text && <TextStats text={text} />}

      {/* Processing Slots */}
      <ProcessingSlots queueItems={queueItems} />

      {/* Queue Viewer */}
      {queueItems.length > 0 && <QueueViewer items={queueItems} />}
    </Stack>
  );
};

export default InputArea;
