
// Audio decoding
export function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

// Audio encoding
export function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// File to Base64
export function fileToBase64(file: File): Promise<{mimeType: string, data: string}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
        const result = reader.result as string;
        const base64Data = result.split(',')[1];
        resolve({ mimeType: file.type, data: base64Data });
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

// Extract frames from video
export async function extractVideoFrames(videoFile: File, framesToExtract: number): Promise<{mimeType: string, data: string}[]> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.src = URL.createObjectURL(videoFile);
    video.muted = true;

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    const frames: {mimeType: string, data: string}[] = [];

    video.onloadedmetadata = async () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const duration = video.duration;

      if (duration === 0) {
        // Fallback for videos without duration info
        // Try to capture just one frame after some time
        setTimeout(() => {
          if (!context) return reject(new Error("Canvas context not available"));
          context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
          const dataUrl = canvas.toDataURL('image/jpeg');
          frames.push({
            mimeType: 'image/jpeg',
            data: dataUrl.split(',')[1]
          });
          URL.revokeObjectURL(video.src);
          resolve(frames);
        }, 1000); // wait 1 sec
        return;
      }
      
      const interval = duration / (framesToExtract + 1);
      let currentTime = interval;

      const captureFrame = () => {
        if (currentTime > duration || frames.length >= framesToExtract) {
          URL.revokeObjectURL(video.src);
          resolve(frames);
          return;
        }

        video.currentTime = currentTime;
      };

      video.onseeked = () => {
        if (!context) return reject(new Error("Canvas context not available"));
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const dataUrl = canvas.toDataURL('image/jpeg');
        frames.push({
          mimeType: 'image/jpeg',
          data: dataUrl.split(',')[1]
        });
        currentTime += interval;
        captureFrame();
      };
      
      captureFrame();
    };

    video.onerror = (e) => {
      URL.revokeObjectURL(video.src);
      reject(new Error("Failed to load video file."));
    };

    video.load();
  });
}
