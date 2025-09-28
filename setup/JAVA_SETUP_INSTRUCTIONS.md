# Java 21 Setup Instructions for Caryo Marketplace

## 🚀 **Automatic Java 21 Setup (Recommended)**

### **Using SDKMAN (Already Configured)**

The project is configured to automatically use Java 21. Here's how it works:

```bash
# 1. Navigate to project directory
cd /path/to/caryo-marketplace

# 2. Auto-activate Java 21 (if SDKMAN is properly configured)
sdk env

# 3. Verify Java version
java -version
# Should show: openjdk version "21.0.8"
```

### **First-Time Setup**

If this is your first time, run:

```bash
# Install the Java version specified in .sdkmanrc
sdk env install

# Then activate it
sdk env
```

## 🔧 **Manual Java Management Commands**

### **Switch to Java 21**
```bash
# Use Java 21 for current session
sdk use java 21.0.8-zulu

# Set Java 21 as default globally
sdk default java 21.0.8-zulu
```

### **Check Available Java Versions**
```bash
# List installed Java versions
sdk list java | grep installed

# List all available Java versions
sdk list java
```

### **Install Different Java Versions**
```bash
# Install Java 17 (if needed for other projects)
sdk install java 17.0.9-zulu

# Install latest Java 21
sdk install java 21.0.8-zulu
```

## 📁 **Project Structure**

```
caryo-marketplace/
├── .sdkmanrc                    # Root Java 21 config
├── backend/autotrader-backend/
│   ├── .sdkmanrc               # Backend Java 21 config
│   ├── build.gradle            # Java 21 configured
│   └── ...
└── frontend/
    └── ...
```

## 🎯 **For Co-pilot/AI Development**

### **Quick Commands for AI Assistants**

```bash
# Ensure Java 21 is active
export JAVA_HOME=$(/usr/libexec/java_home -v 21)
export PATH=$JAVA_HOME/bin:$PATH

# Or use SDKMAN
sdk use java 21.0.8-zulu

# Verify setup
java -version && echo "✅ Java 21 is active"
```

### **Build Commands**
```bash
# Backend build (requires Java 21)
cd backend/autotrader-backend
./gradlew clean build

# Frontend build
cd frontend
npm run build
```

## 🔍 **Troubleshooting**

### **If Java 21 is not active:**
```bash
# Check current Java
java -version

# Force activate Java 21
sdk use java 21.0.8-zulu

# Or use system java_home
export JAVA_HOME=$(/usr/libexec/java_home -v 21)
```

### **If SDKMAN is not working:**
```bash
# Reinitialize SDKMAN
source ~/.sdkman/bin/sdkman-init.sh

# Or reload shell
source ~/.zshrc
```

### **If build fails:**
```bash
# Verify Java version
java -version

# Should show Java 21, if not:
sdk use java 21.0.8-zulu

# Then retry build
./gradlew clean build
```

## 📋 **Environment Variables**

The project automatically sets:
- `JAVA_HOME` → Points to Java 21
- `PATH` → Includes Java 21 bin directory
- Gradle uses Java 21 toolchain (configured in build.gradle)

## ⚡ **Quick Reference**

| Command | Purpose |
|---------|---------|
| `sdk env` | Activate project Java version |
| `sdk use java 21.0.8-zulu` | Switch to Java 21 |
| `java -version` | Check current Java |
| `sdk list java` | List available versions |
| `./gradlew clean build` | Build with Java 21 |

---

**Note:** This project requires Java 21 for Spring Boot 3.2.3 compatibility. The configuration ensures all developers and AI assistants use the correct Java version automatically.
