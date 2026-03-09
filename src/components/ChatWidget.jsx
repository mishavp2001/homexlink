import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, X, Send, Loader2, Minimize2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { createPageUrl } from '@/utils';

export default function ChatWidget({ isOpen, setIsOpen, inNavigation = false }) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const actualIsOpen = inNavigation ? isOpen : internalIsOpen;
  const actualSetIsOpen = inNavigation ? setIsOpen : setInternalIsOpen;
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [sending, setSending] = useState(false);
  const [user, setUser] = useState(null);
  const messagesEndRef = useRef(null);
  
  const siteName = window.location.hostname.split('.')[0].charAt(0).toUpperCase() + window.location.hostname.split('.')[0].slice(1);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {


        // User not logged in - still allow chat
      }};loadUser();
  }, []);

  useEffect(() => {
    if (actualIsOpen && !conversationId) {
      initConversation();
    }
  }, [actualIsOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!conversationId) return;

    const unsubscribe = base44.agents.subscribeToConversation(conversationId, (data) => {
      setMessages(data.messages || []);
    });

    return () => unsubscribe();
  }, [conversationId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initConversation = async () => {
    try {
      const conversation = await base44.agents.createConversation({
        agent_name: 'website_assistant',
        metadata: {
          name: 'Website Help',
          description: `Get help navigating ${siteName}`
        }
      });
      setConversationId(conversation.id);
      setMessages(conversation.messages || []);
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !conversationId || sending) return;

    const userMessage = input.trim();
    setInput('');
    setSending(true);

    try {
      const conversation = await base44.agents.getConversation(conversationId);
      await base44.agents.addMessage(conversation, {
        role: 'user',
        content: userMessage
      });
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Button - only show if not in navigation */}
      {!inNavigation && !actualIsOpen &&
      <Button
        onClick={() => actualSetIsOpen(true)} className="bg-[#1e3a5f] text-primary-foreground text-sm font-medium rounded-full inline-flex items-center justify-center gap-2 whitespace-nowrap focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 fixed bottom-6 right-6 h-14 w-14 max-[600px]:h-10 max-[600px]:w-10 max-[600px]:bottom-[86px] shadow-2xl hover:bg-[#2a4a7f] z-50 transition-all hover:scale-110"

        size="icon">

          <MessageSquare className="w-6 h-6 max-[600px]:w-4 max-[600px]:h-4" />
        </Button>
      }

      {/* Chat Window */}
      {actualIsOpen &&
      <Card className="fixed bottom-6 right-6 w-96 h-[600px] max-[600px]:bottom-[86px] max-[600px]:w-[280px] max-[600px]:h-[420px] shadow-2xl z-50 flex flex-col">
          {/* Header */}
          <div className="bg-[#1e3a5f] text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              <div>
                <h3 className="font-semibold">{siteName} Assistant</h3>
                <p className="text-xs text-gray-300">Ask me anything!</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
              variant="ghost"
              size="icon"
              onClick={() => actualSetIsOpen(false)}
              className="text-white hover:bg-white/20 h-8 w-8">

                <Minimize2 className="w-4 h-4" />
              </Button>
              <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                actualSetIsOpen(false);
                setConversationId(null);
                setMessages([]);
              }}
              className="text-white hover:bg-white/20 h-8 w-8">

                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.length === 0 &&
          <div className="text-center text-gray-500 mt-8">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-sm">Hi! I'm your {siteName} assistant.</p>
                <p className="text-xs mt-2">Ask me about features, navigation, or how to get started!</p>
              </div>
          }
            
            {messages.map((message, index) =>
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>

                <div
              className={`max-w-[80%] rounded-lg p-3 ${
              message.role === 'user' ?
              'bg-[#1e3a5f] text-white' :
              'bg-white border border-gray-200'}`
              }>

                  {message.role === 'assistant' ?
              <ReactMarkdown
                className="text-sm prose prose-sm max-w-none"
                components={{
                  a: ({ children, href, ...props }) => {
                    const isInternalLink = href?.startsWith('/');
                    return (
                      <a
                        {...props}
                        href={isInternalLink ? createPageUrl(href.slice(1)) : href}
                        className="text-[#1e3a5f] underline hover:text-[#d4af37] font-semibold"
                        target={isInternalLink ? '_self' : '_blank'}
                        rel={isInternalLink ? undefined : 'noopener noreferrer'}>

                              {children}
                            </a>);

                  },
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal ml-4 mb-2">{children}</ol>,
                  li: ({ children }) => <li className="mb-1">{children}</li>
                }}>

                      {message.content}
                    </ReactMarkdown> :

              <p className="text-sm">{message.content}</p>
              }
                  
                  {message.tool_calls?.length > 0 &&
              <div className="mt-2 space-y-1">
                      {message.tool_calls.map((tool, idx) =>
                <Badge key={idx} variant="outline" className="text-xs">
                          🔍 Searching {tool.name}
                        </Badge>
                )}
                    </div>
              }
                </div>
              </div>
          )}
            
            {sending &&
          <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                </div>
              </div>
          }
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t bg-white rounded-b-lg">
            <div className="flex gap-2">
              <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything..."
              disabled={sending || !conversationId}
              className="flex-1" />

              <Button
              onClick={handleSend}
              disabled={!input.trim() || sending || !conversationId}
              className="bg-[#1e3a5f] hover:bg-[#2a4a7f]"
              size="icon">

                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      }
    </>);

}