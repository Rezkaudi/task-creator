import {
    Container,
    Typography,
    Box,
    Paper,
    Zoom,
    Fade,
    Slide,
} from '@mui/material';
import TaskInput from '../components/TaskInput';
import { useState } from 'react';
import TrelloLists from '../components/TrelloLists';

const Home = () => {

    const [selectedCard, setSelectedCard] = useState<string | null>(null);

    return (
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
                                <TrelloLists selectedCard={selectedCard} setSelectedCard={setSelectedCard} />
                            </Paper>
                        </Zoom>
                    </Box>
                </Fade>
            </Container>
        </Box>
    )
};

export default Home;
