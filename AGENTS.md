# Agent Guidelines

## Available Skills

This project includes an agent skill to help you build WebMCP tools:

- **[webmcp-builder](.agents/skills/webmcp-builder/SKILL.md)** — Use this skill whenever you need to create, modify, or extend WebMCP tools in this project. It covers the full lifecycle: registering tools via `navigator.modelContext`, defining input schemas, writing `execute` handlers, and following best practices for accessibility and security. Refer to it when the user mentions WebMCP, `modelContext`, browser tools for agents, or wants to expose web app functionality to AI agents.

## Commit Message Convention

This project follows the [Conventional Commits](https://www.conventionalcommits.org/) specification — a lightweight convention on top of commit messages that makes the history human- and machine-readable.

All commit messages must follow this format:

```
<type>(<optional scope>): <short description>

[optional body]

[optional footer(s)]
```

Common types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`.

**Examples:**
```
feat: add search tool via navigator.modelContext
fix(tools): handle missing DOM element in execute handler
docs: update README with quick start example
chore: add webmcp-builder skill to .agents/skills
```
