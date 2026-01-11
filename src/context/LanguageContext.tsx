// src/context/LanguageContext.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

type Language = 'id' | 'en';

interface Translations {
  id: any;
  en: any;
}

const translations: Translations = {
  id: {
    // Main Page
    appTitle: 'NGITUNG',
    appSubtitle: 'Kelola Usaha Dengan Mudah',
    searchPlaceholder: 'Cari catatan usaha...',
    emptyTitle: 'Belum Ada Catatan Perhitungan',
    emptySubtitle: 'Mulai dengan menambahkan catatan usaha baru Anda',
    createNoteButton: 'Buat Catatan Baru',
    sellingPrice: 'Harga Jual',
    bpp: 'BPP',
    profit: 'Profit',
    saved: 'Disimpan',
    today: 'Hari ini',
    yesterday: 'Kemarin',
    daysAgo: 'hari lalu',
    weeksAgo: 'minggu lalu',
    
    // Modal
    createNewNote: 'Buat Catatan Baru',
    createNewNoteSubtitle: 'Mulai catat usaha Anda dengan nama yang mudah diingat',
    businessName: 'Nama Usaha',
    businessNamePlaceholder: 'Contoh: Bakso Ayam, ...',
    cancel: 'Batal',
    createNote: 'Buat Catatan',
    settings: 'Pengaturan',
    colorBadge: 'Warna Badge',
    deleteNote: 'Hapus Catatan',
    close: 'Tutup',
    
    // Onboarding
    onboardingTitle1: 'Selamat Datang di NGITUNG',
    onboardingDesc1: 'Aplikasi pintar untuk menghitung Biaya Pokok Produksi (BPP) dan menganalisis profit usaha Anda dengan mudah dan akurat.',
    onboardingTitle2: 'Hitung BPP dengan Akurat',
    onboardingDesc2: 'Masukkan biaya tetap dan variabel, tentukan margin keuntungan, lalu dapatkan harga jual optimal dan analisis break-even point.',
    onboardingTitle3: 'Analisis & Simulasi Bisnis',
    onboardingDesc3: 'Lihat komposisi biaya dalam pie chart, simulasikan kenaikan bahan baku, dan dapatkan rekomendasi strategi pricing yang tepat.',
    onboardingTitle4: 'Siap Memulai?',
    onboardingDesc4: 'Mari optimalkan strategi pricing dan tingkatkan profitabilitas usaha Anda bersama NGITUNG.',
    skip: 'Lewati',
    next: 'Lanjut',
    getStarted: 'Mulai Sekarang',
    notReady: 'Belum Siap',
  },
  en: {
    // Main Page
    appTitle: 'NGITUNG',
    appSubtitle: 'Manage Your Business Easily',
    searchPlaceholder: 'Search business notes...',
    emptyTitle: 'No Calculation Notes Yet',
    emptySubtitle: 'Start by adding your new business note',
    createNoteButton: 'Create New Note',
    sellingPrice: 'Selling Price',
    bpp: 'COGS',
    profit: 'Profit',
    saved: 'Saved',
    today: 'Today',
    yesterday: 'Yesterday',
    daysAgo: 'days ago',
    weeksAgo: 'weeks ago',
    
    // Modal
    createNewNote: 'Create New Note',
    createNewNoteSubtitle: 'Start recording your business with a memorable name',
    businessName: 'Business Name',
    businessNamePlaceholder: 'Example: Chicken Meatball, ...',
    cancel: 'Cancel',
    createNote: 'Create Note',
    settings: 'Settings',
    colorBadge: 'Badge Color',
    deleteNote: 'Delete Note',
    close: 'Close',
    
    // Onboarding
    onboardingTitle1: 'Welcome to NGITUNG',
    onboardingDesc1: 'Smart app to calculate Cost of Goods Sold (COGS) and analyze your business profit easily and accurately.',
    onboardingTitle2: 'Calculate COGS Accurately',
    onboardingDesc2: 'Enter fixed and variable costs, set profit margin, then get optimal selling price and break-even point analysis.',
    onboardingTitle3: 'Business Analysis & Simulation',
    onboardingDesc3: 'View cost composition in pie chart, simulate raw material increases, and get the right pricing strategy recommendations.',
    onboardingTitle4: 'Ready to Start?',
    onboardingDesc4: 'Let\'s optimize your pricing strategy and increase your business profitability with NGITUNG.',
    skip: 'Skip',
    next: 'Next',
    getStarted: 'Get Started',
    notReady: 'Not Ready',
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: any;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('id');

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem('app_language');
      if (savedLanguage === 'id' || savedLanguage === 'en') {
        setLanguageState(savedLanguage);
      }
    } catch (error) {
      console.error('Failed to load language:', error);
    }
  };

  const setLanguage = async (lang: Language) => {
    try {
      await AsyncStorage.setItem('app_language', lang);
      setLanguageState(lang);
    } catch (error) {
      console.error('Failed to save language:', error);
    }
  };

  const t = translations[language];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
