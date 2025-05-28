#!/bin/bash

# Install required dependencies for CarMediaGallery component

echo "Installing dependencies for CarMediaGallery component..."

# Install @headlessui/react for accessible modal dialog
npm install @headlessui/react

# Install @heroicons/react for icons
npm install @heroicons/react

# Install react-player for better video support (optional but recommended)
npm install react-player

echo "Dependencies installed successfully!"
echo ""
echo "CarMediaGallery component is now ready to use."
echo "Remember to import it in your components as: import { CarMediaGallery } from '@/components/CarMediaGallery';"
