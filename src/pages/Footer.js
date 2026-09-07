// components/Footer.js
import React from "react";
import { Link, useLocation } from 'react-router-dom';
import './Footer.css';


const Footer = () => {
  const { pathname } = useLocation();
  const isHomepage = pathname === '/';

  return (
    <footer className={`homepage__footer ${isHomepage ? 'homepage__footer--landing' : ''}`}>
      {isHomepage ? (
        <div className="homepage__footer-inner">
          <div className="homepage__footer-brand">
            <span className="homepage__footer-mark" aria-hidden="true">●</span>
            <p>SafeFlame</p>
            <small>Building safer homes, workplaces, and communities through fire awareness.</small>
            <a href="mailto:support@safeflame.com">support@safeflame.com</a>
            <a href="tel:+880123456789">+880 123 456 789</a>
          </div>
          <div className="homepage__footer-column">
            <h2>Explore</h2>
            <Link to="/">Home</Link>
            <Link to="/fire-detection">Fire Detection</Link>
            <Link to="/first-aid">First Aid</Link>
            <Link to="/#about">About Us</Link>
          </div>
          <div className="homepage__footer-column">
            <h2>Get involved</h2>
            <Link to="/register">Create an account</Link>
            <Link to="/login">Sign in</Link>
            <Link to="/#contact">Contact Us</Link>
          </div>
          <div className="homepage__footer-newsletter">
            <h2>Stay safe, stay informed</h2>
            <p>Practical fire-safety tips and updates delivered to your inbox.</p>
            <div className="homepage__footer-subscribe">
              <span>Enter your email</span>
              <button type="button">Subscribe</button>
            </div>
          </div>
          <div className="homepage__footer-bottom">
            <span>&copy; {new Date().getFullYear()} SafeFlame. All rights reserved.</span>
            <span><a href="#privacy">Privacy Policy</a><a href="#terms">Terms of Service</a></span>
          </div>
        </div>
      ) : (
        <>&copy; {new Date().getFullYear()} SafeFlame. All rights reserved.</>
      )}
    </footer>
  );
};

export default Footer;
