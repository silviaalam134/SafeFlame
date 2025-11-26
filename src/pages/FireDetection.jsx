import React, { useRef, useEffect, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as cocossd from '@tensorflow-models/coco-ssd';

const FireDetection = () => {
  const videoRef = useRef(null);
  const alarmRef = useRef(null);
  const [alarmOn, setAlarmOn] = useState(false);
  const [muted, setMuted] = useState(false);
  const [stream, setStream] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [model, setModel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detections, setDetections] = useState([]);
  const [firePixelsCount, setFirePixelsCount] = useState(0);

  // Canvas for color-based detection
  const canvasRef = useRef(document.createElement('canvas'));

  // Load TensorFlow.js model
  useEffect(() => {
    const loadModel = async () => {
      try {
        console.log('🔄 Loading AI Model...');
        await tf.ready();
        const loadedModel = await cocossd.load();
        setModel(loadedModel);
        setLoading(false);
        console.log('✅ AI Model Loaded Successfully');
      } catch (error) {
        console.error('❌ Model loading failed:', error);
        setLoading(false);
      }
    };
    loadModel();
  }, []);

  // Initialize camera
  const initCamera = async () => {
    if (navigator.mediaDevices?.getUserMedia) {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 640, height: 480 } 
        });
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

  // ✅ Color-based Fire Detection (Candle-এর জন্য)
  const checkForFireWithColor = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const frame = context.getImageData(0, 0, canvas.width, canvas.height);
    let firePixels = 0;

    for (let i = 0; i < frame.data.length; i += 4) {
      const r = frame.data[i];
      const g = frame.data[i + 1];
      const b = frame.data[i + 2];

      // Advanced Candle Flame Detection
      const isCandleFlame = (
        r > 180 &&           // High red
        g < 120 &&           // Low green  
        b < 100 &&           // Very low blue
        (r - g) > 80 &&      // Red significantly higher than green
        (r - b) > 100 &&     // Red much higher than blue
        r > (g + b)          // Red dominates
      );

      if (isCandleFlame) {
        firePixels++;
      }
    }

    setFirePixelsCount(firePixels);

    // ✅ Dual Threshold System
    if (firePixels > 50 && !alarmOn) {   // Candle detection (50 pixels)
      setAlarmOn(true);
      if (!muted && alarmRef.current) {
        alarmRef.current.play().catch(e => console.log('Audio play failed:', e));
      }
      
      saveAlertToBackend('Candle Flame (Color Detection)', firePixels / 100);
      
      setAlerts(prev => [
        ...prev,
        { 
          timestamp: new Date(), 
          status: 'unread', 
          type: '🕯️ Candle Flame Detected',
          confidence: Math.min(Math.round((firePixels / 200) * 100), 95)
        },
      ]);
      
      console.log('🎯 Candle Detected! Fire Pixels:', firePixels);
    } 
    else if (firePixels > 3000 && !alarmOn) {  // Large fire detection (3000 pixels)
      setAlarmOn(true);
      if (!muted && alarmRef.current) {
        alarmRef.current.play().catch(e => console.log('Audio play failed:', e));
      }
      
      saveAlertToBackend('Large Fire (Color Detection)', firePixels / 5000);
      
      setAlerts(prev => [
        ...prev,
        { 
          timestamp: new Date(), 
          status: 'unread', 
          type: '🔥 Large Fire Detected',
          confidence: Math.min(Math.round((firePixels / 5000) * 100), 99)
        },
      ]);
      
      console.log('🚨 Large Fire Detected! Fire Pixels:', firePixels);
    }
    else if (firePixels < 30 && detections.length === 0) {
      // Only turn off alarm if no AI detections either
      setAlarmOn(false);
    }
  };

  // AI-powered Fire Detection
  const checkForFireWithAI = async () => {
    if (!model || !videoRef.current || videoRef.current.readyState !== 4) return;

    try {
      const predictions = await model.detect(videoRef.current);
      setDetections(predictions);
      
      // Check for fire-related objects
      const fireObjects = predictions.filter(pred => {
        const className = pred.class.toLowerCase();
        return (
          className.includes('fire') ||
          className.includes('orange') ||
          className.includes('red') ||
          className.includes('bright') ||
          (pred.class === 'teddy bear' && pred.score > 0.8) // Test object
        );
      });

      if (fireObjects.length > 0 && !alarmOn) {
        const bestDetection = fireObjects[0];
        setAlarmOn(true);
        if (!muted && alarmRef.current) {
          alarmRef.current.play().catch(e => console.log('Audio play failed:', e));
        }
        
        // Save to backend
        saveAlertToBackend(bestDetection.class, bestDetection.score);
        
        // Update local alerts
        setAlerts(prev => [
          ...prev,
          { 
            timestamp: new Date(), 
            status: 'unread', 
            type: `🤖 AI Detected: ${bestDetection.class}`,
            confidence: Math.round(bestDetection.score * 100)
          },
        ]);
      }
      
      // Turn off alarm if no fire objects detected
      if (fireObjects.length === 0 && firePixelsCount < 30) {
        setAlarmOn(false);
      }
    } catch (error) {
      console.error('AI Detection error:', error);
    }
  };

  // Real-time detection - Both AI and Color
  useEffect(() => {
    if (loading) return;

    const interval = setInterval(() => {
      checkForFireWithAI();    // AI Detection
      checkForFireWithColor(); // Color Detection
    }, 1000);

    return () => clearInterval(interval);
  }, [model, loading]);

  // Save alert to backend
  const saveAlertToBackend = async (detectedObject, confidence) => {
    try {
      const userName = localStorage.getItem('userName') || 'SafeFlame User';
      await fetch('http://localhost:5000/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: `Detection: ${detectedObject}`,
          status: 'unread',
          location: 'Live Camera Feed',
          severity: 'critical',
          detectedBy: userName,
          confidence: Math.round(confidence * 100)
        })
      });
      console.log('✅ Alert saved to database');
    } catch (err) {
      console.error('Failed to save alert:', err);
    }
  };

  // Disconnect camera
  const disconnectCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      if (videoRef.current) videoRef.current.srcObject = null;
      setAlarmOn(false);
      setDetections([]);
    }
  };

  // Reconnect camera
  const reconnectCamera = () => {
    if (!stream) {
      initCamera();
    }
  };

  // Toggle alert read status
  const toggleRead = (index) => {
    setAlerts(prev => 
      prev.map((alert, i) => 
        i === index ? { ...alert, status: alert.status === 'unread' ? 'read' : 'unread' } : alert
      )
    );
  };

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h1>Fire Detection with AI & Color Analysis</h1>
      
      {loading && (
        <div style={{margin: '20px', color: '#d32f2f', fontSize: '1.2rem'}}>
          🔄 Loading AI Model... Please wait
        </div>
      )}

      <div style={{position: 'relative', display: 'inline-block'}}>
        <video
          ref={videoRef}
          width="640"
          height="480"
          autoPlay
          muted
          style={{ border: '2px solid #d32f2f', borderRadius: '8px', marginTop: '20px' }}
        />
        
        {/* AI Detections Display */}
        {detections.map((detection, index) => (
          <div 
            key={index} 
            style={{
              position: 'absolute',
              left: `${detection.bbox[0]}px`,
              top: `${detection.bbox[1]}px`,
              width: `${detection.bbox[2]}px`,
              height: `${detection.bbox[3]}px`,
              border: '2px solid #ff0000',
              backgroundColor: 'rgba(255,0,0,0.1)',
              color: 'white',
              fontSize: '12px',
              fontWeight: 'bold',
              pointerEvents: 'none'
            }}
          >
            {detection.class} ({Math.round(detection.score * 100)}%)
          </div>
        ))}
      </div>

      <audio ref={alarmRef} src={`${process.env.PUBLIC_URL}/alarm.mp3`} loop />

      {/* Fire Detection Status */}
      <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        <div style={{ fontSize: '0.9rem', color: '#666' }}>
          🔍 Fire Pixels: <strong>{firePixelsCount}</strong> | 
          Thresholds: <strong>50</strong> (Candle) / <strong>3000</strong> (Large Fire) |
          AI Objects: <strong>{detections.length}</strong>
        </div>
      </div>

      {alarmOn && (
        <div style={{ 
          marginTop: '20px', 
          color: '#d32f2f', 
          fontWeight: '700', 
          fontSize: '1.5rem',
          padding: '10px',
          backgroundColor: '#fff5f5',
          borderRadius: '8px'
        }}>
          🔥 Fire Detected! 🔥
        </div>
      )}

      {/* Detection Info */}
      <div style={{marginTop: '10px', fontSize: '0.9rem', color: '#666'}}>
        {detections.length > 0 && `AI detecting ${detections.length} object(s) • `}
        Dual Detection: AI + Color Analysis
      </div>

      {/* Control Buttons */}
      <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <button
          onClick={() => {
            setMuted(!muted);
            if (!muted && alarmRef.current) {
              alarmRef.current.pause();
              alarmRef.current.currentTime = 0;
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
          {muted ? '🔊 Unmute Alarm' : '🔇 Mute Alarm'}
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
          📷 Disconnect Camera
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
          🔄 Reconnect Camera
        </button>
      </div>

      {/* Alerts list */}
      <div style={{ marginTop: '30px', textAlign: 'left', maxWidth: '640px', marginLeft: 'auto', marginRight: 'auto' }}>
        <h2>Fire Alerts ({alerts.length})</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {alerts.map((alert, index) => (
            <li
              key={index}
              style={{
                padding: '12px',
                borderBottom: '1px solid #ccc',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: alert.status === 'unread' ? '#fff5f5' : '#f8f9fa',
                borderLeft: alert.status === 'unread' ? '6px solid #d32f2f' : '6px solid #6c757d',
                borderRadius: '4px',
                marginBottom: '8px',
                flexWrap: 'wrap'
              }}
            >
              <div style={{flex: 1}}>
                <div style={{fontWeight: 'bold', fontSize: '0.95rem'}}>{alert.type}</div>
                <div style={{fontSize: '0.8rem', color: '#666', marginTop: '4px'}}>
                  {alert.timestamp.toLocaleTimeString()} 
                  {alert.confidence && ` • Confidence: ${alert.confidence}%`}
                </div>
              </div>
              <button
                onClick={() => toggleRead(index)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '4px',
                  border: 'none',
                  backgroundColor: alert.status === 'unread' ? '#d32f2f' : '#6c757d',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.8rem',
                  marginLeft: '10px'
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