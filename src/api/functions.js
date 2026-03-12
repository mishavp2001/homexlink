import { functions } from './client';

export const invokeFunction = (functionName, data) => functions.invoke(functionName, data);

export const searchGooglePlaces = ({ query, location }) =>
  invokeFunction('searchGooglePlaces', {
    query,
    location,
  });

export const getLocationFromIP = () => invokeFunction('getLocationFromIP', {});

export const getServiceProviders = () => invokeFunction('getServiceProviders', {});

export const runAutomation = () => invokeFunction('runAutomation', {});

export const sendEmail = input => invokeFunction('sendEmail', input);

export const getUserByEmail = ({ email }) =>
  invokeFunction('getUserByEmail', {
    email,
  });

export const getUserByBusinessName = ({ businessName }) =>
  invokeFunction('getUserByBusinessName', {
    businessName,
  });

export const createCheckoutSession = input => invokeFunction('createCheckoutSession', input);

export const verifyPayment = ({ sessionId }) =>
  invokeFunction('verifyPayment', {
    sessionId,
  });

export const createDealCheckout = ({ dealId }) =>
  invokeFunction('createDealCheckout', {
    dealId,
  });

export const searchYouTubeVideos = ({ query, maxResults }) =>
  invokeFunction('searchYouTubeVideos', {
    query,
    maxResults,
  });

export const sendSMSVerification = phoneNumber =>
  invokeFunction('sendSMSVerification', {
    phoneNumber,
  });

export const verifySMSCode = ({ code, placeId, businessData }) =>
  invokeFunction('verifySMSCode', {
    code,
    placeId,
    businessData,
  });

export const sendClaimSMS = ({ phoneNumber, businessName, claimUrl }) =>
  invokeFunction('sendClaimSMS', {
    phoneNumber,
    businessName,
    claimUrl,
  });

export const generatePropertyVideo = ({ dealId }) =>
  invokeFunction('generatePropertyVideo', {
    dealId,
  });

export const fetchPropertyData = ({ address }) =>
  invokeFunction('fetchPropertyData', {
    address,
  });

export const generatePageMetadata = pageName =>
  invokeFunction('generatePageMetadata', {
    page_name: pageName,
  });

export const generateAllPageMetadata = () => invokeFunction('generateAllPageMetadata', {});