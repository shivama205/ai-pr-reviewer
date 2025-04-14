import { Ids } from '../bot'
import { TokenLimits } from '../limits'

export interface LLMOptions {
  model: string
  tokenLimits: TokenLimits
  baseUrl?: string
  apiKey?: string
  temperature?: number
  timeoutMs?: number
  retries?: number
  debug?: boolean
  systemMessage?: string
}

export interface LLMResponse {
  text: string
  id?: string
  conversationId?: string
}

export interface LLMProvider {
  initialize(options: LLMOptions): void
  sendMessage(message: string, parentMessageId?: string): Promise<LLMResponse>
  countTokens(text: string): number
} 