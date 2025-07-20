import React from 'react';

// Mock the next/image component
function Image({ src, alt, width, height, className, unoptimized, fill, ...rest }) {
  // Handle boolean props that need to be strings for DOM
  const domProps = { ...rest };
  
  // Convert boolean unoptimized to string if it exists
  if (unoptimized === true) {
    domProps.unoptimized = 'true';
  } else if (unoptimized === false) {
    domProps.unoptimized = 'false';
  } else if (unoptimized !== undefined) {
    domProps.unoptimized = String(unoptimized);
  }
  
  // Convert boolean fill to string if it exists
  if (fill === true) {
    domProps.fill = 'true';
  } else if (fill === false) {
    domProps.fill = 'false';
  } else if (fill !== undefined) {
    domProps.fill = String(fill);
  }
  
  // Return a simple img tag for testing
  return (
    <img 
      src={src || ''} 
      alt={alt || ''} 
      width={width} 
      height={height}
      className={className}
      {...domProps}
    />
  );
}

// Mock the default export
export default Image;
