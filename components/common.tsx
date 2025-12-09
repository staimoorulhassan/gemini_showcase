
import React from 'react';

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, className, ...props }) => {
  return (
    <button
      className={`px-4 py-2 bg-teal-600 text-white font-semibold rounded-lg shadow-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-opacity-75 transition-all duration-200 disabled:bg-gray-500 disabled:cursor-not-allowed ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export const LoadingSpinner: React.FC<{ text?: string }> = ({ text = "Loading..."}) => {
  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-400"></div>
      <p className="text-teal-300">{text}</p>
    </div>
  );
};

export const FeatureContainer: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-gray-800/50 rounded-xl shadow-lg p-6 max-w-4xl mx-auto animate-fade-in">
    <h2 className="text-3xl font-bold text-teal-400 mb-6 border-b border-gray-700 pb-4">{title}</h2>
    {children}
  </div>
);

export const FileInput: React.FC<{ onFileSelect: (file: File) => void; accept: string; children: React.ReactNode }> = ({ onFileSelect, accept, children }) => {
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            onFileSelect(file);
        }
    };
    
    const handleClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept={accept}
                className="hidden"
            />
            <Button onClick={handleClick}>{children}</Button>
        </>
    );
};
