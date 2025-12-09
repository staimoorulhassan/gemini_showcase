
import React, { useState } from 'react';
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import { FeatureContainer, Button, LoadingSpinner } from '../components/common';

interface GroundingChunk {
  web: {
    uri: string;
    title: string;
  };
}

const SearchGrounding: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [sources, setSources] = useState<GroundingChunk[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleQuery = async () => {
    if (!prompt) {
      setError('Please enter a question.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setResponse(null);
    setSources([]);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const result: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      setResponse(result.text);
      const groundingChunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (groundingChunks) {
        setSources(groundingChunks as GroundingChunk[]);
      }
    } catch (e: any) {
      setError(`An error occurred: ${e.message}`);
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FeatureContainer title="Grounded Search">
      <div className="space-y-4">
        <p className="text-gray-400">Ask a question about recent events or up-to-date information. Gemini will use Google Search to find the latest answers.</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleQuery()}
            placeholder="e.g., Who won the latest F1 race?"
            className="flex-grow p-2 bg-gray-700 rounded-md border border-gray-600 focus:ring-2 focus:ring-teal-500 focus:outline-none"
          />
          <Button onClick={handleQuery} disabled={isLoading}>
            {isLoading ? 'Searching...' : 'Ask'}
          </Button>
        </div>
        {error && <p className="text-red-400 mt-2">{error}</p>}
        {isLoading && <div className="mt-4"><LoadingSpinner text="Searching the web..." /></div>}
        {response && (
          <div className="mt-6 bg-gray-900/50 p-4 rounded-lg animate-fade-in">
            <h3 className="font-semibold text-lg mb-2 text-teal-300">Answer</h3>
            <p className="whitespace-pre-wrap">{response}</p>
            {sources.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold text-md mb-2 text-gray-300">Sources:</h4>
                <ul className="list-disc list-inside space-y-1">
                  {sources.map((source, index) => (
                    <li key={index}>
                      <a href={source.web.uri} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                        {source.web.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </FeatureContainer>
  );
};

export default SearchGrounding;
