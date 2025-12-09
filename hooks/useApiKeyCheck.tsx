import { useState, useEffect, useCallback } from 'react';

// Fix: Define a complete interface for aistudio to resolve declaration conflicts.
interface AIStudio {
  hasSelectedApiKey: () => Promise<boolean>;
  openSelectKey: () => Promise<void>;
  // Add properties based on error message to match global type.
  getHostUrl: () => string;
  getModelQuota: (modelId: string) => Promise<{ quota: number; used: number }>;
}

// To avoid declaration conflicts, the global Window interface must be augmented
// before window.aistudio is accessed or modified.
declare global {
  interface Window {
    aistudio: AIStudio;
  }
}

// Mocking window.aistudio for environments where it's not present
if (typeof window !== 'undefined' && !window.aistudio) {
  window.aistudio = {
    hasSelectedApiKey: () => Promise.resolve(true),
    openSelectKey: () => Promise.resolve(),
    // Fix: Add mock implementations for missing properties.
    getHostUrl: () => 'mock-host-url',
    getModelQuota: async (_modelId: string) => ({ quota: 100, used: 10 }),
  };
}

export const useApiKeyCheck = () => {
  const [isKeySelected, setIsKeySelected] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const checkApiKey = useCallback(async () => {
    setIsChecking(true);
    try {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      setIsKeySelected(hasKey);
    } catch (error) {
      console.error('Error checking for API key:', error);
      setIsKeySelected(false);
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    checkApiKey();
  }, [checkApiKey]);

  const selectKey = useCallback(async () => {
    try {
      await window.aistudio.openSelectKey();
      // Assume success after opening dialog to avoid race conditions
      setIsKeySelected(true);
    } catch (error) {
      console.error('Error opening API key selection:', error);
      setIsKeySelected(false);
    }
  }, []);

  const resetKeySelection = useCallback(() => {
    setIsKeySelected(false);
  }, []);

  return { isKeySelected, isChecking, selectKey, resetKeySelection };
};
