import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2, Sparkles, Send, X, Camera } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function ComponentCard({ component, onUpdate, onRequestQuote, canEdit, propertyId }) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [editData, setEditData] = useState(component);
  const [saving, setSaving] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.entities.PropertyComponent.update(component.id, editData);
      onUpdate();
      setShowEditDialog(false);
    } catch (error) {
      console.error('Failed to save:', error);
      alert('Failed to save changes');
    }
    setSaving(false);
  };

  const handleGenerateAIInsights = async () => {
    setGeneratingAI(true);
    try {
      const prompt = `You are a property maintenance expert. Analyze this property component and provide detailed insights.

COMPONENT DETAILS:
- Type: ${component.component_type}
- Brand: ${component.brand || 'Unknown'}
- Model: ${component.model || 'Unknown'}
- Installation Year: ${component.installation_year || 'Unknown'}
- Current Condition: ${component.current_condition}
- Estimated Lifetime: ${component.estimated_lifetime_years || 'Unknown'} years
- Replacement Cost: $${component.replacement_cost || 'Unknown'}
- Description: ${component.description || 'None provided'}
- Maintenance Notes: ${component.maintenance_notes || 'None'}

Provide comprehensive insights including:
1. Maintenance recommendations and schedule
2. Expected remaining lifespan
3. Warning signs to watch for
4. Cost-saving tips
5. Upgrade opportunities
6. Safety considerations

Format as structured JSON.`;

      const aiInsights = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            maintenance_schedule: { type: "string" },
            remaining_lifespan: { type: "string" },
            warning_signs: { type: "string" },
            cost_saving_tips: { type: "string" },
            upgrade_opportunities: { type: "string" },
            safety_notes: { type: "string" }
          }
        }
      });

      await base44.entities.PropertyComponent.update(component.id, {
        ai_insights: aiInsights,
        ai_insights_generated_date: new Date().toISOString()
      });

      onUpdate();
      alert('AI insights generated successfully!');
      setShowAIDialog(false);
    } catch (error) {
      console.error('Failed to generate AI insights:', error);
      alert('Failed to generate insights');
    }
    setGeneratingAI(false);
  };

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingPhotos(true);
    try {
      const uploadPromises = files.map(file =>
        base44.integrations.Core.UploadFile({ file })
      );
      const results = await Promise.all(uploadPromises);
      const urls = results.map(r => r.file_url);
      setEditData({ 
        ...editData, 
        photo_urls: [...(editData.photo_urls || []), ...urls] 
      });
    } catch (error) {
      console.error('Upload error:', error);
    }
    setUploadingPhotos(false);
  };

  const removePhoto = (index) => {
    setEditData({
      ...editData,
      photo_urls: editData.photo_urls.filter((_, i) => i !== index)
    });
  };

  const hasAIInsights = component.ai_insights && Object.keys(component.ai_insights).length > 0;

  return (
    <>
      <Card 
        className="p-4 border-2 border-gray-100 hover:border-[#d4af37] transition-all cursor-pointer group"
        onClick={() => canEdit && setShowEditDialog(true)}
      >
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-[#1e3a5f] capitalize">
            {component.component_type.replace('_', ' ')}
          </h3>
          <div className="flex gap-1">
            {hasAIInsights && (
              <Badge className="bg-[#d4af37] text-white text-xs">
                <Sparkles className="w-3 h-3 mr-1" />
                AI
              </Badge>
            )}
          </div>
        </div>

        {component.photo_urls?.length > 0 && (
          <div className="flex gap-2 mb-3 overflow-x-auto">
            {component.photo_urls.map((url, idx) => (
              <img
                key={idx}
                src={url}
                alt=""
                className="w-20 h-20 object-cover rounded"
              />
            ))}
          </div>
        )}

        <div className="space-y-1 text-sm">
          {component.brand && (
            <div className="flex justify-between">
              <span className="text-gray-600">Brand:</span>
              <span className="font-medium">{component.brand}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-600">Condition:</span>
            <span className="font-medium capitalize">{component.current_condition}</span>
          </div>
          {component.estimated_lifetime_years && (
            <div className="flex justify-between">
              <span className="text-gray-600">Lifetime:</span>
              <span className="font-medium">{component.estimated_lifetime_years} years</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-600">Value:</span>
            <span className="font-medium">${component.residual_value?.toLocaleString() || 0}</span>
          </div>
        </div>

        {hasAIInsights && (
          <div className="mt-3 p-2 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-800">✨ AI insights available</p>
          </div>
        )}

        {canEdit && (
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onRequestQuote(component);
            }}
            size="sm"
            className="w-full mt-3 bg-[#d4af37] hover:bg-[#c49d2a]"
          >
            <Send className="w-4 h-4 mr-2" />
            Request Quote
          </Button>
        )}
      </Card>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Component</DialogTitle>
            <DialogDescription>Update component details, add AI insights, or attach a maintenance project</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label>Description</Label>
              <Textarea
                value={editData.description || ''}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Brand</Label>
                <Input
                  value={editData.brand || ''}
                  onChange={(e) => setEditData({ ...editData, brand: e.target.value })}
                />
              </div>
              <div>
                <Label>Model</Label>
                <Input
                  value={editData.model || ''}
                  onChange={(e) => setEditData({ ...editData, model: e.target.value })}
                />
              </div>
              <div>
                <Label>Installation Year</Label>
                <Input
                  type="number"
                  value={editData.installation_year || ''}
                  onChange={(e) => setEditData({ ...editData, installation_year: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <Label>Condition</Label>
                <Select
                  value={editData.current_condition || 'good'}
                  onValueChange={(value) => setEditData({ ...editData, current_condition: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excellent">Excellent</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="poor">Poor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Photos</Label>
              <div className="flex flex-wrap gap-2 mb-3">
                {editData.photo_urls?.map((url, index) => (
                  <div key={index} className="relative w-20 h-20">
                    <img src={url} alt="" className="w-full h-full object-cover rounded-lg" />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              <label className="cursor-pointer">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                  disabled={uploadingPhotos}
                />
                <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg text-sm w-fit">
                  {uploadingPhotos ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                  <span>{uploadingPhotos ? 'Uploading...' : 'Add Photos'}</span>
                </div>
              </label>
            </div>

            <div>
              <Label>Maintenance Notes</Label>
              <Textarea
                value={editData.maintenance_notes || ''}
                onChange={(e) => setEditData({ ...editData, maintenance_notes: e.target.value })}
                rows={3}
                placeholder="Any maintenance history or notes..."
              />
            </div>

            {hasAIInsights && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <p className="font-semibold text-blue-900">AI Insights</p>
                </div>
                <div className="space-y-2 text-sm">
                  {component.ai_insights.maintenance_schedule && (
                    <div>
                      <p className="font-medium text-gray-700">Maintenance Schedule:</p>
                      <p className="text-gray-600">{component.ai_insights.maintenance_schedule}</p>
                    </div>
                  )}
                  {component.ai_insights.warning_signs && (
                    <div>
                      <p className="font-medium text-gray-700">Warning Signs:</p>
                      <p className="text-gray-600">{component.ai_insights.warning_signs}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowEditDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => setShowAIDialog(true)}
                variant="outline"
                className="flex-1"
                disabled={generatingAI}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {hasAIInsights ? 'Regenerate AI' : 'Generate AI Insights'}
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-[#1e3a5f] hover:bg-[#2a4a7f]"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Save
              </Button>
            </div>

            <div className="pt-4 border-t">
              <Button
                onClick={() => {
                  setShowEditDialog(false);
                  onRequestQuote(component);
                }}
                className="w-full bg-[#d4af37] hover:bg-[#c49d2a]"
              >
                <Send className="w-4 h-4 mr-2" />
                Request Quote for This Component
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#d4af37]" />
              Generate AI Insights
            </DialogTitle>
            <DialogDescription>
              Get AI-powered maintenance recommendations for this component
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {generatingAI ? (
              <div className="text-center py-12">
                <Loader2 className="w-12 h-12 animate-spin text-[#1e3a5f] mx-auto mb-4" />
                <p className="text-gray-600">Analyzing component with AI...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-gray-700">
                  This will analyze your <strong className="capitalize">{component.component_type.replace('_', ' ')}</strong> component
                  and provide personalized maintenance recommendations, lifecycle predictions, and cost-saving tips.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowAIDialog(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleGenerateAIInsights}
                    className="flex-1 bg-gradient-to-r from-[#d4af37] to-[#c49d2a]"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Insights
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}