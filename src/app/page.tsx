'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuthState } from '@/hooks/useAuthState';
import { sendChatMessageStream, saveMessage, updateConversationSystemPrompt, Message, AIModel, Conversation } from '@/lib/api';
import Sidebar from '@/components/layout/Sidebar';
import ChatMessage from '@/components/chat/ChatMessage';
import ChatInput from '@/components/chat/ChatInput';
import ModelSelector from '@/components/chat/ModelSelector';
import WelcomeScreen from '@/components/chat/WelcomeScreen';
import ThemeToggle from '@/components/ThemeToggle';
import SystemPromptPanel from '@/components/chat/SystemPromptPanel';

export default function Home() {
  const { user, loading } = useAuthState();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentModel, setCurrentModel] = useState<AIModel>('gemini');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false); // Default false to prevent flash on mobile
  const [useSearch, setUseSearch] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState('');
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

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-background gap-6 animate-pulse">
        <div className="w-20 h-20 relative animate-float">
          <img
            src="/Aksara-AI-Logo-Warna.png"
            alt="Aksara AI Logo"
            className="w-full h-full object-contain"
          />
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="w-48 h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 animate-loading-bar w-0" />
          </div>
          <span className="text-sm font-medium text-gray-400 dark:text-gray-500 animate-pulse">
            Menyiapkan ruang obrolan...
          </span>
        </div>
      </div>
    );
  }

  const handleSendMessage = async (text: string, imageData?: string, overrideHistory?: Message[]) => {
    if (!text.trim() && !imageData) return;

    // Add user message
    const userMessage: Message = {
      isUser: true,
      text: text,
      imageData: imageData,
    };

    setMessages(prev => {
      const base = overrideHistory || prev;
      return [...base, userMessage];
    });

    setInputMessage(''); // Clear input
    setIsLoading(true);
    setIsStreaming(true);

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

      // 2. Send to AI with streaming
      const baseHistory = overrideHistory || messages;

      // Filter out error messages from history
      const history = baseHistory.filter(m =>
        !m.text.startsWith('Maaf, terjadi kesalahan') &&
        !m.text.startsWith('⚠️') &&
        !m.text.includes('masalah teknis internal')
      );

      // Add empty AI message for streaming
      const aiMessageIndex = (overrideHistory || messages).length + 1; // +1 for the user message we just added
      setMessages(prev => [...prev, { isUser: false, text: '' }]);
      setIsLoading(false); // Hide typing indicator, show streaming text

      const { fullText } = await sendChatMessageStream(
        text,
        history,
        currentModel,
        (chunk: string) => {
          // Update the last message (AI response) with each chunk
          setMessages(prev => {
            const updated = [...prev];
            const lastIdx = updated.length - 1;
            if (lastIdx >= 0 && !updated[lastIdx].isUser) {
              updated[lastIdx] = {
                ...updated[lastIdx],
                text: updated[lastIdx].text + chunk,
              };
            }
            return updated;
          });
        },
        imageData,
        currentModel === 'gemini' ? useSearch : undefined,
        systemPrompt || undefined
      );

      // Ensure final text is set correctly
      setMessages(prev => {
        const updated = [...prev];
        const lastIdx = updated.length - 1;
        if (lastIdx >= 0 && !updated[lastIdx].isUser) {
          updated[lastIdx] = { ...updated[lastIdx], text: fullText };
        }
        return updated;
      });

      // 3. Save AI message if logged in
      const aiMessage: Message = { isUser: false, text: fullText };
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
      setIsStreaming(false);
    }
  };

  const handleEditMessage = async (index: number, newText: string) => {
    // 1. Get history up to this index
    const history = messages.slice(0, index);

    // 2. Re-send the message with new text and explicit history
    await handleSendMessage(newText, undefined, history);
  };

  const handleNewChat = () => {
    setMessages([]);
    setConversationId(null);
    setInputMessage('');
    setSystemPrompt('');
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
        onSelectConversation={(id: string, msgs: Message[], conv?: Conversation) => {
          setConversationId(id);
          setMessages(msgs);
          setSystemPrompt(conv?.systemPrompt || '');
        }}
        refreshTrigger={refreshSidebar}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-40 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between bg-background/80 backdrop-blur-xl">
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
            {user && currentModel === 'gemini' && (
              <button
                onClick={() => setUseSearch(prev => !prev)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border backdrop-blur-sm transition-all shadow-sm text-sm font-medium ${useSearch
                  ? 'border-blue-400 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-black/50 text-gray-500 dark:text-gray-400 hover:bg-white/80 dark:hover:bg-black/80'
                  }`}
                title={useSearch ? 'Google Search aktif' : 'Aktifkan Google Search'}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="hidden sm:inline">Search</span>
              </button>
            )}
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
          {/* System Prompt Panel */}
          <SystemPromptPanel
            systemPrompt={systemPrompt}
            onSystemPromptChange={(prompt) => {
              setSystemPrompt(prompt);
              // Save to Firestore if conversation exists
              if (user && conversationId) {
                updateConversationSystemPrompt(user.uid, conversationId, prompt);
              }
            }}
            disabled={isLoading || isStreaming}
          />
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
                  onEdit={message.isUser ? (newText) => handleEditMessage(index, newText) : undefined}
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
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-t from-[var(--background)] to-transparent pointer-events-none">
          <div className="max-w-3xl mx-auto pointer-events-auto">
            <ChatInput
              onSend={handleSendMessage}
              disabled={isLoading || isStreaming}
              value={inputMessage}
              onChange={setInputMessage}
            />
            <p className="text-center text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 mt-2 sm:mt-3 px-4">
              Aksara AI dapat membuat kesalahan. Periksa kembali informasi penting.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
