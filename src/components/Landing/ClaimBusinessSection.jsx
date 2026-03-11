import React, { useState, useEffect } from 'react';
import { redirectToAppLogin } from '@/api/base44Client';
import { PendingUser, ServiceListing } from '@/api/entities';
import { searchGooglePlaces, sendSMSVerification, verifySMSCode } from '@/api/functions';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, Building2, MapPin, Phone, CheckCircle, Search } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

export default function ClaimBusinessSection() {
  const [zipCode, setZipCode] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [searching, setSearching] = useState(false);
  const [businesses, setBusinesses] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [claimStep, setClaimStep] = useState(1);
  const [verificationCode, setVerificationCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);

  // Debounced search
  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (businessName.trim() && zipCode.trim() && businessName.length >= 3) {
        handleSearch();
      }
    }, 500);

    return () => clearTimeout(delaySearch);
  }, [businessName, zipCode]);

  const handleSearch = async () => {
    if (!businessName.trim() || !zipCode.trim()) return;

    setSearching(true);
    setBusinesses([]);

    try {
      const response = await searchGooglePlaces({
        query: `${businessName} ${zipCode}`,
        location: zipCode
      });

      if (response.data?.places) {
        setBusinesses(response.data.places);
        setShowResults(true);
      }
    } catch (error) {
      console.error('Search error:', error);
    }

    setSearching(false);
  };

  const handleClaimBusiness = async (business) => {
    // Check if already claimed
    try {
      const existingListings = await ServiceListing.filter({
        business_name: business.name
      });

      if (existingListings.length > 0) {
        alert('This business has already been claimed. Please contact support if this is your business.');
        return;
      }

      setSelectedBusiness(business);
      setPhoneNumber(business.phone || '');
      setShowClaimModal(true);
      setClaimStep(1);
    } catch (error) {
      console.error('Error checking business:', error);
    }
  };

  const handleSendVerificationCode = async () => {
    if (!phoneNumber.trim()) {
      alert('Please enter a phone number');
      return;
    }

    setSendingCode(true);
    try {
      await sendSMSVerification(phoneNumber);

      alert('Verification code sent! Please check your phone.');
      setClaimStep(2);
    } catch (error) {
      console.error('Error sending code:', error);
      alert('Failed to send verification code. Please try again.');
    }
    setSendingCode(false);
  };

  const handleVerifyAndClaim = async () => {
    if (!verificationCode.trim()) {
      alert('Please enter the verification code');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      alert('Please enter a valid email address');
      return;
    }

    setVerifying(true);
    try {
      // Verify the code
      const verifyResponse = await verifySMSCode({
        code: verificationCode,
        placeId: selectedBusiness.placeId,
        businessData: selectedBusiness
      });

      if (!verifyResponse.data.success) {
        alert('Invalid verification code. Please try again.');
        setVerifying(false);
        return;
      }

      // Create pending user with business data
      const pendingUser = await PendingUser.create({
        email: email.toLowerCase().trim(),
        full_name: selectedBusiness.name,
        phone: phoneNumber,
        user_type: 'service_provider',
        service_listing: {
          business_name: selectedBusiness.name,
          business_address: selectedBusiness.address,
          business_phone: phoneNumber,
          service_types: [],
          is_verified: true
        },
        linked_user_email: '',
        status: 'pending'
      });

      console.log('Created PendingUser:', pendingUser);

      // Redirect to signup with business name and email pre-filled
      const signupUrl = window.location.origin + createPageUrl('Dashboard') +
        '?signup=true' +
        '&email=' + encodeURIComponent(email.toLowerCase().trim()) +
        '&name=' + encodeURIComponent(selectedBusiness.name) +
        '&phone=' + encodeURIComponent(phoneNumber);

      void redirectToAppLogin(signupUrl);
    } catch (error) {
      console.error('Error verifying:', error);
      alert('Verification failed. Please try again.');
      setVerifying(false);
    }
  };

  return (
    <>
      <div className="space-y-3">
        <div>
          <Label className="text-white text-sm mb-2 block">ZIP Code</Label>
          <Input
            type="text"
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value)}
            placeholder="Enter ZIP code"
            className="bg-slate-50 text-slate-900 border-green-300 focus:border-green-600 focus:ring-green-600"
          />
        </div>

        <div>
          <Label className="text-white text-sm mb-2 block">Business Name</Label>
          <div className="relative">
            <Input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Start typing business name..."
              className="bg-slate-50 text-slate-900 border-green-300 focus:border-green-600 focus:ring-green-600"
            />
            {searching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
              </div>
            )}
          </div>
        </div>

        {/* Business Results */}
        {showResults && businesses.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 max-h-[300px] overflow-y-auto">
            {businesses.map((business, idx) => (
              <button
                key={idx}
                onClick={() => handleClaimBusiness(business)}
                className="w-full p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 text-left transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="bg-green-100 p-2 rounded-md flex-shrink-0">
                    <Building2 className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 text-sm truncate">
                      {business.name}
                    </h4>
                    {business.address && (
                      <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />
                        {business.address}
                      </p>
                    )}
                    {business.phone && (
                      <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                        <Phone className="w-3 h-3" />
                        {business.phone}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-shrink-0 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClaimBusiness(business);
                    }}
                  >
                    Claim
                  </Button>
                </div>
              </button>
            ))}
          </div>
        )}

        {showResults && businesses.length === 0 && !searching && (
          <div className="bg-white/10 rounded-lg border border-white/20 p-4 text-center">
            <p className="text-white/70 text-sm">No businesses found. Try a different search.</p>
          </div>
        )}
      </div>

      {/* Claim Business Modal */}
      <Dialog open={showClaimModal} onOpenChange={setShowClaimModal}>
        <DialogContent className="max-w-md">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-[#1e3a5f] mb-4">
              Claim Your Business
            </h2>

            {claimStep === 1 && (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {selectedBusiness?.name}
                  </h3>
                  {selectedBusiness?.address && (
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {selectedBusiness.address}
                    </p>
                  )}
                </div>

                <div>
                  <Label>Phone Number *</Label>
                  <Input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="(555) 123-4567"
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    We'll send a verification code to this number
                  </p>
                </div>

                <Button
                  onClick={handleSendVerificationCode}
                  disabled={!phoneNumber.trim() || sendingCode}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {sendingCode ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending Code...
                    </>
                  ) : (
                    'Send Verification Code'
                  )}
                </Button>
              </div>
            )}

            {claimStep === 2 && (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Phone className="w-8 h-8 text-green-600" />
                  </div>
                  <p className="text-gray-600 mb-4">
                    We sent a verification code to
                    <br />
                    <strong>{phoneNumber}</strong>
                  </p>
                </div>

                <div>
                  <Label>Verification Code *</Label>
                  <Input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="Enter 6-digit code"
                    className="mt-1 text-center text-lg tracking-widest"
                    maxLength={6}
                  />
                </div>

                <div>
                  <Label>Email Address *</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    You'll use this email to log in
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setClaimStep(1)}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleVerifyAndClaim}
                    disabled={!verificationCode.trim() || !email.trim() || verifying}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {verifying ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Verify & Claim
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}