import React, { useEffect } from 'react';
import {
    Box,
    CircularProgress,
    Typography,
    Slide,
    Grid,
    Card,
    CardContent,
} from '@mui/material';
import { useTaskStore } from '../store/taskStore';

interface TrelloListsProps {
    selectedCard: string | null;
    setSelectedCard: React.Dispatch<React.SetStateAction<string | null>>
}

const TrelloLists: React.FC<TrelloListsProps> = ({ selectedCard, setSelectedCard }) => {

    const { isLoading, boardLists, getBoardLists } = useTaskStore();

    useEffect(() => {
        getBoardLists();
    }, []);

    const handleCardClick = (id: string) => {
        setSelectedCard(id);
    };

    return (
        <>
            <Typography variant="h6" sx={{ mt: 4, mb: 2, textAlign: 'left' }}>
                Select a list:
            </Typography>

            {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <Grid container spacing={2}>
                    {boardLists.map((item, index) => (
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
        </>
    );
};

export default TrelloLists;