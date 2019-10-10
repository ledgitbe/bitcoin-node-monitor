import React from 'react';

const Footer = () => {
  return (
    <div>
      <p style={{ textAlign: 'center' }}>
          Bitcoin Node Monitor {process.env.REACT_APP_VERSION}
    </p>
  </div>
  );
}

export default Footer;
