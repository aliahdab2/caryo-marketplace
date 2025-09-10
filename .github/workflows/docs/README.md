# GitHub Actions Documentation Hub

This directory contains comprehensive documentation for all GitHub Actions workflows, custom actions, and CI/CD processes used in the Caryo Marketplace project.

## 📋 Documentation Index

### 🎯 [GitHub Actions Guide](GITHUB_ACTIONS_GUIDE.md)
Complete overview of GitHub Actions setup and usage:
- Getting started with GitHub Actions
- Workflow basics and best practices
- Local testing with Act
- Troubleshooting common issues

### 🔧 [GitHub Actions Reference](GITHUB_ACTIONS_REFERENCE.md)
Detailed documentation for custom GitHub Actions:
- `frontend-setup` - Node.js setup, build, test, and validation
- `gradle-setup` - Java/Gradle environment setup
- `spring-boot-setup` - Spring Boot application setup
- `docker-services-setup` - Database and service containers
- `postman-tests` - API testing with Postman collections

### 🚀 [Workflows Overview](WORKFLOWS_OVERVIEW.md)
High-level overview of all CI/CD workflows:
- Workflow triggers and conditions
- Job dependencies and execution order
- Environment configurations
- Artifact management

### 🌐 [Translation Validation Workflow](TRANSLATION_VALIDATION_WORKFLOW.md)
Specialized workflow for translation quality assurance:
- Translation completeness validation
- Configurable thresholds and quality gates
- PR integration with automated feedback
- Detailed reporting and analytics

### 🤖 [Copilot Instructions](COPILOT_INSTRUCTIONS.md)
Guidelines for GitHub Copilot usage in this project:
- Code generation best practices
- Context-aware suggestions
- Project-specific conventions
- Quality assurance guidelines

## 🔄 Workflow Overview

### Main CI/CD Pipeline (`ci-cd.yml`)
- Backend build and unit tests
- Frontend build, lint, test, and translation validation
- Docker build preparation (commented out)
- Deployment to production

### Specialized Workflows
- **`unit-tests.yml`** - Backend unit tests only
- **`integration-tests.yml`** - Backend integration tests with Docker services
- **`seo-testing.yml`** - Frontend SEO validation and Lighthouse audits
- **`postman-tests.yml`** - API testing with Postman collections
- **`translation-validation.yml`** - Translation completeness validation

## 🚀 Key Features

### Automated Quality Gates
- **Translation validation** on every PR and push
- **SEO testing** with Lighthouse integration
- **API testing** with Postman collections
- **Security scanning** and dependency checks

### Developer Experience
- **PR comments** with validation results
- **Artifact uploads** for detailed reports
- **Matrix builds** for multiple environments
- **Manual triggers** for on-demand testing

## 📊 Quality Metrics

The CI/CD pipeline enforces:
- ✅ **Translation completeness** (English ≥50%, Arabic ≥95%)
- ✅ **Code quality** via ESLint and build checks
- ✅ **Test coverage** with automated reporting
- ✅ **SEO compliance** with structured data validation
- ✅ **API reliability** with comprehensive endpoint testing

## 🔧 Configuration

### Environment Variables
- `NODE_ENV` - Controls build environment
- `SPRING_PROFILES_ACTIVE` - Backend Spring profiles
- Custom secrets for Docker Hub, databases, etc.

### Cache Configuration
- **Gradle dependencies** for faster backend builds
- **npm packages** for faster frontend builds
- **Docker layers** for optimized container builds

## 📈 Monitoring & Analytics

### Workflow Analytics
- **Success/failure rates** across workflows
- **Average run times** for performance monitoring
- **Test coverage trends** over time
- **Translation completeness** historical tracking

### Integration Points
- **PR comments** with validation results
- **Slack notifications** for workflow failures
- **Dashboard integration** for metrics
- **Artifact storage** for reports and logs

## 🛠️ Maintenance

### Regular Tasks
- [ ] Update Node.js and Java versions
- [ ] Review and update dependency versions
- [ ] Monitor workflow run times and optimize slow steps
- [ ] Update translation validation thresholds as needed

### Adding New Workflows
1. Create workflow YAML in this directory
2. Add appropriate triggers and permissions
3. Test locally with `act` if possible
4. Update this documentation

### Troubleshooting
- Check workflow run logs in GitHub Actions
- Review artifact uploads for detailed reports
- Use manual workflow dispatch for testing
- Monitor for flaky tests and external service dependencies

## 📞 Support

For workflow-related issues:
1. Check the specific workflow documentation
2. Review GitHub Actions run logs
3. Check for similar issues in past runs
4. Create issues with detailed reproduction steps

---

**Last updated:** $(date)
**Maintained by:** Development Team
