"use client"
import { useLanguage } from '@/contexts/LanguageContext';

export default function ContactPage() {
  const { language } = useLanguage();

  
    return (
      <div className="flex flex-col items-center p-4 min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
  
        <div className="m-8 max-w-6xl w-full flex flex-col items-center justify-center gap-6 p-8 bg-[#0f172a] rounded-2xl shadow-[0_35px_60px_-15px_rgba(0,0,0,0.5)] text-center">
          <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-2">
            {language === "en" ? "Contact" : "Bizimle"} <span className="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">{language === "en" ? "İletişime Geçin" : "İletişime Geçin"}</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 leading-relaxed max-w-3xl">
            {language === "en" ? "Have questions, feedback, or need support? We'd love to hear from you. Fill out the form below or reach out using the details provided." : "Sorularınız, geri bildirimleriniz veya destek ihtiyacınız mı var? Formu doldurun veya verilen ayrıntıları kullanarak hemen iletişime geçin."}
          </p>
        </div>
  

        <div className="m-8 max-w-4xl w-full p-8 bg-[#0f172a] rounded-2xl shadow-[0_35px_60px_-15px_rgba(0,0,0,0.5)]">
          <h2 className="text-3xl font-semibold mb-8 text-center">{language === "en" ? "Send Us a Message" : "Bize bir mesaj gönderin"}</h2>
          <form className="space-y-6" >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">{language === "en" ? "Name" : "İsim"}</label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  required

                  className="w-full p-3 bg-[#1e293b] text-gray-200 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={language === "en" ? "Your Name" : "İsiminiz"}
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  required

                  className="w-full p-3 bg-[#1e293b] text-gray-200 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="your.email@example.com"
                />
              </div>
            </div>
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-1">{language === "en" ? "Subject" : "Konu"}</label>
              <input
                type="text"
                name="subject"
                id="subject"

                className="w-full p-3 bg-[#1e293b] text-gray-200 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={language === "en" ? "Subject of your message" : "Mesajınızın konusu"}
              />
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-1">{language === "en" ? "Message" : "Mesaj"}</label>
              <textarea
                name="message"
                id="message"
                rows={6}
                required

                className="w-full p-3 bg-[#1e293b] text-gray-200 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder={language === "en" ? "Enter your message here..." : "Mesajınızı buraya yazın..."}
              ></textarea>
            </div>
            <div className="text-center">
              <button
                type="submit"
                className="bg-gradient-to-r from-blue-600 to-indigo-700 transition-colors duration-300 hover:from-blue-700 hover:to-indigo-800 disabled:opacity-50 cursor-pointer text-lg font-semibold text-white py-3 px-8 rounded-lg"
              >
                {language === "en" ? "Send Message" : "Mesaj gönder"}
              </button>
            </div>

          </form>
        </div>
  
        <div className="m-8 max-w-6xl w-full p-8 bg-[#0f172a] rounded-2xl shadow-[0_35px_60px_-15px_rgba(0,0,0,0.5)] text-center">
          <h2 className="text-3xl font-semibold mb-6">{language === "en" ? "Other Ways to Reach Us" : "Bizimle iletişime geçmenin diğer yolları"}</h2>
          <div className="flex flex-col md:flex-row justify-center items-center gap-8 text-gray-300">
            <div>
              <h3 className="text-xl font-medium mb-1">Email</h3>
              <a href="mailto:support@whisperer.app" className="text-blue-400 hover:text-blue-300">support@whisperer.app</a>
            </div>
          </div>
        </div>
  
      </div>
    );
  }