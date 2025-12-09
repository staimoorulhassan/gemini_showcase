import React, { useState, useEffect, useRef, useCallback } from 'react';
// Fix: Removed `LiveSession` from import as it's not an exported member.
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import { FeatureContainer, Button, LoadingSpinner } from '../components/common';
import { decode, decodeAudioData, encode } from '../utils/media';

// Fix: Define a local type for the live session since LiveSession is no longer an exported member of @google/genai.
interface LiveSession {
  sendRealtimeInput(input: { media: Blob }): void;
  close(): void;
}

const VoiceChat: React.FC = () => {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcriptions, setTranscriptions] = useState<{ user: string; model: string }[]>([]);
  const [currentTranscription, setCurrentTranscription] = useState<{ user: string; model: string }>({ user: '', model: '' });

  const sessionRef = useRef<LiveSession | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef(new Set<AudioBufferSourceNode>());

  const stopSession = useCallback(async () => {
    setIsLoading(true);
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
      await inputAudioContextRef.current.close();
    }
    if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
        sourcesRef.current.forEach(source => source.stop());
        sourcesRef.current.clear();
        await outputAudioContextRef.current.close();
    }
    setIsSessionActive(false);
    setIsLoading(false);
    nextStartTimeRef.current = 0;
  }, []);

  const startSession = async () => {
    if (isSessionActive) return;
    setIsLoading(true);
    setError(null);
    setTranscriptions([]);
    setCurrentTranscription({ user: '', model: '' });

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      nextStartTimeRef.current = outputAudioContextRef.current.currentTime;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          systemInstruction: 'You are a friendly and helpful conversational assistant.',
        },
        callbacks: {
          onopen: () => {
            const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current = scriptProcessor;

            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              const pcmBlob: Blob = {
                data: encode(new Uint8Array(new Int16Array(inputData.map(v => v * 32768)).buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              sessionPromise.then((session) => session.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContextRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
             if (message.serverContent?.inputTranscription) {
                const text = message.serverContent.inputTranscription.text;
                setCurrentTranscription(prev => ({ ...prev, user: prev.user + text }));
            }
            if (message.serverContent?.outputTranscription) {
                const text = message.serverContent.outputTranscription.text;
                setCurrentTranscription(prev => ({ ...prev, model: prev.model + text }));
            }
            if (message.serverContent?.turnComplete) {
                setTranscriptions(prev => [...prev, currentTranscription]);
                setCurrentTranscription({ user: '', model: '' });
            }

            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              const audioCtx = outputAudioContextRef.current!;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, audioCtx.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64Audio), audioCtx, 24000, 1);
              const source = audioCtx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(audioCtx.destination);
              source.addEventListener('ended', () => sourcesRef.current.delete(source));
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }
            if (message.serverContent?.interrupted) {
                sourcesRef.current.forEach(source => source.stop());
                sourcesRef.current.clear();
                nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => {
            console.error('Session error:', e);
            setError(`Session error: ${e.type}`);
            stopSession();
          },
          onclose: () => {
             // Handled by user action
          },
        },
      });

      sessionRef.current = await sessionPromise;
      setIsSessionActive(true);
    } catch (err) {
      console.error(err);
      setError('Failed to start session. Please check microphone permissions.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      stopSession();
    };
  }, [stopSession]);

  return (
    <FeatureContainer title="Conversational Voice">
      <div className="space-y-4">
        <p className="text-gray-400">Have a real-time conversation with Gemini. Press "Start Session" to begin and "Stop Session" to end. Your conversation will be transcribed below.</p>
        <div className="flex space-x-4">
          <Button onClick={startSession} disabled={isLoading || isSessionActive}>
            {isLoading ? 'Starting...' : 'Start Session'}
          </Button>
          <Button onClick={stopSession} disabled={isLoading || !isSessionActive} className="bg-red-600 hover:bg-red-700">
            {isLoading ? 'Stopping...' : 'Stop Session'}
          </Button>
        </div>
        {error && <p className="text-red-400">Error: {error}</p>}
        {isSessionActive && <div className="text-green-400 flex items-center"><div className="h-3 w-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>Live Session Active</div>}
        
        <div className="mt-6 bg-gray-900/50 p-4 rounded-lg h-96 overflow-y-auto space-y-4">
            {transcriptions.map((t, i) => (
                <React.Fragment key={i}>
                    {t.user && <div className="text-right"><span className="bg-blue-600/50 px-3 py-2 rounded-lg inline-block">{t.user}</span></div>}
                    {t.model && <div className="text-left"><span className="bg-gray-700/50 px-3 py-2 rounded-lg inline-block">{t.model}</span></div>}
                </React.Fragment>
            ))}
             {currentTranscription.user && <div className="text-right"><span className="bg-blue-600/30 px-3 py-2 rounded-lg inline-block text-gray-400">{currentTranscription.user}</span></div>}
             {currentTranscription.model && <div className="text-left"><span className="bg-gray-700/30 px-3 py-2 rounded-lg inline-block text-gray-400">{currentTranscription.model}</span></div>}
        </div>
      </div>
    </FeatureContainer>
  );
};

export default VoiceChat;
