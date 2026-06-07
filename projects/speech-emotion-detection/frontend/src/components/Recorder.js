// src/components/Recorder.js

import React, { useState, useEffect } from 'react';
import MicRecorder from 'mic-recorder-to-mp3';
import { FaMicrophone, FaStop } from 'react-icons/fa';
import { motion } from 'framer-motion';

const Mp3Recorder = new MicRecorder({ bitRate: 128 });

const Recorder = ({ onRecordingComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [blobURL, setBlobURL] = useState('');
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(() => {
        setIsBlocked(false);
      })
      .catch(() => {
        setIsBlocked(true);
      });
  }, []);

  const startRecording = () => {
    if (isBlocked) {
      alert('Microphone access is blocked. You can still upload an audio file.');
    } else {
      Mp3Recorder.start().then(() => {
        setIsRecording(true);
      }).catch((e) => {
        console.error(e);
        alert('Could not start recording. Please try again.');
      });
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
        <div className="recorder-message" role="status">
          Microphone access is blocked. Uploading an audio file is still available.
        </div>
      )}
    </div>
  );
};

export default Recorder;
