# Markdown Code Blocks Auto Set Language

[![Get it on the Marketplace](https://img.shields.io/badge/Get_it_on_the_Marketplace-informational?style=for-the-badge)](https://github.com/marketplace/actions/md-code-block-auto-lang)
[![License: MIT](https://img.shields.io/badge/License-MIT-purple?style=for-the-badge)](LICENSE)

## **Why**

Automatically update issue / pull request text code blocks - set language to apply syntax highlighting.

### **Example result**

This text in issue / pull request description will be automatically updated

````markdown
```
print("Hello World")
```

To this:
````
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

# Development

## Pull

## Install dependencies
```shell
npm i
```

## Build

```shell
rollup --config rollup.config.js
```

## Commit, push, PR
