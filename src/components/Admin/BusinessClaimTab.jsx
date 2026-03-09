import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, MapPin, Loader2, Send, CheckCircle } from 'lucide-react';

export default function BusinessClaimTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('Granite Bay, CA');
  const [googlePlaces, setGooglePlaces] = useState([]);
  const [loadingPlaces, setLoadingPlaces] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [sendingSMS, setSendingSMS] = useState(false);
  const [smsSent, setSmsSent] = useState(false);

  useEffect(() => {
    const searchPlaces = async () => {
      if (!searchTerm && !locationFilter) {
        setGooglePlaces([]);
        return;
      }

      setLoadingPlaces(true);
      try {
        const searchQuery = searchTerm ? `${searchTerm} service` : 'service';
        const response = await base44.functions.invoke('searchGooglePlaces', {
          query: `${searchQuery} in ${locationFilter}`,
          location: locationFilter
        });
        setGooglePlaces(response.data.places || []);
      } catch (error) {
        console.error('Error searching places:', error);
        setGooglePlaces([]);
      }
      setLoadingPlaces(false);
    };

    const debounce = setTimeout(() => {
      searchPlaces();
    }, 500);

    return () => clearTimeout(debounce);
  }, [searchTerm, locationFilter]);

  const handleSendClaimSMS = async () => {
    if (!selectedBusiness?.phone) {
      alert('This business does not have a phone number listed');
      return;
    }

    setSendingSMS(true);
    setSmsSent(false);

    try {
      const businessSlug = selectedBusiness.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
      const city = selectedBusiness.address?.split(',')[1]?.trim() || locationFilter;
      const claimUrl = `${window.location.origin}/services?claim=${businessSlug}&city=${encodeURIComponent(city)}`;

      await base44.functions.invoke('sendClaimSMS', {
        phoneNumber: selectedBusiness.phone,
        businessName: selectedBusiness.name,
        claimUrl: claimUrl
      });

      setSmsSent(true);
      setTimeout(() => {
        setSelectedBusiness(null);
        setSmsSent(false);
      }, 3000);
    } catch (error) {
      console.error('Error sending SMS:', error);
      alert('Failed to send SMS. Please try again.');
    }
    setSendingSMS(false);
  };

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-[#1e3a5f] mb-2">Business Claim Management</h2>
        <p className="text-sm text-gray-600">
          Search for businesses and send claim links via SMS
        </p>
      </div>

      <div className="space-y-4 mb-6">
        <div>
          <Label>Search Business</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search for businesses..."
              className="pl-10"
            />
          </div>
        </div>

        <div>
          <Label>Location</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              placeholder="City, State or ZIP"
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {loadingPlaces ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#1e3a5f] mx-auto" />
          <p className="text-sm text-gray-600 mt-2">Searching businesses...</p>
        </div>
      ) : googlePlaces.length > 0 ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-600 mb-3">{googlePlaces.length} businesses found</p>
          {googlePlaces.map((place) => (
            <Card key={place.place_id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-[#1e3a5f]">{place.name}</h3>
                    {place.rating > 0 && (
                      <Badge variant="outline">
                        ⭐ {place.rating.toFixed(1)} ({place.user_ratings_total})
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{place.address}</p>
                  {place.phone && (
                    <p className="text-sm text-gray-600">📞 {place.phone}</p>
                  )}
                  {place.website && (
                    <p className="text-sm text-gray-600">🌐 {place.website}</p>
                  )}
                </div>
                <Button
                  onClick={() => setSelectedBusiness(place)}
                  className="bg-[#d4af37] hover:bg-[#c49d2a]"
                  size="sm"
                  disabled={!place.phone}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send Claim Link
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : searchTerm || locationFilter ? (
        <div className="text-center py-12 text-gray-500">
          <p>No businesses found. Try different search terms.</p>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <p>Enter search terms to find businesses</p>
        </div>
      )}

      {/* Send SMS Confirmation Dialog */}
      <Dialog open={!!selectedBusiness} onOpenChange={() => setSelectedBusiness(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send Claim Link</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {smsSent ? (
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">SMS Sent!</h3>
                <p className="text-sm text-gray-600">
                  Claim link sent to {selectedBusiness?.phone}
                </p>
              </div>
            ) : (
              <>
                <div>
                  <p className="font-semibold text-lg mb-2">{selectedBusiness?.name}</p>
                  <p className="text-sm text-gray-600 mb-1">{selectedBusiness?.address}</p>
                  <p className="text-sm text-gray-600">📞 {selectedBusiness?.phone}</p>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-900">
                    This will send an SMS to the business phone number with a link to claim their profile:
                  </p>
                  <div className="mt-2 p-2 bg-white rounded text-xs font-mono break-all">
                    {window.location.origin}/services?claim=
                    {selectedBusiness?.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')}
                    &city={encodeURIComponent(selectedBusiness?.address?.split(',')[1]?.trim() || locationFilter)}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedBusiness(null)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSendClaimSMS}
                    disabled={sendingSMS}
                    className="flex-1 bg-[#1e3a5f] hover:bg-[#2a4a7f]"
                  >
                    {sendingSMS ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send SMS
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}