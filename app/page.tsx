"use client";

import Image from "next/image";
import { useState, ChangeEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import mammoth from 'mammoth';

export default function Home() {
  const router = useRouter();
  const [scriptContent, setScriptContent] = useState<string>("");
  const [fileUploaded, setFileUploaded] = useState<boolean>(false);

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
    router.push("/prompter");
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

      {/* “Try” button */}
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

        {/* File uploader */}
        <div className="mt-4">
          <h1 className="text-2xl mb-4">Or you can upload a script file</h1>
          <input
            type="file"
            accept=".txt,.docx,.pdf"
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
          <p className="text-xs text-gray-500 mt-2">
            Supports .txt, .docx
          </p>
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
    </div>
  );
}







