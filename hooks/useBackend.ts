// hooks/useBackend.ts
import { useEffect, useRef, useState } from 'react';

export default function useBackend(
  enabled: boolean,
  script: string,
  onEvent: (e: { event: string; index?: number }) => void
) {
  const sock    = useRef<WebSocket | null>(null);
  const cbRef   = useRef(onEvent);          // always point to latest handler
  cbRef.current = onEvent;

  const [isConnected, setIsConnected] = useState(false);
  const reconnects  = useRef(0);
  const scriptSent  = useRef(false);

  /* ───── connect once per component lifecycle ─────────── */
  useEffect(() => {
    if (!enabled) return;

    // Prevent duplicate sockets
    if (
      sock.current?.readyState === WebSocket.OPEN ||
      sock.current?.readyState === WebSocket.CONNECTING
    )
      return;

    const ws = new WebSocket('ws://127.0.0.1:8000/ws');
    sock.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      reconnects.current = 0;

      if (!scriptSent.current && script) {
        ws.send(JSON.stringify({ type: 'init_script', script }));
        scriptSent.current = true;
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

    ws.onclose = () => setIsConnected(false);
    ws.onerror = (e) => console.error('WS error', e);

    return () => ws.close(1000, 'cleanup');
  }, [enabled, script]);

  /* ───── helpers ──────────────────────────────────────── */
  const send = (payload: unknown) => {
    if (sock.current?.readyState === WebSocket.OPEN) {
      sock.current.send(JSON.stringify(payload));
    }
  };

  return {
    sendTranscript: (text: string) => send({ type: 'transcript', text }),
    sendVAD: (
      status: 'speech_start' | 'silence_start',
      dur?: 'short' | 'long'
    ) => send({ type: 'vad', status, dur }),
    isConnected,
  };
}
