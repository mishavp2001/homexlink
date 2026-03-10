import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Home, Wrench, DollarSign, FileText, TrendingUp, AlertTriangle, Calendar, MapPin, Ruler, Bed, Bath, Building, Zap, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import Navigation from '../components/Navigation';
import { base44 } from '@/api/base44Client';

export const isPublic = true;

export default function DemoPropertyDashboard() {
  const [activeTab, setActiveTab] = useState('property');

  const handleGetStarted = () => {
    const signupUrl = window.location.origin + createPageUrl('Dashboard') + '?signup=true';
    base44.auth.redirectToAppLogin(signupUrl);
  };

  // Demo Property Data
  const demoProperty = {
    id: 'demo-1',
    address: '123 Demo Street, San Francisco, CA 94102',
    sqft: 2400,
    lot_size: 5000,
    bedrooms: 4,
    bathrooms: 2.5,
    year_built: 1995,
    property_type: 'single_family',
    property_classification: 'primary',
    rebuild_cost_per_sqft: 250,
    land_value: 800000,
    market_rating: 8.5,
    appraised_value: 1450000,
    total_asset_residual_value: 1350000,
    ai_insights: {
      market_trends: 'San Francisco real estate market remains strong with 5.2% year-over-year appreciation. Limited inventory and high demand continue to drive prices upward.',
      roi_projection: {
        one_year: 1521000,
        five_year: 1850000,
        ten_year: 2320000
      },
      investment_risks: [
        { risk_type: 'Market Volatility', severity: 'medium', description: 'Tech sector fluctuations may impact local property values' },
        { risk_type: 'Natural Disasters', severity: 'low', description: 'Earthquake risk typical for Bay Area location' }
      ],
      investment_opportunities: [
        'Kitchen and bathroom modernization could add $80-120k in value',
        'Converting garage to ADU could generate $3,000/month rental income',
        'Solar panel installation with 6-year payback period'
      ],
      value_drivers: [
        'Prime San Francisco location',
        'Strong school district',
        'Recent roof replacement',
        'Updated HVAC system'
      ],
      maintenance_priorities: [
        { priority: 'High', item: 'Water heater replacement recommended within 12 months', estimated_cost: 2500, urgency: 'Plan ahead' },
        { priority: 'Medium', item: 'Exterior paint refresh', estimated_cost: 8000, urgency: '12-18 months' },
        { priority: 'Low', item: 'Landscape improvements', estimated_cost: 5000, urgency: 'Optional' }
      ]
    },
    status: 'completed'
  };

  const demoComponents = [
    {
      id: 'comp-1',
      component_type: 'roof',
      description: 'Asphalt shingle roof - recently replaced',
      installation_year: 2020,
      current_condition: 'excellent',
      estimated_lifetime_years: 25,
      replacement_cost: 18000,
      photo_urls: ['https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400'],
      ai_insights: {
        maintenance_schedule: 'Annual inspections recommended. Clean gutters twice yearly.',
        remaining_lifespan: '21-23 years remaining with proper maintenance',
        warning_signs: 'Watch for missing shingles, granule loss, or water stains on ceiling',
        cost_saving_tips: 'Regular maintenance can extend lifespan by 3-5 years, saving $18,000 in early replacement costs'
      }
    },
    {
      id: 'comp-2',
      component_type: 'hvac',
      description: 'Central air conditioning and forced air heating system',
      brand: 'Carrier',
      model: 'Infinity 21',
      installation_year: 2018,
      current_condition: 'good',
      estimated_lifetime_years: 15,
      replacement_cost: 12000,
      photo_urls: ['https://images.unsplash.com/photo-1607400201889-565b1ee75f8e?w=400'],
      ai_insights: {
        maintenance_schedule: 'Change filters every 3 months. Professional service twice yearly (spring and fall).',
        remaining_lifespan: '8-10 years with regular maintenance',
        warning_signs: 'Unusual noises, reduced airflow, or frequent cycling indicate potential issues',
        cost_saving_tips: 'Smart thermostat can save 10-15% on energy costs ($150-200/year)'
      }
    },
    {
      id: 'comp-3',
      component_type: 'windows',
      description: 'Double-pane vinyl windows throughout',
      installation_year: 2015,
      current_condition: 'good',
      estimated_lifetime_years: 20,
      replacement_cost: 15000,
      photo_urls: ['https://images.unsplash.com/photo-1631889993959-41b4e9c6e3c5?w=400'],
      ai_insights: {
        maintenance_schedule: 'Clean tracks and seals annually. Check weatherstripping every 2 years.',
        remaining_lifespan: '10-12 years expected',
        warning_signs: 'Condensation between panes, drafts, or difficulty opening/closing',
        cost_saving_tips: 'Proper sealing can reduce heating/cooling costs by 15-25%'
      }
    },
    {
      id: 'comp-4',
      component_type: 'heater',
      description: 'Natural gas water heater - 50 gallon',
      brand: 'Rheem',
      installation_year: 2016,
      current_condition: 'fair',
      estimated_lifetime_years: 10,
      replacement_cost: 2500,
      residual_value: 800,
      photo_urls: ['https://images.unsplash.com/photo-1607400201515-c2c41c07e5cc?w=400'],
      ai_insights: {
        maintenance_schedule: 'Flush tank annually to remove sediment. Check anode rod every 2-3 years.',
        remaining_lifespan: '2-4 years - replacement recommended soon',
        warning_signs: 'Rusty water, loud popping noises, or leaks around base',
        cost_saving_tips: 'Tankless water heater could save 30% on water heating costs long-term'
      }
    }
  ];

  const componentIcons = {
    roof: Home,
    hvac: Wrench,
    windows: Building,
    heater: Zap,
    ac: Wrench,
    pool: Home,
    front: Home,
    porch: Home,
    other: Wrench
  };

  const ComponentIcon = ({ type }) => {
    const Icon = componentIcons[type] || Wrench;
    return <Icon className="w-5 h-5" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Navigation />
      
      <div className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Demo Banner */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl p-6 mb-8 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">📊 Demo Property Dashboard</h2>
                <p className="text-blue-100">Explore how our AI-powered property digitization works with real insights and recommendations</p>
              </div>
              <Link to={createPageUrl('Landing')}>
                <Button variant="outline" className="bg-white/20 border-white/40 text-white hover:bg-white/30">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>

          {/* Property Header */}
          <Card className="p-6 mb-8 bg-white">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl p-3">
                    <Home className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-[#1e3a5f]">{demoProperty.address}</h1>
                    <div className="flex items-center gap-2 text-gray-600 mt-1">
                      <MapPin className="w-4 h-4" />
                      <span>San Francisco, CA</span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  <div className="flex items-center gap-2">
                    <Ruler className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Size</p>
                      <p className="font-semibold">{demoProperty.sqft.toLocaleString()} sqft</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Bed className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Bedrooms</p>
                      <p className="font-semibold">{demoProperty.bedrooms}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Bath className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Bathrooms</p>
                      <p className="font-semibold">{demoProperty.bathrooms}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Built</p>
                      <p className="font-semibold">{demoProperty.year_built}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Property Value */}
            <div className="grid md:grid-cols-3 gap-4 pt-6 border-t">
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-1">Appraised Value</p>
                <p className="text-2xl font-bold text-[#1e3a5f]">${demoProperty.appraised_value.toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-1">Land Value</p>
                <p className="text-2xl font-bold text-green-600">${demoProperty.land_value.toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-1">Market Rating</p>
                <p className="text-2xl font-bold text-yellow-600">{demoProperty.market_rating}/10</p>
              </div>
            </div>
          </Card>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="property">
                <Home className="w-4 h-4 mr-2" />
                AI Insights
              </TabsTrigger>
              <TabsTrigger value="components">
                <Wrench className="w-4 h-4 mr-2" />
                Components ({demoComponents.length})
              </TabsTrigger>
            </TabsList>

            {/* AI Insights Tab */}
            <TabsContent value="property">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Market Trends */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-[#1e3a5f] mb-3 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Market Trends
                  </h3>
                  <p className="text-gray-700 mb-4">{demoProperty.ai_insights.market_trends}</p>
                </Card>

                {/* ROI Projections */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-[#1e3a5f] mb-3 flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    ROI Projections
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">1 Year</span>
                      <span className="font-semibold text-green-600">
                        ${demoProperty.ai_insights.roi_projection.one_year.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">5 Years</span>
                      <span className="font-semibold text-green-600">
                        ${demoProperty.ai_insights.roi_projection.five_year.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">10 Years</span>
                      <span className="font-semibold text-green-600">
                        ${demoProperty.ai_insights.roi_projection.ten_year.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </Card>

                {/* Investment Opportunities */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-[#1e3a5f] mb-3 flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Investment Opportunities
                  </h3>
                  <ul className="space-y-2">
                    {demoProperty.ai_insights.investment_opportunities.map((opp, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-green-600 mt-1">✓</span>
                        <span className="text-gray-700">{opp}</span>
                      </li>
                    ))}
                  </ul>
                </Card>

                {/* Maintenance Priorities */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-[#1e3a5f] mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Maintenance Priorities
                  </h3>
                  <div className="space-y-3">
                    {demoProperty.ai_insights.maintenance_priorities.map((item, idx) => (
                      <div key={idx} className="border-l-4 border-yellow-500 pl-3 py-2">
                        <div className="flex items-center justify-between mb-1">
                          <Badge variant={item.priority === 'High' ? 'destructive' : 'secondary'}>
                            {item.priority}
                          </Badge>
                          <span className="text-sm font-semibold text-[#d4af37]">
                            ${item.estimated_cost.toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{item.item}</p>
                        <p className="text-xs text-gray-500 mt-1">{item.urgency}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </TabsContent>

            {/* Components Tab */}
            <TabsContent value="components">
              <div className="space-y-4">
                {demoComponents.map((component) => (
                  <Card key={component.id} className="p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start gap-4">
                      {component.photo_urls?.[0] && (
                        <img
                          src={component.photo_urls[0]}
                          alt={component.component_type}
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <ComponentIcon type={component.component_type} />
                            <h3 className="text-lg font-semibold text-[#1e3a5f] capitalize">
                              {component.component_type.replace('_', ' ')}
                            </h3>
                          </div>
                          <Badge variant={
                            component.current_condition === 'excellent' ? 'default' :
                            component.current_condition === 'good' ? 'secondary' : 'destructive'
                          }>
                            {component.current_condition}
                          </Badge>
                        </div>
                        
                        <p className="text-gray-700 mb-3">{component.description}</p>
                        
                        <div className="grid md:grid-cols-3 gap-4 mb-4">
                          {component.installation_year && (
                            <div>
                              <p className="text-xs text-gray-500">Installed</p>
                              <p className="font-semibold">{component.installation_year}</p>
                            </div>
                          )}
                          {component.estimated_lifetime_years && (
                            <div>
                              <p className="text-xs text-gray-500">Expected Life</p>
                              <p className="font-semibold">{component.estimated_lifetime_years} years</p>
                            </div>
                          )}
                          {component.replacement_cost && (
                            <div>
                              <p className="text-xs text-gray-500">Replacement Cost</p>
                              <p className="font-semibold">${component.replacement_cost.toLocaleString()}</p>
                            </div>
                          )}
                        </div>

                        {component.ai_insights && (
                          <Accordion type="single" collapsible>
                            <AccordionItem value="insights">
                              <AccordionTrigger className="text-sm font-semibold text-[#1e3a5f]">
                                View AI Insights
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="space-y-3 pt-2">
                                  <div>
                                    <p className="text-sm font-semibold text-gray-700 mb-1">Maintenance Schedule</p>
                                    <p className="text-sm text-gray-600">{component.ai_insights.maintenance_schedule}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold text-gray-700 mb-1">Remaining Lifespan</p>
                                    <p className="text-sm text-gray-600">{component.ai_insights.remaining_lifespan}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold text-gray-700 mb-1">Warning Signs</p>
                                    <p className="text-sm text-gray-600">{component.ai_insights.warning_signs}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold text-green-700 mb-1">💡 Cost Saving Tips</p>
                                    <p className="text-sm text-gray-600">{component.ai_insights.cost_saving_tips}</p>
                                  </div>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          {/* CTA */}
          <Card className="p-8 mt-8 bg-gradient-to-r from-blue-600 to-indigo-700 text-white text-center">
            <h2 className="text-2xl font-bold mb-3">Ready to Digitize Your Property?</h2>
            <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
              Get AI-powered insights, maintenance recommendations, and professional reports for your own property in minutes.
            </p>
            <Button 
              size="lg" 
              className="bg-white text-blue-700 hover:bg-gray-100"
              onClick={handleGetStarted}
            >
              Get Started Free
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}