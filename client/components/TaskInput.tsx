import React, { useState } from 'react';
import {
    Box,
    TextField,
    Button,
    CircularProgress,
    Alert,
    Snackbar,
    Typography,
    Chip,
    Stack,
} from '@mui/material';
import { Send as SendIcon, CheckCircle as CheckCircleIcon } from '@mui/icons-material';
import { useTaskStore } from '../store/taskStore';

const TaskInput: React.FC = () => {
    const [inputText, setInputText] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);

    const { isLoading, error, lastCreatedTasks, submitTasks, clearError } = useTaskStore();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim()) return;

        const success = await submitTasks(inputText);
        if (success) {
            setInputText('');
            setShowSuccess(true);
        }
    };

    const handleCloseSuccess = () => {
        setShowSuccess(false);
    };

    const placeholderText = `Example:
    - Create a landing page for the new product by next Friday
    - Review and update documentation with high priority
    - Schedule team meeting to discuss Q2 goals`;

    return (
        <Box component="form" onSubmit={handleSubmit}>
            <Typography variant="h6" gutterBottom>
                Describe your tasks
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
                Enter your tasks in natural language. Our AI will extract and structure them for Trello.
            </Typography>

            <TextField
                fullWidth
                multiline
                rows={6}
                variant="outlined"
                placeholder={placeholderText}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={isLoading}
                sx={{ mb: 2 }}
            />

            {error && (
                <Alert severity="error" onClose={clearError} sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={isLoading || !inputText.trim()}
                startIcon={isLoading ? <CircularProgress size={20} /> : <SendIcon />}
            >
                {isLoading ? 'Processing...' : 'Create Tasks in Trello'}
            </Button>

            {lastCreatedTasks.length > 0 && !isLoading && (
                <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>
                        Recently Created Tasks:
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        {lastCreatedTasks.map((task, index) => (
                            <Chip
                                key={index}
                                label={task.title}
                                color="primary"
                                variant="outlined"
                                icon={<CheckCircleIcon />}
                                sx={{ mb: 1 }}
                            />
                        ))}
                    </Stack>
                </Box>
            )}

            <Snackbar
                open={showSuccess}
                autoHideDuration={6000}
                onClose={handleCloseSuccess}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseSuccess} severity="success" variant="filled">
                    Tasks successfully created in Trello!
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default TaskInput;