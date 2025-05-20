import React from 'react';

// Mock the next/link component
function Link({ href, className, children, ...rest }) {
  return (
    <a href={href} className={className} {...rest}>
      {children}
    </a>
  );
}

// Mock the default export
export default Link;
