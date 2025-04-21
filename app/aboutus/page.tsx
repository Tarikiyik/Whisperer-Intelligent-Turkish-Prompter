export default function AboutPage() {
    return (
      <div className="flex flex-col items-center p-4 min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
  
        <div className="m-8 max-w-6xl w-full flex flex-col items-center justify-center gap-6 p-8 bg-[#0f172a] rounded-2xl shadow-[0_35px_60px_-15px_rgba(0,0,0,0.5)] text-center">
          <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-2">
            About <span className="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">Whisperer</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 leading-relaxed max-w-3xl">
            Whisperer was born from the need for a seamless, intuitive teleprompter experience, enhanced by the power of modern speech technology. We aim to help creators, presenters, and speakers deliver their message flawlessly.
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
           <p className="text-lg text-gray-300 leading-relaxed max-w-3xl mb-4">
             Whisperer leverages cutting-edge, real-time speech recognition to accurately track your voice. Our smart Turkish Natural Language Processing (NLP) algorithms understand the nuances of the language, allowing the script to scroll smoothly and intelligently.
           </p>

           <div className="text-gray-400 space-y-1">
             <p>Real-time Speech-to-Text</p>
             <p>Advanced Turkish NLP</p>
             <p>Smooth Auto-Scrolling</p>
             <p>User-friendly Interface</p>
           </div>
         </div>
  
        <div className="m-8 max-w-6xl w-full p-8 bg-[#0f172a] rounded-2xl shadow-[0_35px_60px_-15px_rgba(0,0,0,0.5)]">
          <h2 className="text-3xl font-semibold mb-8 text-center">Meet the Team</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            <div className="text-center p-4 bg-[#1e293b] rounded-lg">
              <h3 className="text-xl font-medium mb-1">Çağatay Kahraman</h3>
              <p className="text-gray-400">Developer</p>
              <p className="text-sm text-gray-500 mt-2">Responsible for the core functionality and backend.</p>
            </div>
             <div className="text-center p-4 bg-[#1e293b] rounded-lg">
               <h3 className="text-xl font-medium mb-1">Tarık Arda İyik</h3>
               <p className="text-gray-400">Lead Developer</p>
               <p className="text-sm text-gray-500 mt-2">Responsible for the core functionality including both backend and frontend.</p>
             </div>
             <div className="text-center p-4 bg-[#1e293b] rounded-lg">
               <h3 className="text-xl font-medium mb-1">Ekin İşkol</h3>
               <p className="text-gray-400">Developer</p>
               <p className="text-sm text-gray-500 mt-2">Responsible for the core functionality and backend.</p>
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