import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import en from "../i18n/en";
import hi from "../i18n/hi";

const LANGUAGE_STORAGE_KEY = "@agritrace_language";

const dictionaries = { en, hi };

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState("en");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (saved === "hi" || saved === "en") setLanguage(saved);
      } catch (e) {
        console.log("Failed to load language", e);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const changeLanguage = async (lang) => {
    setLanguage(lang);
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch (e) {
      console.log("Failed to save language", e);
    }
  };

  const t = (key) => {
    const dict = dictionaries[language] || dictionaries.en;
    return dict[key] || dictionaries.en[key] || key;
  };

  if (!loaded) return null;

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}