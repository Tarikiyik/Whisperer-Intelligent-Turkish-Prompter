// hooks/useBackend.ts

import { useEffect, useRef, useState } from 'react';

export default function useBackend(
  enabled: boolean,
  script: string,
  onEvent: (e: { event: string; index?: number }) => void,
  sentenceMode: boolean = false
) {
  const sockRef   = useRef<WebSocket | null>(null);
  const cbRef     = useRef(onEvent);
  const scriptSent = useRef(false);
  const [isConnected, setIsConnected] = useState(false);

  // Always keep cbRef.current up to date
  useEffect(() => {
    cbRef.current = onEvent;
  }, [onEvent]);

  // Establish WebSocket when enabled
  useEffect(() => {
    if (!enabled) return;
    // Avoid duplicate connections
    if (
      sockRef.current?.readyState === WebSocket.OPEN ||
      sockRef.current?.readyState === WebSocket.CONNECTING
    ) {
      return;
    }

    const ws = new WebSocket('ws://127.0.0.1:8000/ws');
    sockRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      if (!scriptSent.current && script) {
        ws.send(JSON.stringify({ 
          type: 'init_script',
          script,
          sentenceMode
        }));        scriptSent.current = true;
      }
    };

    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        cbRef.current(data);
      } catch (err) {
        console.error('WS parse error:', err);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
    };
    ws.onerror = (e) => {
      console.error('WS error', e);
    };

    return () => {
      ws.close(1000, 'cleanup');
    };
  }, [enabled, script, sentenceMode]);

  // Only STT transcripts are sent to the backend now
  const sendTranscript = (text: string) => {
    const ws = sockRef.current;
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'transcript', text }));
    }
  };

  return { sendTranscript, isConnected };
}