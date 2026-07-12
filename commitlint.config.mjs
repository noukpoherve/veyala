export default {
  extends: ["@commitlint/config-conventional"],
  // Keep the Conventional Commits structure enforced (type + optional scope,
  // e.g. feat(auth):, chore(deps):, docs:), but relax the two cosmetic rules
  // that AI generators (GitHub Copilot, opencommit…) always trip on, so their
  // output passes without hand-editing:
  rules: {
    // Allow a capitalized subject ("feat(auth): Migrate…"), not just lowercase.
    "subject-case": [0],
    // Allow long single-line descriptions in the body.
    "body-max-line-length": [0],
  },
};
