// src/components/Waveform.js

import React, { useEffect, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';

const Waveform = ({ audioBlob }) => {
  const waveformRef = useRef(null);
  const wavesurfer = useRef(null);

  useEffect(() => {
    if (waveformRef.current && !wavesurfer.current) {
      // Initialize WaveSurfer
      wavesurfer.current = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: '#A8DBA8',
        progressColor: '#3B8686',
        cursorColor: '#3B8686',
        barWidth: 2,
        barRadius: 3,
        responsive: true,
        height: 80,
        normalize: true,
        partialRender: true,
      });

      wavesurfer.current.on('error', (e) => {
        console.error('WaveSurfer error:', e);
      });
    }

    return () => {
      // Cleanup on unmount
      if (wavesurfer.current) {
        wavesurfer.current.destroy();
        wavesurfer.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (wavesurfer.current && audioBlob) {
      // Load the audio blob into WaveSurfer
      const reader = new FileReader();
      reader.onload = function (e) {
        const arrayBuffer = e.target.result;
        wavesurfer.current.loadBlob(new Blob([arrayBuffer]));
      };
      reader.readAsArrayBuffer(audioBlob);
    }
  }, [audioBlob]);

  return <div id="waveform" ref={waveformRef}></div>;
};

export default Waveform;
