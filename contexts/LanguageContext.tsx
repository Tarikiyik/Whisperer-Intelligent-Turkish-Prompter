"use client"
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

const LanguageContext = createContext<{
  language: string;
  setLanguage: (lang: string) => void;
} | undefined>(undefined);

type LanguageProviderProps = {
  children: ReactNode;
};

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguage] = useState("en");

  useEffect(() => {
    const stored = sessionStorage.getItem("language");
    if (stored) setLanguage(stored);
  }, []);

  useEffect(() => {
    sessionStorage.setItem("language", language);
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
