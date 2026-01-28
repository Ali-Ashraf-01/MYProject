'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string | { type: string; data: string; format: string };
  timestamp: Date;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'مرحباً! أنا مساعد Vertex AI الذكي. كيف يمكنني مساعدتك اليوم؟ 🤖',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{name: string, path: string} | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      abortControllerRef.current = new AbortController();
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: uploadedFile ? `[PDF: ${uploadedFile.path}] ${input}` : input 
        }),
        signal: abortControllerRef.current.signal
      });

      const data = await response.json();

      if (data.success) {
        const output = data.result || 'تم إتمام العملية بنجاح!';
        const assistantMessage: Message = {
          role: 'assistant',
          content: output,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(data.error || 'حدث خطأ ما');
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        const errorMessage: Message = {
          role: 'system',
          content: `❌ خطأ: ${error.message}`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: 'مرحباً! أنا مساعد Vertex AI الذكي. كيف يمكنني مساعدتك اليوم؟ 🤖',
      timestamp: new Date()
    }]);
    setUploadedFile(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        setUploadedFile({ name: data.originalName, path: data.filepath });
        setMessages(prev => [...prev, {
          role: 'system',
          content: `📄 تم رفع الملف: ${data.originalName}`,
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      console.error('Upload error:', error);
    }

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-2xl">🚀</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Vertex AI Chat
            </h1>
          </div>
          <p className="text-gray-600">
            مدعوم بتقنية Google Vertex AI المتطورة
          </p>
        </div>

        {/* Chat Container */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden border border-gray-200">
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-white font-semibold">متصل الآن</span>
            </div>
            <button
              onClick={clearChat}
              className="text-white/90 hover:text-white hover:bg-white/20 px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium"
            >
              🗑️ مسح المحادثة
            </button>
          </div>

          {/* Messages Area */}
          <div className="h-[500px] md:h-[550px] overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-50/50 to-white">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                <div
                  className={`max-w-[85%] md:max-w-[75%] px-5 py-3.5 rounded-2xl shadow-md ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-br-sm'
                      : msg.role === 'system'
                      ? 'bg-red-100 text-red-800 border border-red-200 rounded-tl-sm'
                      : 'bg-white text-gray-800 border border-gray-200 rounded-tl-sm'
                  }`}
                >
                  {typeof msg.content === 'object' && msg.content.type === 'image' ? (
                    <div className="space-y-2">
                      <img 
                        src={`data:image/png;base64,${msg.content.data}`}
                        alt="Generated image"
                        className="rounded-lg max-w-full h-auto"
                      />
                      <p className="text-sm opacity-80">✨ تم توليد الصورة بنجاح</p>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap break-words leading-relaxed">
                      {typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)}
                    </p>
                  )}
                  <span className={`text-xs mt-2 block opacity-70`}>
                    {msg.timestamp.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-5 py-4 shadow-md">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-pink-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <span className="text-gray-600 text-sm">يكتب...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 p-4 bg-white">
            {/* Uploaded File Indicator */}
            {uploadedFile && (
              <div className="mb-2 flex items-center gap-2 text-sm text-indigo-600 bg-indigo-50 px-3 py-2 rounded-lg">
                <span>📄</span>
                <span>{uploadedFile.name}</span>
                <button
                  type="button"
                  onClick={() => setUploadedFile(null)}
                  className="mr-auto text-red-500 hover:text-red-700"
                >
                  ✕
                </button>
              </div>
            )}
            <form onSubmit={sendMessage} className="flex gap-2">
              {/* Hidden File Input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".pdf,.txt,.doc,.docx"
                className="hidden"
              />
              {/* Upload Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="px-4 py-3.5 rounded-xl border-2 border-gray-200 hover:border-indigo-500 hover:bg-indigo-50 transition-all duration-200 disabled:opacity-50"
                title="رفع ملف"
              >
                📎
              </button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={uploadedFile ? "اكتب سؤالك عن الملف..." : "اكتب رسالتك هنا..."}
                disabled={isLoading}
                className="flex-1 px-5 py-3.5 rounded-xl border-2 border-gray-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              {isLoading ? (
                <button
                  type="button"
                  onClick={stopGeneration}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3.5 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
                >
                  <span>⏹️</span>
                  <span className="hidden md:inline">إيقاف</span>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-3.5 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <span>📤</span>
                  <span className="hidden md:inline">إرسال</span>
                </button>
              )}
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 space-y-2">
          <p className="text-gray-500 text-sm">
            ⚡ جاهز للاستخدام • {messages.length - 1} رسالة في المحادثة
          </p>
          <p className="text-gray-400 text-xs">
            مدعوم بـ Google Vertex AI & Next.js
          </p>
        </div>
      </div>
    </main>
  );
}
