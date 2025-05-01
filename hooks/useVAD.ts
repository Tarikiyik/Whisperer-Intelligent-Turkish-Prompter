import { useEffect, useRef } from 'react';
import { MicVAD } from '@ricky0123/vad-web';

// Use this to track the VAD instance globally across hot reloads
let globalVAD: MicVAD | null = null;
let globalVADStream: MediaStream | null = null;

export default function useVAD(
  started: boolean,
  sendVAD: (status: 'speech_start' | 'silence_start', dur?: 'short' | 'long') => void
) {
  // Use refs to maintain state across renders
  const speakingRef = useRef(false);
  const silenceT = useRef<NodeJS.Timeout | undefined>(undefined);
  const longT = useRef<NodeJS.Timeout | undefined>(undefined);
  const vadInitializedRef = useRef(false);
  
  // Store VAD instances in refs to prevent unnecessary cleanup/reinit
  const vadRef = useRef<MicVAD | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    // Skip if not started yet
    if (!started) return;
    
    // Use global instance if available
    if (globalVAD) {
      console.log("[VAD] Using existing global VAD instance");
      vadRef.current = globalVAD;
      streamRef.current = globalVADStream;
      vadInitializedRef.current = true;
      return;
    }

    // Timing constants
    const SHORT_MS = 500;
    const LONG_MS = 1800;
    
    // Track if this effect instance is cancelled
    let isCancelled = false;

    async function initializeVAD() {
      // Skip if already initialized
      if (vadInitializedRef.current && vadRef.current) {
        console.log("[VAD] Already initialized, using existing instance");
        return;
      }
      
      try {
        console.log("[VAD] Initializing with dedicated stream");
        
        // Create a dedicated stream for VAD
        const vadStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 16000,
            channelCount: 1,
          },
        });
        
        // Store in ref and global for persistence
        streamRef.current = vadStream;
        globalVADStream = vadStream;
        
        // Create the VAD instance with dedicated stream
        const vad = await MicVAD.new({
          stream: vadStream,
          positiveSpeechThreshold: 0.5,
          negativeSpeechThreshold: 0.35,
          preSpeechPadFrames: 5,
          redemptionFrames: 15,
          minSpeechFrames: 5,
          model: 'v5',
          
          onSpeechStart: () => {
            console.log('[VAD] Speech start');
            speakingRef.current = true;
            clearTimeout(silenceT.current);
            clearTimeout(longT.current);
          },
          
          onSpeechEnd: () => {
            console.log('[VAD] Speech end');
            clearTimeout(silenceT.current);
            silenceT.current = setTimeout(() => {
              speakingRef.current = false;        
              sendVAD('silence_start', 'short');
            }, SHORT_MS);

            longT.current = setTimeout(() => {
              if (!speakingRef.current) {
                console.log('[VAD] Long pause');
                sendVAD('silence_start', 'long');
              }
            }, LONG_MS);
          },
        });
        
        // Check if cancelled during async initialization
        if (isCancelled) { 
          console.log("[VAD] Initialization was cancelled, cleaning up");
          vad.pause();
          vadStream.getTracks().forEach(track => track.stop());
          return; 
        }
        
        // Start the VAD
        await vad.start();

        // Add a small delay to let the VAD calibrate
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Store in our refs and global for persistence
        vadRef.current = vad;
        globalVAD = vad;
        
        vadInitializedRef.current = true;
        console.log("[VAD] Successfully started with dedicated stream");
        
      } catch (err) {
        console.error("[VAD] Initialization error:", err);
      }
    }
    
    // Initialize VAD
    initializeVAD();

    // Return cleanup function
    return () => {
      // Skip normal cleanup during component re-renders 
      if (document.visibilityState === 'visible' && !isCancelled) {
        console.log("[VAD] Skipping cleanup during normal re-render");
        return;
      }
      
      // Set cancelled flag
      isCancelled = true;
      
      console.log("[VAD] Cleaning up VAD resources");
      
      // Clean up timeouts
      clearTimeout(silenceT.current);
      clearTimeout(longT.current);
      
      // Clean up VAD if really unmounting
      if (!started) {
        if (vadRef.current) {
          vadRef.current.pause();
          globalVAD = null;
        }
        
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          globalVADStream = null;
        }
        
        vadInitializedRef.current = false;
      }
    };
  }, [started, sendVAD]);

  return { isSpeaking: speakingRef.current };
}