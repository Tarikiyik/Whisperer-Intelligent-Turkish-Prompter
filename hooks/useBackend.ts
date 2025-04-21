import { useEffect, useRef, useState } from "react";

export default function useBackend(
  enabled: boolean,
  script: string,
  onEvent: (e: { event: string; index?: number }) => void
) {
  const sock = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectAttempts = useRef(0);
  const scriptSent = useRef(false);

  // Create a stable connection
  useEffect(() => {
    if (!enabled) return;
    
    console.log("🔄 useBackend: Connection effect running", { enabled, scriptLength: script?.length });

    // Only create a new connection if we don't have one
    if (sock.current?.readyState === WebSocket.OPEN || 
        sock.current?.readyState === WebSocket.CONNECTING) {
      console.log("🟢 WebSocket already connected or connecting, reusing");
      return;
    }

    console.log("🔌 Connecting to backend websocket...");
    const ws = new WebSocket("ws://127.0.0.1:8000/ws");
    sock.current = ws;

    ws.onopen = () => {
      console.log("✅ WebSocket connected");
      setIsConnected(true);
      reconnectAttempts.current = 0;
      
      // Only send the script once
      if (!scriptSent.current && script) {
        console.log("📤 Sending script to backend...");
        const message = JSON.stringify({ type: "init_script", script });
        ws.send(message);
        scriptSent.current = true;
        console.log("✅ Script sent!");
      }
    };

    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        console.log("📩 Received from backend:", data);
        onEvent(data);
      } catch (err) {
        console.error("Error parsing message:", err);
      }
    };

    ws.onerror = (err) => {
      console.error("❌ Backend WS error:", err);
    };

    ws.onclose = (event) => {
      console.log(`⚠️ WebSocket closed: ${event.code} ${event.reason}`);
      setIsConnected(false);
      scriptSent.current = false;
      
      // Auto-reconnect logic (with backoff)
      if (enabled && reconnectAttempts.current < 5) {
        const timeout = Math.min(1000 * (reconnectAttempts.current + 1), 5000);
        console.log(`🔄 Reconnecting in ${timeout}ms (attempt ${reconnectAttempts.current + 1})`);
        
        setTimeout(() => {
          reconnectAttempts.current++;
          // This will trigger a re-render and recreate the connection
          setIsConnected(false);
        }, timeout);
      }
    };

    // Clean up on unmount or dependency change
    return () => {
      console.log("Cleaning up websocket connection");
      if (sock.current) {
        // Only close if it's open
        if (sock.current.readyState === WebSocket.OPEN) {
          sock.current.close(1000, "Component unmounting");
        }
      }
    };
  }, [enabled, script]);

  // Create a stable sendTranscript function
  const sendTranscript = (text: string) => {
    if (!sock.current || sock.current.readyState !== WebSocket.OPEN) {
      console.warn("⚠️ Cannot send transcript - socket not open");
      return;
    }

    try {
      console.log(`📤 Sending transcript: "${text}"`);
      sock.current.send(JSON.stringify({ 
        type: "transcript", 
        text 
      }));
    } catch (error) {
      console.error("❌ Error sending transcript:", error);
    }
  };

  return { sendTranscript, isConnected };
}
