// app/prompter/page.tsx
'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import useDeepgramRaw from '@/hooks/useDeepgramRaw';
import useBackend from '@/hooks/useBackend';

export default function Prompter() {
  const [lines, setLines] = useState<string[]>([]);
  const [started, setStarted] = useState(false);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState<number>(0);
  const [paused, setPaused] = useState(false);
  const [scriptContent, setScriptContent] = useState('');
  const [scriptReady, setScriptReady] = useState(false);

  // Add ref for the script container and transcript log
  const scriptContainerRef = useRef<HTMLDivElement>(null);
  const transcriptLogRef = useRef<HTMLDivElement>(null);

  // Auto-scroll effect when highlighted text changes
  useEffect(() => {
    if (scriptContainerRef.current) {
      const highlightedElement = scriptContainerRef.current.querySelector('.highlight');
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }
  }, [currentSentenceIndex]);

  // Auto-scroll effect for the transcript log
  useEffect(() => {
    if (lines.length > 0 && transcriptLogRef.current) {
      const lastLine = transcriptLogRef.current.lastElementChild;
      if (lastLine) {
        lastLine.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [lines.length]);

  // Get script content only on client-side after component mounts
  useEffect(() => {
    const storedScript = sessionStorage.getItem('scriptContent') || '';
    console.log(
      "Retrieved script from session storage:",
      storedScript ? `${storedScript.length} chars` : "none"
    );
    setScriptContent(storedScript);
    setScriptReady(true);
  }, []);

  // Open the backend WS, send init_script, and listen for events
  const { sendTranscript, isConnected } = useBackend(
    started && scriptReady,
    scriptContent,
    (e) => {
      console.log("Backend event:", e);
      if (e.event === 'highlight') setCurrentSentenceIndex(e.index!);
      if (e.event === 'pause') setPaused(true);
      if (e.event === 'resume') setPaused(false);
    }
  );

  // Start button event handler
  const handleStart = useCallback(() => {
    if (!scriptContent) {
      alert("No script content found! Please go back and upload a script.");
      return;
    }
    setStarted(true);
  }, [scriptContent]);

  // Handle transcriptions
  const handleTranscription = useCallback((sentence: string) => {
    console.log("Transcription:", sentence);
    setLines((prev) => [...prev, sentence]);
  }, []);

  // Use the DeepgramRaw hook for transcription
  useDeepgramRaw(handleTranscription, started, sendTranscript);

  return (
    <div className="flex flex-col items-center p-10">
      {/* Main prompter container - always visible when script is loaded */}
      {scriptContent && (
        <div className="w-full max-w-5xl bg-[#0f172a] border border-gray-700 rounded-lg p-4 mb-6">
          {/* Script with highlighted current sentence */}
          <div
            ref={scriptContainerRef}
            className="mb-4 leading-7 h-[480px] overflow-y-auto no-scrollbar"
          >
            {scriptContent
              .split(/(?<=[.!?])\s+/)
              .map((sentence, idx) => (
                <p
                  key={idx}
                  className={`my-2 text-center block mx-auto text-[24px] ${
                    idx === currentSentenceIndex ? 'highlight' : ''
                  }`}
                >
                  {sentence + ' '}
                </p>
              ))}
          </div>

          {/* Transcription log */}
          <div
            className="border-t border-gray-700 pt-4 h-24 overflow-y-auto no-scrollbar"
            ref={transcriptLogRef}
          >
            {lines.length > 0 ? (
              lines.map((l, i) => (
                <p key={i} className="text-gray-200 mb-2">
                  {l}
                </p>
              ))
            ) : (
              <p className="text-gray-500 italic">
                Transcriptions will appear here...
              </p>
            )}
          </div>

          {/* Pause indicator */}
          {paused && (
            <p className="text-red-400 font-semibold mt-3">
              ⏸ Paused — off script
            </p>
          )}
        </div>
      )}

      {/* Status indicators moved to the bottom */}
      {!scriptReady ? (
        <div className="p-4 bg-yellow-100 text-yellow-800 rounded-lg mt-2 w-96 text-center">
          Loading script...
        </div>
      ) : !scriptContent ? (
        <div className="p-4 bg-red-100 text-red-800 rounded-lg mt-2 w-96 text-center">
          No script found! Please go back and upload a script.
        </div>
      ) : started ? (
        <div className="p-4 bg-green-100 text-green-800 rounded-lg mt-2 w-96 text-center">
          Listening...
        </div>
      ) : (
        /* Start button only shown when ready but not started */
        <button
          onClick={handleStart}
          className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg mt-2 w-96"
        >
          Start Prompter
        </button>
      )}
    </div>
  );
}
