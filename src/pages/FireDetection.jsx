import React, { useRef, useEffect, useState } from 'react';

// Map Roboflow confidence to the severity values accepted by the alert model.
const getSeverity = (confidence) => {
  if (confidence < 0.55) return 'low';
  if (confidence < 0.7) return 'medium';
  if (confidence < 0.85) return 'high';
  return 'critical';
};

const FireDetection = () => {
  const videoRef = useRef(null);
  // Keeps one audio instance across renders and detection cycles.
  const alarmRef = useRef(null);
  const roboflowCanvasRef = useRef(document.createElement('canvas'));
  const lastAlertTimeRef = useRef(0); // Prevent duplicate alerts within 3 seconds
  const roboflowRequestInFlightRef = useRef(false); // Prevent overlapping inference requests
  const fireStartTimeRef = useRef(null); // Timestamp for the current uninterrupted fire episode
  const telegramSentRef = useRef(false); // Prevents repeated Telegram alerts during one episode

  const [alarmOn, setAlarmOn] = useState(false);
  const [stream, setStream] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState({ totalAlerts: 0, unreadAlerts: 0, resolvedAlerts: 0 });
  const [roboflowPredictions, setRoboflowPredictions] = useState([]);

  // Create the alarm once so the short sound can loop independently of React renders.
  useEffect(() => {
    const alarm = new Audio(`${process.env.PUBLIC_URL}/alarm.mp3`);
    alarm.loop = true;
    alarm.preload = 'auto';
    alarmRef.current = alarm;

    return () => {
      alarm.pause();
      alarm.currentTime = 0;
      alarmRef.current = null;
    };
  }, []);

  // Init Camera
  const initCamera = async () => {
    if (navigator.mediaDevices?.getUserMedia) {
      const s = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      setStream(s);
      if (videoRef.current) videoRef.current.srcObject = s;
    }
  };
  useEffect(() => { initCamera(); }, []);

  // Save alert to backend
  const saveAlertToBackend = async (detectedObject, severity = 'high') => {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    // Prevent duplicate alerts within 3 seconds
    const now = Date.now();
    if (now - lastAlertTimeRef.current < 3000) {
      return;
    }
    lastAlertTimeRef.current = now;
    
    try {
      const res = await fetch('http://localhost:5000/api/alerts', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: `Detection: ${detectedObject}`,
          status: 'unread',
          detectedBy: localStorage.getItem('userName') || 'SafeFlame User',
          location: 'Live Camera Feed',
          severity: severity
        })
      });
      if (res.ok) {
        fetchAlerts(); // Refresh alerts with actual DB data
        fetchStats(); // Refresh stats
      }
    } catch (err) {
      console.error('Failed to save alert:', err);
    }
  };

  // Fetch alerts
  const fetchAlerts = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch('http://localhost:5000/api/alerts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setAlerts(data);
    } catch (err) { console.error(err); }
  };

  // Fetch stats
  const fetchStats = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch('http://localhost:5000/api/alerts/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setStats(data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchAlerts(); fetchStats(); }, []);

  // Notify the backend once a fire episode has lasted at least 15 uninterrupted seconds.
  const notifyTelegram = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/alarm/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`Telegram notification failed with status ${response.status}`);
      }
    } catch (error) {
      // Notification failures must not interrupt future Roboflow checks.
      console.error('Failed to send Telegram notification:', error);
    }
  };

  // Capture one camera frame, send it to the backend, and process Roboflow predictions.
  const checkForFireWithRoboflow = async () => {
    const video = videoRef.current;
    if (!video || video.readyState !== 4 || roboflowRequestInFlightRef.current) return;

    const canvas = roboflowCanvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    roboflowRequestInFlightRef.current = true;

    try {
      // Convert the current video frame to JPEG and remove the data URL prefix.
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const base64Image = canvas.toDataURL('image/jpeg').replace(/^data:image\/jpeg;base64,/, '');

      // The backend keeps the Roboflow API key off the client and forwards this JSON payload.
      const response = await fetch('http://localhost:5000/api/detect-fire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image })
      });

      if (!response.ok) {
        throw new Error(`Roboflow request failed with status ${response.status}`);
      }

      const data = await response.json();
      const predictions = Array.isArray(data.predictions) ? data.predictions : [];
      setRoboflowPredictions(predictions);

      // Only a confident fire prediction should activate the alarm and create an alert.
      const firePrediction = predictions.find(
        (prediction) => prediction.class?.toLowerCase() === 'fire' && prediction.confidence > 0.5
      );

      if (firePrediction) {
        // Start the continuous episode clock only on the first fire detection.
        if (fireStartTimeRef.current === null) {
          fireStartTimeRef.current = Date.now();
          telegramSentRef.current = false;
        }

        // Escalate once after 15 seconds, without delaying or blocking detection.
        if (!telegramSentRef.current && Date.now() - fireStartTimeRef.current >= 15000) {
          telegramSentRef.current = true;
          notifyTelegram();
        }

        setAlarmOn(true);
        // Start the alarm only if it is not already playing. Replaying on every
        // detection cycle would restart this short sound and cause glitches.
        if (alarmRef.current && alarmRef.current.paused !== false) {
          alarmRef.current.play().catch(() => {});
        }
        saveAlertToBackend(
          `Roboflow Detected: ${firePrediction.class}`,
          getSeverity(firePrediction.confidence)
        );
      } else {
        // A missed fire detection ends the episode and stops the alarm immediately.
        fireStartTimeRef.current = null;
        telegramSentRef.current = false;
        setAlarmOn(false);
        if (alarmRef.current) {
          alarmRef.current.pause();
          alarmRef.current.currentTime = 0;
        }
      }
    } catch (error) {
      // A failed inference must not stop future 3-second checks.
      console.error('Roboflow fire detection failed:', error);
    } finally {
      roboflowRequestInFlightRef.current = false;
    }
  };

  // Run Roboflow inference every three seconds and clean up on unmount.
  useEffect(() => {
    const interval = setInterval(checkForFireWithRoboflow, 3000);
    return () => {
      clearInterval(interval);
      fireStartTimeRef.current = null;
      telegramSentRef.current = false;
      if (alarmRef.current) {
        alarmRef.current.pause();
        alarmRef.current.currentTime = 0;
      }
    };
  }, []);

  // Camera controls
  const disconnectCamera = () => { if(stream){stream.getTracks().forEach(t=>t.stop()); setStream(null); if(videoRef.current) videoRef.current.srcObject=null; fireStartTimeRef.current = null; telegramSentRef.current = false; if(alarmRef.current){alarmRef.current.pause(); alarmRef.current.currentTime = 0;} setAlarmOn(false); setRoboflowPredictions([]);} };
  const reconnectCamera = () => { if(!stream) initCamera(); };

  // Toggle alert read/unread with backend sync
  const toggleRead = async (alertId, currentStatus) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`http://localhost:5000/api/alerts/${alertId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: currentStatus === 'unread' ? 'read' : 'unread' })
      });
      const updatedAlert = await res.json();
      // Update local state with backend response
      setAlerts(prev => prev.map(a => (a._id === updatedAlert._id ? updatedAlert : a)));
      fetchStats(); // update stats
    } catch (err) {
      console.error('Failed to update alert status:', err);
    }
  };

  return (
    <div style={{ textAlign:'center', padding:'20px'}}>
      <h1>Fire Detection with Roboflow Trained Model</h1>
      <div style={{position:'relative', display:'inline-block'}}>
        <video ref={videoRef} width="640" height="480" autoPlay muted style={{border:'2px solid #d32f2f', borderRadius:'8px', marginTop:'20px'}}/>
      </div>
      <div style={{ marginTop:'15px', padding:'10px', backgroundColor:'#f5f5f5', borderRadius:'8px' }}>
        Roboflow Model Predictions: {roboflowPredictions.length}
      </div>
      {alarmOn && <div style={{marginTop:'20px', color:'#d32f2f', fontWeight:'700', fontSize:'1.5rem', padding:'10px', backgroundColor:'#fff5f5', borderRadius:'8px'}}>🔥 Fire Detected! 🔥</div>}
      <div style={{marginTop:'20px', display:'flex', justifyContent:'center', gap:'10px', flexWrap:'wrap'}}>
        <button onClick={disconnectCamera} style={{padding:'10px 20px', borderRadius:'8px', border:'none', backgroundColor:'#777', color:'white', fontWeight:'600', cursor:'pointer'}}>📷 Disconnect Camera</button>
        <button onClick={reconnectCamera} style={{padding:'10px 20px', borderRadius:'8px', border:'none', backgroundColor:'#2e7d32', color:'white', fontWeight:'600', cursor:'pointer'}}>🔄 Reconnect Camera</button>
      </div>

      <div style={{marginTop:'30px', textAlign:'left', maxWidth:'640px', marginLeft:'auto', marginRight:'auto'}}>
        <h2>Fire Alerts ({alerts.length})</h2>
        <div style={{marginBottom:'10px'}}>
          <p>Total Alerts: {stats.totalAlerts}</p>
          <p>Unread Alerts: {stats.unreadAlerts}</p>
          <p>Resolved Alerts: {stats.resolvedAlerts}</p>
        </div>
        <ul style={{listStyle:'none', padding:0}}>
          {alerts.map((alert)=>(
            <li key={alert._id} style={{padding:'12px', borderBottom:'1px solid #ccc', display:'flex', justifyContent:'space-between', alignItems:'center', backgroundColor:alert.status==='unread'?'#fff5f5':'#f8f9fa', borderLeft: alert.status==='unread'?'6px solid #d32f2f':'6px solid #6c757d', borderRadius:'4px', marginBottom:'8px', flexWrap:'wrap'}}>
              <div style={{flex:1}}>
                <div style={{fontWeight:'bold', fontSize:'0.95rem'}}>{alert.type}</div>
                <div style={{fontSize:'0.8rem', color:'#666', marginTop:'4px'}}>
                  {new Date(alert.createdAt).toLocaleString()} • Severity: {alert.severity}
                </div>
              </div>
              <button onClick={()=>toggleRead(alert._id, alert.status)} style={{padding:'6px 12px', borderRadius:'4px', border:'none', backgroundColor:alert.status==='unread'?'#d32f2f':'#6c757d', color:'white', cursor:'pointer', fontWeight:'600', fontSize:'0.8rem', marginLeft:'10px'}}>
                Mark as {alert.status==='unread'?'Read':'Unread'}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default FireDetection;
