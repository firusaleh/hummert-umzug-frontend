// frontend/src/pages/errors/NotFound.js
import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Home as HomeIcon } from '@mui/icons-material';

const NotFound = () => {
  const navigate = useNavigate();
  
  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      bgcolor: 'background.default',
      p: 3
    }}>
      <Paper elevation={3} sx={{ p: 4, maxWidth: 600, textAlign: 'center' }}>
        <Typography variant="h1" component="h1" sx={{ 
          fontSize: { xs: '5rem', md: '8rem' }, 
          fontWeight: 700, 
          color: 'primary.main'
        }}>
          404
        </Typography>
        
        <Typography variant="h4" component="h2" gutterBottom>
          Seite nicht gefunden
        </Typography>
        
        <Typography variant="body1" sx={{ mb: 4 }}>
          Die angeforderte Seite konnte nicht gefunden werden. Sie wurde möglicherweise entfernt,
          umbenannt oder ist vorübergehend nicht verfügbar.
        </Typography>
        
        <Button
          variant="contained"
          startIcon={<HomeIcon />}
          onClick={() => navigate('/')}
        >
          Zurück zur Startseite
        </Button>
      </Paper>
    </Box>
  );
};

export default NotFound;