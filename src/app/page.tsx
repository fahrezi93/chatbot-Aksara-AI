'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuthState } from '@/hooks/useAuthState';
import { sendChatMessage, Message } from '@/lib/api';
import Sidebar from '@/components/layout/Sidebar';
import ChatMessage from '@/components/chat/ChatMessage';
import ChatInput from '@/components/chat/ChatInput';
import ModelSelector from '@/components/chat/ModelSelector';
import WelcomeScreen from '@/components/chat/WelcomeScreen';
import ThemeToggle from '@/components/ThemeToggle';

export default function Home() {
  const { user, loading } = useAuthState();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentModel, setCurrentModel] = useState<'gemini' | 'deepseek'>('gemini');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (text: string, imageData?: string) => {
    if (!text.trim() && !imageData) return;

    // Add user message
    const userMessage: Message = {
      isUser: true,
      text: text,
      imageData: imageData,
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Send to API
      const response = await sendChatMessage(
        text,
        messages,
        currentModel,
        imageData
      );

      // Add AI response
      const aiMessage: Message = {
        isUser: false,
        text: response.response,
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        isUser: false,
        text: 'Maaf, terjadi kesalahan saat menghubungi AI. Silakan coba lagi.',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setConversationId(null);
  };

  const getUserName = () => {
    if (!user) return 'Guest';
    return user.displayName?.split(' ')[0] || user.email?.split('@')[0] || 'User';
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onNewChat={handleNewChat}
        user={user}
        conversationId={conversationId}
        onSelectConversation={(id, msgs) => {
          setConversationId(id);
          setMessages(msgs);
        }}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Header */}
        <header className="absolute top-0 left-0 right-0 z-40 px-6 py-4 flex items-center justify-between pointer-events-none">
          <div className="pointer-events-auto">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-3 rounded-xl bg-white/50 dark:bg-black/50 backdrop-blur-md border border-white/20 shadow-sm hover:bg-white/80 dark:hover:bg-black/70 transition-all lg:hidden"
            >
              <svg className="w-5 h-5 text-[var(--text-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className={`flex items-center gap-3 ${!sidebarOpen && 'lg:pl-0'} lg:hidden`}>
              {/* Mobile Branding if needed */}
            </div>
          </div>

          <div className="pointer-events-auto flex items-center gap-3">
            <ThemeToggle />
            <ModelSelector
              currentModel={currentModel}
              onModelChange={setCurrentModel}
            />
          </div>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto pt-24 pb-32 px-4 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
          {messages.length === 0 ? (
            <WelcomeScreen userName={getUserName()} />
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.map((message, index) => (
                <ChatMessage
                  key={index}
                  message={message}
                  isTyping={false}
                />
              ))}
              {isLoading && (
                <ChatMessage
                  message={{ isUser: false, text: '' }}
                  isTyping={true}
                />
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[var(--background)] to-transparent pointer-events-none">
          <div className="max-w-3xl mx-auto pointer-events-auto">
            <ChatInput
              onSend={handleSendMessage}
              disabled={isLoading}
            />
            <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-3">
              Aksara AI dapat membuat kesalahan. Periksa kembali informasi penting.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
