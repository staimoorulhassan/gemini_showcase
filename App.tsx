
import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Feature } from './types';
import Welcome from './features/Welcome';
import VoiceChat from './features/VoiceChat';
import ImageEditor from './features/ImageEditor';
import VideoAnimator from './features/VideoAnimator';
import SearchGrounding from './features/SearchGrounding';
import ImageAnalyzer from './features/ImageAnalyzer';
import VideoAnalyzer from './features/VideoAnalyzer';
import ComplexQuery from './features/ComplexQuery';
import AudioTranscriber from './features/AudioTranscriber';
import TextToSpeech from './features/TextToSpeech';
import FriendlyAI from './features/FriendlyAI';

const App: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState<Feature | null>(null);

  const renderActiveFeature = () => {
    switch (activeFeature) {
      case Feature.VOICE_CHAT:
        return <VoiceChat />;
      case Feature.IMAGE_EDITOR:
        return <ImageEditor />;
      case Feature.VIDEO_ANIMATOR:
        return <VideoAnimator />;
      case Feature.SEARCH_GROUNDING:
        return <SearchGrounding />;
      case Feature.IMAGE_ANALYZER:
        return <ImageAnalyzer />;
      case Feature.VIDEO_ANALYZER:
        return <VideoAnalyzer />;
      case Feature.COMPLEX_QUERY:
        return <ComplexQuery />;
      case Feature.AUDIO_TRANSCRIBER:
        return <AudioTranscriber />;
      case Feature.TEXT_TO_SPEECH:
        return <TextToSpeech />;
      case Feature.FRIENDLY_AI:
        return <FriendlyAI />;
      default:
        return <Welcome />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-900 text-gray-200 font-sans">
      <Sidebar activeFeature={activeFeature} setActiveFeature={setActiveFeature} />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
        {renderActiveFeature()}
      </main>
    </div>
  );
};

export default App;
