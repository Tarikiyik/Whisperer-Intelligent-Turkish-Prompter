"use client"
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import Link from 'next/link';

export default function Navbar() {
    const { language, setLanguage } = useLanguage();

    useEffect(() => {
        sessionStorage.setItem("language", language)
    }, [language])

 return (
    <nav className="flex items-center justify-between p-4 bg-gray-800 text-white w-full h-20">
        <div className='flex items-center justify-between w-full mx-4'>
            <div>
                <Link href="/" >          
                    <Image 
                            src="/images/logo.png" 
                            alt="Logo" 
                            width={200} 
                            height={200} 
                            priority
                        />
                </Link>
            </div>
            <div className="flex gap-10 items-center text-lg font-medium text-gray-100">
                <Link
                    href="/aboutus"
                    className="transition-colors duration-200 hover:text-blue-400 text-2xl"
                >
                    {language === "en" ? "About" : "Hakkımızda"}
                </Link>
                <Link
                    href="/contact"
                    className="transition-colors duration-200 hover:text-blue-400 text-2xl"
                    >
                    {language === "en" ? "Contact" : "İletişim"}
                </Link>
                <div className='flex items-center justify-center text-lg'>
                    <select className='bg-gray-800 text-white text-2xl rounded-md duration-200 hover:text-blue-400 hover:cursor-pointer'
                        onChange={e => setLanguage(e.target.value)}
                        value={language}
                    >
                        <option value="en" className='text-lg'>{language === "en" ? "English" : "İngilizce"}</option>
                        <option value="tr" className='text-lg'>{language === "en" ? "Turkish" : "Türkçe"}</option>
                    </select>
                </div>
            </div>
            

        </div>
    </nav>
      )
}