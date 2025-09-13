import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Paper, Grid, Card, CardContent } from '@mui/material';
import TaskInput from './components/TaskInput';

const App: React.FC = () => {
    const [data, setData] = useState<any[]>([]);
    const [selectedCard, setSelectedCard] = useState<string | null>(null);



    const TRELLO_API_KEY = import.meta.env.VITE_TRELLO_API_KEY || '';
    const TRELLO_TOKEN = import.meta.env.VITE_TRELLO_TOKEN || '';
    const TRELLO_BOARD_ID = import.meta.env.TRELLO_BOARD_ID || '';


    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(
                    `https://api.trello.com/1/boards/${TRELLO_BOARD_ID}/lists?key=${TRELLO_API_KEY}&token=${TRELLO_TOKEN}`
                );
                const result = await response.json();
                setData(result);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, []);

    const handleCardClick = (id: string) => {
        setSelectedCard(id);
        console.log(id);
    };

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
                    <TaskInput selectedListId={selectedCard} />
                    <Grid container spacing={2}>
                        {data.map((item) => (
                            <Grid key={item.id}>
                                <Card
                                    onClick={() => handleCardClick(item.id)}
                                    sx={{
                                        cursor: 'pointer',
                                        border: selectedCard === item.id ? '2px solid blue' : 'none',
                                    }}
                                >
                                    <CardContent>
                                        <Typography variant="h6" component="div">
                                            {item.name}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Paper>
            </Box>
        </Container>
    );
};

export default App;