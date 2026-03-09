import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Sparkles } from 'lucide-react';

export default function BusinessProfileModal({ isOpen, onClose, onComplete }) {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    service_category: '',
    service_area: '',
    description: '',
    years_experience: '',
    hourly_rate: '',
    certifications: '',
    phone: '',
    business_name: ''
  });

  useEffect(() => {
    const loadCategories = async () => {
      const cats = await base44.entities.Category.filter({ type: 'service_type', is_active: true });
      if (cats && cats.length > 0) {
        setCategories(cats);
      } else {
        setCategories([
          { name: 'Plumbing' },
          { name: 'Electrical' },
          { name: 'HVAC' },
          { name: 'Landscaping' },
          { name: 'Cleaning' },
          { name: 'General Contractor' },
          { name: 'Painting' },
          { name: 'Roofing' }
        ]);
      }
    };
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await base44.auth.updateMe({
        business_name: formData.business_name,
        phone: formData.phone,
        service_types: [formData.service_category],
        service_area: formData.service_area,
        description: formData.description,
        years_experience: Number(formData.years_experience) || 0,
        hourly_rate: Number(formData.hourly_rate) || 0,
        certifications: formData.certifications,
        user_type: 'service_provider'
      });

      // Create ProviderSettings for billing
      try {
        const user = await base44.auth.me();
        await base44.entities.ProviderSettings.create({
          provider_email: user.email,
          billing_email: user.email,
          status: 'active'
        });
      } catch (e) {
        console.log('Provider settings creation skipped:', e);
      }

      localStorage.removeItem('proSignupFlow');
      onComplete();
    } catch (error) {
      console.error('Profile setup error:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="w-6 h-6 text-green-600" />
            Complete Your Business Profile
          </DialogTitle>
          <p className="text-sm text-gray-600 mt-2">
            Set up your professional profile to start getting leads and customers
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Business Name *</Label>
            <Input
              placeholder="e.g. Smith & Sons Plumbing"
              value={formData.business_name}
              onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Service Category *</Label>
              <Select
                value={formData.service_category}
                onValueChange={(val) => setFormData({ ...formData, service_category: val })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select service" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat, idx) => (
                    <SelectItem key={idx} value={cat.name.toLowerCase()}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Business Phone *</Label>
              <Input
                type="tel"
                placeholder="(555) 123-4567"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Service Area *</Label>
            <Input
              placeholder="e.g. Greater Seattle Area"
              value={formData.service_area}
              onChange={(e) => setFormData({ ...formData, service_area: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Bio / Description *</Label>
            <Textarea
              placeholder="Tell customers about your expertise..."
              className="min-h-[100px]"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Years of Experience</Label>
              <Input
                type="number"
                min="0"
                placeholder="e.g. 5"
                value={formData.years_experience}
                onChange={(e) => setFormData({ ...formData, years_experience: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Hourly Rate ($)</Label>
              <Input
                type="number"
                min="0"
                placeholder="e.g. 75"
                value={formData.hourly_rate}
                onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Licenses & Certifications</Label>
            <Input
              placeholder="e.g. Licensed Electrician #12345"
              value={formData.certifications}
              onChange={(e) => setFormData({ ...formData, certifications: e.target.value })}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={loading || !formData.business_name || !formData.service_category || !formData.phone || !formData.service_area || !formData.description}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                'Complete Profile'
              )}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Skip for Now
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}