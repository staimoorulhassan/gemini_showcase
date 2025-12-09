
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, GenerateVideosOperation } from '@google/genai';
import { FeatureContainer, Button, LoadingSpinner, FileInput } from '../components/common';
import { fileToBase64 } from '../utils/media';
import { useApiKeyCheck } from '../hooks/useApiKeyCheck';

const loadingMessages = [
  "Summoning digital artists...",
  "Teaching pixels to dance...",
  "Warming up the animation engine...",
  "This can take a few minutes...",
  "Composing the video soundtrack (silently)...",
  "Checking the lighting...",
  "Almost there, adding the final sparkle...",
];

const ApiKeyPrompt: React.FC<{ onSelectKey: () => void; }> = ({ onSelectKey }) => (
    <div className="text-center bg-gray-900/50 p-8 rounded-lg">
        <h3 className="text-2xl font-bold text-yellow-400 mb-4">API Key Required</h3>
        <p className="text-gray-300 mb-6 max-w-lg mx-auto">
            Video generation with Veo is a premium feature and requires a paid Google Cloud project. Please select an API key associated with a project that has billing enabled.
        </p>
        <Button onClick={onSelectKey} className="bg-yellow-600 hover:bg-yellow-700">
            Select API Key
        </Button>
        <p className="text-xs text-gray-500 mt-4">
            For more information, visit <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline hover:text-yellow-300">Google AI billing documentation</a>.
        </p>
    </div>
);

const VideoAnimator: React.FC = () => {
  const { isKeySelected, isChecking, selectKey, resetKeySelection } = useApiKeyCheck();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);
  const [error, setError] = useState<string | null>(null);
  const pollingIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setLoadingMessage(loadingMessages[Math.floor(Math.random() * loadingMessages.length)]);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isLoading]);

  const handleFileSelect = (file: File) => {
    setImageFile(file);
    setImageUrl(URL.createObjectURL(file));
    setGeneratedVideoUrl(null);
  };

  const handleGenerate = async () => {
    if (!imageFile) {
      setError('Please upload an image.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedVideoUrl(null);
    setLoadingMessage(loadingMessages[0]);

    try {
      // Create new instance to pick up latest key
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY }); 
      const { data, mimeType } = await fileToBase64(imageFile);

      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        image: { imageBytes: data, mimeType },
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio,
        },
      });

      const pollOperation = async (op: GenerateVideosOperation) => {
        let currentOp = op;
        while (!currentOp.done) {
          await new Promise(resolve => setTimeout(resolve, 10000));
          try {
            const aiPoll = new GoogleGenAI({ apiKey: process.env.API_KEY });
            currentOp = await aiPoll.operations.getVideosOperation({ operation: currentOp });
          } catch(pollError: any) {
              if (pollError.message.includes("Requested entity was not found.")) {
                  throw new Error("API key invalid or expired. Please re-select your key.");
              }
              throw pollError; // Re-throw other errors
          }
        }
        return currentOp;
      };

      const finalOperation = await pollOperation(operation);
      
      const downloadLink = finalOperation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        // Must append API key to fetch the video
        const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        const videoBlob = await videoResponse.blob();
        setGeneratedVideoUrl(URL.createObjectURL(videoBlob));
      } else {
        throw new Error('Video generation completed but no video URI was found.');
      }

    } catch (e: any) {
      setError(`An error occurred: ${e.message}`);
      if (e.message.includes("API key invalid")) {
        resetKeySelection();
      }
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return <FeatureContainer title="Animate Image with Veo"><LoadingSpinner text="Checking API Key..." /></FeatureContainer>;
  }

  if (!isKeySelected) {
    return <FeatureContainer title="Animate Image with Veo"><ApiKeyPrompt onSelectKey={selectKey} /></FeatureContainer>;
  }

  return (
    <FeatureContainer title="Animate Image with Veo">
      <div className="space-y-6">
        <p className="text-gray-400">Upload a photo to animate it into a short video using Google's Veo model.</p>
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <FileInput onFileSelect={handleFileSelect} accept="image/*">
            Choose Image
          </FileInput>
          <div className="flex items-center gap-4">
            <span className="font-medium">Aspect Ratio:</span>
            <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value as '16:9' | '9:16')} className="bg-gray-700 border border-gray-600 rounded-md p-2 focus:ring-2 focus:ring-teal-500 focus:outline-none">
              <option value="16:9">16:9 (Landscape)</option>
              <option value="9:16">9:16 (Portrait)</option>
            </select>
          </div>
        </div>
        {imageUrl && <img src={imageUrl} alt="Uploaded" className="mt-4 rounded-lg max-h-64 w-auto shadow-lg" />}
        <div className="text-center mt-4">
          <Button onClick={handleGenerate} disabled={isLoading || !imageFile}>
            Generate Video
          </Button>
        </div>
        {error && <p className="text-red-400 text-center mt-4">{error}</p>}
        {isLoading && (
            <div className="mt-6 flex flex-col items-center justify-center">
                <LoadingSpinner text={loadingMessage} />
            </div>
        )}
        {generatedVideoUrl && (
          <div className="mt-6">
            <h3 className="font-semibold text-xl mb-4 text-teal-300 text-center">Generated Video</h3>
            <video controls autoPlay loop src={generatedVideoUrl} className="rounded-lg mx-auto shadow-lg w-full max-w-2xl" />
          </div>
        )}
      </div>
    </FeatureContainer>
  );
};

export default VideoAnimator;
