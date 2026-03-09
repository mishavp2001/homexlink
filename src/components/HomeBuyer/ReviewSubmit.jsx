import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle2, ArrowLeft, Home, DollarSign, Bed, Bath, Maximize } from 'lucide-react';

export default function ReviewSubmit({ criteria, selectedHome, desiredChanges, onBack }) {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [userData, setUserData] = useState({
    full_name: '',
    email: '',
    phone: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!userData.full_name || !userData.email) {
      alert('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      await base44.entities.PendingUser.create({
        email: userData.email,
        full_name: userData.full_name,
        phone: userData.phone,
        user_type: 'first_time_buyer',
        search_criteria: {
          location: criteria.location,
          max_price: parseFloat(criteria.max_price),
          min_bedrooms: criteria.min_bedrooms ? parseInt(criteria.min_bedrooms) : null,
          min_bathrooms: criteria.min_bathrooms ? parseFloat(criteria.min_bathrooms) : null,
          property_type: criteria.property_type,
          min_sqft: criteria.min_sqft ? parseInt(criteria.min_sqft) : null,
          additional_notes: criteria.additional_notes
        },
        selected_home: {
          address: selectedHome.address,
          price: selectedHome.price,
          bedrooms: selectedHome.bedrooms,
          bathrooms: selectedHome.bathrooms,
          sqft: selectedHome.sqft,
          description: selectedHome.description
        },
        desired_changes: desiredChanges,
        status: 'pending'
      });

      setSuccess(true);
      
      // Redirect to signup after 2 seconds
      setTimeout(() => {
        const signupUrl = window.location.origin + '/dashboard?signup=true' +
          '&email=' + encodeURIComponent(userData.email) +
          '&name=' + encodeURIComponent(userData.full_name) +
          '&phone=' + encodeURIComponent(userData.phone || '') +
          '&type=first_time_buyer';
        
        base44.auth.redirectToLogin(signupUrl);
      }, 2000);
      
    } catch (error) {
      console.error('Failed to submit:', error);
      alert('Failed to submit. Please try again.');
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <Card className="p-12 text-center">
        <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Submitted!</h2>
        <p className="text-gray-600">Redirecting you to create your account...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold text-[#1e3a5f] mb-6">Review Your Selection</h2>

        {/* Selected Home */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">{selectedHome.address}</h3>
              <p className="text-2xl font-bold text-[#d4af37]">
                ${selectedHome.price.toLocaleString()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
            <span className="flex items-center gap-1">
              <Bed className="w-4 h-4" />
              {selectedHome.bedrooms} bed
            </span>
            <span className="flex items-center gap-1">
              <Bath className="w-4 h-4" />
              {selectedHome.bathrooms} bath
            </span>
            <span className="flex items-center gap-1">
              <Maximize className="w-4 h-4" />
              {selectedHome.sqft.toLocaleString()} sq ft
            </span>
          </div>
          
          <p className="text-sm text-gray-700 mb-3">{selectedHome.description}</p>
          
          {desiredChanges && (
            <div className="border-t pt-3">
              <p className="text-xs font-semibold text-gray-600 mb-1">Your Notes:</p>
              <p className="text-sm text-gray-700">{desiredChanges}</p>
            </div>
          )}
        </div>

        {/* Search Criteria */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-2">Your Search Criteria</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="text-gray-600">Location:</span> <span className="font-medium">{criteria.location}</span></div>
            <div><span className="text-gray-600">Max Price:</span> <span className="font-medium">${parseInt(criteria.max_price).toLocaleString()}</span></div>
            {criteria.min_bedrooms && <div><span className="text-gray-600">Min Bedrooms:</span> <span className="font-medium">{criteria.min_bedrooms}</span></div>}
            {criteria.min_bathrooms && <div><span className="text-gray-600">Min Bathrooms:</span> <span className="font-medium">{criteria.min_bathrooms}</span></div>}
            {criteria.min_sqft && <div><span className="text-gray-600">Min Sq Ft:</span> <span className="font-medium">{parseInt(criteria.min_sqft).toLocaleString()}</span></div>}
            <div><span className="text-gray-600">Type:</span> <span className="font-medium capitalize">{criteria.property_type.replace(/_/g, ' ')}</span></div>
          </div>
          {criteria.additional_notes && (
            <div className="mt-3 pt-3 border-t">
              <p className="text-xs font-semibold text-gray-600 mb-1">Additional Requirements:</p>
              <p className="text-sm text-gray-700">{criteria.additional_notes}</p>
            </div>
          )}
        </div>

        {/* User Information Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <h4 className="font-semibold text-gray-900">Your Information</h4>
          
          <div>
            <Label>Full Name *</Label>
            <Input
              value={userData.full_name}
              onChange={(e) => setUserData({ ...userData, full_name: e.target.value })}
              placeholder="John Doe"
              required
            />
          </div>

          <div>
            <Label>Email *</Label>
            <Input
              type="email"
              value={userData.email}
              onChange={(e) => setUserData({ ...userData, email: e.target.value })}
              placeholder="john@example.com"
              required
            />
          </div>

          <div>
            <Label>Phone</Label>
            <Input
              type="tel"
              value={userData.phone}
              onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
              placeholder="(555) 123-4567"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800">
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                'Create Account & Submit'
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}