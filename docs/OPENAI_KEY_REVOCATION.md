# OpenAI API Key Revocation Guide

## CRITICAL: Immediate Action Required

If an OpenAI API key was committed to your git repository, it is **publicly exposed** and must be revoked immediately to prevent unauthorized usage and potential costs.

---

## Step 1: Revoke the Exposed Key

### Access OpenAI Platform

1. Go to [OpenAI API Keys Dashboard](https://platform.openai.com/api-keys)
2. Sign in with your OpenAI account

### Identify and Revoke the Key

3. Look for the exposed key in your key list
   - According to the security audit, a key starting with `sk-proj-krvAH...` was found
   - The key may have a name like "Caryo Project" or similar
4. Click on the key to view details
5. Click **"Revoke"** or **"Delete"** button
6. Confirm the revocation

**IMPORTANT:** Do this immediately, even if you're not sure if the key is actively used.

---

## Step 2: Generate a New API Key

### Create New Key

1. Still on the [API Keys page](https://platform.openai.com/api-keys)
2. Click **"Create new secret key"**
3. Give it a descriptive name (e.g., "Caryo Production - Jan 2026")
4. (Optional) Set permissions if available:
   - Recommended: Restrict to specific models or rate limits
5. Click **"Create secret key"**

### Save the Key Securely

6. **Copy the key immediately** - you won't be able to see it again!
7. Save it to a secure password manager or secrets vault
8. **DO NOT:**
   - Email it to yourself
   - Store it in a text file
   - Commit it to git
   - Share it in Slack/Discord/chat

---

## Step 3: Update Your Application Configuration

### Set Environment Variable

**Development:**
```bash
# Create or update .env file (NEVER commit this file!)
cd /path/to/caryo-marketplace
cp .env.example .env

# Edit .env and add your new key:
OPENAI_API_KEY=sk-proj-YOUR_NEW_KEY_HERE
```

**Production:**

Choose one of these methods:

#### Option A: Docker/Docker Compose
```yaml
# docker-compose.yml or docker-compose.prod.yml
services:
  backend:
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    # OR use env_file:
    env_file:
      - .env.production  # Never commit this file!
```

#### Option B: Kubernetes Secret
```bash
# Create Kubernetes secret
kubectl create secret generic caryo-secrets \
  --from-literal=openai-api-key=sk-proj-YOUR_NEW_KEY_HERE \
  -n your-namespace

# Reference in deployment:
# env:
#   - name: OPENAI_API_KEY
#     valueFrom:
#       secretKeyRef:
#         name: caryo-secrets
#         key: openai-api-key
```

#### Option C: Cloud Provider Secrets Manager

**AWS Secrets Manager:**
```bash
aws secretsmanager create-secret \
  --name caryo/openai-api-key \
  --secret-string sk-proj-YOUR_NEW_KEY_HERE
```

**Google Cloud Secret Manager:**
```bash
echo -n "sk-proj-YOUR_NEW_KEY_HERE" | \
  gcloud secrets create caryo-openai-key --data-file=-
```

**Azure Key Vault:**
```bash
az keyvault secret set \
  --vault-name caryo-vault \
  --name openai-api-key \
  --value sk-proj-YOUR_NEW_KEY_HERE
```

---

## Step 4: Verify the Configuration

### Test the New Key

```bash
# Start your backend application
cd backend/caryo-backend
./gradlew bootRun

# Check logs for successful startup
# Look for: "OpenAI configuration loaded successfully"
# Or similar message

# Test translation functionality
curl -X POST http://localhost:8080/api/translations/test \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello","targetLanguage":"ar"}'

# Expected: Should return translated text without errors
```

### Monitor API Usage

1. Go to [OpenAI Usage Dashboard](https://platform.openai.com/usage)
2. Verify requests are being made with the new key
3. Set up usage alerts if available:
   - Email notifications for high usage
   - Budget limits to prevent excessive costs

---

## Step 5: Remove Key from Git History (Optional but Recommended)

If the key was committed to git, it exists in your repository history even after deletion.

### ⚠️ WARNING
This rewrites git history. Coordinate with your team before proceeding.

### Using git-filter-repo (Recommended)

```bash
# Install git-filter-repo
pip install git-filter-repo

# Backup your repository first!
cd /path/to/caryo-marketplace
cp -r . ../caryo-marketplace-backup

# Remove the key from history
git filter-repo --invert-paths --path backend/caryo-backend/src/main/resources/application.properties

# Or use a callback to replace the key:
git filter-repo --replace-text <(echo 'sk-proj-krvAH==>')
```

### Using BFG Repo-Cleaner (Alternative)

```bash
# Install BFG
brew install bfg  # macOS
# or download from https://rtyley.github.io/bfg-repo-cleaner/

# Backup first!
cd /path/to/caryo-marketplace
cp -r . ../caryo-marketplace-backup

# Remove the key
bfg --replace-text replacement.txt

# replacement.txt content:
# sk-proj-krvAH***===>REDACTED
```

### Force Push (Only if necessary)

```bash
# ONLY do this if:
# 1. You have team coordination
# 2. The repo is private
# 3. You understand the consequences

git push origin --force --all
git push origin --force --tags
```

---

## Step 6: Monitor for Unauthorized Usage

### Set Up Alerts

1. Go to [OpenAI Usage page](https://platform.openai.com/usage)
2. Set up email alerts for:
   - Unusual spending patterns
   - High request volumes
   - Budget thresholds

### Check for Unauthorized Access

For the next 7-14 days:

1. **Daily:** Check OpenAI usage dashboard
2. **Look for:**
   - Requests you didn't make
   - Unusual usage patterns
   - Unexpected models being used
3. **If suspicious activity detected:**
   - Revoke the new key immediately
   - Generate another new key
   - Contact OpenAI support
   - Review application logs

---

## Step 7: Prevent Future Exposure

### Git Hooks (Pre-commit)

Create a pre-commit hook to prevent committing secrets:

```bash
# Create hook file
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash

# Check for common secret patterns
if git diff --cached | grep -E '(sk-proj-|sk-[a-zA-Z0-9]{48})'; then
  echo "ERROR: OpenAI API key detected in staged changes!"
  echo "Remove the key and use environment variables instead."
  exit 1
fi
EOF

# Make it executable
chmod +x .git/hooks/pre-commit
```

### Use Secret Scanning Tools

**GitHub Secret Scanning:**
- Automatically enabled for public repos
- Enable for private repos in Settings > Security

**GitGuardian:**
```bash
# Install GitGuardian CLI
pip install ggshield

# Scan repository
ggshield secret scan repo .
```

**TruffleHog:**
```bash
# Install
brew install trufflesecurity/trufflehog/trufflehog

# Scan repository
trufflehog git file://. --only-verified
```

### Code Review Checklist

Before merging any PR:

- [ ] No hardcoded API keys
- [ ] No .env files included
- [ ] All secrets use environment variables
- [ ] application.properties uses ${VAR} syntax
- [ ] No credentials in comments

---

## Verification Checklist

After completing all steps:

- [ ] Old OpenAI API key revoked
- [ ] New OpenAI API key generated
- [ ] New key stored in password manager/vault
- [ ] .env file updated with new key (and NOT committed)
- [ ] Application tested with new key
- [ ] Usage monitoring enabled
- [ ] Git history cleaned (if applicable)
- [ ] Pre-commit hooks installed
- [ ] Team notified of key rotation
- [ ] Documentation updated

---

## Emergency Contacts

- **OpenAI Support:** https://help.openai.com/
- **If unauthorized charges:** Contact OpenAI immediately via support portal

---

## Additional Resources

- [OpenAI API Security Best Practices](https://platform.openai.com/docs/guides/safety-best-practices)
- [Managing API Keys](https://platform.openai.com/docs/guides/production-best-practices/api-keys)
- [Caryo Security Documentation](./SECURITY_CONFIGURATION.md)
- [Caryo Quick Start Guide](./SECURITY_QUICK_START.md)

---

**Last Updated:** January 2026
**Priority:** CRITICAL - Complete within 24 hours
