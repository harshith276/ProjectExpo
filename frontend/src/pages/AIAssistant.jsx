import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Bot, User } from 'lucide-react';
import api from '../api';

export default function AIAssistant() {
  const [messages, setMessages] = useState([
    { role: 'ai', content: 'Hello! I am Volt, your AI energy advisor. How can I help you save energy today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { role: 'user', content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await api.post('/api/ai/chat', { message: userMsg.content });
      setMessages((prev) => [...prev, { role: 'ai', content: response.data.response }]);
    } catch (err) {
      console.error('Failed to get AI response:', err);
      setMessages((prev) => [
        ...prev, 
        { role: 'ai', content: 'Sorry, I am having trouble connecting to my neural network right now. Please try again later.' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-theme(spacing.16))] sm:h-screen p-4 sm:p-6 bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-white transition-colors duration-500 flex flex-col">
      <div className="max-w-4xl w-full mx-auto flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-800/40 backdrop-blur-md rounded-3xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700/60 bg-white/50 dark:bg-slate-900/50 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Bot className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Volt AI</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Your Personal Energy Advisor</p>
          </div>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-end gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-emerald-500' : 'bg-cyan-600'}`}>
                {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
              </div>
              
              <div className={`max-w-[80%] sm:max-w-[70%] px-5 py-3.5 rounded-2xl text-[15px] ${
                msg.role === 'user' 
                  ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-br-sm shadow-md shadow-emerald-500/10' 
                  : 'bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 rounded-bl-sm shadow-sm dark:shadow-none'
              }`}>
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              </div>
            </motion.div>
          ))}

          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-end gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center shrink-0 shadow-sm">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="px-5 py-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 rounded-bl-sm flex items-center gap-1.5 shadow-sm dark:shadow-none">
                <span className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-900/50">
          <form onSubmit={handleSend} className="flex items-center gap-3 max-w-3xl mx-auto">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Volt about reducing your energy bill..."
              className="flex-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-full pl-6 pr-4 py-3.5 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all text-[15px]"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="w-12 h-12 flex items-center justify-center bg-cyan-500 hover:bg-cyan-600 text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-cyan-500/20 shrink-0"
            >
              <Send className="w-5 h-5 ml-0.5" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
