"use client";

import Image from "next/image";
import { useState, ChangeEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import mammoth from 'mammoth';
import { useAppVAD } from '@/contexts/VADContext';

export default function Home() {
  const router = useRouter();
  const [scriptContent, setScriptContent] = useState<string>("");
  const [fileUploaded, setFileUploaded] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [settings, setSettings] = useState({
    tts_voice_name: "",
    tts_speaking_rate: 1.0,
    tts_volume_gain_db: 0.0,
    vad_long_ms: 1500,
  });
  
  // Get access to VAD context
  const { updateVadSettings } = useAppVAD();

  useEffect(() => {
    // Fetch settings from backend
    fetch("http://localhost:8000/api/settings")
      .then(res => res.json())
      .then(data => {
        setSettings(data);
        updateVadSettings(data.vad_long_ms);
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

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50">
          <div className="modal-content rounded-lg shadow-xl p-6 w-[500px] max-w-[90%] max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">Settings</h2>
              <button 
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  TTS Voice
                </label>
                <select 
                  value={settings.tts_voice_name}
                  onChange={(e) => setSettings({...settings, tts_voice_name: e.target.value})}
                  className="w-full bg-[#0f172a] text-gray-200 rounded border border-gray-700 p-2"
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
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Speaking Rate: {settings.tts_speaking_rate.toFixed(2)}
                </label>
                <input 
                  type="range" 
                  min="0.5" 
                  max="2.0" 
                  step="0.05"
                  value={settings.tts_speaking_rate}
                  onChange={(e) => setSettings({...settings, tts_speaking_rate: parseFloat(e.target.value)})}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Volume Gain (dB): {settings.tts_volume_gain_db.toFixed(1)}
                </label>
                <input 
                  type="range" 
                  min="-16.0" 
                  max="16.0" 
                  step="0.5"
                  value={settings.tts_volume_gain_db}
                  onChange={(e) => setSettings({...settings, tts_volume_gain_db: parseFloat(e.target.value)})}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  VAD Long Silence (ms): {settings.vad_long_ms}
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
            </div>
            
            <div className="mt-6 flex justify-end gap-3">
              <button 
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleSettingsSave(settings)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
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