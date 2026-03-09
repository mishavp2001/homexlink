import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin, Loader2, X } from 'lucide-react';

export default function LocationInput({ value, onChange, placeholder = "Enter ZIP code or city", onApply }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [localValue, setLocalValue] = useState(value || '');

  const detectLocation = async () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }

    setLoading(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`
          );
          
          const data = await response.json();
          const zipCode = data.address?.postcode || '';
          const city = data.address?.city || data.address?.town || data.address?.village || '';
          
          if (zipCode) {
            setLocalValue(zipCode);
            onChange(zipCode);
            if (onApply) onApply();
          } else if (city) {
            setLocalValue(city);
            onChange(city);
            if (onApply) onApply();
          } else {
            setError('Could not determine location');
          }
        } catch (err) {
          console.error('Geocoding error:', err);
          setError('Failed to get location');
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error('Geolocation error:', err);
        setError('Location access denied');
        setLoading(false);
      },
      { timeout: 10000 }
    );
  };

  const handleApply = () => {
    const trimmed = localValue.trim();
    if (!trimmed) {
      setError('Please enter a location');
      return;
    }
    
    // Basic validation: 5-digit ZIP or non-empty string
    const isZip = /^\d{5}$/.test(trimmed);
    const isValid = isZip || trimmed.length >= 2;
    
    if (!isValid) {
      setError('Enter valid ZIP code or city name');
      return;
    }
    
    setError('');
    onChange(trimmed);
    if (onApply) onApply();
  };

  const clearLocation = () => {
    setLocalValue('');
    onChange('');
    setError('');
  };

  return (
    <div className="space-y-3">
      <div className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleApply();
              }
            }}
            placeholder={placeholder}
            className="pl-9 pr-8"
          />
          {localValue && (
            <button
              type="button"
              onClick={clearLocation}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={detectLocation}
          disabled={loading}
          className="flex-shrink-0"
          title="Detect my location"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <MapPin className="w-4 h-4" />
          )}
        </Button>
      </div>
      
      {error && (
        <div className="text-xs text-red-500">{error}</div>
      )}
      
      <Button
        type="button"
        onClick={handleApply}
        className="w-full bg-[#1e3a5f] hover:bg-[#2a4a7f]"
        size="sm"
      >
        Apply Location
      </Button>
    </div>
  );
}