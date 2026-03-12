import React, { useState, useEffect, useRef } from 'react';
import { getUserByBusinessName, getUserByEmail } from '@/api/functions';
import { InvokeLLM, SendEmail } from '@/api/integrations';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, CheckCircle2, Mail, AlertCircle, Bot } from 'lucide-react';

export const isPublic = true;

export default function ServiceQuote() {
  const [businessName, setBusinessName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadForm, setLeadForm] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [sendingLead, setSendingLead] = useState(false);
  const [leadSent, setLeadSent] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const name = params.get('name');
    const email = params.get('user');
    if (name) {
      setBusinessName(name);
    }
    if (email) {
      setUserEmail(email);
    }
  }, []);

  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['user', businessName, userEmail],
    queryFn: async () => {
      if (userEmail) {
        const result = await getUserByEmail({ email: userEmail });
        return result.data;
      } else if (businessName) {
        const result = await getUserByBusinessName({ businessName });
        return result.data;
      }
      return null;
    },
    enabled: !!businessName || !!userEmail,
    retry: false
  });

  useEffect(() => {
    if (user && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: `Hello! I'm ${user.business_name}'s AI quote assistant. I can help you get an instant quote for our services. Please describe what you need help with.`
      }]);
    }
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setSending(true);

    try {
      // Build context from business profile
      const context = buildBusinessContext(user);
      
      const prompt = `You are a professional quote assistant for ${user.business_name}.

BUSINESS CONTEXT:
${context}

CONVERSATION HISTORY:
${messages.map(m => `${m.role}: ${m.content}`).join('\n')}

USER REQUEST:
${input}

INSTRUCTIONS:
- KEEP RESPONSES SHORT: 1-2 sentences maximum
- FIRST verify the customer's location is in our service areas
- If location not in service area, politely decline and suggest they contact us
- Provide quick, professional quotes using the price list
- Ask ONE clarifying question at a time if needed
- Include estimated costs clearly
- Be friendly but concise

Generate your SHORT response (1-2 sentences):`;

      const response = await InvokeLLM({
        prompt,
        add_context_from_internet: false
      });

      const assistantMessage = { role: 'assistant', content: response };
      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Error generating quote:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I apologize, but I'm having trouble generating a quote right now. Please contact us directly for assistance."
      }]);
    }

    setSending(false);
  };

  const buildBusinessContext = (user) => {
    let context = `Business Name: ${user.business_name}\n`;
    
    if (user.service_types?.length > 0) {
      context += `Service Types Offered: ${user.service_types.join(', ')}\n`;
    }
    
    if (user.service_areas?.length > 0) {
      context += `Service Areas (VERIFIED): ${user.service_areas.join(', ')}\n`;
      context += `IMPORTANT: Only provide quotes for customers in these verified service areas.\n`;
    }
    
    if (user.price_list?.length > 0) {
      context += `\nIMPORTANT: Only quote from PRICE LIST:\n`;
      user.price_list.forEach(item => {
        context += `- ${item.description}: $${item.price}\n`;
      });
    }
    
    if (user.website_url) {
      context += `\nWebsite: ${user.website_url}\n`;
    }
    
    if (user.quote_assistant_instructions) {
      context += `\nSPECIAL INSTRUCTIONS:\n${user.quote_assistant_instructions}\n`;
    }
    
    return context;
  };

  const handleSendLead = async () => {
    if (!leadForm.name || !leadForm.email) {
      alert('Please provide your name and email');
      return;
    }

    setSendingLead(true);

    try {
      // Format conversation with bold customer questions
      const conversationHtml = messages.map(m => {
        if (m.role === 'user') {
          return `<p style="margin: 15px 0;"><strong style="color: #1e3a5f;">Customer:</strong> ${m.content}</p>`;
        } else {
          return `<p style="margin: 15px 0; color: #555;">AI Assistant: ${m.content}</p>`;
        }
      }).join('');

      // Send email to business owner
      await SendEmail({
        to: user.email,
        subject: `🔔 New Quote Request from ${leadForm.name}`,
        body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { background: #1e3a5f; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9fafb; }
    .section { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; border: 1px solid #e5e7eb; }
    .info-row { margin: 8px 0; }
    .label { font-weight: bold; color: #1e3a5f; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">💼 New Quote Request</h1>
      <p style="margin: 5px 0 0 0;">Your website widget generated a new lead!</p>
    </div>
    
    <div class="content">
      <div class="section">
        <h2 style="color: #1e3a5f; margin-top: 0;">📋 Customer Information</h2>
        <div class="info-row"><span class="label">Name:</span> ${leadForm.name}</div>
        <div class="info-row"><span class="label">Email:</span> <a href="mailto:${leadForm.email}">${leadForm.email}</a></div>
        <div class="info-row"><span class="label">Phone:</span> ${leadForm.phone || 'Not provided'}</div>
      </div>
      
      <div class="section">
        <h2 style="color: #1e3a5f; margin-top: 0;">💬 Conversation Summary</h2>
        ${conversationHtml}
      </div>
      
      <div style="text-align: center; margin: 20px 0;">
        <a href="mailto:${leadForm.email}" style="display: inline-block; background: #d4af37; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reply to Customer</a>
      </div>
    </div>
    
    <div class="footer">
      <p>This lead was generated through your HomeXREI business profile.</p>
    </div>
  </div>
</body>
</html>`
      });

      // Send confirmation email to customer
      const businessLogo = user.business_photo_url ? `<img src="${user.business_photo_url}" alt="${user.business_name}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; margin-bottom: 15px;">` : '';
      
      await SendEmail({
        to: leadForm.email,
        subject: `✓ Quote Request Received - ${user.business_name}`,
        body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { background: #1e3a5f; color: white; padding: 30px; text-align: center; }
    .content { padding: 20px; background: #f9fafb; }
    .section { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; border: 1px solid #e5e7eb; }
    .info-row { margin: 8px 0; }
    .label { font-weight: bold; color: #1e3a5f; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
    .business-info { background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      ${businessLogo}
      <h1 style="margin: 10px 0 5px 0;">${user.business_name}</h1>
      <p style="margin: 0; opacity: 0.9;">Quote Request Confirmation</p>
    </div>
    
    <div class="content">
      <div class="section">
        <h2 style="color: #1e3a5f; margin-top: 0;">✓ Thank You!</h2>
        <p>We've received your quote request and will get back to you as soon as possible.</p>
        
        <div class="business-info">
          <h3 style="color: #1e3a5f; margin-top: 0; font-size: 16px;">About ${user.business_name}</h3>
          ${user.bio ? `<p style="margin: 8px 0;">${user.bio.replace(/<[^>]*>/g, '')}</p>` : ''}
          ${user.business_phone ? `<p style="margin: 5px 0;"><strong>Phone:</strong> <a href="tel:${user.business_phone}">${user.business_phone}</a></p>` : ''}
          ${user.business_address ? `<p style="margin: 5px 0;"><strong>Location:</strong> ${user.business_address}</p>` : ''}
          ${user.website_url ? `<p style="margin: 5px 0;"><strong>Website:</strong> <a href="${user.website_url}" target="_blank">${user.website_url}</a></p>` : ''}
        </div>
      </div>
      
      <div class="section">
        <h3 style="color: #1e3a5f; margin-top: 0;">Your Information</h3>
        <div class="info-row"><span class="label">Name:</span> ${leadForm.name}</div>
        <div class="info-row"><span class="label">Email:</span> ${leadForm.email}</div>
        <div class="info-row"><span class="label">Phone:</span> ${leadForm.phone || 'Not provided'}</div>
      </div>
      
      <div class="section">
        <h3 style="color: #1e3a5f; margin-top: 0;">💬 Your Conversation</h3>
        ${conversationHtml}
      </div>
      
      <div style="text-align: center; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 14px;">Need immediate assistance? Contact us directly!</p>
      </div>
    </div>
    
    <div class="footer">
      <p>This quote was generated through ${user.business_name}'s AI assistant on HomeXREI.</p>
    </div>
  </div>
</body>
</html>`
      });

      setLeadSent(true);
      setTimeout(() => {
        setShowLeadForm(false);
        setLeadSent(false);
      }, 3000);

    } catch (error) {
      console.error('Error sending lead:', error);
      alert('Failed to send request. Please try again.');
    }

    setSendingLead(false);
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Business Not Found</h2>
          <p className="text-gray-600">
            The requested business could not be found. Please check the URL and try again.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          {user.business_photo_url && (
            <img 
              src={user.business_photo_url} 
              alt={user.business_name}
              className="w-12 h-12 object-cover rounded-lg"
            />
          )}
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">{user.business_name}</h1>
            <p className="text-sm text-gray-600">AI Quote Assistant</p>
          </div>
          {!showLeadForm && (
            <Button 
              onClick={() => setShowLeadForm(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Mail className="w-4 h-4 mr-2" />
              Send Formal Request
            </Button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-900'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-2">
                    <Bot className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-semibold text-blue-600">AI Assistant</span>
                  </div>
                )}
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Lead Form Modal */}
      {showLeadForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="p-6 max-w-md w-full">
            {leadSent ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Request Sent!</h3>
                <p className="text-gray-600">
                  We'll get back to you as soon as possible.
                </p>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Request Quote</h2>
                <p className="text-gray-600 mb-6">
                  Please provide your contact information to receive a formal quote.
                </p>
                
                <div className="space-y-4">
                  <div>
                    <Label>Name *</Label>
                    <Input
                      value={leadForm.name}
                      onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                      placeholder="John Doe"
                    />
                  </div>
                  
                  <div>
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={leadForm.email}
                      onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                      placeholder="john@example.com"
                    />
                  </div>
                  
                  <div>
                    <Label>Phone</Label>
                    <Input
                      type="tel"
                      value={leadForm.phone}
                      onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                      placeholder="(555) 123-4567"
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowLeadForm(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                      onClick={handleSendLead}
                      disabled={sendingLead}
                    >
                      {sendingLead ? (
                        <><Loader2 className="w-4 h-4 animate-spin mr-2" />Sending...</>
                      ) : (
                        <>Send Request</>
                      )}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </Card>
        </div>
      )}

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
              placeholder="Describe what you need..."
              className="flex-1"
              disabled={sending}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Powered by {user.business_name}
          </p>
        </div>
      </div>
    </div>
  );
}