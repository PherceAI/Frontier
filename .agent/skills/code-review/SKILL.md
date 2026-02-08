---
name: code-review
description: Validates code changes against best practices, security standards, and style guidelines. Use this skill when the user asks for a review of their code or before finalizing significant changes.
---

# Code Review Skill

## Goal
To ensure code quality, security, and maintainability by reviewing changes against a set of best practices.

## Workflow
1.  **Analyze Context**: Understand the purpose of the changes (feature, bugfix, refactor).
2.  **Verify Correctness**:
    - [ ] Does the code solve the stated problem?
    - [ ] Are there any logical errors?
    - [ ] Are edge cases handled?
3.  **Security Check**:
    - [ ] Are there potential SQL injection vulnerabilities?
    - [ ] Is input validation sufficient?
    - [ ] Are sensitive secrets exposed?
4.  **Style & Maintainability**:
    - [ ] Is the code readable and self-documenting?
    - [ ] Does it follow the project's existing coding style?
    - [ ] Are variable and function names descriptive?
5.  **Report**:
    - Summarize findings.
    - Categorize issues by severity (Critical, Warning, Suggestion).
    - Provide specific examples and suggested fixes.
