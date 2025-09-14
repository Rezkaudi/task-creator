import React, { useState, useEffect } from 'react';
import {
    Container, Typography, Box, Paper, Grid, Card, CardContent,
    alpha, useTheme, Zoom, Fade, Slide,
    CircularProgress
} from '@mui/material';
import TaskInput from './components/TaskInput';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Create a custom theme with beautiful colors
const theme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#6366f1',
            light: '#818cf8',
            dark: '#4f46e5',
        },
        secondary: {
            main: '#ec4899',
            light: '#f472b6',
            dark: '#db2777',
        },
        background: {
            default: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
            paper: '#ffffff',
        },
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h3: {
            fontWeight: 700,
            background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
            backgroundClip: 'text',
            textFillColor: 'transparent',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
        },
    },
    shape: {
        borderRadius: 16,
    },
    components: {
        MuiCard: {
            styleOverrides: {
                root: {
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 12px 28px rgba(0,0,0,0.12)',
                    },
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    borderRadius: 12,
                    fontWeight: 600,
                },
            },
        },
    },
});

const App: React.FC = () => {
    const [data, setData] = useState<any[]>([]);
    const [selectedCard, setSelectedCard] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const TRELLO_API_KEY = import.meta.env.VITE_TRELLO_API_KEY || '';
    const TRELLO_TOKEN = import.meta.env.VITE_TRELLO_TOKEN || '';
    const TRELLO_BOARD_ID = import.meta.env.VITE_TRELLO_BOARD_ID || '';

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(
                    `https://api.trello.com/1/boards/${TRELLO_BOARD_ID}/lists?key=${TRELLO_API_KEY}&token=${TRELLO_TOKEN}`
                );
                const result = await response.json();
                setData(result);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching data:', error);
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleCardClick = (id: string) => {
        setSelectedCard(id);
    };

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Box
                sx={{
                    minHeight: '100vh',
                    background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                    py: 4,
                }}
            >
                <Container maxWidth="md">
                    <Fade in timeout={1000}>
                        <Box sx={{ my: 4, textAlign: 'center' }}>
                            <Typography
                                variant="h3"
                                component="h1"
                                gutterBottom
                                sx={{
                                    fontSize: { xs: '2.5rem', md: '3.5rem' },
                                    mb: 1,
                                }}
                            >
                                Task Creator
                            </Typography>
                            <Slide in timeout={1200} direction="up">
                                <Typography
                                    variant="subtitle1"
                                    color="text.secondary"
                                    paragraph
                                    sx={{ fontSize: '1.1rem', mb: 4 }}
                                >
                                    Transform your ideas into Trello tasks with AI
                                </Typography>
                            </Slide>

                            <Zoom in timeout={800}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: { xs: 3, md: 4 },
                                        mt: 4,
                                        background: 'rgba(255, 255, 255, 0.8)',
                                        backdropFilter: 'blur(10px)',
                                        border: '1px solid rgba(255, 255, 255, 0.5)',
                                        borderRadius: 4,
                                        overflow: 'hidden',
                                        position: 'relative',
                                        '&::before': {
                                            content: '""',
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            height: '6px',
                                            background: 'linear-gradient(90deg, #6366f1 0%, #ec4899 100%)',
                                        }
                                    }}
                                >
                                    <TaskInput selectedListId={selectedCard} />

                                    <Typography variant="h6" sx={{ mt: 4, mb: 2, textAlign: 'left' }}>
                                        Select a list:
                                    </Typography>

                                    {loading ? (
                                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                                            <CircularProgress />
                                        </Box>
                                    ) : (
                                        <Grid container spacing={2}>
                                            {data.map((item, index) => (
                                                <Grid key={item.id}>
                                                    <Slide in timeout={1000 + (index * 100)} direction="up">
                                                        <Card
                                                            onClick={() => handleCardClick(item.id)}
                                                            sx={{
                                                                cursor: 'pointer',
                                                                border: selectedCard === item.id ?
                                                                    '2px solid #6366f1' :
                                                                    '2px solid transparent',
                                                                background: selectedCard === item.id ?
                                                                    'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%)' :
                                                                    'rgba(255, 255, 255, 0.7)',
                                                                boxShadow: selectedCard === item.id ?
                                                                    '0 10px 25px rgba(99, 102, 241, 0.2)' :
                                                                    '0 4px 12px rgba(0,0,0,0.05)',
                                                                borderRadius: 3,
                                                                transition: 'all 0.3s ease',
                                                            }}
                                                        >
                                                            <CardContent sx={{ p: 2.5 }}>
                                                                <Typography
                                                                    variant="h6"
                                                                    component="div"
                                                                    sx={{
                                                                        fontWeight: 600,
                                                                        color: selectedCard === item.id ? '#6366f1' : 'text.primary',
                                                                    }}
                                                                >
                                                                    {item.name}
                                                                </Typography>
                                                            </CardContent>
                                                        </Card>
                                                    </Slide>
                                                </Grid>
                                            ))}
                                        </Grid>
                                    )}
                                </Paper>
                            </Zoom>
                        </Box>
                    </Fade>
                </Container>
            </Box>
        </ThemeProvider>
    );
};

export default App;