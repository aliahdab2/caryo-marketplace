const { Octokit } = require('@octokit/rest');
const fs = require('fs');
const path = require('path');

/**
 * GitHub Integration Service
 * Handles automatic PR creation for translations
 */
class GitHubService {
  constructor() {
    this.octokit = null;
    this.owner = null;
    this.repo = null;
    this.branch = null;
  }

  /**
   * Initialize GitHub client
   * @param {string} token - GitHub token
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {string} branch - Base branch
   */
  initialize(token, owner, repo, branch = 'main') {
    if (!token) {
      throw new Error('GitHub token is required. Set GITHUB_TOKEN environment variable.');
    }

    this.octokit = new Octokit({ auth: token });
    this.owner = owner;
    this.repo = repo;
    this.branch = branch;

    console.log(`🔗 Connected to GitHub: ${owner}/${repo} (branch: ${branch})`);
  }

  /**
   * Check if GitHub integration is configured
   */
  isConfigured() {
    return !!(this.octokit && this.owner && this.repo);
  }

  /**
   * Create a new branch for translations
   * @param {string} baseBranch - Base branch to create from
   * @returns {Promise<string>} New branch name
   */
  async createTranslationBranch(baseBranch = 'main') {
    if (!this.isConfigured()) {
      throw new Error('GitHub service not initialized');
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const branchName = `translation-updates-${timestamp}`;

    try {
      // Get the base branch reference
      const { data: baseRef } = await this.octokit.git.getRef({
        owner: this.owner,
        repo: this.repo,
        ref: `heads/${baseBranch}`
      });

      // Create new branch
      await this.octokit.git.createRef({
        owner: this.owner,
        repo: this.repo,
        ref: `refs/heads/${branchName}`,
        sha: baseRef.object.sha
      });

      console.log(`✅ Created branch: ${branchName}`);
      return branchName;
    } catch (error) {
      console.error('❌ Failed to create branch:', error.message);
      throw error;
    }
  }

  /**
   * Upload translation files to GitHub
   * @param {string} branchName - Branch to upload to
   * @param {Object} translationFiles - Files to upload {filePath: content}
   * @param {string} baseBranch - Base branch for comparison
   * @returns {Promise<Array>} Array of uploaded files info
   */
  async uploadTranslationFiles(branchName, translationFiles, baseBranch = 'main') {
    if (!this.isConfigured()) {
      throw new Error('GitHub service not initialized');
    }

    const uploadedFiles = [];

    try {
      // Get base branch tree
      const { data: baseRef } = await this.octokit.git.getRef({
        owner: this.owner,
        repo: this.repo,
        ref: `heads/${baseBranch}`
      });

      const { data: baseCommit } = await this.octokit.git.getCommit({
        owner: this.owner,
        repo: this.repo,
        commit_sha: baseRef.object.sha
      });

      // Create blobs for each file
      const blobs = [];
      for (const [filePath, content] of Object.entries(translationFiles)) {
        const blob = await this.octokit.git.createBlob({
          owner: this.owner,
          repo: this.repo,
          content: Buffer.from(content).toString('base64'),
          encoding: 'base64'
        });

        blobs.push({
          path: filePath,
          mode: '100644', // Regular file
          type: 'blob',
          sha: blob.data.sha,
          originalContent: content
        });

        console.log(`📄 Created blob for: ${filePath}`);
      }

      // Create new tree
      const { data: newTree } = await this.octokit.git.createTree({
        owner: this.owner,
        repo: this.repo,
        base_tree: baseCommit.tree.sha,
        tree: blobs.map(blob => ({
          path: blob.path,
          mode: blob.mode,
          type: blob.type,
          sha: blob.sha
        }))
      });

      // Create commit
      const { data: newCommit } = await this.octokit.git.createCommit({
        owner: this.owner,
        repo: this.repo,
        message: 'feat: Update translations via AI translation service',
        tree: newTree.sha,
        parents: [baseRef.object.sha]
      });

      // Update branch reference
      await this.octokit.git.updateRef({
        owner: this.owner,
        repo: this.repo,
        ref: `heads/${branchName}`,
        sha: newCommit.sha
      });

      console.log(`✅ Committed ${blobs.length} translation files to branch: ${branchName}`);

      return blobs.map(blob => ({
        filePath: blob.path,
        sha: blob.sha,
        size: blob.originalContent.length
      }));

    } catch (error) {
      console.error('❌ Failed to upload files:', error.message);
      throw error;
    }
  }

  /**
   * Create a pull request
   * @param {string} branchName - Branch to create PR from
   * @param {string} title - PR title
   * @param {string} description - PR description
   * @param {Array} labels - Labels to add to PR
   * @returns {Promise<Object>} PR information
   */
  async createPullRequest(branchName, title, description, labels = ['translations', 'automated']) {
    if (!this.isConfigured()) {
      throw new Error('GitHub service not initialized');
    }

    try {
      const pr = await this.octokit.pulls.create({
        owner: this.owner,
        repo: this.repo,
        title,
        head: branchName,
        base: this.branch,
        body: description,
        draft: false
      });

      // Add labels if provided
      if (labels.length > 0) {
        await this.octokit.issues.addLabels({
          owner: this.owner,
          repo: this.repo,
          issue_number: pr.data.number,
          labels
        });
      }

      console.log(`✅ Created PR #${pr.data.number}: ${pr.data.html_url}`);

      return {
        number: pr.data.number,
        url: pr.data.html_url,
        title: pr.data.title,
        branch: branchName
      };

    } catch (error) {
      console.error('❌ Failed to create PR:', error.message);
      throw error;
    }
  }

  /**
   * Generate PR description with translation details
   * @param {Object} translationStats - Statistics about the translation
   * @param {Array} translatedFiles - List of files that were translated
   * @returns {string} PR description
   */
  generatePRDescription(translationStats, translatedFiles) {
    const description = `# 🤖 AI Translation Update

## 📊 Translation Summary

- **Language Pair**: ${translationStats.fromLang} → ${translationStats.toLang}
- **Total Translations**: ${translationStats.totalCount}
- **Successful**: ${translationStats.successCount}
- **Failed**: ${translationStats.errorCount}
- **Estimated Cost**: $${translationStats.estimatedCost}

## 📁 Files Updated

${translatedFiles.map(file => `- \`${file.filePath}\` (${file.size} chars)`).join('\n')}

## 🔍 Review Notes

- ✅ All translations were generated using OpenAI GPT-4
- ✅ Preserved technical terminology and placeholders
- ✅ Maintained UI context and natural language flow
- ⚠️ Please review translations for accuracy and cultural appropriateness

## 🏷️ Labels
- translations
- automated
- ai-generated

---

*This PR was automatically generated by the AI Translation Service*`;

    return description;
  }
}

module.exports = GitHubService;
