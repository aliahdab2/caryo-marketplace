# Responsive Design System Documentation

This document provides an overview of the responsive design system implemented in the Caryo Marketplace frontend application.

## Responsive Breakpoints

The application uses the following breakpoints:

```
'xxs': '320px',  // Extremely small devices
'xs': '375px',   // Small phones
'sm': '640px',   // Large phones, small tablets
'md': '768px',   // Tablets
'lg': '1024px',  // Small laptops
'xl': '1280px',  // Large laptops, desktops
'2xl': '1536px', // Large desktops
```

## Responsive Components

### ResponsiveContainer

A wrapper component that provides consistent horizontal padding and maximum width constraints based on the screen size.

**Usage:**
```jsx
<ResponsiveContainer>
  <YourContent />
</ResponsiveContainer>
```

**Props:**
- `className`: Additional classes to apply
- `as`: Element type to render (default: 'div')
- `fluid`: Whether the container should be full-width (default: false)

### Visibility Components

Components that conditionally render content based on screen size:

- `MobileOnly`: Content only shown on mobile screens
- `TabletOnly`: Content only shown on tablet screens
- `DesktopOnly`: Content only shown on desktop screens
- `NotOnMobile`: Content shown on tablet and desktop screens
- `NotOnDesktop`: Content shown on mobile and tablet screens

**Usage:**
```jsx
<MobileOnly>
  <MobileNavigation />
</MobileOnly>

<NotOnMobile>
  <DesktopNavigation />
</NotOnMobile>
```

### ResponsiveGrid

A flexible grid system that adapts columns and gaps based on screen size.

**Usage:**
```jsx
<ResponsiveGrid
  cols={{ default: 1, xs: 2, md: 3, lg: 4 }}
  gap={{ default: 4, md: 6 }}
>
  {items.map(item => <ItemCard key={item.id} item={item} />)}
</ResponsiveGrid>
```

**Props:**
- `cols`: Number of columns at different breakpoints
- `gap`: Gap size at different breakpoints
- `className`: Additional classes to apply

### ResponsiveFlex

A flexible container with responsive direction control.

**Usage:**
```jsx
<ResponsiveFlex 
  direction={{ default: 'col', md: 'row' }}
  itemsCenter={true}
>
  <LeftContent />
  <RightContent />
</ResponsiveFlex>
```

**Props:**
- `direction`: Flex direction at different breakpoints
- `wrap`: Whether items should wrap
- `gap`: Gap between items
- `itemsCenter`: Vertically align items
- `justifyCenter`: Horizontally center items
- `justifyBetween`: Space items evenly

### ResponsiveText & ResponsiveHeading

Typography components that adjust font sizes based on screen size.

**Usage:**
```jsx
<ResponsiveHeading level={1} size="3xl">
  Page Title
</ResponsiveHeading>

<ResponsiveText size="lg" weight="medium">
  This is responsive text that adjusts based on screen size.
</ResponsiveText>
```

**Props:**
- `size`: Text size (xs, sm, base, lg, xl, 2xl, 3xl, 4xl, 5xl)
- `weight`: Font weight (normal, medium, semibold, bold)
- `color`: Text color class
- `align`: Text alignment (left, center, right)
- `component`: HTML element to render for ResponsiveText
- `level`: Heading level (1-6) for ResponsiveHeading

### ResponsiveImage

An image component that selects different image sources based on screen size and handles loading errors.

**Usage:**
```jsx
<ResponsiveImage
  src={{
    default: "/images/product.jpg",
    mobile: "/images/product-mobile.jpg",
    desktop: "/images/product-desktop.jpg"
  }}
  alt="Product"
  aspectRatio="aspect-video"
  rounded="md"
/>
```

**Props:**
- `src`: Image source (string or object with breakpoint-specific sources)
- `fallbackSrc`: Fallback image if main image fails to load
- `aspectRatio`: Aspect ratio class
- `objectFit`: Image fitting mode (cover, contain, fill)
- `rounded`: Rounded corners (boolean or size)

## Responsive Hooks

### useResponsive

A custom hook that provides responsive screen information.

**Usage:**
```jsx
const { isMobile, isTablet, isDesktop, width, height, breakpoint } = useResponsive();

return isMobile ? <MobileView /> : <DesktopView />;
```

**Returns:**
- `isMobile`: Whether current screen is mobile size
- `isTablet`: Whether current screen is tablet size
- `isDesktop`: Whether current screen is desktop size
- `width`: Current viewport width
- `height`: Current viewport height
- `breakpoint`: Current breakpoint name (xxs, xs, sm, md, lg, xl, 2xl)

## Utility Functions

### responsiveFontSize

Generates responsive font size classes based on specified size.

**Usage:**
```jsx
const textClasses = responsiveFontSize('lg');
```

### responsiveSpacing

Generates responsive spacing classes for padding or margin.

**Usage:**
```jsx
const paddingClasses = responsiveSpacing('p', 'md');
```

## CSS Utilities

Responsive CSS utilities are available in `responsive.css`:

- `.hide-on-mobile`, `.hide-on-tablet`, `.hide-on-desktop`
- `.responsive-text-*` classes
- `.responsive-p-*` and `.responsive-m-*` spacing classes
- `.responsive-container` class

## Best Practices

1. Use the responsive components whenever possible instead of custom media queries
2. Start with mobile-first design and progressively enhance for larger screens
3. Test on various screen sizes regularly during development
4. Use the responsive hooks when you need conditional logic based on screen size
5. Prefer flexbox and grid for layouts over fixed sizing
