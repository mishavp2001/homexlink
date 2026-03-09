/// <reference lib="deno.ns" />
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get user's IP address from request headers
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIP = req.headers.get('x-real-ip');
    const cfConnectingIP = req.headers.get('cf-connecting-ip');
    
    const ipAddress = cfConnectingIP || forwardedFor?.split(',')[0].trim() || realIP || 'unknown';

    console.log('IP Address:', ipAddress);

    // Skip geolocation for localhost or private IPs
    if (ipAddress === 'unknown' || ipAddress === '127.0.0.1' || ipAddress.startsWith('192.168.') || ipAddress.startsWith('10.')) {
      return Response.json({
        success: true,
        city: null,
        region: null,
        country: null,
        location: null,
        ip: ipAddress
      });
    }

    // Use free IP geolocation API
    const geoResponse = await fetch(`http://ip-api.com/json/${ipAddress}?fields=status,message,country,regionName,city,lat,lon,timezone`);
    const geoData = await geoResponse.json();

    console.log('Geolocation data:', geoData);

    if (geoData.status === 'success' && geoData.city) {
      const location = geoData.regionName 
        ? `${geoData.city}, ${geoData.regionName}`
        : geoData.city;

      return Response.json({
        success: true,
        city: geoData.city,
        region: geoData.regionName,
        country: geoData.country,
        location: location,
        lat: geoData.lat,
        lon: geoData.lon,
        timezone: geoData.timezone,
        ip: ipAddress
      });
    }

    return Response.json({
      success: true,
      city: null,
      region: null,
      country: null,
      location: null,
      ip: ipAddress
    });

  } catch (error) {
    console.error('Error getting location:', error);
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});