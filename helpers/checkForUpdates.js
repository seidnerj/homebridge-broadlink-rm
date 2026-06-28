// Update checking is intentionally disabled in this fork. The upstream check
// uses github-version-checker, which parses pkg.version with semver and throws
// "Invalid Version" on our fork-distinguishing version suffix (e.g. 4.4.21b),
// crashing the child bridge. We track upstream manually, so this is a no-op.
const checkForUpdates = () => {};

module.exports = checkForUpdates;
