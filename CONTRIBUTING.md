# Contributing

Contributions welcome, please raise a pull request.

To develop locally:

```bash
yarn
yarn dev
```

Contributions will need to pass the tests. To run everything once:

```
yarn test
```

To run the tests in dev mode (automatically reruns when a file changes):

```
yarn test:dev
```

## Cutting a new release

`git pull --rebase` on `master` and then run:

```bash
git checkout -b "v1.2.3"
vim CHANGELOG.md # Update changelog, put all unreleased changes under new heading.
git commit -am "Update CHANGELOG"
npm version <major|minor|patch> -m "## 1.2.3 - 2017-01-13

- Change included in this release
- Another change included in this release"
git push --tags --set-upstream origin refs/heads/v1.2.3:refs/heads/v1.2.3
```

To actually publish, you will need access to an `npm` account that owns `openregister-picker-engine`. Merge the version PR and then run:

```bash
git checkout master
git pull --rebase
npm publish
```
