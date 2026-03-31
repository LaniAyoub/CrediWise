import React from 'react';
import './Header.css';

const Header = () => {
  return (
    <header className="app-header">
      <div className="header-container">
        <div className="logo-section">
          <img 
            src="/creditwise-logo.svg" 
            alt="CrediWise Logo" 
            className="logo"
          />
        </div>
        <div className="brand-section">
          <h1 className="app-title">
            <span className="title-credi">Credi</span>
            <span className="title-wise">Wise</span>
          </h1>
          <p className="app-tagline">Des décisions de crédit éclairées</p>
        </div>
      </div>
    </header>
  );
};

export default Header;
