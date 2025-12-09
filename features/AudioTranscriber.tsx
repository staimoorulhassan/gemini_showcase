
import React, { useState, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { FeatureContainer, Button, LoadingSpinner } from '../components/common';
import { fileToBase64 } from '../utils/media';

const AudioTranscriber: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setAudioBlob(null);
      setAudioUrl(null);
      setTranscription(null);
      setError(null);
    } catch (err) {
      setError('Could not start recording. Please check microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleTranscribe = async () => {
    if (!audioBlob) {
      setError('Please record audio first.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setTranscription(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      // We need to convert the blob to a File to use our helper
      const audioFile = new File([audioBlob], "recording.webm", { type: audioBlob.type });
      const audioPart = await fileToBase64(audioFile);

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
          parts: [
            { inlineData: audioPart },
            { text: "Transcribe this audio recording." }
          ],
        },
      });

      setTranscription(response.text);
    } catch (e: any) {
      setError(`An error occurred: ${e.message}`);
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FeatureContainer title="Audio Transcriber">
      <div className="space-y-4 text-center">
        <p className="text-gray-400">Record a short audio clip using your microphone and Gemini will transcribe it into text.</p>
        <div className="flex justify-center space-x-4">
          <Button onClick={startRecording} disabled={isRecording}>
            {isRecording ? 'Recording...' : 'Start Recording'}
          </Button>
          <Button onClick={stopRecording} disabled={!isRecording} className="bg-red-600 hover:bg-red-700">
            Stop Recording
          </Button>
        </div>
        
        {isRecording && (
          <div className="flex items-center justify-center text-red-400 mt-4">
            <div className="h-3 w-3 bg-red-500 rounded-full mr-2 animate-ping"></div>
            <span>Recording in progress...</span>
          </div>
        )}

        {audioUrl && (
          <div className="mt-6 bg-gray-900/50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-2">Your Recording:</h3>
            <audio controls src={audioUrl} className="w-full"></audio>
            <div className="mt-4">
                <Button onClick={handleTranscribe} disabled={isLoading}>
                    {isLoading ? 'Transcribing...' : 'Transcribe Audio'}
                </Button>
            </div>
          </div>
        )}

        {error && <p className="text-red-400 mt-4">{error}</p>}
        {isLoading && <div className="mt-4"><LoadingSpinner text="Transcribing audio..." /></div>}

        {transcription && (
          <div className="mt-6 bg-gray-900/50 p-4 rounded-lg text-left">
            <h3 className="font-semibold text-lg mb-2 text-teal-300">Transcription:</h3>
            <p className="whitespace-pre-wrap">{transcription}</p>
          </div>
        )}
      </div>
    </FeatureContainer>
  );
};

export default AudioTranscriber;
