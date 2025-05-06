// app/prompter/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import useDeepgramRaw from '@/hooks/useDeepgramRaw';
import useBackend from '@/hooks/useBackend';
import useVAD from '@/hooks/useVAD';
import { useAppVAD }   from '@/contexts/VADContext';
import { segmentScript, sentenceBuckets } from '@/utils/segment_util';

export default function Prompter() {
  /* ───── core state ───────────────────────────────────── */
  const [script, setScript] = useState('');
  const [segments, setSegments] = useState<string[]>([]);
  const [buckets, setBuckets] = useState<number[][]>([]);
  const [lines, setLines] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [started, setStarted] = useState(false);
  const [segIdx, setSegIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  /* scroll refs */
  const scriptRef = useRef<HTMLDivElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);

  /* ───── load script ──────────────────────────────────── */
  useEffect(() => {
    const txt = sessionStorage.getItem('scriptContent') ?? '';
    setScript(txt);

    const segs = segmentScript(txt);
    setSegments(segs);
    setBuckets(sentenceBuckets(segs));
    setReady(true);
  }, []);

  /* ───── WebSocket bridge to backend ──────────────────── */
  const { sendTranscript, sendVAD } = useBackend(
    started && ready,
    script,
    ({ event, index }) => {
      if (event === 'highlight') setSegIdx(index!);
      if (event === 'pause') setPaused(true);
      if (event === 'resume') setPaused(false);
    }
  );

  /* ───── VAD (auto‑starts mic & exposes stream) ────────── */
  const { lastEvent, silenceType } = useVAD(started, sendVAD);
  const { audioStream } = useAppVAD(); 

  /* ───── Deepgram STT hook ────────────────────────────── */
  useDeepgramRaw(
    (txt) => setLines((prev) => [...prev, txt]),
    started,
    sendTranscript,
    audioStream  
  );

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
      // Add warning highlight
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
}