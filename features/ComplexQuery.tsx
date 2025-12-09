
import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { FeatureContainer, Button, LoadingSpinner } from '../components/common';

const ComplexQuery: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleQuery = async () => {
    if (!prompt) {
      setError('Please enter a query.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setResponse(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const result = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
          thinkingConfig: { thinkingBudget: 32768 },
        },
      });

      setResponse(result.text);
    } catch (e: any) {
      setError(`An error occurred: ${e.message}`);
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FeatureContainer title="Thinking Mode for Complex Queries">
      <div className="space-y-4">
        <p className="text-gray-400">Ask a complex question that requires deep reasoning, planning, or code generation. Gemini will use its maximum "thinking budget" to provide a thorough answer.</p>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., Write a business plan for a sustainable energy startup, including market analysis, financial projections, and a technology roadmap."
          className="w-full h-32 p-2 bg-gray-700 rounded-md border border-gray-600 focus:ring-2 focus:ring-teal-500 focus:outline-none"
        />
        <div className="text-center">
            <Button onClick={handleQuery} disabled={isLoading}>
                {isLoading ? 'Thinking...' : 'Submit Query'}
            </Button>
        </div>
        {error && <p className="text-red-400 mt-2 text-center">{error}</p>}
        {isLoading && <div className="mt-4"><LoadingSpinner text="Engaging deep thought..." /></div>}
        {response && (
          <div className="mt-6 bg-gray-900/50 p-4 rounded-lg animate-fade-in">
            <h3 className="font-semibold text-lg mb-2 text-teal-300">Response</h3>
            <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: response.replace(/\n/g, '<br />') }} />
          </div>
        )}
      </div>
    </FeatureContainer>
  );
};

export default ComplexQuery;
