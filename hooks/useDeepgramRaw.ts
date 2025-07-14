// hooks/useDeepgramRaw.ts
import { useEffect, useRef } from 'react';
import { createClient, LiveTranscriptionEvents } from '@deepgram/sdk';

/**
 * Hook that streams microphone audio to Deepgram,
 * calls onFinal(text) for each final transcription,
 * and optionally forwards it to a backend WebSocket.
 */
export default function useDeepgramRaw(
  onFinal: (line: string) => void,
  enabled: boolean,
  backendSend?: (t: string) => void,
  upstream?    : MediaStream | null
) {
  
  // Use refs to store the latest callback functions without triggering effect reruns
  const onFinalRef = useRef(onFinal);
  const backendSendRef = useRef(backendSend);
  
  // Update refs when callbacks change
  useEffect(() => {
    onFinalRef.current = onFinal;
    backendSendRef.current = backendSend;
  }, [onFinal, backendSend]);

  // Main effect that sets up the Deepgram connection
  useEffect(() => {
    if (!enabled) return;                 // STT disabled → nothing to do
    if (!upstream)  return;               // wait until VAD supplies a stream

    // Guard against React 18 dev‑mode double mount
    let alreadyRunning = false;
    let live : ReturnType<ReturnType<typeof createClient>['listen']['live']> | null = null;

    // pick mic source from VAD or upstream prop 
    let stream: MediaStream | null = null; // mic stream from VAD or prop
    let audioCtx: AudioContext | null = null; // audio context for worklet
    let workletNode: AudioWorkletNode | null = null; // worklet node for processing
    let lastTextRef = '';

    async function init() {
      try {
        if (alreadyRunning) return;       // second invocation in StrictMode
        alreadyRunning = true;

        
        /* 1) choose mic source ------------------------------------------ */
        stream = upstream ? upstream.clone()
                          : await navigator.mediaDevices.getUserMedia({ audio: true });

        /* 2) audio context + worklet ------------------------------------ */
        audioCtx = new AudioContext({ sampleRate: 16_000, latencyHint: 'interactive' });
        await audioCtx.audioWorklet.addModule('/worklet-processor.js');

        const micSrc = audioCtx.createMediaStreamSource(stream);
        workletNode  = new AudioWorkletNode(audioCtx, 'pcm-processor');
        micSrc.connect(workletNode);

        /* 3) Deepgram live connection ----------------------------------- */
        const key = process.env.NEXT_PUBLIC_DEEPGRAM_KEY;
        if (!key) throw new Error('Missing NEXT_PUBLIC_DEEPGRAM_KEY');
        const dg  = createClient(key);

        // 4) Open Deepgram live transcription stream
        live = dg.listen.live({
          encoding: 'linear16',
          sample_rate: 16000,
          language: 'tr',
          punctuate: true,
          model: 'nova-2',
          endpointing: 200,
        });

        // 5) Wire up event handlers
        live.on(LiveTranscriptionEvents.Open, () => {
          workletNode!.port.onmessage = ({ data }) => {
            if (live && live.getReadyState() === WebSocket.OPEN) {
              live.send(data);
            }
          };
        });

        live.on(LiveTranscriptionEvents.Transcript, (msg: any) => {
          if (msg.is_final) {
            const text = msg.channel.alternatives[0]?.transcript.trim();
            if (text && text !== lastTextRef) {
              lastTextRef = text;
              onFinalRef.current(text);
              backendSendRef.current?.(text);
            }
          }
        });

        live.on(LiveTranscriptionEvents.Error, (error) => {
          console.error("❌ Deepgram error:", error);
        });

        live.on(LiveTranscriptionEvents.Close, () => {
        });

      } catch (error) {
        console.error("❌ Initialization error:", error);
      }
    }

    init().catch(err => console.error("Failed to initialize:", err));

    // 6) Cleanup function
    return () => {
      if (live) live.requestClose();
      if (workletNode) workletNode.disconnect();
      if (audioCtx) audioCtx.close();
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, [enabled, upstream]); // Only re-run if enabled or upstream changes
}