# Setup & Configuration

This directory contains all setup and configuration files for the Caryo Marketplace project.

## 🚀 **Quick Setup**

### **One-Click Setup (Recommended)**
```bash
# Run from project root
./setup/setup-java21.sh
```

### **Manual Setup**
```bash
# 1. Set Java 21
sdk use java 21.0.8-zulu

# 2. Verify version
java -version

# 3. Build backend
cd backend/caryo-backend
./gradlew build
```

## 📁 **Files in this Directory**

| File | Purpose |
|------|---------|
| `setup-java21.sh` | **One-click Java 21 setup script** |
| `JAVA_SETUP_INSTRUCTIONS.md` | **Comprehensive Java setup guide** |
| `.cursorrules` | **Cursor/Co-pilot instructions** |
| `.sdkmanrc` | **SDKMAN configuration template** |

## 🎯 **For New Developers**

1. **Read**: [JAVA_SETUP_INSTRUCTIONS.md](JAVA_SETUP_INSTRUCTIONS.md)
2. **Run**: `./setup-java21.sh`
3. **Verify**: `java -version` should show Java 21
4. **Build**: Follow instructions in main [README.md](../README.md)

## 🤖 **For AI Assistants**

- **Always check**: `.cursorrules` file for project requirements
- **Java 21 Required**: Use `sdk use java 21.0.8-zulu` before backend operations
- **Quick Setup**: Run `./setup/setup-java21.sh` for full environment setup

## 🔧 **Configuration Files**

### **SDKMAN Configuration**
- Root `.sdkmanrc` auto-activates Java 21 in project directory
- Backend `.sdkmanrc` ensures Java 21 in backend directory

### **Cursor/Co-pilot Rules**
- `.cursorrules` provides AI assistants with project requirements
- Includes Java version requirements and common commands

---

**Need help?** Check the main [PROJECT_STRUCTURE.md](../PROJECT_STRUCTURE.md) for full project organization.
