import * as core from "@actions/core";
import * as github from "@actions/github";

const MARKER = '<!-- markdown-code-block-checker -->';
const MAX_CODE_PREVIEW = 50;
const LOAD_COMMENTS_PER_PAGE = 10;

function isBotComment(comment, actor) {
  return (
    (comment.user && (
      comment.user.type === 'Bot' ||
      comment.user.login === 'github-actions[bot]' ||
      comment.user.login === actor
    )) &&
    comment.body &&
    comment.body.includes(MARKER)
  );
}

function fixCodeBlocks(body, lang) {
  const lines = body.split('\n');
  let insideCode = false;
  let fixed = false;
  let fixCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Opening code block without language
    if (!insideCode && line.trim() === '```') {
      lines[i] = `\`\`\`${lang}`;
      insideCode = true;
      fixed = true;
      fixCount++;
    }
    // Opening code block with language (don't touch)
    else if (!insideCode && line.trim().startsWith('```') && line.trim().length > 3) {
      insideCode = true;
    }
    // Closing code block
    else if (insideCode && line.trim() === '```') {
      insideCode = false;
    }
    // else leave the line as is
  }
  return { fixedBody: lines.join('\n'), fixed, fixCount };
}

function findMissingLangBlocks(body) {
  const lines = body.split('\n');
  let insideCode = false;
  let errors = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/^```(\S*)/);
    if (match) {
      if (!insideCode) {
        const lang = match[1];
        if (!lang) {
          // Find the next line that is not empty and not a code block marker
          let codePreview = '';
          for (let j = i + 1; j < lines.length; j++) {
            if (lines[j].trim() && !lines[j].startsWith('```')) {
              codePreview = lines[j].trim();
              break;
            }
          }
          if (codePreview.length > MAX_CODE_PREVIEW) {
            codePreview = codePreview.slice(0, MAX_CODE_PREVIEW) + '...';
          }
          errors.push(
            `Line ${i + 1}: Missing language for code block. Code starts with: "${codePreview}"`
          );
        }
        insideCode = true;
      } else {
        insideCode = false;
      }
    }
  }
  return errors;
}

async function getCheckerComment(octokit, owner, repo, issue_number, actor) {
  let checkerComment = null;
  let page = 1;
  while (true) {
    const { data: comments } = await octokit.issues.listComments({
      owner,
      repo,
      issue_number,
      per_page: LOAD_COMMENTS_PER_PAGE,
      page,
    });
    if (comments.length === 0) break;
    for (const comment of comments) {
      if (isBotComment(comment, actor)) {
        checkerComment = comment;
        break;
      }
    }
    if (checkerComment || comments.length < LOAD_COMMENTS_PER_PAGE) break;
    page++;
  }
  return checkerComment;
}

async function main() {
  try {
    // Inputs
    const lang = core.getInput('language', { required: true });
    const silent = core.getBooleanInput('silent');
    const whatToUpdate = core.getMultilineInput('what-to-update').map(s => s.trim().toLowerCase());
    const token = core.getInput('github-token', { required: true });

    const context = github.context;
    const octokit = github.getOctokit(token);

    const actor = context.actor;
    const repo = context.repo.repo;
    const owner = context.repo.owner;

    // Determine event type and body
    let body = '';
    let issue_number = null;
    let type = null;
    let isPR = false;

    // Only process if event matches what-to-update
    const updateAllChosen = whatToUpdate.includes('all');
    if (
      context.payload.pull_request &&
      (whatToUpdate.includes('pull_request') || updateAllChosen)
    ) {
      body = context.payload.pull_request.body || '';
      issue_number = context.payload.pull_request.number;
      type = 'pull request';
      isPR = true;
    } else if (
      context.payload.issue &&
      (whatToUpdate.includes('issue') || updateAllChosen)
    ) {
      body = context.payload.issue.body || '';
      issue_number = context.payload.issue.number;
      type = 'issue';
      isPR = false;
    } else {
      core.info('Event type does not match what-to-update input. Skipping.');
      core.setOutput('fixes', 0);
      return;
    }

    // 1. Check for missing languages in the original body
    const errors = findMissingLangBlocks(body);

    // 2. Prepare comment and fixed body if needed
    let commentBody = '';
    let fixedBody = body;
    let fixed = false;
    let fixCount = 0;

    if (errors.length > 0) {
      // Prepare fixed body
      const fixResult = fixCodeBlocks(body, lang);
      fixedBody = fixResult.fixedBody;
      fixed = fixResult.fixed;
      fixCount = fixResult.fixCount;

      // Prepare comment (no re-checking after fix!)
      commentBody = [
        MARKER,
        `:information_source: All code blocks without a language in this ${type} description were set to \`${lang}\` by default.`,
        '',
        '**You must check if the language was guessed correctly.**',
        '',
        '> In the future, please specify the language after the opening triple backticks in your code snippets.',
        '',
        'Example:',
        '````markdown',
        '```python',
        'print("hello world")',
        '```',
        '````'
      ].join('\n');
    }

    // 3. Find existing checker comment by the bot
    let checkerComment = null;
    if (!silent && issue_number) {
      checkerComment = await getCheckerComment(octokit, owner, repo, issue_number, actor);
    }

    // 4. Only update if needed
    if (errors.length > 0 && fixed && body !== fixedBody) {
      // Update the issue or PR body
      if (isPR) {
        await octokit.rest.pulls.update({
          owner,
          repo,
          pull_number: issue_number,
          body: fixedBody
        });
      } else {
        await octokit.rest.issues.update({
          owner,
          repo,
          issue_number,
          body: fixedBody
        });
      }
      // Add or update the bot comment
      if (!silent) {
        if (checkerComment) {
          if (checkerComment.body !== commentBody) {
            await octokit.rest.issues.updateComment({
              owner,
              repo,
              comment_id: checkerComment.id,
              body: commentBody
            });
          }
        } else {
          await octokit.rest.issues.createComment({
            owner,
            repo,
            issue_number,
            body: commentBody
          });
        }
      }
      core.info(`Fixed ${fixCount} missing code block language(s) and notified the user.`);
      core.setOutput('fixes', fixCount);
      return;
    } else if (checkerComment && errors.length === 0 && !silent) {
      // If everything is OK and there was a previous comment, delete it
      await octokit.rest.issues.deleteComment({
        owner,
        repo,
        comment_id: checkerComment.id
      });
      core.info('All code blocks have language specified. Thank you.');
      core.setOutput('fixes', 0);
      return;
    } else {
      // All code blocks are OK and no bot comment exists
      core.info('All code blocks have language specified.');
      core.setOutput('fixes', 0);
      return;
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

main();
