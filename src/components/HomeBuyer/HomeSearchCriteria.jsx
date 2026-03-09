import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRight, ArrowLeft } from 'lucide-react';

export default function HomeSearchCriteria({ onNext, onBack, initialData }) {
  const [criteria, setCriteria] = useState(initialData || {
    location: '',
    max_price: '',
    min_bedrooms: '',
    min_bathrooms: '',
    property_type: 'single_family',
    min_sqft: '',
    additional_notes: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!criteria.location || !criteria.max_price) {
      alert('Please fill in location and max price');
      return;
    }
    onNext(criteria);
  };

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold text-[#1e3a5f] mb-6">What are you looking for?</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>City or ZIP Code *</Label>
          <Input
            value={criteria.location}
            onChange={(e) => setCriteria({ ...criteria, location: e.target.value })}
            placeholder="e.g., Sacramento or 95814"
            required
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Maximum Price *</Label>
            <Input
              type="number"
              value={criteria.max_price}
              onChange={(e) => setCriteria({ ...criteria, max_price: e.target.value })}
              placeholder="e.g., 500000"
              required
            />
          </div>

          <div>
            <Label>Property Type</Label>
            <Select
              value={criteria.property_type}
              onValueChange={(value) => setCriteria({ ...criteria, property_type: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single_family">Single Family Home</SelectItem>
                <SelectItem value="condo">Condo</SelectItem>
                <SelectItem value="townhouse">Townhouse</SelectItem>
                <SelectItem value="multi_family">Multi-Family</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <Label>Min Bedrooms</Label>
            <Input
              type="number"
              value={criteria.min_bedrooms}
              onChange={(e) => setCriteria({ ...criteria, min_bedrooms: e.target.value })}
              placeholder="e.g., 3"
            />
          </div>

          <div>
            <Label>Min Bathrooms</Label>
            <Input
              type="number"
              step="0.5"
              value={criteria.min_bathrooms}
              onChange={(e) => setCriteria({ ...criteria, min_bathrooms: e.target.value })}
              placeholder="e.g., 2"
            />
          </div>

          <div>
            <Label>Min Sq Ft</Label>
            <Input
              type="number"
              value={criteria.min_sqft}
              onChange={(e) => setCriteria({ ...criteria, min_sqft: e.target.value })}
              placeholder="e.g., 1500"
            />
          </div>
        </div>

        <div>
          <Label>What are you looking for? (Optional)</Label>
          <Textarea
            value={criteria.additional_notes}
            onChange={(e) => setCriteria({ ...criteria, additional_notes: e.target.value })}
            placeholder="Describe your ideal home, must-have features, preferred neighborhoods, etc..."
            rows={4}
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button type="submit" className="flex-1 bg-[#1e3a5f] hover:bg-[#2a4a7f]">
            Search Homes
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </form>
    </Card>
  );
}