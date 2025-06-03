"use client";

import Image from "next/image";
import { useState, ChangeEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import mammoth from 'mammoth';
import { useAppVAD } from '@/contexts/VADContext';

// Predefined speaking rate options
const speakingRateOptions = [
  { label: "Very Slow", value: 0.5 },
  { label: "Slow", value: 0.75 },
  { label: "Normal", value: 1.0 },
  { label: "Fast", value: 1.25 },
  { label: "Very Fast", value: 1.5 },
];

// Predefined volume level options
const volumeLevelOptions = [
  {value: -16.0 },
  {value: -12.0},
  {value: -8.0},
  {value: -4.0},
  {value: 0.0},
  {value: 4.0},
  {value: 8.0},
  {value: 12.0},
  {value: 16.0}
];

export default function Home() {
  const router = useRouter();
  const [scriptContent, setScriptContent] = useState<string>("");
  const [fileUploaded, setFileUploaded] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [settings, setSettings] = useState({
    tts_voice_name: "tr-TR-Chirp3-HD-Charon",
    tts_speaking_rate: 1.15,
    tts_volume_gain_db: 0.0,
    vad_long_ms: 1500,
    sentence_mode: true,
    interrupt_on_speech: true,
  });
  
  // Get access to VAD context
  const { updateVadSettings } = useAppVAD();

  useEffect(() => {
    // Fetch settings from backend
    fetch("http://localhost:8000/api/settings")
      .then(res => res.json())
      .then(fetchedData => {
        // Snap fetched tts_speaking_rate to the nearest predefined value
        let matchedRate = speakingRateOptions[2].value; // Default value
        if (typeof fetchedData.tts_speaking_rate === 'number') {
          const closestOption = speakingRateOptions.reduce((prev, curr) => 
            Math.abs(curr.value - fetchedData.tts_speaking_rate) < Math.abs(prev.value - fetchedData.tts_speaking_rate) ? curr : prev
          );
          matchedRate = closestOption.value;
        }
        let matchedVolume = volumeLevelOptions[4].value; // Default value
        if (typeof fetchedData.tts_volume_gain_db === 'number') {
          const closestOption = volumeLevelOptions.reduce((prev, curr) => 
            Math.abs(curr.value - fetchedData.tts_volume_gain_db) < Math.abs(prev.value - fetchedData.tts_volume_gain_db) ? curr : prev
          );
          matchedVolume = closestOption.value;
        }

        setSettings(prevSettings => ({ ...prevSettings, ...fetchedData, tts_speaking_rate: matchedRate , tts_volume_gain_db: matchedVolume }));
        if (typeof fetchedData.vad_long_ms === 'number') {
          updateVadSettings(fetchedData.vad_long_ms);
        }
      })
      .catch(err => console.error("Failed to fetch settings:", err));
  }, [updateVadSettings]);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase();
    let text = "";

    try {
      if (ext === "txt") {
        text = await file.text();

      } else if (ext === "docx") {
        const arrayBuffer = await file.arrayBuffer();
        const { value: extracted } = await mammoth.extractRawText({ arrayBuffer });
        text = extracted;

      } else {
        window.alert(`Unsupported file type: ${ext}\nOnly .txt and .docx files are supported.`);
        return;
      }

      setScriptContent(text);
      setFileUploaded(true);

    } catch (err) {
      console.error("Error reading file:", err);
    }
  };

  const handleFileAreaChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setScriptContent(event.target.value);
  };

  const scrollToBottom = () => {
    window.scrollTo({
      top: 1200,
      behavior: "smooth",
    });
  };

  const handleNavigate = () => {
    sessionStorage.setItem("scriptContent", scriptContent);
    sessionStorage.setItem("settings", JSON.stringify(settings));
    router.push("/prompter");
  };

  // Save settings to backend
  const handleSettingsSave = async (updatedSettings: typeof settings) => {
    try {
      const response = await fetch("http://localhost:8000/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedSettings),
      });
      
      if (response.ok) {
        setSettings(updatedSettings);
        updateVadSettings(updatedSettings.vad_long_ms);
        setShowSettings(false);
      } else {
        console.error("Failed to update settings");
      }
    } catch (err) {
      console.error("Error updating settings:", err);
    }
  };

  return (
    <div className="flex flex-col">
      {/* Hero section */}
      <div className="m-8 w-7xl h-72 flex items-center justify-between gap-10 px-6 bg-[#0f172a] rounded-2xl shadow-[0_35px_60px_-15px_rgba(0,0,0,0.5)]">
        <Image
          src="/images/homepage_img1.png"
          alt="Whisperer illustration"
          width={240}
          height={240}
          priority
          className="rounded-xl"
        />
        <div className="text-white text-4xl font-semibold leading-snug max-w-2xl">
          <span className="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
            Whisperer
          </span>{" "}
          helps you follow your script, line by line,
          <br />
          with real-time speech tracking.
        </div>
      </div>

      {/* Feature section */}
      <div className="self-end m-8 w-7xl h-72 flex items-center justify-between gap-10 px-6 bg-[#0f172a] rounded-2xl shadow-[0_35px_60px_-15px_rgba(0,0,0,0.5)]">
        <div className="text-white text-4xl font-semibold leading-snug max-w-2xl">
          Powered by real-time speech recognition and smart Turkish NLP.
        </div>
        <Image
          src="/images/homepage_img2.png"
          alt="Whisperer illustration"
          width={520}
          height={10}
          priority
          className="rounded-xl"
        />
      </div>

      {/* "Try" button */}
      <div className="self-center m-4 mb-32 w-96 h-20 shadow-[0_35px_80px_10px_rgba(0,0,0,0.8)]">
        <button
          onClick={scrollToBottom}
          className="bg-gradient-to-r from-blue-600 to-indigo-700 transition-colors duration-300 hover:from-blue-700 hover:to-indigo-800 cursor-pointer text-2xl font-semibold text-white w-full h-full rounded-lg"
        >
          Try Whisperer
        </button>
      </div>

      {/* Script input */}
      <div
        id="script-section"
        className="self-center m-16 max-h-screen h-[90vh] max-w-full w-[75%]"
      >
        <div className="w-full h-[60vh] flex flex-col items-center">
          <textarea
            placeholder="Paste your script here..."
            className="h-full w-full p-4 bg-[#0f172a] text-gray-200 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-lg"
            value={scriptContent}
            onChange={handleFileAreaChange}
          />
        </div>

        {/* File uploader and Settings*/}
        <div className="mt-4 flex justify-between">
          <div className="w-full">
            <h1 className="text-2xl mb-4">Or you can upload a script file</h1>
            <div className="flex justify-between">
            <input
              type="file"
              accept=".txt,.docx"
              id="file-upload"
              className="hidden"
              onChange={handleFileChange}
            />
            <label
              htmlFor="file-upload"
              className={`cursor-pointer ${
                fileUploaded ? "bg-blue-700" : "bg-[#0f172a]"
              } transition-colors duration-200 hover:bg-blue-600 text-gray-200 rounded-lg border border-gray-700 py-2 px-8`}
            >
              {fileUploaded ? "File uploaded" : "Upload a script file"}
            </label>
            <button 
              onClick={() => setShowSettings(true)}
              className="cursor-pointer bg-[#0f172a] transition-colors duration-200 hover:bg-blue-600 text-gray-200 rounded-lg border border-gray-700 py-2 px-8 flex items-center"
            >
              <span className="material-symbols-outlined mr-2">settings</span>
              Configure Settings
            </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Supports .txt, .docx
            </p>
          </div>
        </div>

        {/* Start button */}
        <div className="mt-8 w-full h-16 flex justify-center">
          <button
            onClick={handleNavigate}
            className="bg-blue-800 transition-colors duration-200 hover:bg-blue-700 w-full h-full cursor-pointer rounded-lg text-lg font-medium"
          >
            Start Prompter
          </button>
        </div>
      </div>

      {/* Settings Container */}
      {showSettings && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50">
          <div className="modal-content rounded-lg shadow-xl p-6 w-[500px] max-w-[90%] max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">Settings</h2>
              <button 
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-white hover:cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                 Voice Selection
                </label>
                <select 
                  value={settings.tts_voice_name}
                  onChange={(e) => setSettings({...settings, tts_voice_name: e.target.value})}
                  className="w-full bg-[#0f172a] text-gray-200 rounded border border-gray-700 p-2 hover:cursor-pointer"
                >
                  <option value="tr-TR-Chirp3-HD-Charon">Charon (Male)</option>
                  <option value="tr-TR-Chirp3-HD-Algieba">Algieba (Male)</option>
                  <option value="tr-TR-Chirp3-HD-Schedar">Schedar (Male)</option>
                  <option value="tr-TR-Chirp3-HD-Kore">Kore (Female)</option>
                  <option value="tr-TR-Chirp3-HD-Laomedeia">Laomedeia (Female)</option>
                  <option value="tr-TR-Chirp3-HD-Vindemiatrix">Vindemiatrix (Female)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1 relative">
                  Voice Speed: {speakingRateOptions.find(opt => opt.value === settings.tts_speaking_rate)?.label || "Normal"}   <span className="absolute group right-0 cursor-pointer text-gray-500">?<span className="absolute bottom-full right-0 mb-2 hidden w-48 rounded bg-black text-white text-xs p-2 group-hover:block">This controls how fast the voice reads text. Move the slider left for slower voice, and right for faster voice.</span></span>
                </label>
                <input 
                  type="range" 
                  min="0" 
                  max={speakingRateOptions.length - 1}
                  step="1"
                  value={speakingRateOptions.findIndex(opt => opt.value === settings.tts_speaking_rate)}
                  onChange={(e) => {
                    const newIndex = parseInt(e.target.value);
                    setSettings({...settings, tts_speaking_rate: speakingRateOptions[newIndex].value });
                  }}
                  className={`w-full ${settings.tts_speaking_rate === 2.0 ? 'accent-red-600' : ''}`}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1 relative">
                  Voice Volume: {volumeLevelOptions.findIndex(opt => opt.value === settings.tts_volume_gain_db) +1} <span className="absolute group right-0 cursor-pointer text-gray-500">?<span className="absolute bottom-full right-0 mb-2 hidden w-68 rounded bg-black text-white text-xs p-2 group-hover:block">This controls the loudness of the voice. Move the slider left to make the voice quieter, and right to make it louder.</span></span>
                </label>
                <input 
                  type="range" 
                  min="0" 
                  max={volumeLevelOptions.length - 1}
                  step="1"
                  value= {volumeLevelOptions.findIndex(opt => opt.value === settings.tts_volume_gain_db)}
                  onChange={(e) => {
                    const newIndex = parseInt(e.target.value);
                    setSettings({...settings, tts_volume_gain_db: volumeLevelOptions[newIndex].value });
                  }}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1 relative">
                  Silence Detection Time(s): {settings.vad_long_ms / 1000} <span className="absolute group right-0 cursor-pointer text-gray-500">?<span className="absolute bottom-full right-0 mb-2 hidden w-68 rounded bg-black text-white text-xs p-2 group-hover:block">How long the app waits after you stop speaking before it considers you have paused and the voice starts reading the current sentence.</span></span>
                </label>
                <input 
                  type="range" 
                  min="800" 
                  max="3000" 
                  step="100"
                  value={settings.vad_long_ms}
                  onChange={(e) => setSettings({...settings, vad_long_ms: parseInt(e.target.value)})}
                  className="w-full"
                />
              </div>
              {/* Interrupt on Speech Toggle Switch */}
              <div className="pt-2">
                <label htmlFor="interrupt-on-speech-toggle" className="flex items-center cursor-pointer">
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      id="interrupt-on-speech-toggle" 
                      className="sr-only" 
                      checked={settings.interrupt_on_speech}
                      onChange={(e) => setSettings({
                        ...settings, 
                        interrupt_on_speech: e.target.checked 
                      })} 
                    />
                    <div className={`block w-10 h-6 rounded-full transition-colors ${settings.interrupt_on_speech ? 'bg-blue-600' : 'bg-gray-600'}`}></div>
                    <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${settings.interrupt_on_speech ? 'translate-x-full' : ''}`}></div>
                  </div>
                  <div className="ml-3 text-sm text-gray-300">
                    Pause the voice when you start speaking
                  </div>
                </label>
                <div className="mt-1 ml-14 text-xs">
                  <p className="text-gray-400">
                    When enabled, the voice will pause reading your script as soon as you start speaking. When disabled, the voice will keep reading even while you are speaking.
                  </p>
                </div>
              </div>
              {/* Sub-sentence Segmentation Mode Toggle Switch */}
              <div className="pt-2">
                <label htmlFor="sub-sentence-mode-toggle" className="flex items-center cursor-pointer">
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      id="sub-sentence-mode-toggle" 
                      className="sr-only" 
                      checked={!settings.sentence_mode}
                      onChange={(e) => setSettings({
                        ...settings, 
                        sentence_mode: !e.target.checked 
                      })} 
                    />
                    <div className={`block w-10 h-6 rounded-full transition-colors ${!settings.sentence_mode ? 'bg-blue-600' : 'bg-gray-600'}`}></div>
                    <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${!settings.sentence_mode ? 'translate-x-full' : ''}`}></div>
                  </div>
                  <div className="ml-3 text-sm text-gray-300">
                    {settings.sentence_mode ? "Enable" : "Disable"} sub-sentence segmentation <span className="italic text-yellow-500">(experimental)</span>
                  </div>
                </label>
                <div className="mt-2 ml-14 text-xs space-y-1">
                  <p className="text-gray-400">
                    Standard operation segments the script by full sentences for optimal stability. Enabling this option activates <strong className="font-medium text-sky-400">experimental sub-sentence segmentation</strong> for more granular control.
                  </p>
                  <div className="p-2 mt-1 rounded-md bg-slate-700/70 border border-slate-600">
                    <p className="text-amber-400">
                      <span className="font-semibold">Important Note:</span> As an experimental feature, sub-sentence mode may occasionally result in minor inaccuracies with speech tracking synchronization.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end gap-3">
              <button 
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 hover:cursor-pointer text-white rounded"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleSettingsSave(settings)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 hover:cursor-pointer text-white rounded"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}