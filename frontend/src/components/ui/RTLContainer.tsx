import React from 'react';
import { useRTL } from '@/hooks/useRTL';

interface RTLContainerProps {
  children: React.ReactNode;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
  style?: React.CSSProperties;
  [key: string]: unknown;
}

/**
 * RTL-aware container component that automatically applies proper direction and text alignment
 * 
 * @example
 * ```tsx
 * <RTLContainer className="p-4">
 *   <h1>This text will be properly aligned for RTL/LTR</h1>
 * </RTLContainer>
 * 
 * <RTLContainer as="section" className="bg-gray-100">
 *   <p>Content with proper RTL support</p>
 * </RTLContainer>
 * ```
 */
export function RTLContainer({ 
  children, 
  className = '', 
  as: Component = 'div',
  style = {},
  ...props 
}: RTLContainerProps) {
  const { dir, getInlineStyles } = useRTL();
  
  const combinedStyles = {
    ...getInlineStyles(),
    ...style,
  };
  
  return (
    <Component 
      dir={dir} 
      className={className} 
      style={combinedStyles}
      {...props}
    >
      {children}
    </Component>
  );
}

export default RTLContainer;
