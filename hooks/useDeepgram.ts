// @ts-nocheck
import { useEffect, useRef } from 'react';
import { createClient, LiveTranscriptionEvents } from '@deepgram/sdk';

export default function useDeepgram(onFinal: (line: string) => void) {
  const liveRef  = useRef<ReturnType<
    ReturnType<typeof createClient>['listen']['live']
  > | null>(null);
  const mediaRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    async function bootstrap() {
      if (liveRef.current) return;    

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRef.current = stream;

      const live = createClient(
        process.env.NEXT_PUBLIC_DEEPGRAM_KEY as string
      ).listen.live({
        language: 'tr',
        punctuate: true,
        endpointing: false,
        model: 'nova-2',
        interim_results: true,
        utterance_end_ms: "300",
      });
      liveRef.current = live;

      live.on(LiveTranscriptionEvents.Open, () => {
        const rec = new MediaRecorder(stream, {
          mimeType: 'audio/webm;codecs=opus',
        });
        rec.ondataavailable = (e) =>
          e.data.size && live.getReadyState() === WebSocket.OPEN && live.send(e.data);
        rec.start(150);
      });

      live.on(LiveTranscriptionEvents.Transcript, (r: any) => {
        if (r.is_final) {
          const text = r.channel.alternatives[0]?.transcript.trim();
          if (text) onFinal(text);
        }
      });

      live.on(LiveTranscriptionEvents.Error, console.error);
    }

    bootstrap().catch(console.error);

    return () => {
      liveRef.current?.requestClose();
      mediaRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [onFinal]);
}
