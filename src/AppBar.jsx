import { useState } from "react";
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from "@mui/material/IconButton";
import NightlightRoundIcon from "@mui/icons-material/NightlightRound";
import WbSunnyRoundedIcon from "@mui/icons-material/WbSunnyRounded";


export default function Header({ toggleTheme }) {

  const [mode, setMode] = useState(localStorage.getItem("mode") || "light");

  const handleThemeChange = () => {
    setMode((prev) => (prev === "light") ? "dark" : "light")
    toggleTheme();
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="fixed" enableColorOnDark>
        <Toolbar sx={{ justifyContent: 'space-between', gap: 1 }}>
          <Box sx={{ width: { xs: 0, sm: 48 }, flexShrink: 0 }} />
          
          <Typography
            variant="h6"
            component="div"
            sx={{
              fontFamily: 'Roboto, Arial, Helvetica, "Segoe UI", sans-serif',
              fontWeight: 1000,
              fontSize: 25,
              flexGrow: 1,
              textAlign: 'center',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              minWidth: 0
            }}
          >
            Compressify
          </Typography>

          <IconButton
            onClick={handleThemeChange}
            color="inherit"
            sx={{ flexShrink: 0 }}
          >
            {mode === "light" ? <WbSunnyRoundedIcon /> : <NightlightRoundIcon />}
          </IconButton>
        </Toolbar>
      </AppBar>
    </Box>
  );
}
