export default function AboutPage() {
    return (
      <div className="flex flex-col items-center p-4 min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
  
        <div className="m-8 max-w-6xl w-full flex flex-col items-center justify-center gap-6 p-8 bg-[#0f172a] rounded-2xl shadow-[0_35px_60px_-15px_rgba(0,0,0,0.5)] text-center">
          <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-2">
            About <span className="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">Whisperer</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 leading-relaxed max-w-3xl">
          Whisperer is a real-time, Turkish-first prompter platform that fuses cutting-edge STT, NLP, and TTS to keep presenters perfectly synchronized with their script—even when they paraphrase or change pace. Our goal is to let creators focus on delivery, not scrolling.
          </p>
        </div>
  
        <div className="m-8 max-w-6xl w-full p-8 bg-[#0f172a] rounded-2xl shadow-[0_35px_60px_-15px_rgba(0,0,0,0.5)] text-center">
          <h2 className="text-3xl font-semibold mb-6">Our Mission</h2>
          <p className="text-lg text-gray-300 leading-relaxed max-w-3xl mx-auto">
            To empower clear and confident communication by providing an intelligent, real-time teleprompter solution that adapts to the speaker's pace, ensuring a natural and engaging delivery every time.
          </p>
        </div>
  
        <div className="m-8 max-w-6xl w-full flex flex-col items-center justify-center gap-6 p-8 bg-[#0f172a] rounded-2xl shadow-[0_35px_60px_-15px_rgba(0,0,0,0.5)] text-center">
           <h2 className="text-3xl font-semibold mb-4">The Technology Behind Whisperer</h2>
           <p className="text-lg text-gray-300 leading-relaxed max-w-3xl mb-6">
           Under the hood, Whisperer combines several best-in-class services &nbsp;to keep latency low and alignment precise:
           </p>

           <div className="text-gray-400 space-y-1 text-sm sm:text-base">
             <p>•&nbsp; <span className="text-white">Deepgram&nbsp;Nova-2</span> for <b>real-time Turkish STT</b></p>
             <p>•&nbsp; <span className="text-white">Fine-tuned BERTurk</span> for <b>semantic similarity</b></p>
             <p>•&nbsp; <span className="text-white">Google TTS</span> with several voice options for <b>Turkish TTS</b></p>
             <p>•&nbsp; <b>Adaptive segmentation</b> (sentence&nbsp;⇄&nbsp;sub-sentence) </p>
             <p>•&nbsp; <b>WebSocket</b> backend (FastAPI&nbsp;+&nbsp;Python) for ≤ 400 ms latency</p>
             <p>•&nbsp; <b>Voice-Activity Detection</b> to detect when the presenter is speaking</p>
           </div>
         </div>
  
        <div className="m-8 max-w-6xl w-full p-8 bg-[#0f172a] rounded-2xl shadow-[0_35px_60px_-15px_rgba(0,0,0,0.5)]">
          <h2 className="text-3xl font-semibold mb-8 text-center">Meet the Team</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            <div className="text-center p-4 bg-[#1e293b] rounded-lg">
              <h3 className="text-xl font-medium mb-1">Çağatay Kahraman</h3>
              <p className="text-gray-400">Developer</p>
              <p className="text-sm text-gray-500 mt-2">Responsible for the core functionality including both backend and frontend.</p>
            </div>
             <div className="text-center p-4 bg-[#1e293b] rounded-lg">
               <h3 className="text-xl font-medium mb-1">Tarık Arda İyik</h3>
               <p className="text-gray-400">Developer</p>
               <p className="text-sm text-gray-500 mt-2">Responsible for the core functionality including both backend and frontend.</p>
             </div>
             <div className="text-center p-4 bg-[#1e293b] rounded-lg">
               <h3 className="text-xl font-medium mb-1">Ekin İşkol</h3>
               <p className="text-gray-400">Developer</p>
               <p className="text-sm text-gray-500 mt-2">Responsible for the core functionality including both backend and frontend.</p>
             </div>
          </div>
        </div>
  
         <div className="self-center m-8 mb-16 w-full max-w-md h-20 shadow-[0_35px_80px_10px_rgba(0,0,0,0.8)]">
           <a href="/#script-section" className="w-full h-full">
             <button className="bg-gradient-to-r from-blue-600 to-indigo-700 transition-colors duration-300 hover:from-blue-700 hover:to-indigo-800 cursor-pointer text-2xl font-semibold text-white w-full h-full rounded-lg">
               Try Whisperer Now
             </button>
           </a>
         </div>
  
      </div>
    );
  }