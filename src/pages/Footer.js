// components/Footer.js
import React from "react";
import './Footer.css';


const Footer = () => {
  return (
    <footer className="homepage__footer">
      &copy; {new Date().getFullYear()} SafeFlame. All rights reserved.
    </footer>
  );
};

export default Footer;
