import React, { createContext, useContext, useState, useEffect } from 'react';

const translations = {
  en: {
    // Navigation
    dashboard: 'Dashboard',
    deals: 'Deals',
    services: 'Services',
    insights: 'Insights',
    messages: 'Messages',
    billing: 'Billing',
    profile: 'Profile',
    logout: 'Logout',
    signIn: 'Sign In',
    getStarted: 'Get Started',
    aiAssistant: 'AI Assistant',
    setLocation: 'Set Location',
    
    // Common
    search: 'Search',
    filter: 'Filter',
    save: 'Save',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    submit: 'Submit',
    loading: 'Loading...',
    viewAll: 'View All',
    viewDetails: 'View Details',
    contact: 'Contact',
    
    // Landing
    welcomeTitle: 'Manage Your Property Assets',
    welcomeSubtitle: 'Everything you need to maximize property value and streamline operations',
    
    // Deals
    allDeals: 'View All Deals',
    propertyDeals: 'Property Deals',
    serviceDeals: 'Service Deals',
    findDeals: 'Find Deals Near You',
    
    // Services
    findProfessionals: 'Find Professionals',
    serviceProviders: 'Service Providers',
    
    // Insights
    latestInsights: 'Latest Insights',
    communityInsights: 'Community Insights',
  },
  es: {
    // Navigation
    dashboard: 'Tablero',
    deals: 'Ofertas',
    services: 'Servicios',
    insights: 'Conocimientos',
    messages: 'Mensajes',
    billing: 'Facturación',
    profile: 'Perfil',
    logout: 'Cerrar Sesión',
    signIn: 'Iniciar Sesión',
    getStarted: 'Comenzar',
    aiAssistant: 'Asistente IA',
    setLocation: 'Establecer Ubicación',
    
    // Common
    search: 'Buscar',
    filter: 'Filtrar',
    save: 'Guardar',
    cancel: 'Cancelar',
    edit: 'Editar',
    delete: 'Eliminar',
    submit: 'Enviar',
    loading: 'Cargando...',
    viewAll: 'Ver Todo',
    viewDetails: 'Ver Detalles',
    contact: 'Contactar',
    
    // Landing
    welcomeTitle: 'Administre sus Activos Inmobiliarios',
    welcomeSubtitle: 'Todo lo que necesita para maximizar el valor de su propiedad',
    
    // Deals
    allDeals: 'Ver Todas las Ofertas',
    propertyDeals: 'Ofertas de Propiedad',
    serviceDeals: 'Ofertas de Servicios',
    findDeals: 'Encuentra Ofertas Cerca de Ti',
    
    // Services
    findProfessionals: 'Encuentra Profesionales',
    serviceProviders: 'Proveedores de Servicios',
    
    // Insights
    latestInsights: 'Últimos Conocimientos',
    communityInsights: 'Conocimientos de la Comunidad',
  },
  ru: {
    // Navigation
    dashboard: 'Панель',
    deals: 'Предложения',
    services: 'Услуги',
    insights: 'Обзоры',
    messages: 'Сообщения',
    billing: 'Счета',
    profile: 'Профиль',
    logout: 'Выйти',
    signIn: 'Войти',
    getStarted: 'Начать',
    aiAssistant: 'ИИ Помощник',
    setLocation: 'Установить Местоположение',
    
    // Common
    search: 'Поиск',
    filter: 'Фильтр',
    save: 'Сохранить',
    cancel: 'Отмена',
    edit: 'Редактировать',
    delete: 'Удалить',
    submit: 'Отправить',
    loading: 'Загрузка...',
    viewAll: 'Посмотреть Все',
    viewDetails: 'Подробнее',
    contact: 'Связаться',
    
    // Landing
    welcomeTitle: 'Управляйте Вашей Недвижимостью',
    welcomeSubtitle: 'Все необходимое для максимальной стоимости недвижимости',
    
    // Deals
    allDeals: 'Посмотреть Все Предложения',
    propertyDeals: 'Предложения по Недвижимости',
    serviceDeals: 'Предложения по Услугам',
    findDeals: 'Найти Предложения Рядом',
    
    // Services
    findProfessionals: 'Найти Специалистов',
    serviceProviders: 'Поставщики Услуг',
    
    // Insights
    latestInsights: 'Последние Обзоры',
    communityInsights: 'Обзоры Сообщества',
  }
};

const TranslationContext = createContext();

export function TranslationProvider({ children }) {
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    const saved = localStorage.getItem('language');
    if (saved && translations[saved]) {
      setLanguage(saved);
    }
  }, []);

  const changeLanguage = (lang) => {
    if (translations[lang]) {
      setLanguage(lang);
      localStorage.setItem('language', lang);
    }
  };

  const t = (key) => {
    return translations[language]?.[key] || translations.en[key] || key;
  };

  return (
    <TranslationContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within TranslationProvider');
  }
  return context;
}