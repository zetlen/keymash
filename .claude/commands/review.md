# /review - Pre-PR Agent Review

Analyze the current branch changes and invoke all relevant specialized agents for code review.

## Instructions

1. First, identify what files have changed compared to the main branch:
   ```bash
   git diff main..HEAD --name-only
   ```

2. Based on the changed files, determine which agents to invoke:

   **If any of these files changed, invoke `keyboard-compat-advocate`:**
   - `lib/keymash.ts`
   - `lib/keymash-core.ts`
   - Any file with keyboard event handling

   **If any of these conditions are met, invoke `api-docs-completionist`:**
   - New exports added to lib/*.ts
   - Changes to `types.ts`
   - Changes to `README.md`
   - New public methods or types

   **If any of these conditions are met, invoke `frontend-api-reviewer`:**
   - New React hooks (lib/keymash-react.ts)
   - New components in components/
   - Documentation examples changed

3. For each relevant agent, launch it using the Task tool with a prompt like:
   ```
   Review the changes in the current branch (git diff main..HEAD) for [agent's focus area].
   Provide a prioritized list of issues and recommendations.
   ```

4. Compile findings from all agents into a single summary with:
   - Critical issues (must fix before merge)
   - Important issues (should fix)
   - Suggestions (nice to have)

5. If no agents are relevant (e.g., only config changes), report that no specialized review is needed.

## Output Format

```markdown
## Pre-PR Review Summary

### Agents Invoked
- [ ] keyboard-compat-advocate (reason or "not needed")
- [ ] api-docs-completionist (reason or "not needed")
- [ ] frontend-api-reviewer (reason or "not needed")

### Critical Issues
...

### Important Issues
...

### Suggestions
...
```
