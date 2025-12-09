
export enum Feature {
  VOICE_CHAT = 'VOICE_CHAT',
  IMAGE_EDITOR = 'IMAGE_EDITOR',
  VIDEO_ANIMATOR = 'VIDEO_ANIMATOR',
  SEARCH_GROUNDING = 'SEARCH_GROUNDING',
  IMAGE_ANALYZER = 'IMAGE_ANALYZER',
  VIDEO_ANALYZER = 'VIDEO_ANALYZER',
  COMPLEX_QUERY = 'COMPLEX_QUERY',
  AUDIO_TRANSCRIBER = 'AUDIO_TRANSCRIBER',
  TEXT_TO_SPEECH = 'TEXT_TO_SPEECH',
  FRIENDLY_AI = 'FRIENDLY_AI',
}

export interface FeatureInfo {
  id: Feature;
  name: string;
  description: string;
  icon: 'audio_spark' | 'image_edit_auto' | 'movie' | 'google' | 'document_scanner' | 'video_library' | 'network_intelligence' | 'speech_to_text' | 'heart';
}
