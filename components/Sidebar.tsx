
import React from 'react';
import { Feature, FeatureInfo } from '../types';
import {
  AudioSparkIcon,
  ImageEditIcon,
  MovieIcon,
  GoogleIcon,
  DocumentScannerIcon,
  VideoLibraryIcon,
  NetworkIntelligenceIcon,
  SpeechToTextIcon,
  HeartIcon,
} from './Icons';

const features: FeatureInfo[] = [
  { id: Feature.VOICE_CHAT, name: 'Conversational Voice', description: 'Real-time voice chat with Gemini', icon: 'audio_spark' },
  { id: Feature.IMAGE_EDITOR, name: 'Image Editor', description: 'Edit images with text prompts', icon: 'image_edit_auto' },
  { id: Feature.VIDEO_ANIMATOR, name: 'Animate Image', description: 'Generate videos from photos with Veo', icon: 'movie' },
  { id: Feature.SEARCH_GROUNDING, name: 'Grounded Search', description: 'Get up-to-date info with Google Search', icon: 'google' },
  { id: Feature.IMAGE_ANALYZER, name: 'Image Analyzer', description: 'Analyze photos with Gemini', icon: 'document_scanner' },
  { id: Feature.VIDEO_ANALYZER, name: 'Video Analyzer', description: 'Analyze videos for key information', icon: 'video_library' },
  { id: Feature.COMPLEX_QUERY, name: 'Thinking Mode', description: 'Handle complex queries with deeper reasoning', icon: 'network_intelligence' },
  { id: Feature.AUDIO_TRANSCRIBER, name: 'Audio Transcriber', description: 'Transcribe spoken audio to text', icon: 'speech_to_text' },
  { id: Feature.TEXT_TO_SPEECH, name: 'Text to Speech', description: 'Generate natural-sounding speech from text', icon: 'audio_spark' },
  { id: Feature.FRIENDLY_AI, name: 'Friendly AI', description: 'Chat with a friendly AI companion', icon: 'heart' },
];

const iconMap: Record<FeatureInfo['icon'], React.FC<{ className?: string }>> = {
  audio_spark: AudioSparkIcon,
  image_edit_auto: ImageEditIcon,
  movie: MovieIcon,
  google: GoogleIcon,
  document_scanner: DocumentScannerIcon,
  video_library: VideoLibraryIcon,
  network_intelligence: NetworkIntelligenceIcon,
  speech_to_text: SpeechToTextIcon,
  heart: HeartIcon,
};

interface SidebarProps {
  activeFeature: Feature | null;
  setActiveFeature: (feature: Feature) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeFeature, setActiveFeature }) => {
  return (
    <nav className="w-64 bg-gray-900/70 backdrop-blur-sm border-r border-gray-700/50 p-4 overflow-y-auto hidden md:block">
      <h1 className="text-2xl font-bold text-teal-400 mb-6">Gemini Showcase</h1>
      <ul>
        {features.map((feature) => {
          const IconComponent = iconMap[feature.icon];
          const isActive = activeFeature === feature.id;
          return (
            <li key={feature.id} className="mb-2">
              <button
                onClick={() => setActiveFeature(feature.id)}
                className={`w-full text-left flex items-center p-3 rounded-lg transition-colors duration-200 ${
                  isActive
                    ? 'bg-teal-500/20 text-teal-300'
                    : 'hover:bg-gray-700/50 text-gray-400 hover:text-gray-200'
                }`}
              >
                <IconComponent className="h-5 w-5 mr-3 flex-shrink-0" />
                <span className="text-sm font-medium">{feature.name}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
