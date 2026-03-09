import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, X, Camera, Loader2 } from 'lucide-react';
import { createPageUrl } from '@/utils';

const COMPONENT_TYPES = [
  { value: 'roof', label: 'Roof' },
  { value: 'hvac', label: 'HVAC System' },
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'windows', label: 'Windows/Doors' },
  { value: 'flooring', label: 'Flooring' },
  { value: 'painting', label: 'Painting' },
  { value: 'appliances', label: 'Appliances' },
  { value: 'foundation', label: 'Foundation' },
  { value: 'other', label: 'Other' }
];

export default function MaintenanceProjectModal({ onClose }) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [projectData, setProjectData] = useState({ project_title: '', project_description: '', project_type: '', component_type: '', urgency: 'medium', preferred_timeline: '', budget_range: '', photo_urls: [] });
  const [profileData, setProfileData] = useState({ full_name: '', email: '', phone: '', address: '' });
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [creating, setCreating] = useState(false);

  const { data: projectTypeCategories = [] } = useQuery({
    queryKey: ['projectTypeCategories'],
    queryFn: () => base44.entities.Category.filter({ type: 'project_type', is_active: true })
  });

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploadingPhotos(true);
    const results = await Promise.all(files.map(f => base44.integrations.Core.UploadFile({ file: f })));
    setProjectData(prev => ({ ...prev, photo_urls: [...prev.photo_urls, ...results.map(r => r.file_url)] }));
    setUploadingPhotos(false);
  };

  const handleProjectNext = () => {
    if (!projectData.project_title || !projectData.project_description || !projectData.component_type) { alert('Please fill in all required fields'); return; }
    setCurrentStep(2);
  };

  const handleCreateProject = async () => {
    if (!profileData.full_name || !profileData.email || !profileData.address) { alert('Please fill in all required fields'); return; }
    setCreating(true);
    const signupUrl = window.location.origin + createPageUrl('Dashboard') + '?signup=true&name=' + encodeURIComponent(profileData.full_name) + '&email=' + encodeURIComponent(profileData.email) + '&phone=' + encodeURIComponent(profileData.phone || '') + '&address=' + encodeURIComponent(profileData.address) + '&project=' + encodeURIComponent(JSON.stringify(projectData));
    base44.auth.redirectToLogin(signupUrl);
  };

  return (
    <div className="py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#1e3a5f] mb-2">Start a Maintenance Project</h1>
          <p className="text-gray-600">Tell us what you need, we'll connect you with experts</p>
        </div>

        {currentStep === 1 && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-[#1e3a5f] mb-4">Project Details</h2>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Project Type *</Label>
                  <Select value={projectData.project_type} onValueChange={v => setProjectData(p => ({ ...p, project_type: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      {projectTypeCategories.length > 0 ? projectTypeCategories.map(t => <SelectItem key={t.id} value={t.name}>{t.icon} {t.name}</SelectItem>) : <><SelectItem value="Repair">Repair</SelectItem><SelectItem value="Replace">Replace</SelectItem><SelectItem value="Install">Install</SelectItem></>}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Component Type *</Label>
                  <Select value={projectData.component_type} onValueChange={v => setProjectData(p => ({ ...p, component_type: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select component" /></SelectTrigger>
                    <SelectContent>{COMPONENT_TYPES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Project Title *</Label><Input value={projectData.project_title} onChange={e => setProjectData(p => ({ ...p, project_title: e.target.value }))} placeholder="e.g., Fix leaking kitchen faucet" /></div>
              <div><Label>Description *</Label><Textarea value={projectData.project_description} onChange={e => setProjectData(p => ({ ...p, project_description: e.target.value }))} rows={4} placeholder="Describe what needs to be done..." /></div>
              <div className="grid md:grid-cols-3 gap-4">
                <div><Label>Urgency</Label><Select value={projectData.urgency} onValueChange={v => setProjectData(p => ({ ...p, urgency: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem><SelectItem value="urgent">Urgent</SelectItem></SelectContent></Select></div>
                <div><Label>Timeline</Label><Input value={projectData.preferred_timeline} onChange={e => setProjectData(p => ({ ...p, preferred_timeline: e.target.value }))} placeholder="e.g., Within 1 week" /></div>
                <div><Label>Budget ($)</Label><Input value={projectData.budget_range} onChange={e => setProjectData(p => ({ ...p, budget_range: e.target.value }))} placeholder="e.g., 500-1000" /></div>
              </div>
              <div>
                <Label>Photos (Optional)</Label>
                <div className="flex flex-wrap gap-2 mb-3">{projectData.photo_urls.map((url, i) => <div key={i} className="relative w-20 h-20"><img src={url} alt="" className="w-full h-full object-cover rounded-lg" /><button type="button" onClick={() => setProjectData(p => ({ ...p, photo_urls: p.photo_urls.filter((_, j) => j !== i) }))} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><X className="w-3 h-3" /></button></div>)}</div>
                <label className="cursor-pointer"><input type="file" multiple accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploadingPhotos} /><div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg text-sm w-fit">{uploadingPhotos ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}<span>{uploadingPhotos ? 'Uploading...' : 'Add Photos'}</span></div></label>
              </div>
              <div className="flex gap-2 pt-4"><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={handleProjectNext} className="bg-[#1e3a5f] hover:bg-[#2a4a7f]">Next <ArrowRight className="w-4 h-4 ml-2" /></Button></div>
            </div>
          </Card>
        )}

        {currentStep === 2 && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-[#1e3a5f] mb-4">Your Information</h2>
            <p className="text-gray-600 mb-6">Create your profile to receive quotes from professionals</p>
            <div className="space-y-4">
              <div><Label>Full Name *</Label><Input value={profileData.full_name} onChange={e => setProfileData(p => ({ ...p, full_name: e.target.value }))} placeholder="John Doe" /></div>
              <div><Label>Email *</Label><Input type="email" value={profileData.email} onChange={e => setProfileData(p => ({ ...p, email: e.target.value }))} placeholder="john@example.com" /></div>
              <div><Label>Phone</Label><Input type="tel" value={profileData.phone} onChange={e => setProfileData(p => ({ ...p, phone: e.target.value }))} placeholder="(555) 123-4567" /></div>
              <div><Label>Property Address *</Label><Input value={profileData.address} onChange={e => setProfileData(p => ({ ...p, address: e.target.value }))} placeholder="123 Main St, City, State ZIP" /></div>
              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setCurrentStep(1)}>Back</Button>
                <Button onClick={handleCreateProject} disabled={creating} className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800">
                  {creating ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Creating...</> : <>Create Account & Project <ArrowRight className="w-4 h-4 ml-2" /></>}
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}