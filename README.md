# WebMCP Agentic Template

A starter template for building [WebMCP](https://github.com/explainers-by-googlers/web-model-context-protocol) tools — client-side JavaScript tools that expose web application functionality to AI agents via the browser's `navigator.modelContext` API.

## What is WebMCP?

WebMCP is a browser API that lets web developers expose their application's functionality as "tools" — JavaScript functions with natural language descriptions and structured schemas — that AI agents, browser assistants, and assistive technologies can invoke. Think of it as turning a web page into an MCP server, but the tools run in client-side JavaScript instead of on a backend.

## Getting Started

You can use this template in two ways:

- **Start fresh**: Use this template as the foundation for a new WebMCP-enabled web project.
- **Migrate existing code**: Copy your existing web project files into this template and add WebMCP tools on top.

### Quick Example

```js
if ("modelContext" in navigator) {
  navigator.modelContext.registerTool({
    name: "greet_user",
    description: "Returns a personalized greeting for the given name.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "The person's name" }
      },
      required: ["name"]
    },
    execute: ({ name }) => {
      document.getElementById("greeting").textContent = `Hello, ${name}!`;
      return `Greeted ${name} successfully.`;
    }
  });
}
```

## Project Structure

```
.
├── .agents/
│   └── skills/
│       └── webmcp-builder/   # Agent skill for building WebMCP tools
├── AGENTS.md                 # Agent instructions and guidelines
└── README.md                 # This file
```

## For Agents

See [AGENTS.md](./AGENTS.md) for instructions on how to work within this project, including available skills and commit message conventions.
