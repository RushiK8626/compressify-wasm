import { useState } from 'react';
import Box from '@mui/material/Box';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import { Paper } from "@mui/material";

export default function OptionsRadioGroup({ onChangeSelectedMode }) {

  const [selectedMode, setSelectedMode] = useState(localStorage.getItem("selectedMode") || "compress");

  const handleChangeMode = (e) => {
    const updated = e.target.value;
    onChangeSelectedMode(updated);
    setSelectedMode(updated);
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        mt: 2,
        width: '100%',
        px: { xs: 2, sm: 0 }
      }}
    >
      <Paper
        elevation={3}
        sx={{
          height: 120,
          width: { xs: '100%', sm: 420 },
          maxWidth: 420,
          p: 3,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: 2,
        }}
      >
        <FormControl
          sx={{
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <RadioGroup
            aria-labelledby="demo-row-radio-buttons-group-label"
            name="row-radio-buttons-group"
            value={selectedMode}
            onChange={handleChangeMode}
          >
            <FormControlLabel value="compress" control={<Radio sx={{
              color: 'blue',
              '&.Mui-checked': {
                color: 'blue',
              },
            }}/>} label="Compress any file" />
            <FormControlLabel value="decompress" control={<Radio sx={{
              color: 'green',
              '&.Mui-checked': {
                color: 'green',
              },
            }} />} label="Decompress the compressed .rsk file" />

          </RadioGroup>
        </FormControl>
      </Paper>
    </Box>
  );
}
