# Contributing to Telegram MCP Server

Thank you for your interest in contributing to the Telegram MCP Server! This document provides guidelines and instructions for contributing.

## Code of Conduct

Please be respectful and considerate of others when contributing to this project. We aim to foster an inclusive and welcoming community.

## Getting Started

1. Fork the repository on GitHub
2. Clone your fork locally
3. Set up the development environment
4. Create a new branch for your changes

```bash
# Clone your fork
git clone https://github.com/your-username/telegram-mcp.git
cd telegram-mcp

# Install dependencies
npm install

# Create a branch for your changes
git checkout -b feature/your-feature-name
```

## Development Workflow

1. Make your changes
2. Write or update tests if necessary
3. Ensure all tests pass
4. Update documentation if necessary
5. Commit your changes with a clear commit message
6. Push your changes to your fork
7. Create a pull request

```bash
# Build the project
npm run build

# Watch for changes during development
npm run watch

# Test with the MCP Inspector
npm run inspector
```

## Pull Request Process

1. Ensure your code follows the project's coding style
2. Update the README.md or other documentation if necessary
3. The pull request will be reviewed by maintainers
4. Address any feedback from the review
5. Once approved, your pull request will be merged

## Coding Guidelines

- Follow the existing code style
- Write clear, descriptive commit messages
- Keep changes focused and atomic
- Document new code with comments as necessary
- Update documentation for any user-facing changes

## Testing

- Add tests for new features
- Ensure existing tests pass with your changes
- Test your changes with the MCP Inspector

## Reporting Issues

If you find a bug or have a suggestion for improvement:

1. Check if the issue already exists in the GitHub issues
2. If not, create a new issue with a clear description
3. Include steps to reproduce the issue if applicable
4. Include any relevant logs or screenshots

## Feature Requests

We welcome feature requests! Please create an issue describing the feature you'd like to see, why it would be valuable, and how it should work.

## License

By contributing to this project, you agree that your contributions will be licensed under the project's MIT license.
