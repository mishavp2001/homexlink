/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import Accounting from './pages/Accounting';
import Admin from './pages/Admin';
import AdminVideoGeneration from './pages/AdminVideoGeneration';
import AuthCallback from './pages/AuthCallback';
import ConsentRecords from './pages/ConsentRecords';
import Dashboard from './pages/Dashboard';
import Deals from './pages/Deals';
import DemoBusinessDashboard from './pages/DemoBusinessDashboard';
import DemoPropertyDashboard from './pages/DemoPropertyDashboard';
import EditDeal from './pages/EditDeal';
import EditInsight from './pages/EditInsight';
import EditProperty from './pages/EditProperty';
import EditService from './pages/EditService';
import Home from './pages/Home';
import Insights from './pages/Insights';
import Landing from './pages/Landing';
import Maintenance from './pages/Maintenance';
import Messages from './pages/Messages';
import PrivacyPolicy from './pages/PrivacyPolicy';
import ProOnboarding from './pages/ProOnboarding';
import ProSignup from './pages/ProSignup';
import Profile from './pages/Profile';
import PropertyCapture from './pages/PropertyCapture';
import PropertyDetails from './pages/PropertyDetails';
import PropertyLanding from './pages/PropertyLanding';
import ProviderBilling from './pages/ProviderBilling';
import PublicProfile from './pages/PublicProfile';
import ReportViewer from './pages/ReportViewer';
import SEOManager from './pages/SEOManager';
import SMSConsent from './pages/SMSConsent';
import SMSOptIn from './pages/SMSOptIn';
import ServiceProfile from './pages/ServiceProfile';
import Services from './pages/Services';
import TermsOfService from './pages/TermsOfService';
import airbnb from './pages/airbnb';
import electrical from './pages/electrical';
import hvac from './pages/hvac';
import paymentSuccess from './pages/payment-success';
import plumbing from './pages/plumbing';
import rent from './pages/rent';
import sale from './pages/sale';
import serviceProfile from './pages/service-profile';
import service from './pages/service';
import servicequote from './pages/servicequote';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Accounting": Accounting,
    "Admin": Admin,
    "AdminVideoGeneration": AdminVideoGeneration,
    "AuthCallback": AuthCallback,
    "ConsentRecords": ConsentRecords,
    "Dashboard": Dashboard,
    "Deals": Deals,
    "DemoBusinessDashboard": DemoBusinessDashboard,
    "DemoPropertyDashboard": DemoPropertyDashboard,
    "EditDeal": EditDeal,
    "EditInsight": EditInsight,
    "EditProperty": EditProperty,
    "EditService": EditService,
    "Home": Home,
    "Insights": Insights,
    "Landing": Landing,
    "Maintenance": Maintenance,
    "Messages": Messages,
    "PrivacyPolicy": PrivacyPolicy,
    "ProOnboarding": ProOnboarding,
    "ProSignup": ProSignup,
    "Profile": Profile,
    "PropertyCapture": PropertyCapture,
    "PropertyDetails": PropertyDetails,
    "PropertyLanding": PropertyLanding,
    "ProviderBilling": ProviderBilling,
    "PublicProfile": PublicProfile,
    "ReportViewer": ReportViewer,
    "SEOManager": SEOManager,
    "SMSConsent": SMSConsent,
    "SMSOptIn": SMSOptIn,
    "ServiceProfile": ServiceProfile,
    "Services": Services,
    "TermsOfService": TermsOfService,
    "airbnb": airbnb,
    "electrical": electrical,
    "hvac": hvac,
    "payment-success": paymentSuccess,
    "plumbing": plumbing,
    "rent": rent,
    "sale": sale,
    "service-profile": serviceProfile,
    "service": service,
    "servicequote": servicequote,
}

export const pagesConfig = {
    mainPage: "Landing",
    Pages: PAGES,
    Layout: __Layout,
};