const core = require('@actions/core');
const github = require('@actions/github');

(async () => {
  try {
    const token = process.env.GH_TOKEN;
    const octokit = github.getOctokit(token);
    const { owner, repo } = github.context.repo;

    const issues = await octokit.paginate(octokit.rest.issues.listForRepo, {
      owner,
      repo,
      state: 'open',
      per_page: 100,
    });

    const now = new Date();

    for (const issue of issues) {
      const isPR = !!issue.pull_request;
      const updatedAt = new Date(issue.updated_at);
      const daysInactive = Math.floor((now - updatedAt) / (1000 * 60 * 60 * 24));

      if (daysInactive < 3) continue;
      if (!issue.assignees || issue.assignees.length === 0) continue;

      const assignees = issue.assignees.map(a => `@${a.login}`).join(', ');
      const labels = issue.labels.map(l => l.name);

      // Motivational message
      let message = `💪 Hey ${assignees}! Just a friendly check-in from Manager Max 🤖\n\n`;
      message += `This ${isPR ? 'pull request' : 'issue'} has been quiet for **${daysInactive} days**.`;

      if (labels.includes('needs-review')) {
        message += `\n🔍 It’s tagged \`needs-review\`. Let's give it some love!`;
      } else if (labels.includes('in-progress')) {
        message += `\n🛠️ Still \`in-progress\`? You’ve got this—drop an update when you can!`;
      } else {
        message += `\n⏳ Time flies! Let’s make sure this is still on your radar.`;
      }

      message += `\n\n✅ Take action:\n- [ ] Drop a quick update or comment\n- [ ] Or wrap it up if it’s ready to go`;
      message += `\n\n🚀 Keep going, you’re crushing it! – Manager Max`;

      await octokit.rest.issues.createComment({
        owner,
        repo,
        issue_number: issue.number,
        body: message,
      });

      await octokit.rest.issues.addLabels({
        owner,
        repo,
        issue_number: issue.number,
        labels: ['stale'],
      });
    }

    const prs = issues.filter(issue => !!issue.pull_request);
    for (const pr of prs) {
      const reviews = await octokit.rest.pulls.listReviews({
        owner,
        repo,
        pull_number: pr.number,
      });

      if (reviews.data.length === 0) {
        const assignees = pr.assignees.map(a => `@${a.login}`).join(', ');
        const message = `👀 ${assignees}, this PR has no reviewers assigned. Tag a reviewer to keep momentum going! 🙌`;

        await octokit.rest.issues.createComment({
          owner,
          repo,
          issue_number: pr.number,
          body: message,
        });
      }
    }
  } catch (error) {
    core.setFailed(error.message);
  }
})();
