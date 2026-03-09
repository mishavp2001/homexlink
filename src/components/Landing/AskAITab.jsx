import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Send, Loader2, ArrowRight, TrendingUp, Plus, Lightbulb } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const EXAMPLES = [
  { icon: <TrendingUp className="w-4 h-4" />, label: 'Show me deals', prompt: 'Show me the latest deals available on the platform' },
  { icon: <Plus className="w-4 h-4" />, label: 'How to add a deal', prompt: 'How do I add or post a deal on this platform?' },
  { icon: <Lightbulb className="w-4 h-4" />, label: 'Post an insight', prompt: 'How can I post an insight or tip for the community?' },
];

export default function AskAITab() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! I\'m your HomeXLink AI assistant. Ask me anything about the platform — finding deals, adding listings, posting insights, or managing your home.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (messages.length > 1) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const sendMessage = async (text) => {
    const userText = text || input.trim();
    if (!userText) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userText }]);
    setLoading(true);

    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a friendly AI assistant for HomeXLink, a home management platform.
        
Platform features:
- Deals: Browse/post property sales, rentals, and service deals
- Services: Find verified home service professionals (plumbers, electricians, HVAC, etc.)
- Insights: Community tips and tricks for homeowners
- Home Management: Digitize your property, track expenses, AI maintenance recommendations

User question: ${userText}

Give a concise, helpful answer. If relevant, mention specific actions they can take on the platform. Keep it under 3 sentences.`,
      });

      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I had trouble answering that. Please try again!' }]);
    }
    setLoading(false);
  };

  return (
    <div className="mt-5 space-y-3">
      {/* Example chips */}
      <div className="flex flex-wrap gap-2">
        {EXAMPLES.map((ex) => (
          <button
            key={ex.label}
            onClick={() => sendMessage(ex.prompt)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 border border-white/40 rounded-full text-white text-xs font-medium transition-all"
          >
            {ex.icon}
            {ex.label}
          </button>
        ))}
      </div>

      {/* Chat window */}
      <div className="bg-white/10 border border-white/20 rounded-xl p-3 h-56 overflow-y-auto space-y-2">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm leading-snug ${
              msg.role === 'user'
                ? 'bg-green-600 text-white'
                : 'bg-white/20 text-white border border-white/20'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white/20 border border-white/20 px-3 py-2 rounded-xl">
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && !loading && sendMessage()}
          placeholder="Ask anything..."
          className="bg-slate-50 text-slate-900 flex-1"
          disabled={loading}
        />
        <Button
          onClick={() => sendMessage()}
          disabled={!input.trim() || loading}
          className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>

      {/* CTA */}
      <Button
        onClick={() => navigate(createPageUrl('Deals'))}
        variant="outline"
        className="w-full bg-white/20 text-white border-white/60 hover:bg-white/30 h-11"
      >
        <Sparkles className="w-4 h-4 mr-2" />
        Explore Platform
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );
}