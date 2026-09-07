import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Dashboard from './Dashboard';
import { FirstAidAskSection } from './FirstAidChatbot';
import './Homepage.css';

const awarenessTaglines = [
  'সচেতনতা  হোক  অগ্নিকাণ্ড  প্রতিরোধের  প্রথম  পদক্ষেপ।',
  'অগ্নিকাণ্ড  প্রতিরোধে  আজকের  সচেতনতাই  আগামীর  সুরক্ষা।',
  'একটু  সচেতনতা,  একটি  জীবন  রক্ষার  সম্ভাবনা।',
  'নিরাপত্তার  শুরু হোক আগুন  সম্পর্কে  সচেতনতা  থেকে।',
  'অসতর্কতার  আগুন  নয়,  সচেতনতার  আলো  ছড়িয়ে  দিন।',
  'সতর্ক  থাকুন,  অগ্নিকাণ্ডের  ঝুঁকি এড়িয়ে  চলুন।',
  'একটি  নিরাপদ ভবিষ্যতের  জন্য  আগুন  সম্পর্কে  সচেতন  হোন।',
];

const Homepage = () => {
  const [stats, setStats] = useState({
    totalAlerts: 0,
    unreadAlerts: 0,
    resolvedAlerts: 0,
  });
  const [activeTagline, setActiveTagline] = useState(0);

  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchStats = async () => {
      if (!token) return;
      try {
        const res = await fetch('http://localhost:5000/api/alerts/stats', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch stats');
        const data = await res.json();
        setStats({
          totalAlerts: data.totalAlerts || 0,
          unreadAlerts: data.unreadAlerts || 0,
          resolvedAlerts: data.resolvedAlerts || 0,
        });
      } catch (err) {
        console.error(err);
      }
    };
    fetchStats();
  }, [token]);

  useEffect(() => {
    const taglineInterval = setInterval(() => {
      setActiveTagline((currentTagline) => (currentTagline + 1) % awarenessTaglines.length);
    }, 5000);

    return () => clearInterval(taglineInterval);
  }, []);

  return (
    <div className="homepage">
      {/* Hero Section */}
      <section
        className="homepage__hero"
        id="home"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(8, 16, 18, 0.2), rgba(8, 12, 13, 0.86)), url("${process.env.PUBLIC_URL}/fire-background.jpg")`,
        }}
      >
        <div className="homepage__hero-content">
          <p className="homepage__eyebrow">FIRE SAFETY AWARENESS</p>
          <h1>Protect what matters most from fire.</h1>
          <p>Monitor fire alerts in real time and make safer decisions for your home, workplace, and community.</p>
        </div>
        <Link
          to="/fire-detection"
          className="homepage__primary-button"
        >
          Fire Monitoring
        </Link>
      </section>

      {/* Awareness and First Aid Section */}
      <section className="homepage__awareness-tools" aria-label="Fire safety awareness and first aid">
        <div className="homepage__awareness-tools-content">
          <section className="homepage__awareness" aria-label="Fire safety awareness">
            <p key={activeTagline} className="homepage__awareness-tagline" aria-live="polite">
              “
              {awarenessTaglines[activeTagline].split(' ').map((word, wordIndex) => (
                <span className="homepage__awareness-word" key={`${word}-${wordIndex}`}>
                  {word}{wordIndex < awarenessTaglines[activeTagline].split(' ').length - 1 ? ' ' : ''}
                </span>
              ))}
              ”
            </p>
          </section>

          <div className="homepage__first-aid">
            <FirstAidAskSection />
          </div>
        </div>

        <div className="homepage__awareness-video">
          <video autoPlay muted loop playsInline preload="metadata" aria-label="Fire safety awareness video">
            <source src={`${process.env.PUBLIC_URL}/700_F_1650400912_bCczJ6XZZz7cf9LPe1urgVGFDG1aRZu5_ST.mp4`} type="video/mp4" />
          </video>
        </div>
      </section>

      {/* Alerts Section */}
      <section className="homepage__alerts" id="alerts">
        <p className="homepage__eyebrow">STAY INFORMED</p>
        <h2>Fire alerts at a glance</h2>
        {token ? <Dashboard /> : <p>Please login to see your previous fire alerts history.</p>}
      </section>

      {/* Statistics Section */}
      <section className="homepage__stats" id="stats">
        <p className="homepage__eyebrow">WHY PREVENTION MATTERS</p>
        <h2>Safety in numbers</h2>
        <p className="homepage__section-intro">Every alert is a chance to respond earlier, prepare better, and protect more people.</p>
        {token ? (
          <div className="homepage__stats-grid">
            <div className="homepage__stat-card">
              <h3>Total Alerts</h3>
              <p>{stats.totalAlerts}</p>
            </div>
            <div className="homepage__stat-card">
              <h3>Unread Alerts</h3>
              <p>{stats.unreadAlerts}</p>
            </div>
            <div className="homepage__stat-card">
              <h3>Resolved Alerts</h3>
              <p>{stats.resolvedAlerts}</p>
            </div>
          </div>
        ) : (
          <p>Please login to view your alert statistics.</p>
        )}
      </section>

      {/* About Section */}
      <section className="homepage__about" id="about">
        <p className="homepage__eyebrow">OUR APPROACH</p>
        <h2>Simple tools for safer spaces</h2>
        <p>
          SafeFlame helps you monitor fire hazards instantly with live alerts and updates.
          Stay aware, stay prepared, and act before a small risk becomes an emergency.
        </p>
        <div className="homepage__approach-grid">
          <article className="homepage__approach-card">
            <span className="homepage__approach-icon" aria-hidden="true">◯</span>
            <h3>Prevent</h3>
            <p>Identify and reduce common fire hazards in your home and workplace with practical checklists and simple guidance.</p>
          </article>
          <article className="homepage__approach-card">
            <span className="homepage__approach-icon" aria-hidden="true">⌂</span>
            <h3>Prepare</h3>
            <p>Build an escape plan, test your smoke alarms, and keep the right safety equipment ready for the moment you need it.</p>
          </article>
          <article className="homepage__approach-card">
            <span className="homepage__approach-icon" aria-hidden="true">SOS</span>
            <h3>Respond</h3>
            <p>Know exactly what to do when a fire starts, from raising the alarm to evacuating everyone safely.</p>
          </article>
        </div>
      </section>

      {/* Contact Section */}
      <section className="homepage__contact" id="contact">
        <p className="homepage__eyebrow">EMERGENCY SUPPORT</p>
        <h2>Fire Services &amp; Emergency Contacts</h2>
        <p className="homepage__contact-warning">In case of immediate danger, call the appropriate emergency service immediately.</p>
        <div className="homepage__emergency-grid">
          <article className="homepage__emergency-card homepage__emergency-card--primary">
            <span className="homepage__emergency-icon" aria-hidden="true">🚒</span>
            <div>
              <h3>Fire Service</h3>
              <p>Call for a fire, smoke, rescue, or immediate fire-related danger.</p>
              <a className="homepage__call-button" href="tel:102">Call Now <strong>102</strong></a>
            </div>
          </article>
          <article className="homepage__emergency-card">
            <span className="homepage__emergency-icon" aria-hidden="true">🚑</span>
            <div>
              <h3>Emergency Ambulance</h3>
              <p>Call when someone is injured and needs urgent medical assistance.</p>
              <a className="homepage__call-button" href="tel:999">Call Now <strong>999</strong></a>
            </div>
          </article>
          <article className="homepage__emergency-card">
            <span className="homepage__emergency-icon" aria-hidden="true">👮</span>
            <div>
              <h3>Police Emergency</h3>
              <p>Call for immediate danger, public safety threats, or emergency support.</p>
              <a className="homepage__call-button" href="tel:999">Call Now <strong>999</strong></a>
            </div>
          </article>
        </div>
        <p className="homepage__contact-details">Email: <a href="mailto:support@safeflame.com">support@safeflame.com</a> | Phone: <a href="tel:+880123456789">+880 123 456 789</a></p>
        <div className="homepage__social">
          <a href="#!" onClick={(e) => e.preventDefault()}>Facebook</a>
          <a href="#!" onClick={(e) => e.preventDefault()}>Twitter</a>
          <a href="#!" onClick={(e) => e.preventDefault()}>LinkedIn</a>
        </div>
      </section>
    </div>
  );
};

export default Homepage;
