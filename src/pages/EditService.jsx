import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ArrowLeft } from 'lucide-react';

export default function EditService() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const serviceId = urlParams.get('id');
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [serviceForm, setServiceForm] = useState({
    expert_name: '',
    expert_email: '',
    expert_phone: '',
    service_category: '',
    description: '',
    service_area: '',
    years_experience: '',
    hourly_rate: '',
    photo_url: '',
    certifications: ''
  });

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['clean']
    ]
  };

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        if (!currentUser) base44.auth.redirectToLogin(window.location.href);
        else if (!serviceId) {
           setServiceForm(prev => ({
             ...prev,
             expert_email: currentUser.email,
             expert_name: currentUser.full_name || ''
           }));
        }
      } catch (error) {
        base44.auth.redirectToLogin(window.location.href);
      }
    };
    loadUser();
  }, [serviceId]);

  const { data: service, isLoading } = useQuery({
    queryKey: ['service', serviceId],
    queryFn: async () => {
      if (!serviceId) return null;
      const services = await base44.entities.ServiceListing.filter({ id: serviceId });
      return services[0];
    },
    enabled: !!serviceId
  });

  const { data: categories } = useQuery({
    queryKey: ['serviceCategories'],
    queryFn: () => base44.entities.Category.filter({ type: 'service_type', is_active: true }),
    initialData: []
  });

  useEffect(() => {
    if (service) {
      setServiceForm(service);
    }
  }, [service]);

  const mutation = useMutation({
    mutationFn: (data) => {
      const formattedData = {
        ...data,
        years_experience: parseFloat(data.years_experience) || 0,
        hourly_rate: parseFloat(data.hourly_rate) || 0
      };
      if (serviceId) {
        return base44.entities.ServiceListing.update(serviceId, formattedData);
      }
      return base44.entities.ServiceListing.create(formattedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myServices']);
      queryClient.invalidateQueries(['services']);
      navigate(-1);
    }
  });

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setServiceForm({ ...serviceForm, photo_url: file_url });
    } catch (error) {
      console.error(error);
    }
    setUploadingPhoto(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(serviceForm);
  };

  if (isLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center bg-black/50"><Loader2 className="animate-spin text-white" /></div>;
  }

  return (
    <div className="min-h-screen bg-gray-100/90 backdrop-blur-sm flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-3xl relative">
        <Button 
          variant="ghost" 
          className="absolute -top-12 left-0 text-gray-600 hover:text-gray-900"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        
        <Card className="shadow-2xl p-6 bg-white">
          <h2 className="text-xl font-bold text-[#1e3a5f] mb-4">
            {serviceId ? 'Edit Service' : 'New Service Listing'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Your Name *</Label>
                <Input
                  value={serviceForm.expert_name}
                  onChange={(e) => setServiceForm({ ...serviceForm, expert_name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Email *</Label>
                <Input
                  value={serviceForm.expert_email}
                  onChange={(e) => setServiceForm({ ...serviceForm, expert_email: e.target.value })}
                  type="email"
                  required
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={serviceForm.expert_phone}
                  onChange={(e) => setServiceForm({ ...serviceForm, expert_phone: e.target.value })}
                  type="tel"
                />
              </div>
              <div>
                <Label>Service Category *</Label>
                <Select
                  value={serviceForm.service_category || ''}
                  onValueChange={(value) => setServiceForm({ ...serviceForm, service_category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.filter(cat => cat.name).map(cat => (
                      <SelectItem key={cat.id} value={cat.name}>{cat.icon} {cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Service Area</Label>
                <Input
                  value={serviceForm.service_area}
                  onChange={(e) => setServiceForm({ ...serviceForm, service_area: e.target.value })}
                  placeholder="City, State"
                />
              </div>
              <div>
                <Label>Years of Experience</Label>
                <Input
                  value={serviceForm.years_experience}
                  onChange={(e) => setServiceForm({ ...serviceForm, years_experience: e.target.value })}
                  type="number"
                />
              </div>
              <div>
                <Label>Hourly Rate ($)</Label>
                <Input
                  value={serviceForm.hourly_rate}
                  onChange={(e) => setServiceForm({ ...serviceForm, hourly_rate: e.target.value })}
                  type="number"
                />
              </div>
              <div>
                <Label>Profile Photo</Label>
                <Input type="file" accept="image/*" onChange={handlePhotoUpload} disabled={uploadingPhoto} />
                {serviceForm.photo_url && <img src={serviceForm.photo_url} className="w-20 h-20 object-cover rounded mt-2" />}
              </div>
            </div>
            <div>
              <Label>Description *</Label>
              <ReactQuill
                theme="snow"
                value={serviceForm.description}
                onChange={(value) => setServiceForm({ ...serviceForm, description: value })}
                modules={quillModules}
                style={{ minHeight: '120px' }}
              />
            </div>
            <div>
              <Label>Certifications</Label>
              <Textarea
                value={serviceForm.certifications}
                onChange={(e) => setServiceForm({ ...serviceForm, certifications: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="submit" className="bg-[#1e3a5f] hover:bg-[#2a4a7f]" disabled={mutation.isLoading}>
                {mutation.isLoading ? <Loader2 className="animate-spin" /> : 'Save Service'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}