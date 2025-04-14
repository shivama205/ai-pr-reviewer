# Testing Locally

This guide explains how to test the AI PR Reviewer locally using the [act](https://github.com/nektos/act) tool.

## Prerequisites

1. Install the [act](https://github.com/nektos/act) tool:
   ```bash
   # macOS (using Homebrew)
   brew install act
   
   # Other platforms: see https://github.com/nektos/act#installation
   ```

2. Make sure Docker is installed and running on your system.

## Setting Up

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Create a `.secrets` file in the project root with your API keys:
   ```
   # Choose one of the following configurations:
   
   # For OpenAI:
   LLM_PROVIDER=openai
   LLM_API_KEY=your_openai_api_key
   
   # For Gemini:
   # LLM_PROVIDER=gemini
   # LLM_API_KEY=your_gemini_api_key
   ```

3. Build the project:
   ```bash
   npm run build
   ```

## Running Tests

### Using the NPM Script

The project includes a pre-configured script to run act:

```bash
npm run act
```

This will simulate a pull request event and run the action locally.

### Manual Testing with Different Configurations

You can also run act directly with custom parameters:

```bash
# Test with OpenAI
act pull_request -s LLM_PROVIDER=openai -s LLM_API_KEY=your_openai_api_key

# Test with Gemini
act pull_request -s LLM_PROVIDER=gemini -s LLM_API_KEY=your_gemini_api_key

# Test pull request review comment event
act pull_request_review_comment -s LLM_PROVIDER=openai -s LLM_API_KEY=your_openai_api_key
```

## Troubleshooting

### Common Issues

1. **Error: Cannot find module '@actions/core'**
   
   This is likely due to dependencies not being installed. Run:
   ```bash
   npm install
   ```

2. **Typescript Errors**
   
   If you encounter TypeScript errors, try rebuilding the project:
   ```bash
   npm run build
   ```

3. **Docker Issues**
   
   Ensure Docker is running on your system. Act uses Docker to simulate the GitHub Actions environment.

4. **API Key Issues**
   
   Verify your API keys are correct. You can test them:
   - OpenAI: https://platform.openai.com/playground
   - Gemini: https://aistudio.google.com/app/playground

### Viewing Debug Logs

To see more detailed logs:

```bash
# Run with debug logging enabled
act pull_request -s LLM_PROVIDER=openai -s LLM_API_KEY=your_openai_api_key --verbose
```

## Testing Different Scenarios

You can test different types of pull requests by modifying the example events in `.github/workflows/sample-pr.json` (you may need to create this file).

For example:

```json
{
  "pull_request": {
    "number": 1,
    "title": "Test PR",
    "body": "This is a test PR",
    "head": {
      "ref": "feature-branch",
      "sha": "abcdef123456"
    },
    "base": {
      "ref": "main",
      "sha": "fedcba654321"
    }
  },
  "repository": {
    "name": "test-repo",
    "owner": {
      "login": "test-user"
    }
  }
}
```

Then run:

```bash
act pull_request -e .github/workflows/sample-pr.json -s LLM_PROVIDER=openai -s LLM_API_KEY=your_openai_api_key
``` 