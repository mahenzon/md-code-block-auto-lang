# Markdown Code Blocks Auto Set Language

[![Get it on the Marketplace](https://img.shields.io/badge/Get_it_on_the_Marketplace-informational?style=for-the-badge)](https://github.com/marketplace/actions/markdown-code-block-auto-lang)
[![License: MIT](https://img.shields.io/badge/License-MIT-purple?style=for-the-badge)](LICENSE)

## **Why**

Automatically update issue / pull request text code blocks - set language to apply syntax highlighting.

### **Example result**

This text in issue / pull request description will be automatically updated

````markdown
```
print("Hello World")
```
````

To this:
````markdown
```python
print("Hello World")
```
````

So it looks not boring as:

```
print("Hello World")
```

But highlighted as

```python
print("Hello World")
```

## **Usage Examples**

### Example 1: Default (all PRs and issues, language = python)

```yaml
name: Auto-fix Markdown code blocks

permissions:
  issues: write
  pull-requests: write

on:
  issues:
    types:
      - opened
      - edited
  pull_request:
    types:
      - opened
      - edited
      - synchronize

jobs:
  fix-md-code-blocks:
    runs-on: ubuntu-latest
    steps:
      - uses: mahenzon/md-code-block-auto-lang@v1
        with:
          language: python
```

### Example 2: Only PRs, language = js, silent mode

Silent mode means no comment in issue / pull request, just update text.

You don't need to set `what-to-update` if `on` contains only what event triggers the action.

```yaml
name: Auto-fix Markdown code blocks in PRs

permissions:
  pull-requests: write

on:
  pull_request:
    types:
      - opened
      - edited
      - synchronize

jobs:
  fix-md-code-blocks:
    runs-on: ubuntu-latest
    steps:
      - uses: mahenzon/md-code-block-auto-lang@v1
        with:
          language: js
          silent: true
```

### Example 3: Only issues, language = bash

Set `what-to-update` explicitly.

```yaml
name: Auto-fix Markdown code blocks in issues

permissions:
  issues: write

on:
  issues:
    types:
      - opened
      - edited

jobs:
  fix-md-code-blocks:
    runs-on: ubuntu-latest
    steps:
      - uses: mahenzon/md-code-block-auto-lang@v1
        with:
          language: bash
          what-to-update: issue
```

### Example 4: Use output

```yaml
name: Count code block fixes

permissions:
  issues: write
  pull-requests: write

on:
  issues:
    types:
      - opened
      - edited
  pull_request:
    types:
      - opened
      - edited
      - synchronize

jobs:
  fix-md-code-blocks:
    runs-on: ubuntu-latest
    steps:
      - id: fixer
        uses: mahenzon/md-code-block-auto-lang@v1
        with:
          language: python

      - name: Show fix result count
        run: echo "Fixed ${{ steps.fixer.outputs.fixes }} code blocks"
```

## Configuration

If you want this to work for issues and pull requests from other users, you need to set a separate GitHub token, so the
action will be authorized to update issues and pull requests made by other users.

### Create a new fine-grained personal access token

1. Create a new [fine-grained personal access token](https://github.com/settings/personal-access-tokens/new).
   Follow the link or go to Account → Settings → Developer Settings → Personal access tokens → Fine-grained tokens;
2. Click **Generate new token**;
3. Set name to "%Repo-Name% md code blocks updater";
4. Set description to "%Repo-Name% Markdown code blocks updater for usage in GitHub
   Action https://github.com/mahenzon/md-code-block-auto-lang";
5. Select resource owner. It may be you of the organization where the repo is;
6. Set **Expiration** of your preference - for example "No expiration";
7. In **Repository access** choose what you prefer, you can select only one repo;
8. In **Permissions** select what you'd like to update. **Pull requests** and **Issues** recommended;
   Set **Read and write** to each one;
9. Click **Generate token**, double-check params in the modal and click **Generate token** again;
10. Copy the new token. Go to the next step to save the token in the actions secrets, it will not be shown ever again.

### Set the token in the repo's actions secrets

1. Go to your repo where you want to add this new action: visit repo's main page and in the top bar click **Settings**;
2. Click **Secrets and variables**, click **Actions**;
3. Click **New repository secret** in the **Repository secrets** section;
4. Set the new secret name, for example it can be `REPO_ISSUE_AND_PR_PAT` (where PAT is personal access token);
5. Paste your new token in the **Secret** field;
6. Click **Add secret** to save the new secret;
7. Copy the new token name and go to the next step.

### Provide token for the action in the repo

Set `github-token`:

```yaml
- uses: mahenzon/md-code-block-auto-lang@v1
  with:
    github-token: ${{ secrets.REPO_ISSUE_AND_PR_PAT }}
    language: python
```

Full action should look like this:

```yaml
name: Auto-fix Markdown code blocks

permissions:
  issues: write
  pull-requests: write

on:
  issues:
    types:
      - opened
      - edited
  pull_request:
    types:
      - opened
      - edited
      - synchronize

jobs:
  fix-md-code-blocks:
    runs-on: ubuntu-latest
    steps:
      - uses: mahenzon/md-code-block-auto-lang@v1
        with:
          github-token: ${{ secrets.REPO_ISSUE_AND_PR_PAT }}
          language: python
```

## Development

### Pull

### Install dependencies

```shell
npm i
```

### Build

```shell
rollup --config rollup.config.js
```

### Commit, push, PR
