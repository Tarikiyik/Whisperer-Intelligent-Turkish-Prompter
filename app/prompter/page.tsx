// app/prompter/page.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import useDeepgramRaw from '@/hooks/useDeepgramRaw';
import useBackend     from '@/hooks/useBackend';
import {
  segmentScript,
  sentenceBuckets,
} from '@/utils/segment_util';      

export default function Prompter() {
  /* ───── state ─────────────────────────────────────────── */
  const [script, setScript]         = useState('');
  const [segments, setSegments]     = useState<string[]>([]);
  const [buckets,  setBuckets]      = useState<number[][]>([]);
  const [lines,    setLines]        = useState<string[]>([]);

  const [started, setStarted]       = useState(false);
  const [segIdx,  setSegIdx]        = useState(0);   
  const [paused,  setPaused]        = useState(false);
  const [ready,   setReady]         = useState(false);

  /* scroll refs */
  const scriptRef     = useRef<HTMLDivElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);

  /* ───── initial load ──────────────────────────────────── */
  useEffect(() => {
    const scr = sessionStorage.getItem('scriptContent') ?? '';
    setScript(scr);
    const segs = segmentScript(scr);
    setSegments(segs);
    setBuckets(sentenceBuckets(segs));
    setReady(true);
  }, []);

  /* ───── backend socket ────────────────────────────────── */
  const { sendTranscript } = useBackend(
    started && ready,
    script,
    (e) => {
      if (e.event === 'highlight') setSegIdx(e.index!);
      if (e.event === 'pause')     setPaused(true);
      if (e.event === 'resume')    setPaused(false);
    }
  );

  /* ───── microphone / STT ──────────────────────────────── */
  useDeepgramRaw(
    (txt) => setLines(l => [...l, txt]),
    started,
    sendTranscript
  );

  /* ───── scrolling helpers ─────────────────────────────── */
  useEffect(() => {
    if (!scriptRef.current) return;
    const sentIndex = buckets.findIndex(arr => arr.includes(segIdx));
    const target = scriptRef.current.querySelector(
      `[data-sent="${sentIndex}"]`
    );
    target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [segIdx, buckets]);

  useEffect(() => {
    const node = transcriptRef.current?.lastElementChild;
    node?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  /* ───── render ────────────────────────────────────────── */
  return (
    <div className="flex flex-col items-center p-10">
      {script && (
        <div className="w-full max-w-5xl bg-[#0f172a] border border-gray-700 rounded-lg p-4 mb-6">
          {/* script view */}
          <div ref={scriptRef} className="mb-4 leading-7 h-[480px] overflow-y-auto no-scrollbar">
            {buckets.map((segArr, sIdx) => (
              <p
                key={sIdx}
                data-sent={sIdx}
                className="my-2 text-center block mx-auto text-[24px]"
              >
                {segArr.map(i => (
                  <span key={i} className={i === segIdx ? 'highlight' : ''}>
                    {segments[i]}{' '}
                  </span>
                ))}
              </p>
            ))}
          </div>

          {/* live transcript */}
          <div ref={transcriptRef} className="border-t border-gray-700 pt-4 h-24 overflow-y-auto no-scrollbar">
            {lines.length
              ? lines.map((t, i) => <p key={i} className="text-gray-200 mb-2">{t}</p>)
              : <p className="text-gray-500 italic">Transcriptions will appear here…</p>
            }
          </div>

          {paused && <p className="text-red-400 font-semibold mt-3">⏸ Paused — off script</p>}
        </div>
      )}

      {/* controls / status */}
      { !ready
        ? <div className="p-4 bg-yellow-100 text-yellow-800 rounded-lg mt-2 w-96 text-center">Loading script…</div>
        : !script
            ? <div className="p-4 bg-red-100 text-red-800 rounded-lg mt-2 w-96 text-center">No script found! Please go back and upload one.</div>
            : started
                ? <div className="p-4 bg-green-100 text-green-800 rounded-lg mt-2 w-96 text-center">Listening…</div>
                : <button
                    onClick={() => setStarted(true)}
                    className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg mt-2 w-96"
                  >
                    Start Prompter
                  </button>
      }
    </div>
  );
}
