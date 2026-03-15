# Caryo Marketplace - Project Structure

## 📁 **Root Directory Structure**

```
caryo-marketplace/
├── README.md                    # Main project documentation
├── DEVELOPMENT_PLAN.md          # Project roadmap and status
├── .sdkmanrc                    # Java 21 auto-activation
├── .gitignore                   # Git ignore rules
│
├── 📁 setup/                    # Setup & Configuration
│   ├── setup-java21.sh         # Java 21 setup script
│   ├── JAVA_SETUP_INSTRUCTIONS.md  # Java setup guide
│   └── .cursorrules             # Cursor/Co-pilot instructions
│
├── 📁 backend/                  # Backend Application
│   └── caryo-backend/     # Spring Boot application
│       ├── src/                 # Java source code
│       ├── build.gradle         # Build configuration
│       ├── docker-compose.*.yml # Docker configurations
│       └── scripts/             # Backend-specific scripts
│
├── 📁 frontend/                 # Frontend Application
│   ├── src/                     # Next.js source code
│   ├── public/                  # Static assets
│   ├── package.json             # NPM configuration
│   └── scripts/                 # Frontend-specific scripts
│
├── 📁 docs/                     # Documentation Hub
│   ├── README.md                # Documentation index
│   ├── architecture/            # System design docs
│   ├── development/             # Development guides
│   ├── implementation/          # Feature implementation docs
│   ├── integration/             # Integration guides
│   ├── setup/                   # Setup instructions
│   └── testing/                 # Testing documentation
│
├── 📁 scripts/                  # Project-wide Scripts
│   ├── README.md                # Scripts documentation
│   ├── testing/                 # Test automation scripts
│   ├── diagnostics/             # Diagnostic tools
│   └── maintenance/             # Maintenance scripts
│
├── 📁 testing/                  # Integration Testing
│   └── integration/             # Cross-system tests
│
├── 📁 postman/                  # API Testing
│   ├── *.json                   # Postman collections
│   └── *.sh                     # Collection fix scripts
│
├── 📁 payments/                 # Payment system documentation
│
├── 📁 config/                   # Configuration files
│
└── 📁 archive/                  # Legacy/Experimental Code
    └── src/                     # Old source files (may be removed)
```

## 🎯 **Directory Purposes**

### **Core Application**
- **`backend/`** - Spring Boot 3.5.3 + Java 21 backend
- **`frontend/`** - Next.js 16.1.6 + TypeScript frontend

### **Documentation**
- **`docs/`** - All project documentation organized by category
- **`README.md`** - Main project overview and quick start

### **Development Tools**
- **`setup/`** - Environment setup and configuration
- **`scripts/`** - Automation and utility scripts
- **`testing/`** - Integration and end-to-end testing

### **External Tools**
- **`postman/`** - API testing collections and scripts

## 📋 **File Organization Rules**

### **✅ DO:**
- Keep root directory clean (only essential files)
- Group related files in appropriate directories
- Use consistent naming conventions
- Document directory purposes

### **❌ DON'T:**
- Put loose documentation files in root
- Mix setup scripts with application code
- Create directories without clear purposes
- Use inconsistent naming patterns

## 🚀 **Quick Navigation**

| Need | Go To |
|------|-------|
| **Start Development** | `setup/JAVA_SETUP_INSTRUCTIONS.md` |
| **API Documentation** | `backend/caryo-backend/API.md` |
| **Frontend Guide** | `docs/development/frontend_development_plan.md` |
| **System Architecture** | `docs/architecture/` |
| **Testing** | `docs/testing/` + `testing/` |
| **Deployment** | `docs/deployment/` |

## 🔄 **Maintenance**

This structure should be maintained as the project grows:
1. **New features** → Document in `docs/implementation/`
2. **Setup changes** → Update files in `setup/`
3. **New scripts** → Add to appropriate `scripts/` subdirectory
4. **Architecture changes** → Update `docs/architecture/`

---

**Last updated:** 2026-03-14
**Structure version:** 2.1 (Version corrections and missing directories added)
