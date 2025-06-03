"use client"
import { useLanguage } from '@/contexts/LanguageContext';

export default function AboutPage() {
    const { language } = useLanguage();

    return (
      <div className="flex flex-col items-center p-4 min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
  
        <div className="m-8 max-w-6xl w-full flex flex-col items-center justify-center gap-6 p-8 bg-[#0f172a] rounded-2xl shadow-[0_35px_60px_-15px_rgba(0,0,0,0.5)] text-center">
          <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-2">
            {language === "en" ? "About" : "Whisperer"} <span className="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">{language === "en" ? "Whisperer" : "Hakkında"}</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 leading-relaxed max-w-3xl">
            {language === "en" ? "Whisperer is a real-time, Turkish-first prompter platform that fuses cutting-edge STT, NLP, and TTS to keep presenters perfectly synchronized with their script—even when they paraphrase or change pace. Our goal is to let presenters focus on delivery, and not worry about anything else." : "Whisperer, en yeni ses tanıma ve yapay zeka teknolojilerini kullanan, gerçek zamanlı ve Türkçe odaklı bir prompter platformudur. Konuşmacılar, metni değiştirseler ya da farklı bir hızda konuşsalar bile, uygulama metinle senkronizasoyunu korur. Hedefimiz, konuşmacıların yalnızca sunuma odaklanmasını, ve başka şeyleri düşünmemesini sağlamaktır."}
          </p>
        </div>
  
        <div className="m-8 max-w-6xl w-full p-8 bg-[#0f172a] rounded-2xl shadow-[0_35px_60px_-15px_rgba(0,0,0,0.5)] text-center">
          <h2 className="text-3xl font-semibold mb-6">{language === "en" ? "Our Mission" : "Görevimiz"}</h2>
          <p className="text-lg text-gray-300 leading-relaxed max-w-3xl mx-auto">
            {language === "en" ? "To empower clear and confident communication by providing an intelligent, real-time teleprompter solution that adapts to the speaker's pace, ensuring a natural and engaging delivery every time." : "Konuşmacının hızına uyum sağlayan akıllı, gerçek zamanlı bir prompter çözümü sunarak, her seferinde doğal ve etkileyici bir sunum yapılmasını sağlamak ve net, kendinden emin bir iletişimi mümkün kılmak."}
          </p>
        </div>
  
        <div className="m-8 max-w-6xl w-full flex flex-col items-center justify-center gap-6 p-8 bg-[#0f172a] rounded-2xl shadow-[0_35px_60px_-15px_rgba(0,0,0,0.5)] text-center">
           <h2 className="text-3xl font-semibold mb-4">{language === "en" ? "The Technology Behind Whisperer" : "Whisperer'ın Arkasındaki Teknoloji"}</h2>
           <p className="text-lg text-gray-300 leading-relaxed max-w-3xl mb-6">
           {language === "en" ? "Under the hood, Whisperer combines several best-in-class services to keep latency low and alignment precise:" : "Whisperer, düşük gecikme ve hassas senkronizasyon sağlamak için arka planda birden fazla birinci sınıf servisi bir araya getirir:"}
           </p>

           <div className="text-gray-400 space-y-1 text-sm sm:text-base">
             <p>•&nbsp; <span className="text-white">Deepgram&nbsp;Nova-2</span> {language === "en" ? "for" : "ile"} <b>{language === "en" ? "real-time Turkish STT" : "gerçek zamanlı Türkçe STT"}</b></p>
             <p>•&nbsp; <span className="text-white">{language === "en" ? "Fine-tuned LaBSE" : "İnce ayarlı LaBSE"}</span> {language === "en" ? "for" : "ile"} <b>{language === "en" ? "semantic similarity analysis" : "anlamsal benzerlik algılama"}</b></p>
             <p>•&nbsp; <span className="text-white">Google TTS</span> {language === "en" ? "with several voice options for" : "ile Türkçe için çoklu ses seçenekleri"} <b>{language === "en" ? "Turkish TTS" : ""}</b></p>
             <p>•&nbsp; <b>{language === "en" ? "Adaptive segmentation" : "Adaptif segmentasyon"}</b> ({language === "en" ? "sentence" : "cümle"}&nbsp;⇄&nbsp;{language === "en" ? "sub-sentence" : "alt-cümle"}) </p>
             <p>•&nbsp; <b>WebSocket</b> {language === "en" ? "backend" : "arka uç"} (FastAPI&nbsp;+&nbsp;Python) {language === "en" ? "for" : "ile"} ≤ 800 ms {language === "en" ? "latency" : "gecikme"}</p>
             <p>•&nbsp; <b>{language === "en" ? "Voice-Activity Detection" : "Ses Aktivitesi Algılama"}</b> {language === "en" ? "to detect when the presenter is speaking" : "sunucunun ne zaman konuştuğunu algılamak için"}</p>
           </div>
         </div>
  
        <div className="m-8 max-w-6xl w-full p-8 bg-[#0f172a] rounded-2xl shadow-[0_35px_60px_-15px_rgba(0,0,0,0.5)]">
          <h2 className="text-3xl font-semibold mb-8 text-center">{language === "en" ? "Meet the Team" : "Takımımız ile Tanışın"}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            <div className="text-center p-4 bg-[#1e293b] rounded-lg">
              <h3 className="text-xl font-medium mb-1">Çağatay Kahraman</h3>
              <p className="text-gray-400">{language === "en" ? "Developer" : "Geliştirici"}</p>
              <p className="text-sm text-gray-500 mt-2">{language === "en" ? "Responsible for the core functionality including both backend and frontend." : "Hem arka uç hem ön uç kodlarının geliştirilmesi için sorumlu."}</p>
            </div>
             <div className="text-center p-4 bg-[#1e293b] rounded-lg">
               <h3 className="text-xl font-medium mb-1">Tarık Arda İyik</h3>
               <p className="text-gray-400">{language === "en" ? "Developer" : "Geliştirici"}</p>
               <p className="text-sm text-gray-500 mt-2">{language === "en" ? "Responsible for the core functionality including both backend and frontend." : "Hem arka uç hem ön uç kodlarının geliştirilmesi için sorumlu."}</p>
             </div>
             <div className="text-center p-4 bg-[#1e293b] rounded-lg">
               <h3 className="text-xl font-medium mb-1">Ekin İşkol</h3>
               <p className="text-gray-400">{language === "en" ? "Developer" : "Geliştirici"}</p>
               <p className="text-sm text-gray-500 mt-2">{language === "en" ? "Responsible for the core functionality including both backend and frontend." : "Hem arka uç hem ön uç kodlarının geliştirilmesi için sorumlu."}</p>
             </div>
          </div>
        </div>
  
         <div className="self-center m-8 mb-16 w-full max-w-md h-20 shadow-[0_35px_80px_10px_rgba(0,0,0,0.8)]">
           <a href="/#script-section" className="w-full h-full">
             <button className="bg-gradient-to-r from-blue-600 to-indigo-700 transition-colors duration-300 hover:from-blue-700 hover:to-indigo-800 cursor-pointer text-2xl font-semibold text-white w-full h-full rounded-lg">
               {language === "en" ? "Try Whisperer Now" : "Şimdi Whisperer'ı Deneyin"}
             </button>
           </a>
         </div>
  
      </div>
    );
  }