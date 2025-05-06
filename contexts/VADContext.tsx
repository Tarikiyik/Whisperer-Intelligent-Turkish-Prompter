// contexts/VADContext.tsx
'use client';
import {
  createContext, useContext, useState, useRef,
  useEffect, useCallback, ReactNode
} from 'react';
import { MicVAD } from '@ricky0123/vad-web';

type Silence = 'short' | 'long' | null;
type LastEvt = 'speech_start' | 'silence_short' | 'silence_long' | null;

interface VADContextShape {
    // reactive state
    isSpeaking  : boolean;
    silenceType : Silence;
    lastEvent   : LastEvt;
    audioStream : MediaStream | null;    // expose the real mic stream

    // controls
    start : () => Promise<void>;
    stop  : () => void;
  }

const VADContext = createContext<VADContextShape | null>(null);

// Timing constants
const SHORT_MS =  500;
const LONG_MS  = 2500;

export function VADProvider({ children }: { children: ReactNode }) {
  // reactive state exposed to consumers
  const [isSpeaking,  setIsSpeaking ] = useState(false);
  const [silenceType, setSilenceType] = useState<Silence>(null);
  const [lastEvent,   setLastEvent  ] = useState<LastEvt>(null);
  const [audioStream, setAudioStream] = useState<MediaStream|null>(null);

  // mutable refs that survive re‑renders 
  const vadRef       = useRef<MicVAD | null>(null);
  const streamRef    = useRef<MediaStream | null>(null);
  const speakingRef  = useRef(false);
  const silenceT = useRef<NodeJS.Timeout | undefined>(undefined);
  const longT = useRef<NodeJS.Timeout | undefined>(undefined);

  // create & start VAD only once
  const start = useCallback(async () => {
    if (vadRef.current) return; // already started

    // 1. One getUserMedia call for the whole app
    const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation : true,
          noiseSuppression : true,
          autoGainControl  : true,
          sampleRate       : 16_000,
          channelCount     : 1,
        },
      });
      streamRef.current = stream;
      setAudioStream(stream);  

    // 2️. Initialise MicVAD on the same stream
    const vad = await MicVAD.new({
      stream,
      model: 'v5',
      positiveSpeechThreshold : 0.50,
      negativeSpeechThreshold : 0.35,
      preSpeechPadFrames      : 5,
      redemptionFrames        : 15,
      minSpeechFrames         : 5,

      onSpeechStart() {
        if (speakingRef.current) return;
        speakingRef.current = true;
        setIsSpeaking(true);
        setSilenceType(null);
        setLastEvent('speech_start');
        console.log('[VAD] speech_start');
        clearTimeout(silenceT.current);
        clearTimeout(longT.current);
      },

      onSpeechEnd() {
        if (!speakingRef.current) return;
        clearTimeout(silenceT.current);

        silenceT.current = setTimeout(() => {
          speakingRef.current = false;
          setIsSpeaking(false);
          setSilenceType('short');
          setLastEvent('silence_short');
          console.log('[VAD] silence_short');
        }, SHORT_MS);

        longT.current = setTimeout(() => {
          if (!speakingRef.current) {
            setSilenceType('long');
            setLastEvent('silence_long');
            console.log('[VAD] silence_long');
          }
        }, LONG_MS);
      }
    });

    await vad.start();
    vadRef.current = vad;
    console.log('[VAD] started');
  }, []);

  // stop VAD (pause + free mic)
  const stop = useCallback(() => {
    clearTimeout(silenceT.current); 
    clearTimeout(longT.current);

    vadRef.current?.pause();                                // release the worklet / worker
    vadRef.current = null;

    streamRef.current?.getTracks().forEach(t => t.stop());  // stop the mic stream
    streamRef.current = null;                               // release the stream ref
    setAudioStream(null);                                   // release the stream

    speakingRef.current = false;    // reset the speaking flag
    setIsSpeaking(false);           // reset the speaking state
    setSilenceType(null);           // reset the silence type
    setLastEvent(null);             // reset the last event

    console.log('[VAD] stopped & mic released');
  }, []);

  // provider cleanup (rare)
  useEffect(() => stop, [stop]);

  // context value 
  const ctx: VADContextShape = {
    isSpeaking, silenceType, lastEvent,
    audioStream,
    start, stop,
  };
  return <VADContext.Provider value={ctx}>{children}</VADContext.Provider>;
}

// Convenience hook
export function useAppVAD() {
  const ctx = useContext(VADContext);
  if (!ctx) throw new Error('useAppVAD() must be used inside <VADProvider>');
  return ctx;
}
