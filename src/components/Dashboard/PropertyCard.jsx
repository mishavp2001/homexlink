import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Home, FileText, Wrench, ExternalLink, Sparkles, TrendingUp, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function PropertyCard({ property, reports, onRevaluate, isRevaluating, onDelete }) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const photos = property.property_photos || [];
  const hasPhotos = photos.length > 0;

  const handleDelete = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('Delete this property? This will also delete all associated components, reports, and maintenance tasks.')) {
      onDelete?.();
    }
  };

  const nextPhoto = (e) => {
    e.preventDefault();
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = (e) => {
    e.preventDefault();
    setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };
  const inspectionReport = reports?.find(r => r.report_type === 'inspection');
  const appraisalReport = reports?.find(r => r.report_type === 'appraisal');
  const hasAIInsights = property?.ai_insights && Object.keys(property.ai_insights).length > 0;

  return (
    <Link to={createPageUrl(`PropertyDetails?id=${property.id}`)} className="block">
      <Card className="overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer relative">
        <Button
          size="icon"
          variant="ghost"
          className="absolute bottom-2 right-2 h-7 w-7 text-gray-400 hover:text-red-600 hover:bg-red-50 z-10"
          onClick={handleDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      {hasPhotos ? (
        <div className="relative h-56 bg-gray-100">
          <img
            src={photos[currentPhotoIndex]}
            alt={`${property.address} - Photo ${currentPhotoIndex + 1}`}
            className="w-full h-full object-cover"
          />
          {photos.length > 1 && (
            <>
              <Button
                size="icon"
                variant="ghost"
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full h-8 w-8"
                onClick={prevPhoto}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full h-8 w-8"
                onClick={nextPhoto}
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {photos.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-2 rounded-full transition-all ${
                      idx === currentPhotoIndex ? 'bg-white w-6' : 'bg-white/50 w-2'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
          <div className="absolute top-3 right-3">
            {hasAIInsights && (
              <Badge className="bg-[#d4af37] text-white border-none">
                <Sparkles className="w-3 h-3 mr-1" />
                AI
              </Badge>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-[#1e3a5f] to-[#2a4a7f] p-6 text-white">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <Home className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold">{property.address}</h2>
                    {hasAIInsights && (
                      <Badge className="bg-[#d4af37] text-white border-none">
                        <Sparkles className="w-3 h-3 mr-1" />
                        AI
                      </Badge>
                    )}
                  </div>
                  <p className="text-white/80 text-sm">{property.sqft} sqft • {property.bedrooms} bed • {property.bathrooms} bath</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="p-6">
        {hasPhotos && (
          <div className="mb-4">
            <h2 className="text-xl font-bold text-[#1e3a5f] mb-1">{property.address}</h2>
            <p className="text-sm text-gray-600">{property.sqft} sqft • {property.bedrooms} bed • {property.bathrooms} bath</p>
          </div>
        )}
        
        <div className="bg-gradient-to-r from-[#d4af37]/10 to-[#d4af37]/5 rounded-xl p-6 mb-6">
          <p className="text-sm text-gray-600 mb-1">Appraised Value</p>
          <p className="text-4xl font-bold text-[#1e3a5f]">
            ${property.appraised_value ? Math.round(property.appraised_value).toLocaleString() : 'Calculating...'}
          </p>
          {property.market_rating && (
            <p className="text-sm text-gray-600 mt-2">
              Market Rating: {property.market_rating}/10
            </p>
          )}
        </div>

        {hasAIInsights && property.ai_insights.roi_projection && (
          <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <h3 className="text-sm font-semibold text-gray-900">AI ROI Projection</h3>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <p className="text-gray-600">1 Year</p>
                <p className="font-bold text-green-600">+{property.ai_insights.roi_projection.one_year}%</p>
              </div>
              <div>
                <p className="text-gray-600">5 Year</p>
                <p className="font-bold text-green-600">+{property.ai_insights.roi_projection.five_year}%</p>
              </div>
              <div>
                <p className="text-gray-600">10 Year</p>
                <p className="font-bold text-green-600">+{property.ai_insights.roi_projection.ten_year}%</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Rebuild Cost</p>
            <p className="text-lg font-semibold text-[#1e3a5f]">
              ${Math.round((property.sqft || 0) * (property.rebuild_cost_per_sqft || 0)).toLocaleString()}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Asset Value</p>
            <p className="text-lg font-semibold text-[#1e3a5f]">
              ${Math.round(property.total_asset_residual_value || 0).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {inspectionReport && (
            <Link to={createPageUrl(`ReportViewer?id=${inspectionReport.id}`)} onClick={(e) => e.stopPropagation()}>
              <Button variant="outline" className="w-full justify-between border-[#1e3a5f] text-[#1e3a5f] hover:bg-[#1e3a5f] hover:text-white">
                <span className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Inspection Report
                </span>
                <ExternalLink className="w-4 h-4" />
              </Button>
            </Link>
          )}

          {appraisalReport && (
            <Link to={createPageUrl(`ReportViewer?id=${appraisalReport.id}`)} onClick={(e) => e.stopPropagation()}>
              <Button variant="outline" className="w-full justify-between border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37] hover:text-white">
                <span className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Appraisal Report
                </span>
                <ExternalLink className="w-4 h-4" />
              </Button>
            </Link>
          )}

          <Link to={createPageUrl(`Maintenance?propertyId=${property.id}`)} onClick={(e) => e.stopPropagation()}>
            <Button variant="outline" className="w-full justify-between">
              <span className="flex items-center gap-2">
                <Wrench className="w-4 h-4" />
                Maintenance Schedule
              </span>
              <ExternalLink className="w-4 h-4" />
            </Button>
          </Link>

          <Button
            variant="outline"
            className="w-full justify-between border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37] hover:text-white"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRevaluate?.();
            }}
            disabled={isRevaluating}
          >
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              {hasAIInsights ? 'AI Revaluation' : 'Generate AI Insights'}
            </span>
            {isRevaluating && <span className="animate-spin">⏳</span>}
          </Button>
        </div>
      </div>
    </Card>
    </Link>
  );
}