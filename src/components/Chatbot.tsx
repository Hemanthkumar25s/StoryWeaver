import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Loader2 } from 'lucide-react';
import { createChatSession } from '../services/gemini';
import Markdown from 'react-markdown';
import { cn } from '../utils';

interface Message {
  role: 'user' | 'model';
  text: string;
}

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && !chatRef.current) {
      chatRef.current = createChatSession();
      setMessages([{ role: 'model', text: 'Hello! I am your creative writing assistant. How can I help you expand your story today?' }]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const response = await chatRef.current.sendMessage({ message: userMessage });
      setMessages(prev => [...prev, { role: 'model', text: response.text || '' }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { role: 'model', text: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 w-14 h-14 bg-[#5A5A40] text-white rounded-full shadow-lg flex items-center justify-center hover:bg-[#4a4a34] transition-all z-50",
          isOpen && "scale-0 opacity-0"
        )}
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      <div
        className={cn(
          "fixed bottom-6 right-6 w-96 h-[500px] max-h-[80vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 z-50 origin-bottom-right",
          isOpen ? "scale-100 opacity-100" : "scale-0 opacity-0 pointer-events-none"
        )}
      >
        <div className="bg-[#5A5A40] text-white p-4 flex items-center justify-between">
          <h3 className="font-serif text-xl font-semibold">Writing Assistant</h3>
          <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#f5f5f0]/50">
          {messages.map((msg, idx) => (
            <div key={idx} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[80%] p-3 rounded-2xl text-sm",
                  msg.role === 'user'
                    ? "bg-[#5A5A40] text-white rounded-br-sm"
                    : "bg-white border border-[#e0e0d8] text-[#2c2c2a] rounded-bl-sm shadow-sm"
                )}
              >
                {msg.role === 'model' ? (
                  <div className="markdown-body prose prose-sm prose-stone">
                    <Markdown>{msg.text}</Markdown>
                  </div>
                ) : (
                  msg.text
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-[#e0e0d8] p-3 rounded-2xl rounded-bl-sm shadow-sm">
                <Loader2 className="w-5 h-5 animate-spin text-[#5A5A40]" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-3 bg-white border-t border-[#e0e0d8]">
          <div className="flex items-center gap-2 bg-[#f5f5f0] rounded-full px-4 py-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask for ideas..."
              className="flex-1 bg-transparent outline-none text-sm text-[#2c2c2a] placeholder:text-[#8c8c8a]"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="text-[#5A5A40] disabled:opacity-50 hover:text-[#4a4a34] transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
