// src/components/Recorder.js

import React, { useState } from 'react';
import MicRecorder from 'mic-recorder-to-mp3';
import { FaMicrophone, FaStop } from 'react-icons/fa';
import { motion } from 'framer-motion';

const Mp3Recorder = new MicRecorder({ bitRate: 128 });

const Recorder = ({ onRecordingComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [blobURL, setBlobURL] = useState('');
  const [isBlocked, setIsBlocked] = useState(false);
  const [permissionMessage, setPermissionMessage] = useState('');

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setIsBlocked(true);
      setPermissionMessage('Microphone recording requires HTTPS and a supported browser. You can still upload an audio file.');
      return;
    }

    try {
      const permissionStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      permissionStream.getTracks().forEach((track) => track.stop());
      setIsBlocked(false);
      setPermissionMessage('');
      await Mp3Recorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error(error);
      setIsBlocked(true);
      setPermissionMessage(
        error?.name === 'NotAllowedError'
          ? 'Microphone permission was denied. Allow microphone access in the browser site settings, then press the microphone again.'
          : 'The microphone could not start. Check that another application is not using it, or upload an audio file.'
      );
    }
  };

  const stopRecording = () => {
    Mp3Recorder.stop().getMp3().then(([buffer, blob]) => {
      const blobURL = URL.createObjectURL(blob);
      setBlobURL(blobURL);
      setIsRecording(false);
      onRecordingComplete(blob);
    }).catch((e) => {
      console.error(e);
      alert('Could not retrieve recording. Please try again.');
      setIsRecording(false);
    });
  };

  return (
    <div className="flex flex-col items-center">
      <div className="mb-4">
        {blobURL && (
          <audio src={blobURL} controls className="rounded-lg" />
        )}
      </div>
      <div className="flex space-x-4">
        <motion.button
          type="button"
          aria-label="Start microphone recording"
          onClick={startRecording}
          disabled={isRecording}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className={`flex items-center justify-center bg-green-500 text-white p-4 rounded-full shadow-lg hover:bg-green-600 transition duration-300 ${
            isRecording ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <FaMicrophone className="w-6 h-6" />
        </motion.button>
        <motion.button
          type="button"
          aria-label="Stop microphone recording"
          onClick={stopRecording}
          disabled={!isRecording}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className={`flex items-center justify-center bg-red-500 text-white p-4 rounded-full shadow-lg hover:bg-red-600 transition duration-300 ${
            !isRecording ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <FaStop className="w-6 h-6" />
        </motion.button>
      </div>
      {isRecording && (
        <motion.div
          className="mt-4 text-white text-lg animate-pulse"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ repeat: Infinity, duration: 1 }}
        >
          Recording...
        </motion.div>
      )}
      {isBlocked && (
        <div className="recorder-message" role="alert">
          {permissionMessage}
        </div>
      )}
    </div>
  );
};

export default Recorder;
