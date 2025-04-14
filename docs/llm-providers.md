# LLM Provider Support

This document explains how to use different LLM providers with the AI PR Reviewer.

## Supported Providers

Currently, the following LLM providers are supported:

1. **OpenAI** (default)
   - Models: `gpt-3.5-turbo`, `gpt-4`, etc.
   - Best for: High-quality code reviews and detailed suggestions

2. **Google Gemini**
   - Models: `gemini-pro`
   - Best for: Cost-effective reviews with good reasoning capabilities

## Configuration

### Environment Variables

The following environment variables are used to configure the LLM provider:

- `LLM_PROVIDER`: Specifies which provider to use. Options:
  - `openai` (default)
  - `gemini`
- `LLM_API_KEY`: The API key for the selected provider

Provider-specific environment variables:
- OpenAI:
  - `OPENAI_API_ORG` (optional): The organization ID for OpenAI API

### GitHub Action Configuration

Here's how to configure different providers in your GitHub Actions workflow:

#### OpenAI (Default)

```yaml
steps:
  - uses: coderabbitai/ai-pr-reviewer@latest
    env:
      GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      LLM_PROVIDER: openai
      LLM_API_KEY: ${{ secrets.OPENAI_API_KEY }}
      OPENAI_API_ORG: ${{ secrets.OPENAI_API_ORG }} # Optional
    with:
      openai_light_model: gpt-3.5-turbo
      openai_heavy_model: gpt-4
      openai_model_temperature: 0.05
```

#### Google Gemini

```yaml
steps:
  - uses: coderabbitai/ai-pr-reviewer@latest
    env:
      GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      LLM_PROVIDER: gemini
      LLM_API_KEY: ${{ secrets.GEMINI_API_KEY }}
    with:
      openai_light_model: gemini-pro
      openai_heavy_model: gemini-pro
      openai_model_temperature: 0.2
```

## Getting API Keys

### OpenAI

1. Go to [OpenAI API Keys](https://platform.openai.com/account/api-keys)
2. Create a new API key
3. Add the key to your GitHub repository secrets as `OPENAI_API_KEY`

### Google Gemini

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create an API key
3. Add the key to your GitHub repository secrets as `GEMINI_API_KEY`

## Provider-Specific Notes

### OpenAI

- Supports conversation history with more sophisticated context handling
- Offers multiple model options with different capabilities and price points
- Consider using `gpt-3.5-turbo` for summaries and `gpt-4` for detailed reviews

### Google Gemini

- Generally more cost-effective than GPT-4
- Good for code understanding and reviews
- Currently only has `gemini-pro` as the primary model
- Conversation handling is implemented via a custom in-memory map
- Token counting uses the OpenAI tokenizer as an approximation

## Customizing Prompts

The system message and prompts may need adjustment depending on the provider. While the default prompts work across providers, you might want to optimize them for specific models:

```yaml
with:
  system_message: |
    You are `@coderabbitai` (aka `github-actions[bot]`), an AI assistant 
    specialized in code review. Focus on improving:
    - Logic
    - Security
    - Performance
    - Error handling
    - Best practices
```

## Troubleshooting

### OpenAI Issues

- "API key not valid" error: Ensure your API key is correct and has not expired
- Rate limit errors: Consider adjusting the `openai_concurrency_limit` to a lower value
- Timeout errors: Increase `openai_timeout_ms` for complex reviews

### Gemini Issues

- "API key not valid" error: Verify your Gemini API key
- If Gemini responses seem cut off: This could be due to model limitations, try breaking up the code into smaller segments

## Future Provider Support

The architecture is designed to be extensible. To add support for additional LLM providers:

1. Create a new provider class implementing the `LLMProvider` interface
2. Add the provider to the factory
3. Update the documentation with the new provider details 