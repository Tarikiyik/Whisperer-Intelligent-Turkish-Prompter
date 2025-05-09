// app/prompter/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import useDeepgramRaw from '@/hooks/useDeepgramRaw';
import useBackend from '@/hooks/useBackend';
import useVAD from '@/hooks/useVAD';
import { useAppVAD } from '@/contexts/VADContext';
import { usePromptPlayer } from '@/hooks/usePromptPlayer';
import { segmentScript, sentenceBuckets } from '@/utils/segment_util';
import dynamic from 'next/dynamic';

const Prompter = () => {
  /* ───── core state ───────────────────────────────────── */
  const [script, setScript] = useState('');
  const [segments, setSegments] = useState<string[]>([]);
  const [buckets, setBuckets] = useState<number[][]>([]);
  const [lines, setLines] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [started, setStarted] = useState(false);
  const [segIdx, setSegIdx] = useState(0);

  /* scroll refs */
  const scriptRef = useRef<HTMLDivElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);

  /* Get access to VAD context */
  const { updateVadSettings } = useAppVAD();

  /* ───── load script ──────────────────────────────────── */
  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return;
    
    const txt = sessionStorage.getItem('scriptContent') ?? '';
    setScript(txt);

    /* Load settings*/
    const settingsJson = sessionStorage.getItem('settings');
    if (settingsJson) {
      try {
        const settings = JSON.parse(settingsJson);
        if (settings.vad_long_ms) {
          updateVadSettings(settings.vad_long_ms);
        }
      } catch (err) {
        console.error("Error parsing settings:", err);
      }
    }

    const segs = segmentScript(txt);
    setSegments(segs);
    setBuckets(sentenceBuckets(segs));
    setReady(true);
  }, [updateVadSettings]);

  // 1) websocket bridge—only transcript & highlight events
  const { sendTranscript } = useBackend(
    started && ready,
    script,
    ({ event, index }) => {
      if (event === 'highlight') {
        setSegIdx(index!);
      }
    }
  );

  // 2) VAD hook—no sendVAD anymore
  const { lastEvent, silenceType } = useVAD(started);
  const { audioStream } = useAppVAD(); 

  // 3) STT → SpeechMonitor hook
  useDeepgramRaw(
    (txt) => setLines((prev) => [...prev, txt]),
    started,
    sendTranscript,
    audioStream  
  );

  // 4) Prompt hook—play TTS audio
  const { playPrompt, stopPrompt } = usePromptPlayer();

  // Play first segment when "Start Prompter" is clicked
  useEffect(() => {
    if (started) {
      playPrompt(0);
    }
  }, [started]);

  // 5) On long silence, play segIdx+1 prompt
  useEffect(() => {
    if (started && lastEvent === 'silence_long') {
      if (segIdx < segments.length) {
        playPrompt(segIdx);
      }
    }
  }, [lastEvent, started, segIdx, segments.length, playPrompt]);

  /* ───── interrupt if user speaks ────────────────────── */
  useEffect(() => {
    if (started && lastEvent === 'speech_start') {
      stopPrompt();
    }
  }, [lastEvent, started, stopPrompt]);
  
  /* ───── scrolling helpers ────────────────────────────── */
  useEffect(() => {
    if (!scriptRef.current) return;
    const bucketIdx = buckets.findIndex((arr) => arr.includes(segIdx));
    scriptRef.current
      .querySelector(`[data-sent="${bucketIdx}"]`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [segIdx, buckets]);

  useEffect(() => {
    transcriptRef.current?.lastElementChild?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  useEffect(() => {
    if (!started) return;
    
    // Get references to elements
    const transcriptEl = transcriptRef.current;
    const scriptEl = scriptRef.current;
    
    if (!transcriptEl || !scriptEl) return;
    
    // For speech start - smooth pulse effect
    if (lastEvent === 'speech_start') {
      transcriptEl.classList.add('highlight-speech');
      setTimeout(() => {
        transcriptEl.classList.remove('highlight-speech');
      }, 1000); // Adjust the duration for the pulse effect
    }
    
    // For long silence - persistent warning
    if (silenceType === 'long') {
      scriptEl.classList.add('warn-silence');
    } else {
      // Remove warning when no longer in long silence
      scriptEl.classList.remove('warn-silence');
    }
  }, [lastEvent, silenceType, started]);

  /* ───── UI ───────────────────────────────────────────── */
  return (
    <div className="flex flex-col items-center p-10">
      {script && (
        <div className="w-full max-w-5xl bg-[#0f172a] border border-gray-700 rounded-lg p-4 mb-6">
          {/* script view */}
          <div
            ref={scriptRef}
            className="mb-4 leading-7 h-[480px] overflow-y-auto no-scrollbar"
          >
            {buckets.map((segArr, sIdx) => (
              <p key={sIdx} data-sent={sIdx} className="my-2 text-center text-[24px]">
                {segArr.map((i) => (
                  <span key={i} className={i === segIdx ? 'highlight' : ''}>
                    {segments[i]}{' '}
                  </span>
                ))}
              </p>
            ))}
          </div>

          {/* live transcript */}
          <div
            ref={transcriptRef}
            className="border-t border-gray-700 pt-4 h-24 overflow-y-auto no-scrollbar"
          >
            {lines.length
              ? lines.map((t, i) => (
                  <p key={i} className="text-gray-200 mb-2">
                    {t}
                  </p>
                ))
              : <p className="text-gray-500 italic">Transcriptions will appear here…</p>}
          </div>
        </div>
      )}

      {/* controls / status */}
      {!ready ? (
        <div className="p-4 bg-yellow-100 text-yellow-800 rounded-lg mt-2 w-96 text-center">
          Loading script…
        </div>
      ) : !script ? (
        <div className="p-4 bg-red-100 text-red-800 rounded-lg mt-2 w-96 text-center">
          No script found! Please go back and upload one.
        </div>
      ) : started ? (
        <div className="p-4 bg-green-100 text-green-800 rounded-lg mt-2 w-96 text-center">
          Listening…
        </div>
      ) : (
        <button
          onClick={() => setStarted(true)}
          className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg mt-2 w-96"
        >
          Start Prompter
        </button>
      )}
    </div>
  );
};

// Use dynamic import to skip SSR
export default dynamic(() => Promise.resolve(Prompter), {
  ssr: false
});