import '../fetch-polyfill'
import { info, warning } from '@actions/core'
import {
  ChatGPTAPI,
  ChatGPTError,
  ChatMessage,
  SendMessageOptions
} from 'chatgpt'
import pRetry from 'p-retry'
import { getTokenCount } from '../tokenizer'
import { LLMOptions, LLMProvider, LLMResponse } from './provider'

export class OpenAIProvider implements LLMProvider {
  private api: ChatGPTAPI | null = null
  private options: LLMOptions | null = null
  private systemMessage: string = ''

  initialize(options: LLMOptions): void {
    this.options = options
    
    const currentDate = new Date().toISOString().split('T')[0]
    this.systemMessage = options.systemMessage || ''
    
    if (!options.apiKey) {
      throw new Error('OpenAI API key is required')
    }

    this.api = new ChatGPTAPI({
      apiBaseUrl: options.baseUrl || 'https://api.openai.com/v1',
      systemMessage: this.systemMessage
        ? `${this.systemMessage}
Knowledge cutoff: ${options.tokenLimits.knowledgeCutOff}
Current date: ${currentDate}`
        : undefined,
      apiKey: options.apiKey,
      apiOrg: process.env.OPENAI_API_ORG ?? undefined,
      debug: options.debug || false,
      maxModelTokens: options.tokenLimits.maxTokens,
      maxResponseTokens: options.tokenLimits.responseTokens,
      completionParams: {
        temperature: options.temperature || 0,
        model: options.model
      }
    })
  }

  async sendMessage(message: string, parentMessageId?: string): Promise<LLMResponse> {
    if (!this.api || !this.options) {
      throw new Error('OpenAI provider not initialized')
    }

    const start = Date.now()
    if (!message) {
      return { text: '' }
    }

    let response: ChatMessage | undefined
    
    const opts: SendMessageOptions = {
      timeoutMs: this.options.timeoutMs || 120000
    }
    
    if (parentMessageId) {
      opts.parentMessageId = parentMessageId
    }
    
    try {
      response = await pRetry(() => this.api!.sendMessage(message, opts), {
        retries: this.options.retries || 3
      })
    } catch (e: unknown) {
      if (e instanceof ChatGPTError) {
        info(
          `response: ${response}, failed to send message to openai: ${e}, backtrace: ${e.stack}`
        )
      }
    }
    
    const end = Date.now()
    info(`openai sendMessage (including retries) response time: ${end - start} ms`)
    
    let responseText = ''
    if (response != null) {
      responseText = response.text
    } else {
      warning('openai response is null')
    }
    
    // remove the prefix "with " in the response
    if (responseText.startsWith('with ')) {
      responseText = responseText.substring(5)
    }
    
    return {
      text: responseText,
      id: response?.id,
      conversationId: response?.conversationId
    }
  }

  countTokens(text: string): number {
    return getTokenCount(text)
  }
} 