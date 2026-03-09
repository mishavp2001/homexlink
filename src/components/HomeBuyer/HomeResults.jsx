import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Home, Bed, Bath, Maximize, DollarSign, ArrowLeft, ArrowRight } from 'lucide-react';

export default function HomeResults({ criteria, onNext, onBack }) {
  const [loading, setLoading] = useState(true);
  const [homes, setHomes] = useState([]);
  const [selectedHome, setSelectedHome] = useState(null);
  const [desiredChanges, setDesiredChanges] = useState('');

  useEffect(() => {
    searchHomes();
  }, []);

  const searchHomes = async () => {
    setLoading(true);
    try {
      const prompt = `Generate a list of 5 realistic homes currently on the market that match these criteria:
Location: ${criteria.location}
Max Price: $${criteria.max_price}
Property Type: ${criteria.property_type}
Min Bedrooms: ${criteria.min_bedrooms || 'Any'}
Min Bathrooms: ${criteria.min_bathrooms || 'Any'}
Min Sq Ft: ${criteria.min_sqft || 'Any'}
${criteria.additional_notes ? `\nAdditional Requirements: ${criteria.additional_notes}` : ''}

For each home, provide realistic market data including address, price, bedrooms, bathrooms, square footage, and a brief description.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            homes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  address: { type: "string" },
                  price: { type: "number" },
                  bedrooms: { type: "number" },
                  bathrooms: { type: "number" },
                  sqft: { type: "number" },
                  description: { type: "string" },
                  match_score: { type: "number" }
                }
              }
            }
          }
        }
      });

      setHomes(response.homes || []);
    } catch (error) {
      console.error('Failed to search homes:', error);
      alert('Failed to search homes. Please try again.');
    }
    setLoading(false);
  };

  const handleSubmit = () => {
    if (!selectedHome) {
      alert('Please select a home');
      return;
    }
    onNext({ selectedHome, desiredChanges });
  };

  if (loading) {
    return (
      <Card className="p-12 text-center">
        <Loader2 className="w-12 h-12 animate-spin text-[#1e3a5f] mx-auto mb-4" />
        <p className="text-gray-600">Searching for homes that match your criteria...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold text-[#1e3a5f] mb-4">Available Homes</h2>
        <p className="text-gray-600 mb-6">Select the home that best matches your needs</p>

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {homes.map((home, idx) => (
            <Card
              key={idx}
              className={`p-4 cursor-pointer transition-all hover:shadow-lg ${
                selectedHome === home ? 'border-2 border-[#1e3a5f] bg-blue-50' : 'border'
              }`}
              onClick={() => setSelectedHome(home)}>
              
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{home.address}</h3>
                  <p className="text-2xl font-bold text-[#d4af37]">
                    ${home.price.toLocaleString()}
                  </p>
                </div>
                {home.match_score && (
                  <Badge className="bg-green-100 text-green-800">
                    {home.match_score}% Match
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                <span className="flex items-center gap-1">
                  <Bed className="w-4 h-4" />
                  {home.bedrooms} bed
                </span>
                <span className="flex items-center gap-1">
                  <Bath className="w-4 h-4" />
                  {home.bathrooms} bath
                </span>
                <span className="flex items-center gap-1">
                  <Maximize className="w-4 h-4" />
                  {home.sqft.toLocaleString()} sq ft
                </span>
              </div>

              <p className="text-sm text-gray-700">{home.description}</p>
            </Card>
          ))}
        </div>

        {selectedHome && (
          <div className="border-t pt-6">
            <Label>What would you like to change about this home?</Label>
            <Textarea
              value={desiredChanges}
              onChange={(e) => setDesiredChanges(e.target.value)}
              placeholder="e.g., I'd like a lower price, prefer a different location, need more bedrooms..."
              rows={4}
              className="mt-2"
            />
          </div>
        )}

        <div className="flex gap-3 pt-6">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedHome}
            className="flex-1 bg-[#d4af37] hover:bg-[#c49d2a]">
            Continue
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </Card>
    </div>
  );
}