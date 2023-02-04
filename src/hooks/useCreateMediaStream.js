import { useEffect, useState } from 'react';

export const useCreateMediaStream = (localVideoRef) => {
  const [userMediaStream, setUserMediaStream] = useState(null);

  useEffect(() => {
    const createMediaStream = async () => {
      if (navigator !== undefined) {
        try {

          const devices = await navigator.mediaDevices.enumerateDevices();
          const defaultCamera = devices.find(d => !d.label.includes('OBS'));

          const stream = await navigator?.mediaDevices?.getUserMedia({
            video: {
              deviceId: defaultCamera?.deviceId ? defaultCamera?.deviceId : undefined,
              width: { min: 640, ideal: 1920 },
              height: { min: 400, ideal: 1080 },
              aspectRatio: { ideal: 1.7777777778 },
            },
            audio: true,
          });

          localVideoRef.current.srcObject = stream;

          setUserMediaStream(stream);
        } catch (e) {
          console.log('error', e)
          throw e;
        }
      }
    };

    createMediaStream();
  }, [localVideoRef]);

  return userMediaStream;
};
