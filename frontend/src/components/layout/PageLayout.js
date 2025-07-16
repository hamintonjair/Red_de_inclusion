import React from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Paper 
} from '@mui/material';

const PageLayout = ({ title, description, children }) => {
  return (
    <Box sx={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      pt: { xs: 2, sm: 4, md: 6 },
      pb: { xs: 2, sm: 4, md: 6 },
      bgcolor: '#e0e0e0' // Usa el color de fondo por defecto del tema

    }}>
      <Container maxWidth="lg">
        <Paper 
          elevation={3} 
          sx={{ 
            p: { xs: 2, sm: 3, md: 4 },
            mb: { xs: 2, sm: 3, md: 4 },
             bgcolor: 'primary.main'
          }}
        >
          <Typography 
            variant="h4" 
            component="h1" 
            gutterBottom 
            sx={{ 
              fontWeight: 600,
              color: '#fff',
              textAlign: 'center'
            }}
          >
            {title}
          </Typography>
          {description && (
            <Typography 
              variant="subtitle1" 
              component="p" 
              sx={{ 
                textAlign: 'center', 
                color: 'text.secondary',
                mb: 3 
              }}
            >
              {description}
            </Typography>
          )}
        </Paper>
        
        {children}
      </Container>
    </Box>
  );
};

export default PageLayout;
