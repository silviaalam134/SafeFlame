import React, { useRef, useEffect, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as cocossd from '@tensorflow-models/coco-ssd';
import AlertCard from '../components/AlertCard';

const FireDetection = () => {
  const videoRef = useRef(null);
  const alarmRef = useRef(null);
  const canvasRef = useRef(document.createElement('canvas'));

  const [alarmOn, setAlarmOn] = useState(false);
  const [muted, setMuted] = useState(false);
  const [stream, setStream] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState({ totalAlerts: 0, unreadAlerts: 0, resolvedAlerts: 0 });
  const [model, setModel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detections, setDetections] = useState([]);
  const [firePixelsCount, setFirePixelsCount] = useState(0);

  // Load AI model
  useEffect(() => {
    const loadModel = async () => {
      await tf.ready();
      const loadedModel = await cocossd.load();
      setModel(loadedModel);
      setLoading(false);
    };
    loadModel();
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

  // Color-based fire detection
  const checkForFireWithColor = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let firePixels = 0;

    for (let i = 0; i < frame.data.length; i += 4) {
      const r = frame.data[i], g = frame.data[i + 1], b = frame.data[i + 2];
      if (r > 180 && g < 120 && b < 100 && (r - g) > 80 && (r - b) > 100 && r > (g + b)) {
        firePixels++;
      }
    }

    setFirePixelsCount(firePixels);

    if (firePixels > 50 && !alarmOn) {
      setAlarmOn(true);
      if (!muted && alarmRef.current) alarmRef.current.play().catch(()=>{});
      saveAlertToBackend('Candle Flame (Color Detection)', 'medium');
    } else if (firePixels > 3000 && !alarmOn) {
      setAlarmOn(true);
      if (!muted && alarmRef.current) alarmRef.current.play().catch(()=>{});
      saveAlertToBackend('Large Fire (Color Detection)', 'critical');
    } else if (firePixels < 30 && detections.length === 0) setAlarmOn(false);
  };

  // AI detection
  const checkForFireWithAI = async () => {
    if (!model || !videoRef.current || videoRef.current.readyState !== 4) return;

    const predictions = await model.detect(videoRef.current);
    setDetections(predictions);
    const fireObjects = predictions.filter(p => ['fire','orange','red','bright'].some(c => p.class.toLowerCase().includes(c)));

    if (fireObjects.length > 0 && !alarmOn) {
      const best = fireObjects[0];
      setAlarmOn(true);
      if (!muted && alarmRef.current) alarmRef.current.play().catch(()=>{});
      saveAlertToBackend(`AI Detected: ${best.class}`, 'high');
    } else if (fireObjects.length === 0 && firePixelsCount < 30) setAlarmOn(false);
  };

  // Real-time loop
  useEffect(() => {
    if (loading) return;
    const interval = setInterval(() => { checkForFireWithAI(); checkForFireWithColor(); }, 1000);
    return () => clearInterval(interval);
  }, [model, loading, firePixelsCount]);

  // Camera controls
  const disconnectCamera = () => { if(stream){stream.getTracks().forEach(t=>t.stop()); setStream(null); if(videoRef.current) videoRef.current.srcObject=null; setAlarmOn(false); setDetections([]);} };
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
      <h1>Fire Detection with AI & Color Analysis</h1>
      {loading && <div>🔄 Loading AI Model...</div>}
      <div style={{position:'relative', display:'inline-block'}}>
        <video ref={videoRef} width="640" height="480" autoPlay muted style={{border:'2px solid #d32f2f', borderRadius:'8px', marginTop:'20px'}}/>
        {detections.map((d,i)=>(
          <div key={i} style={{position:'absolute', left:d.bbox[0], top:d.bbox[1], width:d.bbox[2], height:d.bbox[3], border:'2px solid red', backgroundColor:'rgba(255,0,0,0.1)', color:'white', fontSize:'12px', fontWeight:'bold', pointerEvents:'none'}}>
            {d.class} ({Math.round(d.score*100)}%)
          </div>
        ))}
      </div>
      <audio ref={alarmRef} src={`${process.env.PUBLIC_URL}/alarm.mp3`} loop/>
      <div style={{ marginTop:'15px', padding:'10px', backgroundColor:'#f5f5f5', borderRadius:'8px' }}>
        🔍 Fire Pixels: {firePixelsCount} | AI Objects: {detections.length}
      </div>
      {alarmOn && <div style={{marginTop:'20px', color:'#d32f2f', fontWeight:'700', fontSize:'1.5rem', padding:'10px', backgroundColor:'#fff5f5', borderRadius:'8px'}}>🔥 Fire Detected! 🔥</div>}
      <div style={{marginTop:'20px', display:'flex', justifyContent:'center', gap:'10px', flexWrap:'wrap'}}>
        <button onClick={()=>{setMuted(!muted); if(!muted && alarmRef.current){alarmRef.current.pause(); alarmRef.current.currentTime=0;}}} style={{padding:'10px 20px', borderRadius:'8px', border:'none', backgroundColor:muted?'#555':'#d32f2f', color:'white', fontWeight:'600', cursor:'pointer'}}>{muted?'🔊 Unmute Alarm':'🔇 Mute Alarm'}</button>
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
