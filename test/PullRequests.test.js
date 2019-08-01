const PullRequests = require('../src/PullRequests')
const Condition = require('../src/Condition')

describe('.isIgnorable', () => {
  test('returns true with matched strings', () => {
    const pullRequest = new PullRequests([], {})
    const pullRequests = [
      { title: "Dont merge - this is a PR title" },
      { title: "Don't merge - this is a PR title" },
      { title: "Do not merge - this is a PR title" },
      { title: "[DO NOT MERGE] - this is a PR title" },
      { title: "WIP - this is a PR title" },
      { title: "[WIP] This is a PR title" },
      { title: "[BLOCKED] This is a PR title" },
      { title: "[blocked] This is a PR title" },
      { title: "This is a PR title", labels: { nodes: [{ name: "blocked" }] } },
      { title: "This is a PR title", labels: { nodes: [{ name: "BLOCKED" }] } },
      { title: "This is a PR title", labels: { nodes: [{ name: 'WIP' }] } },
      { title: "This is a PR title", labels: { nodes: [{ name: '[WIP]' }] } },
      { title: "This is a PR title", labels: { nodes: [{ name: 'wip' }] } },
      { title: "This is a PR title", labels: { nodes: [{ name: 'donotmerge' }] } },
      { title: "This is a PR title", labels: { nodes: [{ name: 'Don\'t Merge' }] } },
      { title: "This is a PR title", labels: { nodes: [{ name: 'dont merge' }] } },
      { title: "[Don't Merge] This is a PR title" },
    ]

    for (const pr of pullRequests) {
      expect(pullRequest.isIgnorable(pr)).toEqual(true)
    }

    const nonIgnorablePRs = [
      { title: "This is a PR title" },
      { title: "This is a PR title", labels: { nodes: [{ name: 'TIP' }] } },
      { title: "This is a PR title", labels: { nodes: [{ name: '[Do Merge]' }] } },
      { title: "This is a PR title", labels: { nodes: [{ name: '[Test]' }] } },
    ]

    for (const pr of nonIgnorablePRs) {
      expect(pullRequest.isIgnorable(pr)).toEqual(false)
    }
  })
})

describe('.matchesLabel', () => {
  const pr = { labels: { nodes: [{ name: 'enhancement' }] } }

  test('returns true with matched strings', () => {
    const pullRequest = new PullRequests([], {
      label: new Condition('label', ['enhancement'], true),
    })

    expect(pullRequest.matchesLabel(pr)).toEqual(true)
  })

  test('returns false even with matched strings when inclusion is false', () => {
    const pullRequest = new PullRequests([], {
      label: new Condition('label', ['enhancement'], false),
    })

    expect(pullRequest.matchesLabel(pr)).toEqual(false)
  })

  test('returns false with unmatched strings', () => {
    const pullRequest = new PullRequests([], {
      label: new Condition('label', ['bug'], true),
    })

    expect(pullRequest.matchesLabel(pr)).toEqual(false)
  })
})

describe('.matchesReviewer', () => {
  const pr = {
    reviewRequests: {
      nodes: [
        {
          // When the reviewer is a user
          requestedReviewer: {
            login: 'ohbarye',
          },
        },
        {
          // When the reviewer is a team
          requestedReviewer: {
            name: 'my-team',
          },
        },
      ],
    },
  }

  describe('given username', () => {
    test('returns true with matched strings', () => {
      const pullRequest = new PullRequests([], {
        reviewer: new Condition('reviewer', ['ohbarye'], true),
      })

      expect(pullRequest.matchesReviewer(pr)).toEqual(true)
    })

    test('returns false even with matched strings when inclusion is false', () => {
      const pullRequest = new PullRequests([], {
        reviewer: new Condition('reviewer', ['ohbarye'], false),
      })

      expect(pullRequest.matchesReviewer(pr)).toEqual(false)
    })

    test('returns false with unmatched strings', () => {
      const pullRequest = new PullRequests([], {
        reviewer: new Condition('reviewer', ['butcher'], true),
      })

      expect(pullRequest.matchesReviewer(pr)).toEqual(false)
    })
  })

  describe('given team name', () => {
    test('returns true with matched strings', () => {
      const pullRequest = new PullRequests([], {
        reviewer: new Condition('reviewer', ['my-team'], true),
      })

      expect(pullRequest.matchesReviewer(pr)).toEqual(true)
    })

    test('returns false even with matched strings when inclusion is false', () => {
      const pullRequest = new PullRequests([], {
        reviewer: new Condition('reviewer', ['org/my-team'], false),
      })

      expect(pullRequest.matchesReviewer(pr)).toEqual(false)
    })

    test('returns false with unmatched strings', () => {
      const pullRequest = new PullRequests([], {
        reviewer: new Condition('reviewer', ['butcher'], true),
      })

      expect(pullRequest.matchesReviewer(pr)).toEqual(false)
    })
  })
})

describe('.formatPullRequest', () => {
  test('returns formatted string without reviewer name when no review assigned', () => {
    const pullRequest = new PullRequests([], {})
    const pr = {
      title: 'Add some tests',
      url: 'https://github.com/ohbarye/review-waiting-list-bot/pull/34',
      author: { login: 'ohbarye' },
      reviewRequests: {
        nodes: [],
      },
    }
    expect(pullRequest.formatPullRequest(pr, 0)).toEqual(
      '1. `Add some tests` https://github.com/ohbarye/review-waiting-list-bot/pull/34 by ohbarye (no reviewer assigned)'
    )
  })

  test('returns formatted string with reviewer name when someone assigned', () => {
    const pullRequest = new PullRequests([], {})
    const pr = {
      title: 'Add some tests',
      url: 'https://github.com/ohbarye/review-waiting-list-bot/pull/34',
      author: { login: 'ohbarye' },
      reviewRequests: {
        nodes: [
          { requestedReviewer: { login:  'basan' }},
          { requestedReviewer: { name:  'team-b' }},
        ],
      },
    }
    expect(pullRequest.formatPullRequest(pr, 0)).toEqual(
      '1. `Add some tests` https://github.com/ohbarye/review-waiting-list-bot/pull/34 by ohbarye (reviewer: basan, team-b)'
    )
  })
})
