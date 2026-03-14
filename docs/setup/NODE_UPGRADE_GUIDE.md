# Node.js Upgrade Guide for macOS with Zsh

## Requirements
- **Minimum:** Node 18.18.0+
- **Recommended:** Node 20 LTS (used in CI)
- **Shell:** Zsh (macOS default)

---

## 🚀 OPTION 1: Install NVM (Recommended)

NVM (Node Version Manager) lets you easily switch between Node versions.

### Step 1: Install NVM
```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
```

### Step 2: Configure Zsh
```bash
# Add to your ~/.zshrc (nvm installer should do this automatically)
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
```

### Step 3: Reload Shell
```bash
# Reload your shell configuration
source ~/.zshrc

# Or open a new terminal window
```

### Step 4: Install Node 20
```bash
# Install Node 20 LTS
nvm install 20

# Use Node 20
nvm use 20

# Make it default
nvm alias default 20

# Verify
node -v  # Should show v20.x.x
```

---

## 🔧 OPTION 2: Use Homebrew (If you have it)

If you already have Homebrew installed:

```bash
# Update Homebrew
brew update

# Install Node 20
brew install node@20

# Link it
brew link node@20 --force --overwrite

# Verify
node -v  # Should show v20.x.x
```

---

## 📦 OPTION 3: Direct Download (Easiest)

1. **Visit:** https://nodejs.org
2. **Download:** Node 20 LTS (Long Term Support)
3. **Run:** The .pkg installer
4. **Verify:** Open new terminal and run `node -v`

**Pros:** Simple, no command line needed  
**Cons:** Can't easily switch versions later

---

## ✅ After Installing Node 20

Once you have Node 20 installed, run these commands:

```bash
# Navigate to frontend
cd /Users/aliahdab/Documents/caryo-marketplace/frontend

# Verify Node version
node -v  # Should be v20.x.x

# Run lint (should work now)
npm run lint

# Build the project
npm run build

# Run tests
npm test

# Start dev server
npm run dev
```

---

## 🎯 Quick Recommendation

**For developers:** Install NVM (Option 1)
- Best long-term solution
- Easy to manage multiple Node versions
- Industry standard

**For quick fix:** Direct Download (Option 3)
- Fastest to get working
- No command line skills needed
- Good enough for single projects

---

## 🆘 Troubleshooting

### If nvm command still not found after install:
```bash
# Check if nvm is in your .zshrc
cat ~/.zshrc | grep nvm

# If not there, add it manually
echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.zshrc
echo '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"' >> ~/.zshrc
echo '[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"' >> ~/.zshrc

# Reload
source ~/.zshrc
```

### If Node still shows old version:
```bash
# Find where Node is installed
which node

# Remove old Node (if installed via pkg)
sudo rm -rf /usr/local/bin/node
sudo rm -rf /usr/local/bin/npm

# Then install again using one of the methods above
```

### Check your current setup:
```bash
# What version of Node?
node -v

# Where is Node installed?
which node

# Do you have Homebrew?
brew --version

# Do you have NVM?
nvm --version
```

---

## 📋 Summary

**After installing Node 20:**
- ✅ Can run `npm run lint`
- ✅ Can run `npm run build`
- ✅ Can run `npm run dev`
- ✅ Can run `npm test`

**Last updated:** March 2026

