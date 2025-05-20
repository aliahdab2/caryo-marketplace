import React from 'react';

// Mock the next/image component
function Image({ src, alt, width, height, className, ...rest }) {
  // Return a simple img tag for testing
  return (
    <img 
      src={src || ''} 
      alt={alt || ''} 
      width={width} 
      height={height}
      className={className}
      {...rest}
    />
  );
}

// Mock the default export
export default Image;
