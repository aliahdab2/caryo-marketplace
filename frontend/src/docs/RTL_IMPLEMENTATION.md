# RTL (Right-to-Left) Implementation Guide

## Overview

This document outlines the comprehensive RTL implementation for the Caryo marketplace, providing support for Arabic and other RTL languages.

## Architecture

### Core Hook: `useRTL`

The `useRTL` hook is the foundation of our RTL implementation, providing:

- **Performance Optimized**: Uses `useCallback` and `useMemo` for optimal re-rendering
- **Comprehensive Utilities**: Covers all common RTL scenarios
- **Type Safe**: Full TypeScript support with proper typing
- **Backward Compatible**: Maintains legacy API while providing new optimized methods

```tsx
import { useRTL } from '@/hooks/useRTL';

function MyComponent() {
  const { isRTL, dir, textAlign, marginStart, getInlineStyles } = useRTL();

  return (
    <div dir={dir} className={textAlign} style={getInlineStyles()}>
      <span className={marginStart('2')}>Content</span>
    </div>
  );
}
```

### RTL Container Component

For simpler usage, use the `RTLContainer` component:

```tsx
import RTLContainer from '@/components/ui/RTLContainer';

function MyComponent() {
  return (
    <RTLContainer className="p-4">
      <h1>Automatically RTL-aware content</h1>
    </RTLContainer>
  );
}
```

## Implementation Patterns

### 1. Basic Text Alignment

```tsx
const { textAlign, dir } = useRTL();

return (
  <div dir={dir} className={textAlign}>
    <h1>Title</h1>
    <p>Description</p>
  </div>
);
```

### 2. Flex Layouts

```tsx
const { flexDirection, spaceX } = useRTL();

return (
  <div className={`flex ${flexDirection} ${spaceX('4')}`}>
    <Icon />
    <Text />
  </div>
);
```

### 3. Margins and Padding

```tsx
const { marginStart, marginEnd, paddingStart } = useRTL();

return (
  <div className={`${marginStart('4')} ${paddingStart('2')}`}>
    <span className={marginEnd('2')}>Content</span>
  </div>
);
```

### 4. Complex Inline Styles

```tsx
const { getInlineStyles } = useRTL();

return (
  <div style={getInlineStyles()}>
    <span>Properly aligned text</span>
  </div>
);
```

## Supported Languages

Currently supported RTL languages:
- Arabic (`ar`)
- Hebrew (`he`)
- Persian/Farsi (`fa`)
- Urdu (`ur`)

To add more languages, update the `RTL_LANGUAGES` set in `useRTL.ts`.

## Best Practices

### 1. Use Semantic Utilities

Instead of hardcoding `ml-4` or `mr-4`, use semantic utilities:

```tsx
// ❌ Bad
<div className="ml-4"> // Always left margin

// ✅ Good
<div className={marginStart('4')}> // Contextual margin
```

### 2. Combine Tailwind with Inline Styles

For complex scenarios, combine both approaches:

```tsx
const { textAlign, getInlineStyles } = useRTL();

return (
  <div className={`p-4 ${textAlign}`} style={getInlineStyles()}>
    Content
  </div>
);
```

### 3. Use RTLContainer for Simple Cases

```tsx
// ❌ Verbose
const { dir, textAlign, getInlineStyles } = useRTL();
return (
  <div dir={dir} className={textAlign} style={getInlineStyles()}>
    Content
  </div>
);

// ✅ Simple
return (
  <RTLContainer>
    Content
  </RTLContainer>
);
```

### 4. Handle Icons and Arrows

```tsx
const { getArrowDirection } = useRTL();

return (
  <svg>
    <path d={getArrowDirection('right')} />
  </svg>
);
```

## Testing RTL Implementation

### Manual Testing

1. Switch language to Arabic in the app
2. Verify text alignment (should be right-aligned)
3. Check icon positioning (should be on appropriate side)
4. Test flex layouts (should reverse properly)
5. Verify spacing (margins should be contextual)

### Automated Testing

```tsx
import { render } from '@testing-library/react';
import { useRTL } from '@/hooks/useRTL';

// Mock Arabic language
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: { language: 'ar' }
  })
}));

test('RTL utilities work correctly', () => {
  const TestComponent = () => {
    const { isRTL, textAlign, marginStart } = useRTL();

    return (
      <div data-testid="container" className={textAlign}>
        <span data-testid="element" className={marginStart('4')}>
          Test
        </span>
      </div>
    );
  };

  const { getByTestId } = render(<TestComponent />);

  expect(getByTestId('container')).toHaveClass('text-right');
  expect(getByTestId('element')).toHaveClass('mr-4');
});
```

## Migration Guide

### From Old Implementation

If you have existing RTL code, here's how to migrate:

```tsx
// ❌ Old way
const isRTL = i18n.language === 'ar';
const textAlign = isRTL ? 'text-right' : 'text-left';
const marginClass = isRTL ? 'mr-4' : 'ml-4';

// ✅ New way
const { textAlign, marginStart } = useRTL();
const marginClass = marginStart('4');
```

### Performance Considerations

The new implementation is optimized for performance:

- Uses `Set` for language lookup (O(1) vs O(n))
- Memoizes expensive calculations
- Provides stable function references with `useCallback`
- Reduces re-renders with proper dependency arrays

## Troubleshooting

### Common Issues

1. **Text not aligning properly**
   - Ensure you're using `dir` attribute
   - Check if parent containers have conflicting styles
   - Use `getInlineStyles()` for complex cases

2. **Icons in wrong position**
   - Use `flexDirection` for flex layouts
   - Use `marginStart`/`marginEnd` instead of fixed margins
   - Check if you need `getArrowDirection` for arrow icons

3. **Spacing issues**
   - Use `spaceX` utility for flex spacing
   - Ensure proper `dir` attribute on containers
   - Check for conflicting CSS that might override RTL styles

### Debug Mode

Enable RTL debugging by adding this to your component:

```tsx
const rtlDebug = useRTL();
console.log('RTL Debug:', rtlDebug);
```

## Future Enhancements

Planned improvements:
- CSS-in-JS integration
- Automatic RTL detection based on content
- Enhanced debugging tools
- Performance monitoring
- Additional language support

## Contributing

When adding new RTL features:

1. Update the `useRTL` hook if needed
2. Add comprehensive tests
3. Update this documentation
4. Ensure backward compatibility
5. Test with multiple RTL languages

## Resources

- [MDN: CSS Logical Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Logical_Properties)
- [W3C: CSS Writing Modes](https://www.w3.org/TR/css-writing-modes-4/)
- [Tailwind CSS: RTL Support](https://tailwindcss.com/docs/hover-focus-and-other-states#rtl-support)
