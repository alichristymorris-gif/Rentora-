import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ChatMessage } from '../types';
import { cn } from '../lib/utils';

interface ChatAssistantProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  messages: ChatMessage[];
  input: string;
  setInput: (input: string) => void;
  isLoading: boolean;
  onSendMessage: () => void;
}

export function ChatAssistant({
  isOpen,
  setIsOpen,
  messages,
  input,
  setInput,
  isLoading,
  onSendMessage
}: ChatAssistantProps) {
  return (
    <>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-8 right-8 z-[100] w-16 h-16 bg-slate-900 dark:bg-blue-600 text-white rounded-[24px] flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all group"
      >
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-500 border-2 border-white"></span>
        </span>
        {isOpen ? <X size={28} /> : <MessageSquare size={28} className="group-hover:rotate-12 transition-transform" />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-28 right-8 z-[100] w-full max-w-[420px] h-[600px] bg-white dark:bg-dark-surface border border-bento-border dark:border-dark-border rounded-[40px] shadow-2xl overflow-hidden flex flex-col transition-colors duration-300"
          >
            <div className="p-8 border-b border-slate-50 dark:border-dark-border flex items-center justify-between bg-white dark:bg-dark-surface transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
                  <MessageSquare size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">AI Assistant</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[10px] uppercase font-black text-emerald-500 tracking-widest">Always Active</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="w-10 h-10 flex items-center justify-center text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors"
                title="Close Assistant"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar bg-slate-50/50 dark:bg-slate-900/50">
              <div className="bg-white dark:bg-dark-surface p-4 rounded-2xl rounded-bl-none text-[13px] leading-relaxed max-w-[85%] border border-slate-100 dark:border-dark-border shadow-sm text-slate-600 dark:text-dark-muted font-medium">
                Salaam! I'm your Rentora assistant. How can I help you find the perfect rental today? I can search for cities in Pakistan or anywhere else! 🌍
              </div>
              
              {messages.map((msg, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "p-4 rounded-2xl overflow-hidden leading-relaxed max-w-[85%] shadow-sm font-medium",
                    msg.role === 'user' 
                      ? "bg-slate-900 dark:bg-blue-600 text-white self-end rounded-br-none ml-auto" 
                      : "bg-white dark:bg-dark-surface text-slate-600 dark:text-dark-muted rounded-bl-none border border-slate-100 dark:border-dark-border"
                  )}
                >
                  <div className="prose dark:prose-invert prose-slate prose-xs text-[12px] leading-relaxed">
                    <ReactMarkdown>
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-1.5 p-3 bg-white dark:bg-dark-surface border border-slate-100 dark:border-dark-border rounded-2xl w-fit shadow-sm">
                  <div className="w-1.5 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full animate-bounce delay-75" />
                  <div className="w-1.5 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full animate-bounce delay-150" />
                </div>
              )}
            </div>

            <div className="p-5 border-t border-slate-50 dark:border-dark-border bg-white dark:bg-dark-surface transition-colors">
               <div className="flex items-center gap-2 mb-4 overflow-x-auto no-scrollbar">
                {["Best car in Karachi?", "Homes in USA?", "Help me post"].map(t => (
                  <button 
                  key={t}
                  onClick={() => setInput(t)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-dark-border px-3 py-1.5 rounded-xl text-[10px] text-slate-500 dark:text-dark-muted font-bold whitespace-nowrap hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Ask me anything..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-dark-border px-5 py-4 pr-14 rounded-2xl text-[13px] outline-none focus:border-blue-500/20 transition-all font-medium text-slate-900 dark:text-white"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && onSendMessage()}
                />
                <button 
                  onClick={onSendMessage}
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 top-2 w-10 h-10 bg-slate-900 dark:bg-blue-600 text-white rounded-xl flex items-center justify-center hover:opacity-90 transition-all disabled:opacity-50 shadow-lg"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
