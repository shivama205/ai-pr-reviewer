import { info, warning } from '@actions/core'
import { LLMProvider } from './provider'
import { OpenAIProvider } from './openai'
import { GeminiProvider } from './gemini'

export function createLLMProvider(providerName?: string): LLMProvider {
  // Default to OpenAI if no provider is specified
  const provider = providerName?.toLowerCase() || 'openai'
  
  info(`Creating LLM provider: ${provider}`)
  
  switch (provider) {
    case 'openai':
      return new OpenAIProvider()
    case 'gemini':
      return new GeminiProvider()
    default:
      warning(`Unknown provider: ${provider}, falling back to OpenAI`)
      return new OpenAIProvider()
  }
} 