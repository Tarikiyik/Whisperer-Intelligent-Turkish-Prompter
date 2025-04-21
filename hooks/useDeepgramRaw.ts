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
  backendSend?: (t: string) => void
) {
  useEffect(() => {
    if (!enabled) return;

    let live: ReturnType<ReturnType<typeof createClient>['listen']['live']> | null = null;
    let audioCtx: AudioContext | null = null;
    let workletNode: AudioWorkletNode | null = null;
    let stream: MediaStream | null = null;
    let lastTextRef = '';

    async function init() {
      try {
        console.log("🎤 Starting speech recognition...");

        // 1) Create Deepgram client
        const apiKey = process.env.NEXT_PUBLIC_DEEPGRAM_KEY;
        if (!apiKey) {
          throw new Error("Missing NEXT_PUBLIC_DEEPGRAM_KEY environment variable");
        }
        const dg = createClient(apiKey);
        console.log("✅ Deepgram client created");

        // 2) Set up AudioContext
        audioCtx = new AudioContext({ sampleRate: 16000 });
        console.log(`AudioContext state: ${audioCtx.state}`);
        if (audioCtx.state !== 'running') {
          console.log("Resuming AudioContext...");
          await audioCtx.resume();
          console.log(`AudioContext after resume: ${audioCtx.state}`);
        }

        // 3) Load the AudioWorklet processor
        console.log("Loading audio worklet...");
        await Promise.race([
          audioCtx.audioWorklet.addModule('/worklet-processor.js'),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Worklet load timeout")), 5000)
          ),
        ]);
        console.log("✅ Worklet loaded successfully");

        // 4) Get microphone access
        console.log("Requesting microphone access...");
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log("✅ Microphone access granted");

        // 5) Build audio pipeline (cross-browser safe)
        console.log("Creating audio pipeline...");
        try {
          const micSrc = audioCtx.createMediaStreamSource(stream);
          workletNode = new AudioWorkletNode(audioCtx, 'pcm-processor');
          micSrc.connect(workletNode);
          console.log("✅ Audio pipeline connected");
        } catch (error) {
          console.warn("Non-critical audio pipeline error:", error);
        }

        // 6) Open Deepgram live transcription stream
        console.log("Opening Deepgram connection...");
        live = dg.listen.live({
          encoding: 'linear16',
          sample_rate: 16000,
          language: 'tr',
          punctuate: true,
          model: 'nova-2',
          endpointing: 250,
        });

        // 7) Wire up event handlers
        live.on(LiveTranscriptionEvents.Open, () => {
          console.log("✅ Deepgram connection opened");
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
              console.log("✅ Final transcript:", text);
              lastTextRef = text;
              onFinal(text);
              backendSend?.(text);
            }
          }
        });

        live.on(LiveTranscriptionEvents.Error, (error) => {
          console.error("❌ Deepgram error:", error);
        });

        live.on(LiveTranscriptionEvents.Close, () => {
          console.log("Deepgram connection closed");
        });

      } catch (error) {
        console.error("❌ Initialization error:", error);
      }
    }

    init().catch(err => console.error("Failed to initialize:", err));

    return () => {
      console.log("🧹 Cleaning up resources");
      if (live) live.requestClose();
      if (workletNode) workletNode.disconnect();
      if (audioCtx) audioCtx.close();
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, [onFinal, enabled, backendSend]);
}
