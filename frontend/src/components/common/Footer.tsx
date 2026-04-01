import React from 'react';

const Footer = () => {
  return (
    <footer className="py-4 px-6 text-center text-xs text-surface-400 border-t border-surface-100">
      © {new Date().getFullYear()} CrediWise. All rights reserved.
    </footer>
  );
};

export default Footer;
