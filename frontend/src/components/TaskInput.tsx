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
    Fade,
    Slide,
} from '@mui/material';
import { Send as SendIcon, CheckCircle as CheckCircleIcon, AutoAwesome } from '@mui/icons-material';
import { useTaskStore } from '../store/taskStore';

interface TaskInputProps {
    selectedListId: string | null;
}

const TaskInput: React.FC<TaskInputProps> = ({ selectedListId }) => {
    const [inputText, setInputText] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);

    const { isLoading, error, lastCreatedTasks, submitTasks, clearError } = useTaskStore();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim()) return;

        if (!selectedListId) {
            alert('Please select a list before submitting a task.');
            return;
        }

        const success = await submitTasks(inputText, selectedListId);
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
            <Fade in timeout={800}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <AutoAwesome sx={{ color: 'primary.main', mr: 1, fontSize: '1.5rem' }} />
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                        Describe your tasks
                    </Typography>
                </Box>
            </Fade>

            <Slide in timeout={1000} direction="up">
                <Typography variant="body2" color="text.secondary" paragraph sx={{ mb: 3 }}>
                    Enter your tasks in natural language. Our AI will extract and structure them for Trello.
                </Typography>
            </Slide>

            <Fade in timeout={1200}>
                <TextField
                    fullWidth
                    multiline
                    rows={6}
                    variant="outlined"
                    placeholder={placeholderText}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    disabled={isLoading}
                    sx={{
                        mb: 3,
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 3,
                            background: 'rgba(255, 255, 255, 0.7)',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                                background: 'rgba(255, 255, 255, 0.9)',
                            },
                            '&.Mui-focused': {
                                background: 'rgba(255, 255, 255, 0.9)',
                                boxShadow: '0 0 0 4px rgba(99, 102, 241, 0.1)',
                            },
                        },
                    }}
                />
            </Fade>

            {error && (
                <Slide in timeout={300} direction="up">
                    <Alert
                        severity="error"
                        onClose={clearError}
                        sx={{
                            mb: 2,
                            borderRadius: 3,
                            alignItems: 'center',
                        }}
                    >
                        {error}
                    </Alert>
                </Slide>
            )}

            <Fade in timeout={1500}>
                <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    fullWidth
                    disabled={isLoading || !inputText.trim()}
                    startIcon={isLoading ? <CircularProgress size={20} /> : <SendIcon />}
                    sx={{
                        py: 1.5,
                        borderRadius: 3,
                        background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
                        boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
                        '&:hover': {
                            boxShadow: '0 6px 20px rgba(99, 102, 241, 0.6)',
                            transform: 'translateY(-2px)',
                        },
                        transition: 'all 0.3s ease',
                    }}
                >
                    {isLoading ? 'Processing with AI...' : 'Create Tasks in Trello'}
                </Button>
            </Fade>

            {lastCreatedTasks.length > 0 && !isLoading && (
                <Slide in timeout={800} direction="up">
                    <Box sx={{ mt: 3 }}>
                        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
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
                                    sx={{
                                        mb: 1,
                                        borderRadius: 2,
                                        background: 'rgba(99, 102, 241, 0.1)',
                                        border: '1px solid rgba(99, 102, 241, 0.2)',
                                        animation: 'pulse 0.5s ease',
                                        '@keyframes pulse': {
                                            '0%': { transform: 'scale(0.95)', opacity: 0.7 },
                                            '50%': { transform: 'scale(1.02)', opacity: 1 },
                                            '100%': { transform: 'scale(1)', opacity: 1 },
                                        }
                                    }}
                                />
                            ))}
                        </Stack>
                    </Box>
                </Slide>
            )}

            <Snackbar
                open={showSuccess}
                autoHideDuration={6000}
                onClose={handleCloseSuccess}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                TransitionComponent={Slide}
            >
                <Alert
                    onClose={handleCloseSuccess}
                    severity="success"
                    variant="filled"
                    sx={{
                        borderRadius: 3,
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    }}
                >
                    Tasks successfully created in Trello!
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default TaskInput;