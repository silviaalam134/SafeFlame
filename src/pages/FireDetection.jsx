import React, { useRef, useEffect, useState } from 'react';

const FireDetection = () => {
  const videoRef = useRef(null);
  const alarmRef = useRef(null);
  const [alarmOn, setAlarmOn] = useState(false);
  const [muted, setMuted] = useState(false);
  const [stream, setStream] = useState(null);
  const [alerts, setAlerts] = useState([]);

  // Initialize camera
  const initCamera = async () => {
    if (navigator.mediaDevices?.getUserMedia) {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: true });
        setStream(s);
        if (videoRef.current) videoRef.current.srcObject = s;
      } catch (err) {
        console.error('Camera error:', err);
      }
    }
  };

  useEffect(() => {
    initCamera();
  }, []);

  // Canvas for analyzing video frames
  const canvasRef = useRef(document.createElement('canvas'));
  
  const checkForFire = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) return; // <-- safety check

    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const frame = context.getImageData(0, 0, canvas.width, canvas.height);

    let redPixels = 0;
    for (let i = 0; i < frame.data.length; i += 4) {
      const r = frame.data[i];
      const g = frame.data[i + 1];
      const b = frame.data[i + 2];

      if (r > 150 && g < 100 && b < 100) redPixels++;
    }

    if (redPixels > 5000) { // threshold for detecting fire
      if (!alarmOn) { // trigger only once per detection
        setAlarmOn(true);
        if (!muted && alarmRef.current) alarmRef.current.play();
        setAlerts(prev => [
          ...prev,
          { timestamp: new Date(), status: 'unread', type: 'Fire Detected' },
        ]);
      }
    } else {
      setAlarmOn(false);
    }
  };

  useEffect(() => {
    const interval = setInterval(checkForFire, 500); // check twice per second
    return () => clearInterval(interval);
  });

  // Disconnect camera
  const disconnectCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      if (videoRef.current) videoRef.current.srcObject = null;
      setAlarmOn(false);
    }
  };

  // Reconnect camera
  const reconnectCamera = () => {
    if (!stream) {
      initCamera();
    }
  };

  // Toggle alert read/unread
  const toggleRead = index => {
    setAlerts(prev =>
      prev.map((alert, i) =>
        i === index ? { ...alert, status: alert.status === 'unread' ? 'read' : 'unread' } : alert
      )
    );
  };

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h1>Fire Detection</h1>
      <video
        ref={videoRef}
        width="640"
        height="480"
        autoPlay
        style={{ border: '2px solid #d32f2f', borderRadius: '8px', marginTop: '20px' }}
      />

      <audio ref={alarmRef} src={`${process.env.PUBLIC_URL}/alarm.mp3`} />

      {alarmOn && (
        <div style={{ marginTop: '20px', color: '#d32f2f', fontWeight: '700', fontSize: '1.5rem' }}>
          🔥 Fire Detected! 🔥
        </div>
      )}

      <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
        <button
          onClick={() => {
            setMuted(!muted);
            if (!muted) {
              // If muting now, stop alarm immediately
              if (alarmRef.current) {
                alarmRef.current.pause();
                alarmRef.current.currentTime = 0;
              }
            } else {
              // If unmuting, play alarm immediately if fire is detected
              if (alarmOn && alarmRef.current) alarmRef.current.play();
            }
          }}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: muted ? '#555' : '#d32f2f',
            color: 'white',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          {muted ? 'Unmute Alarm' : 'Mute Alarm'}
        </button>

        <button
          onClick={disconnectCamera}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: '#777',
            color: 'white',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          Disconnect Camera
        </button>

        <button
          onClick={reconnectCamera}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: '#2e7d32',
            color: 'white',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          Reconnect Camera
        </button>
      </div>

      <div style={{ marginTop: '30px', textAlign: 'left', maxWidth: '640px', marginLeft: 'auto', marginRight: 'auto' }}>
        <h2>Live Fire Alerts ({alerts.length})</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {alerts.map((alert, index) => (
            <li
              key={index}
              style={{
                padding: '8px',
                borderBottom: '1px solid #ccc',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: alert.status === 'unread' ? '#fff5f5' : '#f2fff6',
                borderLeft: alert.status === 'unread' ? '6px solid #d32f2f' : '6px solid #2e7d32',
                borderRadius: '4px',
                marginBottom: '6px',
              }}
            >
              <span>
                {alert.type} at {alert.timestamp.toLocaleTimeString()}
              </span>
              <button
                onClick={() => toggleRead(index)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '4px',
                  border: 'none',
                  backgroundColor: alert.status === 'unread' ? '#d32f2f' : '#2e7d32',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: '600',
                }}
              >
                Mark as {alert.status === 'unread' ? 'Read' : 'Unread'}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default FireDetection;
