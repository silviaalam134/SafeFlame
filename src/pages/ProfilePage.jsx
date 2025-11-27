import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate('/login'); // redirect if not logged in
    }
  }, [navigate]);

  if (!user) return null;

  return (
    <div style={{ padding: '40px', maxWidth: '500px', margin: '0 auto', textAlign: 'center' }}>
      <h2>{user.name}'s Profile</h2>
      <p><strong>Email:</strong> {user.email}</p>
      <p><strong>Phone:</strong> {user.phone}</p>
      <p><strong>Address:</strong> {user.address}</p>
      <p><strong>Account Created:</strong> {new Date(user.createdAt).toLocaleString()}</p>
      <button onClick={() => navigate('/')} style={{ marginTop: '20px', padding: '10px 20px' }}>Back to Home</button>
    </div>
  );
};

export default ProfilePage;
