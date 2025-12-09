
import React, { useState, useRef } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { FeatureContainer, Button, LoadingSpinner } from '../components/common';
import { decode, decodeAudioData } from '../utils/media';

const TextToSpeech: React.FC = () => {
  const [text, setText] = useState('Hello! I am Gemini. I can convert text into natural-sounding speech.');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const handleGenerateAndPlay = async () => {
    if (!text) {
      setError('Please enter some text to generate speech.');
      return;
    }
    setIsLoading(true);
    setError(null);

    // Stop any currently playing audio
    if (audioSourceRef.current) {
        audioSourceRef.current.stop();
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        await audioContextRef.current.close();
    }

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-tts',
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) {
        throw new Error("Model did not return audio data.");
      }

      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const audioBuffer = await decodeAudioData(decode(base64Audio), audioContextRef.current, 24000, 1);
      
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.start();
      audioSourceRef.current = source;
      
    } catch (e: any) {
      setError(`An error occurred: ${e.message}`);
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FeatureContainer title="Text to Speech">
      <div className="space-y-4">
        <p className="text-gray-400">Enter text below to generate speech using Gemini. The audio will play automatically.</p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter text here..."
          className="w-full h-32 p-2 bg-gray-700 rounded-md border border-gray-600 focus:ring-2 focus:ring-teal-500 focus:outline-none"
        />
        <div className="text-center">
            <Button onClick={handleGenerateAndPlay} disabled={isLoading}>
                {isLoading ? 'Generating...' : 'Generate and Play Speech'}
            </Button>
        </div>
        {error && <p className="text-red-400 mt-2 text-center">{error}</p>}
        {isLoading && <div className="mt-4"><LoadingSpinner text="Generating audio..." /></div>}
      </div>
    </FeatureContainer>
  );
};

export default TextToSpeech;
