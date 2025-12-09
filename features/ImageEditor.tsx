
import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { FeatureContainer, Button, LoadingSpinner, FileInput } from '../components/common';
import { fileToBase64 } from '../utils/media';

const ImageEditor: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [editedImageUrl, setEditedImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (file: File) => {
    setImageFile(file);
    setOriginalImageUrl(URL.createObjectURL(file));
    setEditedImageUrl(null);
  };

  const handleGenerate = async () => {
    if (!prompt || !imageFile) {
      setError('Please provide an image and a prompt.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setEditedImageUrl(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const imagePart = await fileToBase64(imageFile);

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ inlineData: imagePart }, { text: prompt }],
        },
      });

      let foundImage = false;
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64Data = part.inlineData.data;
          setEditedImageUrl(`data:image/png;base64,${base64Data}`);
          foundImage = true;
          break;
        }
      }
      if (!foundImage) {
        setError('The model did not return an image. It might have refused the request.');
      }
    } catch (e: any) {
      setError(`An error occurred: ${e.message}`);
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FeatureContainer title="Image Editor">
      <div className="space-y-4">
        <p className="text-gray-400">Upload an image and describe how you'd like to change it. For example, "add a retro filter" or "make the sky purple".</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-900/50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2 text-lg">1. Upload Image</h3>
            <FileInput onFileSelect={handleFileSelect} accept="image/*">
              Choose Image
            </FileInput>
            {originalImageUrl && <img src={originalImageUrl} alt="Original" className="mt-4 rounded-lg max-h-64 w-auto mx-auto" />}
          </div>
          <div className="bg-gray-900/50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2 text-lg">2. Describe Edits</h3>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., Add a cat wearing a party hat"
              className="w-full h-24 p-2 bg-gray-700 rounded-md border border-gray-600 focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>
        </div>
        <div className="text-center mt-4">
          <Button onClick={handleGenerate} disabled={isLoading || !prompt || !imageFile}>
            {isLoading ? 'Editing...' : 'Edit Image'}
          </Button>
        </div>
        {error && <p className="text-red-400 text-center mt-4">{error}</p>}
        {isLoading && <div className="mt-4"><LoadingSpinner text="Applying edits..." /></div>}
        {editedImageUrl && (
          <div className="mt-6 text-center">
            <h3 className="font-semibold text-xl mb-4 text-teal-300">Edited Image</h3>
            <img src={editedImageUrl} alt="Edited" className="rounded-lg mx-auto shadow-lg" />
          </div>
        )}
      </div>
    </FeatureContainer>
  );
};

export default ImageEditor;
