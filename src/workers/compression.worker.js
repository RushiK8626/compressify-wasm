// Web Worker for file compression using WASM
/* eslint-disable no-restricted-globals */

let wasm = null;
let initializationError = null;
let initPromise = null;

const initWasm = async () => {
  try {
    const baseUrl = self.location.origin;

    const wasmModule = await import(/* webpackIgnore: true */ `${baseUrl}/wasm/file-compressor.js`);
    const ModuleFactory = wasmModule.default;

    if (typeof ModuleFactory !== 'function') {
      throw new Error('Module factory not found');
    }

    // Initialize WASM
    wasm = await ModuleFactory({
      locateFile: (path) => {
        if (path.endsWith('.wasm')) {
          return `${baseUrl}/wasm/file-compressor.wasm`;
        }
        return path;
      },
      print: (text) => console.log('WASM stdout:', text),
      printErr: (text) => console.error('WASM stderr:', text),
    });

    self.postMessage({ type: 'ready' });
    return wasm;
  } catch (err) {
    console.error('WASM init error:', err);
    initializationError = err.message;
    self.postMessage({
      type: 'error',
      error: 'Failed to initialize WASM: ' + err.message
    });
    throw err;
  }
};

// Initialize on worker start
initPromise = initWasm();

// Handle messages from main thread
self.onmessage = async (e) => {
  const { type, data, extension, id } = e.data;

  try {
    // Wait for initialization
    if (!wasm) {
      if (initializationError) {
        self.postMessage({
          type: 'error',
          error: 'Worker init failed: ' + initializationError,
          id
        });
        return;
      }
      await initPromise;
    }

    if (!wasm) {
      self.postMessage({
        type: 'error',
        error: 'WASM module not loaded',
        id
      });
      return;
    }

    if (type === 'compress') {
      // Ensure we have a proper Uint8Array
      const inputData = data instanceof Uint8Array ? data : new Uint8Array(data);

      let resultArray;

      // Try Embind style first
      if (typeof wasm.Compress === 'function') {
        try {
          const result = wasm.Compress(inputData, extension);
          // Copy the result to a new Uint8Array to ensure it's independent of WASM memory
          if (result instanceof Uint8Array) {
            resultArray = new Uint8Array(result.length);
            resultArray.set(result);
          } else if (result && typeof result.length === 'number') {
            // Handle TypedArray-like objects from Emscripten
            const len = result.length;
            resultArray = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
              resultArray[i] = result[i];
            }
          } else {
            throw new Error('Unexpected result type from Compress');
          }
        } catch (wasmErr) {
          console.error('WASM Compress error:', wasmErr);
          throw new Error('Compression failed: ' + (wasmErr.message || wasmErr));
        }
      }
      // Try C-style with ccall
      else if (typeof wasm.ccall === 'function') {
        const dataPtr = wasm._malloc(inputData.length);
        wasm.HEAPU8.set(inputData, dataPtr);

        const outLenPtr = wasm._malloc(4);
        const resultPtr = wasm.ccall(
          'CompressC',
          'number',
          ['number', 'number', 'string', 'number'],
          [dataPtr, inputData.length, extension, outLenPtr]
        );

        const resultLen = wasm.getValue(outLenPtr, 'i32');
        resultArray = new Uint8Array(wasm.HEAPU8.buffer, resultPtr, resultLen).slice();

        wasm._free(dataPtr);
        wasm._free(outLenPtr);
      } else {
        throw new Error('No compress function found');
      }

      self.postMessage(
        { type: 'compressed', 
          result: resultArray, 
          id 
        },
        [resultArray.buffer]
      );

    } else if (type === 'decompress') {
      const inputData = data instanceof Uint8Array ? data : new Uint8Array(data);
      let resultData, resultExtension;

      // Try Embind style
      if (typeof wasm.Decompress === 'function') {
        try {
          const result = wasm.Decompress(inputData);
          resultExtension = result.extension;

          // Copy the data to a new Uint8Array
          const rawData = result.data;
          if (rawData instanceof Uint8Array) {
            resultData = new Uint8Array(rawData.length);
            resultData.set(rawData);
          } else if (rawData && typeof rawData.length === 'number') {
            const len = rawData.length;
            resultData = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
              resultData[i] = rawData[i];
            }
          } else {
            throw new Error('Unexpected data type from Decompress');
          }
        } catch (wasmErr) {
          console.error('WASM Decompress error:', wasmErr);
          throw new Error('Decompression failed: ' + (wasmErr.message || wasmErr));
        }
      }
      // Try C-style
      else if (typeof wasm.ccall === 'function') {
        const dataPtr = wasm._malloc(inputData.length);
        wasm.HEAPU8.set(inputData, dataPtr);

        const outLenPtr = wasm._malloc(4);
        const outExtPtr = wasm._malloc(4);

        const resultPtr = wasm.ccall(
          'DecompressC',
          'number',
          ['number', 'number', 'number', 'number'],
          [dataPtr, inputData.length, outLenPtr, outExtPtr]
        );

        const resultLen = wasm.getValue(outLenPtr, 'i32');
        const extPtr = wasm.getValue(outExtPtr, 'i32');

        resultData = new Uint8Array(wasm.HEAPU8.buffer, resultPtr, resultLen).slice();
        resultExtension = wasm.UTF8ToString(extPtr);

        wasm._free(dataPtr);
        wasm._free(outLenPtr);
        wasm._free(outExtPtr);
      } else {
        throw new Error('No decompress function found');
      }

      self.postMessage(
        {
          type: 'decompressed',
          result: resultData,
          extension: resultExtension,
          id
        },
        [resultData.buffer]
      );
    }
  } catch (err) {
    console.error('Worker error:', err);
    self.postMessage({
      type: 'error',
      error: err.message,
      id
    });
  }
};

self.addEventListener('error', (event) => {
  console.error('Worker global error:', event);
  self.postMessage({
    type: 'error',
    error: 'Worker error: ' + (event.message || 'Unknown')
  });
  event.preventDefault();
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('Worker unhandled rejection:', event);
  self.postMessage({
    type: 'error',
    error: 'Promise rejection: ' + (event.reason || 'Unknown')
  });
  event.preventDefault();
});