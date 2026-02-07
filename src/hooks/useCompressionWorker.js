import { useEffect, useState, useRef } from 'react';

export function useCompressionWorker() {
  const workerRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);
  const callbacksRef = useRef(new Map());
  const messageIdRef = useRef(0);

  useEffect(() => {
    
    const worker = new Worker(new URL('../workers/compression.worker.js', import.meta.url), { type: 'module' });
    workerRef.current = worker;

    worker.onmessage = (e) => {
      const { type, result, extension, error, id } = e.data;

      if (type === 'ready') {
        setIsReady(true);
        return;
      }

      if (type === 'error') {
        setError(error);
        const callback = callbacksRef.current.get(id);
        if (callback) {
          callback.reject(new Error(error));
          callbacksRef.current.delete(id);
        }
        return;
      }

      const callback = callbacksRef.current.get(id);
      if (callback) {
        if (type === 'compressed') {
          callback.resolve({ data: result });  
        } else if (type === 'decompressed') {
          callback.resolve({ data: result, extension });
        }
        callbacksRef.current.delete(id);
      }
    };

    worker.onerror = (err) => {
      console.error('Worker error:', err);
      setError(err.message);
    };

    return () => {
      worker.terminate();
    };
  }, []);

  const compress = (data, extension) => {
    if (!isReady) {
      return Promise.reject(new Error('Worker not ready'));
    }

    return new Promise((resolve, reject) => {
      const id = messageIdRef.current++;
      callbacksRef.current.set(id, { resolve, reject });

      const dataCopy = new Uint8Array(data);
      workerRef.current.postMessage(
        { type: 'compress', data: dataCopy, extension, id },
        [dataCopy.buffer]
      );
    });
  };

  const decompress = (data) => {
    if (!isReady) {
      return Promise.reject(new Error('Worker not ready'));
    }

    return new Promise((resolve, reject) => {
      const id = messageIdRef.current++;
      callbacksRef.current.set(id, { resolve, reject });
      
      const dataCopy = new Uint8Array(data);
      workerRef.current.postMessage(
        { type: 'decompress', data: dataCopy, id },
        [dataCopy.buffer]
      );
    });
  };

  return { isReady, error, compress, decompress };
}