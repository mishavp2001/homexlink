import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, X, Camera, Loader2 } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function ProDealModal({ onClose }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [dealData, setDealData] = useState({ title: '', description: '', deal_type: 'service_deal', service_types: [], price: '', location: '', photo_urls: [] });
  const [profileData, setProfileData] = useState({ business_name: '', email: '', phone: '' });
  const [creating, setCreating] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  const { data: serviceCategories = [] } = useQuery({
    queryKey: ['serviceCategories'],
    queryFn: () => base44.entities.Category.filter({ type: 'service_type', is_active: true }),
    staleTime: 60000
  });

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploadingPhotos(true);
    const results = await Promise.all(files.map(f => base44.integrations.Core.UploadFile({ file: f })));
    setDealData(d => ({ ...d, photo_urls: [...d.photo_urls, ...results.map(r => r.file_url)] }));
    setUploadingPhotos(false);
  };

  const handleNext = () => {
    if (!dealData.title || !dealData.price || dealData.service_types.length === 0) { alert('Please fill in all required fields'); return; }
    setCurrentStep(2);
  };

  const handleCreateAccount = async () => {
    if (!profileData.business_name || !profileData.email) { alert('Please fill in all required fields'); return; }
    setCreating(true);
    await base44.entities.PendingUser.create({ email: profileData.email, full_name: profileData.business_name, phone: profileData.phone, user_type: 'service_provider', deal_data: dealData, status: 'pending' });
    base44.auth.redirectToAppLogin(window.location.origin + createPageUrl('Dashboard') + '?signup=true&name=' + encodeURIComponent(profileData.business_name) + '&email=' + encodeURIComponent(profileData.email));
  };

  const steps = [{ number: 1, title: 'Deal Info' }, { number: 2, title: 'Create Account' }];

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-[#1e3a5f] mb-6 text-center">Post a Deal</h2>
      <div className="flex items-center justify-center mb-8">
        {steps.map((step, idx) => (
          <div key={step.number} className="flex items-center">
            <div className={`flex flex-col items-center ${idx > 0 ? 'ml-4' : ''}`}>
              <div className={`rounded-full w-12 h-12 flex items-center justify-center font-bold transition-colors ${currentStep >= step.number ? 'bg-[#1e3a5f] text-white' : 'bg-gray-200 text-gray-500'}`}>{currentStep > step.number ? '✓' : step.number}</div>
              <p className={`text-sm mt-2 font-medium ${currentStep >= step.number ? 'text-[#1e3a5f]' : 'text-gray-500'}`}>{step.title}</p>
            </div>
            {idx < steps.length - 1 && <div className={`h-1 w-24 mx-2 rounded transition-colors ${currentStep > step.number ? 'bg-[#1e3a5f]' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      {currentStep === 1 && (
        <Card className="p-6">
          <div className="space-y-4">
            <div><Label>Deal Title *</Label><Input value={dealData.title} onChange={e => setDealData(d => ({ ...d, title: e.target.value }))} placeholder="Summer Special - 20% Off All Services" /></div>
            <div><Label>Description</Label><Textarea value={dealData.description} onChange={e => setDealData(d => ({ ...d, description: e.target.value }))} rows={3} placeholder="Describe your deal..." /></div>
            <div>
              <Label>Service Types *</Label>
              <Select value={dealData.service_types[0] || ''} onValueChange={v => { if (!dealData.service_types.includes(v)) setDealData(d => ({ ...d, service_types: [...d.service_types, v] })); }}>
                <SelectTrigger><SelectValue placeholder="Select services" /></SelectTrigger>
                <SelectContent>{serviceCategories.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
              {dealData.service_types.length > 0 && <div className="flex flex-wrap gap-2 mt-2">{dealData.service_types.map((s, i) => <Badge key={i} className="bg-[#1e3a5f]">{s}<button onClick={() => setDealData(d => ({ ...d, service_types: d.service_types.filter((_, j) => j !== i) }))} className="ml-2"><X className="w-3 h-3" /></button></Badge>)}</div>}
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div><Label>Price *</Label><Input type="number" value={dealData.price} onChange={e => setDealData(d => ({ ...d, price: e.target.value }))} placeholder="99" /></div>
              <div><Label>Location</Label><Input value={dealData.location} onChange={e => setDealData(d => ({ ...d, location: e.target.value }))} placeholder="City, State" /></div>
            </div>
            <div>
              <Label>Photos (Optional)</Label>
              <div className="flex flex-wrap gap-2 mb-3">{dealData.photo_urls.map((url, i) => <div key={i} className="relative w-20 h-20"><img src={url} alt="" className="w-full h-full object-cover rounded-lg" /><button type="button" onClick={() => setDealData(d => ({ ...d, photo_urls: d.photo_urls.filter((_, j) => j !== i) }))} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><X className="w-3 h-3" /></button></div>)}</div>
              <label className="cursor-pointer"><input type="file" multiple accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploadingPhotos} /><div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg text-sm w-fit">{uploadingPhotos ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}<span>{uploadingPhotos ? 'Uploading...' : 'Add Photos'}</span></div></label>
            </div>
            <div className="flex gap-2 pt-4"><Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button><Button onClick={handleNext} className="bg-[#1e3a5f] hover:bg-[#2a4a7f] flex-1">Next <ArrowRight className="w-4 h-4 ml-2" /></Button></div>
          </div>
        </Card>
      )}

      {currentStep === 2 && (
        <Card className="p-6">
          <div className="space-y-4">
            <div><Label>Business Name *</Label><Input value={profileData.business_name} onChange={e => setProfileData(p => ({ ...p, business_name: e.target.value }))} placeholder="ABC Plumbing Services" /></div>
            <div><Label>Email *</Label><Input type="email" value={profileData.email} onChange={e => setProfileData(p => ({ ...p, email: e.target.value }))} placeholder="business@example.com" /></div>
            <div><Label>Phone</Label><Input type="tel" value={profileData.phone} onChange={e => setProfileData(p => ({ ...p, phone: e.target.value }))} placeholder="(555) 123-4567" /></div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setCurrentStep(1)}>Back</Button>
              <Button onClick={handleCreateAccount} disabled={creating} className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 flex-1">
                {creating ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Creating...</> : <>Create Account <ArrowRight className="w-4 h-4 ml-2" /></>}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}