import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { UploadFile } from '@/api/integrations';
import { Upload, X, Camera, Loader2 } from 'lucide-react';

const componentTypes = [
  { id: 'front', label: 'Front Exterior' },
  { id: 'roof', label: 'Roof' },
  { id: 'windows', label: 'Windows' },
  { id: 'porch', label: 'Porch/Deck' },
  { id: 'heater', label: 'Heater' },
  { id: 'ac', label: 'Air Conditioning' },
  { id: 'pool', label: 'Pool' },
  { id: 'other', label: 'Other Equipment' }
];

const conditions = [
  { id: 'excellent', label: 'Excellent (Perfect)' },
  { id: 'good', label: 'Good' },
  { id: 'fair', label: 'Fair' },
  { id: 'poor', label: 'Poor' }
];

export default function AddSingleComponent({ onSave, onCancel, initialData = null }) {
  const [formData, setFormData] = useState({
    component_type: initialData?.component_type || '',
    description: initialData?.description || '',
    serial_number: initialData?.serial_number || '',
    brand: initialData?.brand || '',
    installation_year: initialData?.installation_year || '',
    current_condition: initialData?.current_condition || '',
    photo_urls: initialData?.photo_urls || []
  });
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (files) => {
    setUploading(true);
    const uploadedUrls = [];
    try {
      for (const file of files) {
        const { file_url } = await UploadFile({ file });
        uploadedUrls.push(file_url);
      }
      setFormData(prev => ({
        ...prev,
        photo_urls: [...prev.photo_urls, ...uploadedUrls]
      }));
    } catch (error) {
      console.error('Upload error:', error);
    }
    setUploading(false);
  };

  const removePhoto = (index) => {
    setFormData(prev => ({
      ...prev,
      photo_urls: prev.photo_urls.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = () => {
    if (!formData.component_type) {
      alert('Please select a component type');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="bg-white p-6 rounded-lg border shadow-sm space-y-6">
      <h3 className="text-lg font-semibold text-[#1e3a5f]">{initialData ? 'Edit Component' : 'Add New Component'}</h3>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label>Component Type *</Label>
            <Select 
              value={formData.component_type} 
              onValueChange={(v) => setFormData({...formData, component_type: v})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {componentTypes.map(type => (
                  <SelectItem key={type.id} value={type.id}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea 
              value={formData.description} 
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Describe the component..."
            />
          </div>

          <div>
            <Label>Brand</Label>
            <Input 
              value={formData.brand} 
              onChange={(e) => setFormData({...formData, brand: e.target.value})}
              placeholder="e.g. Carrier, Trane"
            />
          </div>

          <div>
            <Label>Serial Number</Label>
            <Input 
              value={formData.serial_number} 
              onChange={(e) => setFormData({...formData, serial_number: e.target.value})}
              placeholder="Optional"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label>Year Installed</Label>
            <Input 
              type="number"
              value={formData.installation_year} 
              onChange={(e) => setFormData({...formData, installation_year: e.target.value})}
              placeholder="YYYY"
            />
          </div>

          <div>
            <Label>Condition</Label>
            <Select 
              value={formData.current_condition} 
              onValueChange={(v) => setFormData({...formData, current_condition: v})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select condition" />
              </SelectTrigger>
              <SelectContent>
                {conditions.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-2 block">Photos</Label>
            <div className="flex flex-wrap gap-2 mb-3">
              {formData.photo_urls.map((url, index) => (
                <div key={index} className="relative w-20 h-20">
                  <img src={url} alt="" className="w-full h-full object-cover rounded-lg" />
                  <button
                    onClick={() => removePhoto(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            <label className="cursor-pointer inline-block">
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileUpload(Array.from(e.target.files))}
                disabled={uploading}
              />
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors">
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
                <span>{uploading ? 'Uploading...' : 'Add Photos'}</span>
              </div>
            </label>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSubmit} className="bg-[#1e3a5f] hover:bg-[#2a4a7f]">
          {initialData ? 'Update Component' : 'Save Component'}
        </Button>
      </div>
    </div>
  );
}