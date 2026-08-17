# AI Usage Log

## Tools used

- Cursor / VS Code agent workflows
- GitHub Copilot
- Node.js + Express tooling
- MongoDB and local validation scripts

## Example of an AI correction

An earlier draft of the pricing config assumed numeric values would remain as strings in frontend state. The result was a miscalculation in the estimate because the backend logic had to coerce values before use. The fix was to normalize values in the backend config parser and to treat multipliers and rate columns as numbers before calculation.

## Code authored directly

The project structure, Express API, dynamic React estimator, owner panel, and admin configuration logic were authored directly in the workspace created for this implementation.
