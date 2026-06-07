// src/components/AudioUploader.js

import React, { useState } from 'react';
import Waveform from './Waveform';
import { FaUpload } from 'react-icons/fa';

const AudioUploader = ({ onUploadComplete }) => {
  const [audioBlob, setAudioBlob] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handleFileUpload = (event) => {
    setErrorMessage('');
    const file = event.target.files[0];
    if (file) {
      const allowedTypes = ['audio/wav', 'audio/mp3', 'audio/flac', 'audio/m4a'];
      if (!allowedTypes.includes(file.type)) {
        setErrorMessage('Unsupported file type. Please upload a .wav, .mp3, .flac, or .m4a file.');
        return;
      }
      const blob = file;
      setAudioBlob(blob);
      onUploadComplete(blob);
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* Waveform Display */}
      {audioBlob && <Waveform audioBlob={audioBlob} />}

      {/* Audio Player */}
      {audioBlob && (
        <audio
          src={URL.createObjectURL(audioBlob)}
          controls
          className="mt-4 w-full max-w-md"
        />
      )}

      {/* Upload Button */}
      <div className="mt-6">
        <label
          htmlFor="audio-upload"
          className="flex items-center justify-center bg-indigo-500 text-white px-6 py-3 rounded-full cursor-pointer hover:bg-indigo-600 transition duration-300"
        >
          <FaUpload className="mr-2" />
          Upload Audio
          <input
            type="file"
            id="audio-upload"
            accept="audio/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="mt-4 text-red-500">
          {errorMessage}
        </div>
      )}
    </div>
  );
};

export default AudioUploader;
