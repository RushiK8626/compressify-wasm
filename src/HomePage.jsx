import React from 'react';
import Header from './AppBar'
import FileConvertorPanel from './FileConvertorPanel';

import {
    CssBaseline,
    Box,
} from '@mui/material'

function HomePage({ toggleTheme }) {
    return (
        <>
            <CssBaseline />
            <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '85vh' }}>
                <Header toggleTheme={toggleTheme}/>
                
                <Box sx={{ 
                    flexGrow: 1, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center' 
                }}>
                    <FileConvertorPanel />
                </Box>
            </Box>
            
        </>
    )
}

export default HomePage;