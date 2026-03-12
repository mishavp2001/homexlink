import React, { useState } from 'react';
import { updateCurrentUserProfile } from '@/api/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { MessageCircle, Phone, X } from 'lucide-react';

export default function SMSOptInModal({ isOpen, onClose, user }) {
  const [phoneNumber, setPhoneNumber] = useState(
    user?.sms_phone_number || user?.phone || user?.business_phone || ''
  );
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSkip = async () => {
    try {
      await updateCurrentUserProfile({
        has_seen_sms_optin: true
      });
      onClose();
    } catch (error) {
      console.error('Error marking as seen:', error);
      onClose();
    }
  };

  const handleOptIn = async (e) => {
    e.preventDefault();
    
    if (!phoneNumber.trim() || !consent) {
      return;
    }

    setSubmitting(true);

    try {
      let ipAddress = 'unknown';
      try {
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        ipAddress = ipData.ip;
      } catch (ipError) {
        console.log('Could not fetch IP:', ipError);
      }

      await updateCurrentUserProfile({
        sms_phone_number: phoneNumber.trim(),
        sms_consent: true,
        sms_consent_date: new Date().toISOString(),
        sms_consent_ip: ipAddress,
        sms_opt_in: true,
        sms_opt_in_date: new Date().toISOString(),
        sms_opt_in_ip: ipAddress,
        has_seen_sms_optin: true
      });

      onClose(true);
    } catch (error) {
      console.error('Opt-in error:', error);
    }

    setSubmitting(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleSkip}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <MessageCircle className="w-6 h-6 text-[#1e3a5f]" />
            Enable SMS Notifications?
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleOptIn} className="space-y-4 mt-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-[#1e3a5f] mb-2">Get instant updates:</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>✅ Booking confirmations</li>
              <li>✅ Service updates</li>
              <li>✅ Appointment reminders</li>
            </ul>
          </div>

          <div>
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+1 (555) 123-4567"
              required
              className="mt-1"
            />
          </div>

          <div className="flex items-start gap-3">
            <Checkbox
              id="consent"
              checked={consent}
              onCheckedChange={setConsent}
              className="mt-1"
            />
            <Label htmlFor="consent" className="cursor-pointer font-normal text-sm">
              I agree to receive SMS notifications. Message and data rates may apply. I can opt-out anytime by replying STOP.
            </Label>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleSkip}
              className="flex-1"
              disabled={submitting}
            >
              Skip for Now
            </Button>
            <Button
              type="submit"
              disabled={submitting || !consent || !phoneNumber.trim()}
              className="flex-1 bg-[#1e3a5f] hover:bg-[#2a4a7f]"
            >
              {submitting ? 'Saving...' : 'Enable Notifications'}
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            By opting in, you consent to receive automated SMS messages.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}