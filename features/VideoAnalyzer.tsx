
import React, { useState } from 'react';
import { GoogleGenAI, Part } from '@google/genai';
import { FeatureContainer, Button, LoadingSpinner, FileInput } from '../components/common';
import { extractVideoFrames } from '../utils/media';

const VideoAnalyzer: React.FC = () => {
  const [prompt, setPrompt] = useState('Describe what is happening in this video based on these frames.');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [frames, setFrames] = useState<string[]>([]);

  const handleFileSelect = (file: File) => {
    setVideoFile(file);
    setVideoUrl(URL.createObjectURL(file));
    setAnalysis(null);
    setFrames([]);
  };

  const handleAnalyze = async () => {
    if (!prompt || !videoFile) {
      setError('Please provide a video and a prompt.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setAnalysis(null);
    setFrames([]);

    try {
      const extractedFrames = await extractVideoFrames(videoFile, 8);
      if (extractedFrames.length === 0) {
        throw new Error("Could not extract any frames from the video. The file may be corrupt or in an unsupported format.");
      }
      setFrames(extractedFrames.map(f => `data:${f.mimeType};base64,${f.data}`));
      
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const parts: Part[] = extractedFrames.map(frame => ({
        inlineData: {
          mimeType: frame.mimeType,
          data: frame.data,
        },
      }));
      parts.push({ text: prompt });

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: { parts },
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
    <FeatureContainer title="Video Analyzer">
      <div className="space-y-4">
        <p className="text-gray-400">Upload a short video. The app will extract key frames and use Gemini to analyze them based on your question.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-900/50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2 text-lg">1. Upload Video</h3>
            <FileInput onFileSelect={handleFileSelect} accept="video/*">
              Choose Video
            </FileInput>
            {videoUrl && <video src={videoUrl} controls className="mt-4 rounded-lg max-h-64 w-auto mx-auto" />}
          </div>
          <div className="bg-gray-900/50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2 text-lg">2. Ask a Question</h3>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., What is the main activity in this video?"
              className="w-full h-24 p-2 bg-gray-700 rounded-md border border-gray-600 focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>
        </div>
        <div className="text-center mt-4">
          <Button onClick={handleAnalyze} disabled={isLoading || !prompt || !videoFile}>
            {isLoading ? 'Analyzing...' : 'Analyze Video'}
          </Button>
        </div>
        {error && <p className="text-red-400 text-center mt-4">{error}</p>}
        {isLoading && <div className="mt-4"><LoadingSpinner text="Extracting frames & analyzing..." /></div>}
        {frames.length > 0 && !analysis && (
          <div className="mt-6">
              <h3 className="font-semibold text-lg mb-2 text-teal-300">Extracted Frames:</h3>
              <div className="grid grid-cols-4 gap-2">
                  {frames.map((frame, index) => (
                      <img key={index} src={frame} alt={`Frame ${index + 1}`} className="rounded" />
                  ))}
              </div>
          </div>
        )}
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

export default VideoAnalyzer;
