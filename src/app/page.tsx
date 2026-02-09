'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuthState } from '@/hooks/useAuthState';
import { sendChatMessage, saveMessage, Message, AIModel } from '@/lib/api';
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
  const [currentModel, setCurrentModel] = useState<AIModel>('gemini');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false); // Default false to prevent flash on mobile
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle responsive sidebar behavior
  useEffect(() => {
    // Only set initial state based on screen size
    if (window.innerWidth >= 1024) {
      setSidebarOpen(true);
    }
  }, []);

  const [refreshSidebar, setRefreshSidebar] = useState(0);

  const [inputMessage, setInputMessage] = useState('');

  const handleSendMessage = async (text: string, imageData?: string) => {
    if (!text.trim() && !imageData) return;

    // Add user message
    const userMessage: Message = {
      isUser: true,
      text: text,
      imageData: imageData,
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage(''); // Clear input
    setIsLoading(true);

    try {
      // 1. Save user message if logged in
      let currentConvId = conversationId;
      if (user) {
        try {
          const result = await saveMessage(user.uid, conversationId, userMessage);
          if (result && result.conversationId) {
            const isNewConversation = !conversationId;
            currentConvId = result.conversationId;
            setConversationId(currentConvId);

            // Refresh sidebar if it's a new conversation
            if (isNewConversation) {
              setRefreshSidebar(prev => prev + 1);
            }
          }
        } catch (err) {
          console.error('Failed to save user message:', err);
        }
      }

      // 2. Send to AI
      // Filter out error messages from history so AI doesn't hallucinate errors
      const history = messages.filter(m =>
        !m.text.startsWith('Maaf, terjadi kesalahan') &&
        !m.text.startsWith('⚠️') &&
        !m.text.includes('masalah teknis internal') // Filter user's screenshot error too just in case
      );

      const response = await sendChatMessage(
        text,
        history,
        currentModel,
        imageData
      );

      // Add AI response
      const aiMessage: Message = {
        isUser: false,
        text: response.response,
      };

      setMessages(prev => [...prev, aiMessage]);

      // 3. Save AI message if logged in
      if (user && currentConvId) {
        try {
          await saveMessage(user.uid, currentConvId, aiMessage);
        } catch (err) {
          console.error('Failed to save AI message:', err);
        }
      }
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
    setInputMessage('');
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
        refreshTrigger={refreshSidebar}
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
            {user && (
              <ModelSelector
                currentModel={currentModel}
                onModelChange={setCurrentModel}
              />
            )}
          </div>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto pt-24 pb-32 px-4 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
          {messages.length === 0 ? (
            <WelcomeScreen
              userName={getUserName()}
              onPromptSelect={setInputMessage}
            />
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
              value={inputMessage}
              onChange={setInputMessage}
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
