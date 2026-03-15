#!/bin/bash

# Caryo Marketplace - Java 21 Setup Script
# This script ensures Java 21 is properly configured for the project

set -e

echo "🚀 Setting up Java 21 for Caryo Marketplace..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if SDKMAN is installed
if [ ! -d "$HOME/.sdkman" ]; then
    print_warning "SDKMAN not found. Installing SDKMAN..."
    curl -s "https://get.sdkman.io" | bash
    source "$HOME/.sdkman/bin/sdkman-init.sh"
    print_success "SDKMAN installed successfully!"
else
    print_status "SDKMAN found. Initializing..."
    source "$HOME/.sdkman/bin/sdkman-init.sh"
fi

# Check if Java 21 is installed
if ! sdk list java | grep -q "21.0.8-zulu"; then
    print_status "Installing Java 21 (Zulu)..."
    sdk install java 21.0.8-zulu
    print_success "Java 21 installed successfully!"
else
    print_status "Java 21 already installed."
fi

# Set Java 21 as current version
print_status "Activating Java 21..."
sdk use java 21.0.8-zulu

# Verify Java version
JAVA_VERSION=$(java -version 2>&1 | head -n 1)
if echo "$JAVA_VERSION" | grep -q "21.0"; then
    print_success "Java 21 is now active!"
    echo "   Current version: $JAVA_VERSION"
else
    print_error "Failed to activate Java 21. Current version: $JAVA_VERSION"
    exit 1
fi

# Install project Java environment
if [ -f "../.sdkmanrc" ]; then
    print_status "Installing project Java environment..."
    cd ..
    sdk env install
    cd setup
    print_success "Project environment configured!"
fi

# Test backend build
print_status "Testing backend build..."
cd ../backend/caryo-backend
if ./gradlew compileJava --no-daemon -q; then
    print_success "Backend compiles successfully with Java 21!"
else
    print_error "Backend compilation failed. Please check your setup."
    exit 1
fi

cd ../../

echo ""
print_success "🎉 Java 21 setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "   1. Run 'sdk env' when entering the project directory"
echo "   2. Use './gradlew build' in backend/caryo-backend"
echo "   3. Use 'npm run build' in frontend"
echo ""
echo "💡 Pro tip: The .sdkmanrc files will auto-activate Java 21 when you enter project directories!"
