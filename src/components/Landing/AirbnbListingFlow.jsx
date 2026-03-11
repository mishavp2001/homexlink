import React, { useState } from 'react';
import { redirectToAppLogin } from '@/api/base44Client';
import { PendingUser } from '@/api/entities';
import { UploadFile } from '@/api/integrations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, ArrowLeft, Loader2, CheckCircle2, Home, Link, DollarSign, Calendar, Camera, X } from 'lucide-react';
import { createPageUrl } from '@/utils';

const STEPS = [
  { number: 1, title: 'Property' },
  { number: 2, title: 'Rental Details' },
  { number: 3, title: 'Photos & Links' },
  { number: 4, title: 'Done' },
];

function StepDots({ currentStep }) {
  return (
    <div className="flex items-center justify-center gap-1 mb-4">
      {STEPS.map((step, idx) => (
        <div key={step.number} className="flex items-center">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
            currentStep >= step.number ? 'bg-green-500 text-white' : 'bg-white/20 text-white/60'
          }`}>
            {currentStep > step.number ? '✓' : step.number}
          </div>
          {idx < STEPS.length - 1 && (
            <div className={`h-0.5 w-6 mx-1 transition-colors ${currentStep > step.number ? 'bg-green-500' : 'bg-white/20'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function AirbnbListingFlow() {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  const [data, setData] = useState({
    address: '',
    bedrooms: '',
    bathrooms: '',
    sqft: '',
    property_type: 'single_family',
    description: '',
    price_per_night: '',
    minimum_stay: '1',
    check_in_time: '15:00',
    check_out_time: '11:00',
    airbnb_url: '',
    booking_url: '',
    amenities: '',
    rules: '',
    photo_urls: [],
    contact_email: '',
    contact_phone: '',
  });

  const update = (field, value) => setData(prev => ({ ...prev, [field]: value }));

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files).slice(0, 8 - data.photo_urls.length);
    if (!files.length) return;
    setUploadingPhotos(true);
    const results = await Promise.all(files.map(f => UploadFile({ file: f })));
    update('photo_urls', [...data.photo_urls, ...results.map(r => r.file_url)].slice(0, 8));
    setUploadingPhotos(false);
    e.target.value = '';
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await PendingUser.create({
        email: data.contact_email || 'pending@homexlink.com',
        user_type: 'homeowner',
        selected_home: {
          address: data.address,
          description: data.description,
        },
        project: {
          type: 'airbnb_listing',
          ...data,
          amenities: data.amenities ? data.amenities.split(',').map(a => a.trim()) : [],
        },
        status: 'pending',
      });
    } catch (e) {
      // ignore, proceed to success step
    }
    setSubmitting(false);
    setStep(4);
  };

  if (step === 4) {
    return (
      <div className="text-center py-6 space-y-4">
        <CheckCircle2 className="w-14 h-14 text-green-400 mx-auto" />
        <h3 className="text-white text-xl font-bold">Listing Ready!</h3>
        <p className="text-white/80 text-sm">Create your free account to publish and manage your short-term rental.</p>
        <Button
          onClick={() => {
            void redirectToAppLogin(window.location.origin + createPageUrl('Dashboard') + '?signup=true');
          }}
          className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 h-11"
        >
          Create Free Account
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <StepDots currentStep={step} />

      {step === 1 && (
        <div className="space-y-3">
          <div>
            <Label className="text-white/80 text-xs mb-1 block">Property Address *</Label>
            <Input
              value={data.address}
              onChange={e => update('address', e.target.value)}
              placeholder="123 Main St, City, State ZIP"
              className="bg-slate-50 text-slate-900 h-9 text-sm"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-white/80 text-xs mb-1 block">Beds</Label>
              <Input value={data.bedrooms} onChange={e => update('bedrooms', e.target.value)} placeholder="3" type="number" className="bg-slate-50 text-slate-900 h-9 text-sm" />
            </div>
            <div>
              <Label className="text-white/80 text-xs mb-1 block">Baths</Label>
              <Input value={data.bathrooms} onChange={e => update('bathrooms', e.target.value)} placeholder="2" type="number" className="bg-slate-50 text-slate-900 h-9 text-sm" />
            </div>
            <div>
              <Label className="text-white/80 text-xs mb-1 block">Sqft</Label>
              <Input value={data.sqft} onChange={e => update('sqft', e.target.value)} placeholder="1200" type="number" className="bg-slate-50 text-slate-900 h-9 text-sm" />
            </div>
          </div>
          <div>
            <Label className="text-white/80 text-xs mb-1 block">Property Type</Label>
            <Select value={data.property_type} onValueChange={v => update('property_type', v)}>
              <SelectTrigger className="bg-slate-50 text-slate-900 h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single_family">Single Family</SelectItem>
                <SelectItem value="condo">Condo</SelectItem>
                <SelectItem value="townhouse">Townhouse</SelectItem>
                <SelectItem value="multi_family">Multi-Family</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-white/80 text-xs mb-1 block">Description</Label>
            <Textarea
              value={data.description}
              onChange={e => update('description', e.target.value)}
              placeholder="Beautiful home with great views, fully furnished..."
              className="bg-slate-50 text-slate-900 text-sm min-h-[70px]"
              rows={3}
            />
          </div>
          <Button
            onClick={() => setStep(2)}
            disabled={!data.address.trim()}
            className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 h-9"
          >
            Next <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-white/80 text-xs mb-1 block">Price per Night ($) *</Label>
              <Input value={data.price_per_night} onChange={e => update('price_per_night', e.target.value)} placeholder="150" type="number" className="bg-slate-50 text-slate-900 h-9 text-sm" />
            </div>
            <div>
              <Label className="text-white/80 text-xs mb-1 block">Min. Stay (nights)</Label>
              <Input value={data.minimum_stay} onChange={e => update('minimum_stay', e.target.value)} placeholder="1" type="number" className="bg-slate-50 text-slate-900 h-9 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-white/80 text-xs mb-1 block">Check-in Time</Label>
              <Input value={data.check_in_time} onChange={e => update('check_in_time', e.target.value)} type="time" className="bg-slate-50 text-slate-900 h-9 text-sm" />
            </div>
            <div>
              <Label className="text-white/80 text-xs mb-1 block">Check-out Time</Label>
              <Input value={data.check_out_time} onChange={e => update('check_out_time', e.target.value)} type="time" className="bg-slate-50 text-slate-900 h-9 text-sm" />
            </div>
          </div>
          <div>
            <Label className="text-white/80 text-xs mb-1 block">Amenities (comma separated)</Label>
            <Input value={data.amenities} onChange={e => update('amenities', e.target.value)} placeholder="WiFi, Pool, Parking, Kitchen, AC" className="bg-slate-50 text-slate-900 h-9 text-sm" />
          </div>
          <div>
            <Label className="text-white/80 text-xs mb-1 block">House Rules</Label>
            <Textarea value={data.rules} onChange={e => update('rules', e.target.value)} placeholder="No parties, no smoking, no pets..." className="bg-slate-50 text-slate-900 text-sm min-h-[60px]" rows={2} />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(1)} className="bg-white/20 text-white border-white/40 hover:bg-white/30 flex-shrink-0 h-9">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => setStep(3)}
              disabled={!data.price_per_night}
              className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 h-9"
            >
              Next <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3">
          <div>
            <Label className="text-white/80 text-xs mb-1 block">Airbnb Listing URL</Label>
            <Input value={data.airbnb_url} onChange={e => update('airbnb_url', e.target.value)} placeholder="https://airbnb.com/rooms/..." className="bg-slate-50 text-slate-900 h-9 text-sm" />
          </div>
          <div>
            <Label className="text-white/80 text-xs mb-1 block">Contact Email</Label>
            <Input value={data.contact_email} onChange={e => update('contact_email', e.target.value)} placeholder="you@email.com" type="email" className="bg-slate-50 text-slate-900 h-9 text-sm" />
          </div>
          <div>
            <Label className="text-white/80 text-xs mb-1 block">Photos (up to 8)</Label>
            {data.photo_urls.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {data.photo_urls.map((url, i) => (
                  <div key={i} className="relative w-14 h-14">
                    <img src={url} alt="" className="w-full h-full object-cover rounded-lg" />
                    <button
                      type="button"
                      onClick={() => update('photo_urls', data.photo_urls.filter((_, idx) => idx !== i))}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {data.photo_urls.length < 8 && (
              <label className="cursor-pointer block">
                <input type="file" multiple accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploadingPhotos} />
                <div className="flex items-center justify-center gap-2 px-3 py-2 bg-white/20 border border-white/40 hover:bg-white/30 rounded-lg text-sm text-white h-9 w-full">
                  {uploadingPhotos ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                  <span>{uploadingPhotos ? 'Uploading...' : `Add Photos (${data.photo_urls.length}/8)`}</span>
                </div>
              </label>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(2)} className="bg-white/20 text-white border-white/40 hover:bg-white/30 flex-shrink-0 h-9">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 h-9"
            >
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving...</> : <>Finish <ArrowRight className="w-4 h-4 ml-2" /></>}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}