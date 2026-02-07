import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  IconButton,
  CircularProgress,
  Snackbar,
  Alert
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import DownloadIcon from "@mui/icons-material/Download";
import CancelIcon from '@mui/icons-material/Cancel';
import OptionsRadioGroup from "./OptionsRadioGroup";

import { useCompressionWorker } from './hooks/useCompressionWorker';
import { useToast } from "./hooks/useToast";

export default function FileConvertorPanel() {

  const [processing, setProcessing] = useState(false);
  const [selectedMode, setSelectedMode] = useState(localStorage.getItem("selectedMode") || "compress");

  const [file, setFile] = useState(null);
  const [processedBlob, setProcessedBlob] = useState(null);
  const [processedFileURL, setProcessedFileURL] = useState(null);
  const [outputFileName, setOutputFileName] = useState(null);

  const { isReady, compress, decompress } = useCompressionWorker();
  const { toast, showToast, handleClose } = useToast();

  useEffect(() => {
    return () => {
      if (processedFileURL) {
        URL.revokeObjectURL(processedFileURL);
      }
    };
  }, [processedFileURL]);

  const handleProcess = async () => {
    if (!file || !isReady) return;

    try {
      setProcessing(true);

      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      if (selectedMode === "compress") {
        const extension = getFileExtension(file.name);
        const result = await compress(uint8Array, extension);
        const blob = new Blob([result.data], { type: "application/octet-stream" });
        const url = URL.createObjectURL(blob);

        setProcessedBlob(blob);
        setProcessedFileURL(url);
        const baseName = getFileBaseName(file.name);
        const outputFileName = baseName + ".rsk";
        setOutputFileName(outputFileName);
        showToast('success', "File Compressed Successfully");
      } else {
        const result = await decompress(uint8Array);
        const blob = new Blob([result.data], { type: "application/octet-stream" });
        const url = URL.createObjectURL(blob);
        
        setProcessedBlob(blob);
        setProcessedFileURL(url);
        const baseName = getFileBaseName(file.name);
        const outputFileName = baseName + ((result.extension) ? result.extension : "");
        setOutputFileName(outputFileName);
        showToast('success', "File Decompressed Successfully");
      }
      setProcessing(false);
    } catch (err) {
      console.error('Processing error:', err);
      showToast('error', 'Failed to process file: ' + err.message);
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!processedBlob || !file || !outputFileName) return

    const url = URL.createObjectURL(processedBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = outputFileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getFileBaseName = (filename) => {
    const dotIndex = filename.lastIndexOf(".");
    const basename = dotIndex !== -1 ? filename.slice(0, dotIndex) : filename;
    return basename;
  }

  const getFileExtension = (filename) => {
    const dotIndex = filename.lastIndexOf(".");
    const extension = dotIndex !== -1 ? filename.slice(dotIndex) : "";
    return extension;
  }

  const changeSelectedMode = (Mode) => {
    if (processing) return;
    setSelectedMode(Mode);
    setFile(null);
    setProcessedBlob(null);
    setProcessedFileURL(null);
    setOutputFileName(null);
    localStorage.setItem("selectedMode", Mode);
  }

  const handleUpload = (e) => {
    setFile(e.target.files[0]);
    setProcessedBlob(null);
    setProcessedFileURL(null);
  };

  const formatFileSize = (bytes, decimals = 2) => {
    if (!bytes || bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    const value = bytes / Math.pow(k, i);

    return `${parseFloat(value.toFixed(decimals))} ${sizes[i]}`;
  }

  const calculateReduction = () => {
    if (!file) return 0;

    const reduction = (1 - processedBlob.size / file.size) * 100;

    return Number(reduction.toFixed(2));
  }

  return (
    <>
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        py: 4
      }}>
        {/* Toast */}
        <Snackbar
          open={toast.open}
          autoHideDuration={3000} 
          onClose={handleClose}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          sx={{ mt: 8 }}
        >
          <Alert
            onClose={handleClose}
            severity={toast.severity}
            variant="filled"
          >
            {toast.message}
          </Alert>
        </Snackbar>

        {/* Options Section */}
        <Box component="main"
          sx={{
            mt: 6,
            mb: 6,
            mx: { xs: 2, sm: 4, md: 10 },
            display: 'flex',
            justifyContent: 'center',
            width: '100%',
          }}
        >
          <OptionsRadioGroup onChangeSelectedMode={changeSelectedMode} />
        </Box>

        {/* Panels Section */}
        <Box sx={{
          px: { xs: 2, sm: 4 },
          display: 'flex',
          justifyContent: 'center',
          width: '100%',
          flexGrow: 0
        }}>
          <Grid
            container
            spacing={{ xs: 2, sm: 4 }}
            sx={{
              maxWidth: 1000,
              width: '100%',
              justifyContent: 'center',
              alignItems: 'stretch',
              margin: 0
            }}
          >
            {/* Upload Panel */}
            <Grid size={{ xs: 12, md: 6 }} sx={{ display: 'flex' }}>
              <Paper
                elevation={4}
                sx={{
                  width: '100%',
                  minHeight: 280,
                  p: 4,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 2.5,
                  borderRadius: 2,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6
                  }
                }}
              >
                <Typography variant="h5" fontWeight={600}>
                  Upload File
                </Typography>

                <Button
                  component="label"
                  variant="outlined"
                  size="large"
                  startIcon={<UploadFileIcon />}
                  sx={{
                    minWidth: 180,
                    py: 1.5,
                    borderWidth: 2,
                    '&:hover': { borderWidth: 2 }
                  }}
                >
                  Choose File
                  <input
                    hidden
                    type="file"
                    disabled={processing}
                    accept={selectedMode === "decompress" ? ".rsk" : ""}
                    onChange={handleUpload}
                  />
                </Button>

                {file && (
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    maxWidth: '100%'
                  }}>
                    <Typography
                      variant="body2"
                      sx={{
                        maxWidth: '250px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {file.name}
                    </Typography>
                    <IconButton
                      color="error"
                      size="small"
                      onClick={() => {
                        setFile(null);
                        setProcessedBlob(null);
                        setProcessedFileURL(null);
                        setOutputFileName(null);
                      }}
                      disabled={processing}
                      sx={{
                        '&:hover': {
                          backgroundColor: 'error.light',
                          color: 'white'
                        }
                      }}
                    >
                      <CancelIcon fontSize="small" />
                    </IconButton>
                  </Box>
                )}

                {file &&
                  <Typography
                    variant="body2"
                    sx={{
                      maxWidth: '100%',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      px: 2
                    }}
                  >
                    {`File Size: ${formatFileSize(file.size)}`}
                  </Typography>
                }

                <Button
                  variant="contained"
                  size="large"
                  disabled={!file || processing || !isReady}
                  onClick={handleProcess}
                  sx={{
                    minWidth: 180,
                    py: 1.5
                  }}
                >
                  {processing ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box
                        sx={{
                          width: 20,
                          height: 20,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <CircularProgress
                          color="success"
                          size={20}
                          thickness={5}
                        />
                      </Box>
                      <span>{selectedMode === "compress" ? "Compressing..." : "Decompressing..."}</span>
                    </Box>
                  ) : (
                    selectedMode === "compress" ? "Compress" : "Decompress"
                  )}
                </Button>
              </Paper>
            </Grid>

            {/* Download Panel */}
            <Grid size={{ xs: 12, md: 6 }} sx={{ display: 'flex' }}>
              <Paper
                elevation={4}
                sx={{
                  width: '100%',
                  minHeight: 280,
                  p: 4,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 2.5,
                  borderRadius: 2,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6
                  }
                }}
              >
                <Typography variant="h5" fontWeight={600} textAlign='center'>
                  Download Output
                </Typography>

                {outputFileName && processedBlob ? (
                  <Box sx={{
                    mt: 4,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    maxWidth: '100%'
                  }}>
                    <Typography
                      variant="body2"
                      sx={{
                        maxWidth: '250px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {outputFileName}
                    </Typography>
                    <IconButton
                      color="error"
                      size="small"
                      onClick={() => {
                        setProcessedBlob(null);
                        setProcessedFileURL(null);
                        setOutputFileName(null);
                      }}
                      sx={{
                        '&:hover': {
                          backgroundColor: 'error.light',
                          color: 'white'
                        }
                      }}
                    >
                      <CancelIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ) : null}

                {outputFileName && processedBlob && (
                  <>
                    <Typography
                      variant="body2"
                      sx={{
                        maxWidth: '100%',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        px: 2,
                      }}
                    >
                      Output File Size:{' '}
                      <span
                        style={{
                          color: processedBlob.size < file.size ? '#00FF00' : '#FF0000',
                          fontWeight: 600,
                        }}
                      >
                        {formatFileSize(processedBlob.size)}
                      </span>
                    </Typography>

                    {selectedMode === "compress" && (
                      <Typography variant="body2" sx={{ px: 2 }}>
                        <span
                          style={{
                            color: processedBlob.size < file.size ? '#00FF00' : '#FF0000',
                            fontWeight: 600,
                          }}
                        >
                          {calculateReduction()}
                        </span>
                        {' '}% Reduction
                      </Typography>

                    )}
                  </>
                )}

                <Button
                  variant="contained"
                  size="large"
                  startIcon={<DownloadIcon />}
                  disabled={!processedFileURL}
                  onClick={handleDownload}
                  sx={{
                    minWidth: 180,
                    py: 1.5
                  }}
                >
                  Download
                </Button>

                {!processedBlob && (
                  <Typography variant="body2" color="text.secondary">
                    No output yet
                  </Typography>
                )}
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </>
  );
}