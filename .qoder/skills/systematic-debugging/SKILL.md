---
name: systematic-debugging
description: Use when investigating bugs, errors, or unexpected behavior in code
---

# Systematic Debugging

## Overview

Debug systematically rather than guessing. Follow a structured process to find root causes.

## The Debugging Process

### Phase 1: Reproduce

- [ ] Confirm the bug is reproducible
- [ ] Document exact steps to trigger
- [ ] Note environment (browser, OS, versions)
- [ ] Check if it's consistent or intermittent

### Phase 2: Isolate

- [ ] Find the smallest input that triggers the bug
- [ ] Identify which component/code section is involved
- [ ] Check recent changes (git log, recent commits)
- [ ] Use binary search: comment out half the code, test, repeat

### Phase 3: Hypothesize

Form hypotheses about the cause:
- What changed recently?
- What assumptions might be wrong?
- What edge case is not handled?

### Phase 4: Test Hypotheses

- Add logging/console output to verify assumptions
- Use debugger or breakpoints
- Check data at each step
- Verify inputs and outputs

### Phase 5: Fix and Verify

- Make the minimal fix
- Verify the fix resolves the issue
- Verify no regressions (run tests)
- Add test to prevent recurrence

## Common Debugging Techniques

### Console Logging

```typescript
// Log data flow
console.log('Step 1: Input:', input);
console.log('Step 2: After transform:', transformed);
console.log('Step 3: Output:', output);

// Log API calls
console.log('API Request:', url, params);
console.log('API Response:', response);
```

### Network Debugging

- Check browser DevTools Network tab
- Verify request/response payloads
- Check status codes and headers
- Look for CORS errors

### Database Debugging

```sql
-- Check related records
SELECT * FROM table WHERE id = 'xxx';

-- Check foreign key relationships
SELECT a.*, b.* 
FROM table_a a
LEFT JOIN table_b b ON a.foreign_id = b.id
WHERE a.id = 'xxx';
```

## Anti-Patterns to Avoid

| Bad | Good |
|-----|------|
| Randomly changing code hoping it fixes | Systematic hypothesis testing |
| Assuming the cause without verifying | Adding logging to confirm assumptions |
| Fixing symptoms not root cause | Finding and fixing the actual cause |
| Not adding a regression test | Adding test to prevent recurrence |

## Checklist Before Declaring Fixed

- [ ] Bug is reproducibly fixed
- [ ] Root cause is understood
- [ ] Fix is minimal and targeted
- [ ] No regressions introduced
- [ ] Test added to prevent recurrence
- [ ] Documentation updated if needed
