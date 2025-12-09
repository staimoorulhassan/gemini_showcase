
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Chat, GenerateContentResponse } from '@google/genai';
import { FeatureContainer, Button } from '../components/common';
import { ShareIcon } from '../components/Icons';

interface Message {
  role: 'user' | 'model';
  text: string;
}

const FriendlyAI: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const chatRef = useRef<Chat | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initChat = () => {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        chatRef.current = ai.chats.create({
          model: 'gemini-2.5-flash',
          config: {
            systemInstruction: 'You are a friendly, supportive, and open-source AI companion. Your name is Sparky. Be cheerful and encouraging in your responses.',
          },
        });
        setMessages([{ role: 'model', text: 'Hello! My name is Sparky. What\'s on your mind today?' }]);
      } catch (e: any) {
        setError('Failed to initialize chat. Please check your API key.');
        console.error(e);
      }
    };
    initChat();
  }, []);
  
  useEffect(() => {
    if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      if (!chatRef.current) {
        throw new Error("Chat is not initialized.");
      }
      const result: GenerateContentResponse = await chatRef.current.sendMessage({ message: input });
      const modelMessage: Message = { role: 'model', text: result.text };
      setMessages(prev => [...prev, modelMessage]);
    } catch (e: any)      {
      setError(`An error occurred: ${e.message}`);
      // Re-add user's message to input box for resubmission
      setMessages(prev => prev.slice(0, -1));
      setInput(userMessage.text);
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = () => {
    if (messages.length <= 1) return;

    const formattedConversation = messages.map(msg => {
        const prefix = msg.role === 'model' ? 'Sparky' : 'You';
        return `${prefix}: ${msg.text}`;
    }).join('\n\n');

    const blob = new Blob([formattedConversation], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'friendly-ai-chat.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <FeatureContainer title="Friendly AI Companion">
      <div className="flex flex-col h-[75vh]">
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto bg-gray-900/50 p-4 rounded-lg space-y-4 scroll-smooth">
          {messages.map((msg, index) => (
            <div key={index} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-2xl ${msg.role === 'user' ? 'bg-teal-600 text-white rounded-br-none' : 'bg-gray-700 text-gray-200 rounded-bl-none'}`}>
                <p className="whitespace-pre-wrap">{msg.text}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
               <div className="max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-2xl bg-gray-700 text-gray-200 rounded-bl-none">
                <div className="flex items-center space-x-2">
                   <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-300"></div> 
                   <span>Sparky is thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>
        {error && <p className="text-red-400 text-center pt-2">{error}</p>}
        <div className="mt-4 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your message..."
            className="flex-grow p-2 bg-gray-700 rounded-md border border-gray-600 focus:ring-2 focus:ring-teal-500 focus:outline-none disabled:bg-gray-600"
            disabled={isLoading}
          />
          <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
            Send
          </Button>
          <Button 
            onClick={handleShare} 
            disabled={messages.length <= 1}
            className="p-2 !bg-gray-600 hover:!bg-gray-500 focus:!ring-gray-400"
            title="Share Conversation"
          >
            <ShareIcon className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </FeatureContainer>
  );
};

export default FriendlyAI;
