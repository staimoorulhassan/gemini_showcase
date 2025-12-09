
import React from 'react';
import { NetworkIntelligenceIcon } from '../components/Icons';

const Welcome: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <NetworkIntelligenceIcon className="h-24 w-24 text-teal-500 mb-6" />
      <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-blue-500">
        Welcome to the Gemini Showcase
      </h1>
      <p className="text-lg text-gray-400 max-w-2xl">
        Explore the power of Gemini's multimodal capabilities. Select a feature from the sidebar to get started.
      </p>
    </div>
  );
};

export default Welcome;
