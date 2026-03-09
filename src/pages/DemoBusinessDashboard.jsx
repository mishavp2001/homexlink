import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  Briefcase, DollarSign, Calendar, TrendingUp, MessageSquare, 
  Edit2, MapPin, CheckCircle2, Clock, Sparkles, ArrowLeft,
  User, Mail, Phone, Image, Plus, X, Lightbulb
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import Navigation from '../components/Navigation';
import { format } from 'date-fns';

export const isPublic = true;

export default function DemoBusinessDashboard() {
  const [selectedDeal, setSelectedDeal] = useState(null);

  const demoUser = {
    email: 'demo@provider.com',
    full_name: 'Demo Service Provider',
    business_name: 'ABC Home Services',
    user_type: 'service_provider',
  };

  const demoDeals = [
    {
      id: 'deal1',
      deal_type: 'service_deal',
      title: 'Winter HVAC Tune-Up Special',
      description: 'Complete HVAC system inspection and tune-up',
      price: 149,
      original_price: 249,
      discount_percent: 40,
      location: 'Sacramento, CA',
      service_types: ['HVAC', 'Heating'],
      photo_urls: ['https://images.unsplash.com/photo-1581094271901-8022df4466f9?w=800'],
      status: 'active',
      created_date: '2025-12-15T10:00:00Z'
    },
    {
      id: 'deal2',
      deal_type: 'service_deal',
      title: 'Plumbing Inspection Package',
      description: 'Full home plumbing inspection with leak detection',
      price: 99,
      location: 'Roseville, CA',
      service_types: ['Plumbing'],
      photo_urls: ['https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=800'],
      status: 'active',
      created_date: '2025-12-20T14:30:00Z'
    }
  ];

  const demoBookings = [
    {
      id: 'booking1',
      booking_type: 'service',
      service_name: 'HVAC Tune-Up',
      renter_name: 'John Smith',
      renter_email: 'john@example.com',
      renter_phone: '(916) 555-0123',
      property_address: '123 Oak St, Sacramento, CA',
      service_date: '2026-01-10',
      service_time: '10:00 AM',
      total_cost: 149,
      status: 'pending',
      message: 'Need this done before winter gets worse',
      created_date: '2026-01-05T09:00:00Z'
    },
    {
      id: 'booking2',
      booking_type: 'service',
      service_name: 'Plumbing Inspection',
      renter_name: 'Sarah Johnson',
      renter_email: 'sarah@example.com',
      renter_phone: '(916) 555-0456',
      property_address: '456 Maple Ave, Roseville, CA',
      service_date: '2026-01-12',
      service_time: '2:00 PM',
      total_cost: 99,
      status: 'confirmed',
      confirmed_date: '2026-01-06T11:00:00Z',
      created_date: '2026-01-06T10:30:00Z'
    }
  ];

  const demoInsights = [
    {
      id: 'insight1',
      title: '5 Signs Your HVAC Needs Maintenance',
      content_text: 'Regular HVAC maintenance can save you thousands in repairs...',
      category: 'HVAC',
      views: 245,
      likes: 18,
      status: 'published',
      created_date: '2025-11-10T12:00:00Z'
    }
  ];

  const demoPriceList = [
    { description: 'Basic HVAC Tune-Up', price: 149 },
    { description: 'Emergency Service Call', price: 199 },
    { description: 'Complete System Inspection', price: 299 },
    { description: 'Air Duct Cleaning', price: 399 }
  ];

  const demoQuoteInstructions = `Always include a detailed breakdown of labor and materials. Offer a 10% discount for first-time customers. Include warranty information (1 year parts, 90 days labor). Emphasize energy efficiency benefits. Provide flexible scheduling options.`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Navigation user={null} />
      
      <div className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Link to={createPageUrl('Landing')}>
              <Button variant="outline" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex-1">
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-2">
                <p className="text-sm text-blue-900">
                  <Sparkles className="w-4 h-4 inline mr-1" />
                  <strong>Demo Mode:</strong> This is a preview of what your business dashboard will look like as a service provider.
                </p>
              </div>
              <h1 className="text-4xl font-bold text-[#1e3a5f] mb-2">
                ABC Home Services Dashboard
              </h1>
              <p className="text-gray-600">Manage your business, deals, and bookings</p>
            </div>
          </div>

          <Tabs defaultValue="deals" className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-8">
              <TabsTrigger value="deals">Deals</TabsTrigger>
              <TabsTrigger value="bookings">Bookings</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
              <TabsTrigger value="pricing">Price List</TabsTrigger>
              <TabsTrigger value="assistant">AI Assistant</TabsTrigger>
            </TabsList>

            {/* DEALS TAB */}
            <TabsContent value="deals">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-[#1e3a5f]">My Service Deals</h2>
                  <p className="text-sm text-gray-600 mt-1">Special offers for customers</p>
                </div>
                <Button className="bg-[#1e3a5f] hover:bg-[#2a4a7f]">
                  <Plus className="w-5 h-5 mr-2" />
                  Post Deal
                </Button>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {demoDeals.map((deal) => (
                  <Card key={deal.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    {deal.photo_urls?.length > 0 && (
                      <div className="h-40 overflow-hidden relative">
                        <img
                          src={deal.photo_urls[0]}
                          alt={deal.title}
                          className="w-full h-full object-cover"
                        />
                        {deal.discount_percent && (
                          <Badge className="absolute top-3 right-3 bg-red-500 text-white">
                            {deal.discount_percent}% OFF
                          </Badge>
                        )}
                        <Badge className="absolute top-3 left-3 bg-green-600 text-white">
                          {deal.status}
                        </Badge>
                      </div>
                    )}
                    <div className="p-6">
                      <h3 className="text-lg font-bold text-[#1e3a5f] mb-2">{deal.title}</h3>
                      <div className="flex items-baseline gap-2 mb-3">
                        <p className="text-2xl font-bold text-[#d4af37]">${deal.price}</p>
                        {deal.original_price && (
                          <p className="text-sm text-gray-500 line-through">${deal.original_price}</p>
                        )}
                      </div>
                      <div className="flex items-start gap-1 text-sm text-gray-500 mb-4">
                        <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>{deal.location}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {deal.service_types?.map((type, idx) => (
                          <Badge key={idx} variant="outline">{type}</Badge>
                        ))}
                      </div>
                      <Button size="sm" className="w-full" variant="outline">
                        <Edit2 className="w-4 h-4 mr-2" />
                        Edit Deal
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* BOOKINGS TAB */}
            <TabsContent value="bookings">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-[#1e3a5f]">Service Bookings</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {demoBookings.filter(b => b.status === 'pending').length} pending requests
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {demoBookings.map((booking) => (
                  <Card key={booking.id} className="p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-[#1e3a5f] mb-1">{booking.property_address}</h3>
                        <Badge className={
                          booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }>
                          {booking.status}
                        </Badge>
                      </div>
                      <Badge variant="outline">
                        {booking.service_name}
                      </Badge>
                    </div>

                    <div className="space-y-2 mb-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-700">
                        <User className="w-4 h-4" />
                        <span>{booking.renter_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <Mail className="w-4 h-4" />
                        <span>{booking.renter_email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <Phone className="w-4 h-4" />
                        <span>{booking.renter_phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <Calendar className="w-4 h-4" />
                        <span>{booking.service_date} at {booking.service_time}</span>
                      </div>
                    </div>

                    {booking.message && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Message:</p>
                        <p className="text-sm text-gray-700">{booking.message}</p>
                      </div>
                    )}

                    <div className="pt-4 border-t">
                      <p className="text-2xl font-bold text-[#d4af37] mb-3">
                        ${booking.total_cost.toLocaleString()}
                      </p>
                      
                      {booking.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700">
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Accept
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1 text-red-600">
                            Decline
                          </Button>
                        </div>
                      )}

                      {booking.status === 'confirmed' && (
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <p className="text-sm text-green-800">
                            ✓ Confirmed on {format(new Date(booking.confirmed_date), 'MMM d, yyyy')}
                          </p>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* INSIGHTS TAB */}
            <TabsContent value="insights">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-[#1e3a5f]">My Insights</h2>
                  <p className="text-sm text-gray-600 mt-1">Share your expertise with the community</p>
                </div>
                <Button className="bg-[#d4af37] hover:bg-[#c49d2a]">
                  <Plus className="w-5 h-5 mr-2" />
                  Share Insight
                </Button>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {demoInsights.map((insight) => (
                  <Card key={insight.id} className="p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="outline" className="capitalize">
                        {insight.category}
                      </Badge>
                      <Badge className="bg-green-100 text-green-800">
                        {insight.status}
                      </Badge>
                    </div>

                    <h3 className="text-lg font-bold text-[#1e3a5f] mb-3">{insight.title}</h3>
                    <p className="text-gray-700 mb-4 text-sm">{insight.content_text}</p>

                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4 pt-4 border-t">
                      <span className="flex items-center gap-3">
                        <span>👁️ {insight.views}</span>
                        <span>❤️ {insight.likes}</span>
                      </span>
                      <span className="text-xs">
                        {format(new Date(insight.created_date), 'MMM d, yyyy')}
                      </span>
                    </div>

                    <Button size="sm" variant="outline" className="w-full">
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit Insight
                    </Button>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* PRICE LIST TAB */}
            <TabsContent value="pricing">
              <Card className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-[#1e3a5f]">Service Price List</h2>
                    <p className="text-sm text-gray-600 mt-1">Your standard service rates</p>
                  </div>
                  <Button className="bg-[#1e3a5f] hover:bg-[#2a4a7f]">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Service
                  </Button>
                </div>

                <div className="space-y-3">
                  {demoPriceList.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.description}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold text-[#d4af37]">${item.price}</span>
                        <Button size="sm" variant="ghost">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            {/* AI ASSISTANT TAB */}
            <TabsContent value="assistant">
              <Card className="p-6">
                <h2 className="text-xl font-bold text-[#1e3a5f] mb-4">AI Quote Assistant Configuration</h2>
                <p className="text-gray-600 mb-6">
                  Configure how the AI assistant generates quotes for your business
                </p>

                <div className="space-y-6">
                  <div>
                    <Label>Quote Assistant Instructions</Label>
                    <Textarea
                      value={demoQuoteInstructions}
                      rows={6}
                      className="font-mono text-sm"
                      disabled
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      These instructions guide the AI when generating quotes for customers
                    </p>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 className="font-semibold text-[#1e3a5f] mb-2">Widget Embed Code</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Copy this code and paste it into your website:
                    </p>
                    <div className="bg-white p-3 rounded-lg font-mono text-xs overflow-x-auto border">
                      {`<iframe src="${window.location.origin}/servicequote?name=ABC%20Home%20Services" width="100%" height="600" frameborder="0"></iframe>`}
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-[#1e3a5f] mb-3">What the AI Uses</h3>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span><strong>Business Name:</strong> ABC Home Services</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span><strong>Service Types:</strong> HVAC, Plumbing, Electrical</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span><strong>Price List:</strong> {demoPriceList.length} services</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span><strong>Custom Instructions:</strong> ✓ Configured</span>
                      </li>
                    </ul>
                  </div>

                  <Button className="w-full bg-[#1e3a5f] hover:bg-[#2a4a7f]">
                    Save Configuration
                  </Button>
                </div>
              </Card>
            </TabsContent>
          </Tabs>

          {/* CTA */}
          <Card className="p-8 text-center mt-8 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300">
            <h3 className="text-2xl font-bold text-[#1e3a5f] mb-3">Ready to Start?</h3>
            <p className="text-gray-600 mb-6">
              Create your account to access these features and start growing your business
            </p>
            <Link to={createPageUrl('ProSignup')}>
              <Button className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white">
                <Briefcase className="w-5 h-5 mr-2" />
                Sign Up as a Pro
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}