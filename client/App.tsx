import React from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';
import TaskInput from './components/TaskInput';

const App: React.FC = () => {
    return (
        <Container maxWidth="md">
            <Box sx={{ my: 4 }}>
                <Typography variant="h3" component="h1" gutterBottom align="center">
                    Task Creator
                </Typography>
                <Typography variant="subtitle1" align="center" color="text.secondary" paragraph>
                    Transform your ideas into Trello tasks with AI
                </Typography>
                <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
                    <TaskInput />
                </Paper>
            </Box>
        </Container>
    );
};

export default App;