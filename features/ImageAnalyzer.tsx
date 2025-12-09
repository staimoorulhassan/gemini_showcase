
import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { FeatureContainer, Button, LoadingSpinner, FileInput } from '../components/common';
import { fileToBase64 } from '../utils/media';

const ImageAnalyzer: React.FC = () => {
  const [prompt, setPrompt] = useState('Describe this image in detail.');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (file: File) => {
    setImageFile(file);
    setImageUrl(URL.createObjectURL(file));
    setAnalysis(null);
  };

  const handleAnalyze = async () => {
    if (!prompt || !imageFile) {
      setError('Please provide an image and a prompt.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const imagePart = await fileToBase64(imageFile);

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: {
          parts: [{ inlineData: imagePart }, { text: prompt }],
        },
      });

      setAnalysis(response.text);
    } catch (e: any) {
      setError(`An error occurred: ${e.message}`);
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FeatureContainer title="Image Analyzer">
      <div className="space-y-4">
        <p className="text-gray-400">Upload a photo and ask Gemini to analyze it. You can ask it to describe the image, count objects, identify landmarks, and more.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-900/50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2 text-lg">1. Upload Image</h3>
            <FileInput onFileSelect={handleFileSelect} accept="image/*">
              Choose Image
            </FileInput>
            {imageUrl && <img src={imageUrl} alt="For analysis" className="mt-4 rounded-lg max-h-64 w-auto mx-auto" />}
          </div>
          <div className="bg-gray-900/50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2 text-lg">2. Ask a Question</h3>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., What kind of dog is this?"
              className="w-full h-24 p-2 bg-gray-700 rounded-md border border-gray-600 focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>
        </div>
        <div className="text-center mt-4">
          <Button onClick={handleAnalyze} disabled={isLoading || !prompt || !imageFile}>
            {isLoading ? 'Analyzing...' : 'Analyze Image'}
          </Button>
        </div>
        {error && <p className="text-red-400 text-center mt-4">{error}</p>}
        {isLoading && <div className="mt-4"><LoadingSpinner text="Analyzing image..." /></div>}
        {analysis && (
          <div className="mt-6 bg-gray-900/50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-2 text-teal-300">Analysis Result</h3>
            <p className="whitespace-pre-wrap">{analysis}</p>
          </div>
        )}
      </div>
    </FeatureContainer>
  );
};

export default ImageAnalyzer;
