import { useState } from 'react'
import HomePage from './HomePage'
import Box from '@mui/material/Box';
import { createTheme, ThemeProvider } from '@mui/material';

function App() {
  const [mode, setMode] = useState(localStorage.getItem("mode") || "light");

  const toggleTheme = () => {
    setMode((prev) => {
      const newMode = (prev === "light" ? "dark" : "light");
      localStorage.setItem("mode", newMode);
      return newMode;
    });
  };

  const theme = createTheme({
    palette: {
      mode,
      primary: {
        main: mode === 'dark' ? '#B39DDB ' : '#5C3E94',
      },
    },
  })

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ flexGrow: 1 }}>
        <HomePage toggleTheme={toggleTheme}/>
      </Box>
    </ThemeProvider>
  )
}

export default App