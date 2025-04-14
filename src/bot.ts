import './fetch-polyfill'

import {info, setFailed, warning} from '@actions/core'
import { Options } from './options'
import { LLMProvider, LLMOptions } from './llm/provider'
import { createLLMProvider } from './llm/factory'

// define type to save parentMessageId and conversationId
export interface Ids {
  parentMessageId?: string
  conversationId?: string
}

export class Bot {
  private readonly provider: LLMProvider
  private readonly options: Options

  constructor(options: Options, modelOptions: LLMOptions) {
    this.options = options
    
    const provider = process.env.LLM_PROVIDER || 'openai'
    const apiKey = process.env.LLM_API_KEY
    
    if (!apiKey) {
      const err = "Unable to initialize the LLM API, 'LLM_API_KEY' environment variable is not available"
      throw new Error(err)
    }
    
    // Create the appropriate provider
    this.provider = createLLMProvider(provider)
    
    // Add language to system message
    const currentDate = new Date().toISOString().split('T')[0]
    const completeSystemMessage = `${options.systemMessage} 
Knowledge cutoff: ${modelOptions.tokenLimits.knowledgeCutOff}
Current date: ${currentDate}

IMPORTANT: Entire response must be in the language with ISO code: ${options.language}
`
    
    // Initialize the provider with options
    this.provider.initialize({
      ...modelOptions,
      apiKey,
      baseUrl: options.apiBaseUrl,
      temperature: options.openaiModelTemperature, // Using openai name for backward compatibility
      timeoutMs: options.openaiTimeoutMS, // Using openai name for backward compatibility
      retries: options.openaiRetries, // Using openai name for backward compatibility
      debug: options.debug,
      systemMessage: completeSystemMessage
    })
  }

  chat = async (message: string, ids: Ids): Promise<[string, Ids]> => {
    let res: [string, Ids] = ['', {}]
    try {
      res = await this.chat_(message, ids)
      return res
    } catch (e: unknown) {
      warning(`Failed to chat: ${e instanceof Error ? e.message : String(e)}, backtrace: ${e instanceof Error ? e.stack : ''}`)
      return res
    }
  }

  private readonly chat_ = async (
    message: string,
    ids: Ids
  ): Promise<[string, Ids]> => {
    // record timing
    const start = Date.now()
    if (!message) {
      return ['', {}]
    }

    try {
      const response = await this.provider.sendMessage(message, ids.parentMessageId)
      
      const end = Date.now()
      info(`LLM sendMessage response time: ${end - start} ms`)
      
      if (this.options.debug) {
        info(`LLM response: ${JSON.stringify(response)}`)
      }
      
      let responseText = response.text || ''
      
      // remove the prefix "with " in the response for consistency
      if (responseText.startsWith('with ')) {
        responseText = responseText.substring(5)
      }
      
      const newIds: Ids = {
        parentMessageId: response.id,
        conversationId: response.conversationId
      }
      
      return [responseText, newIds]
    } catch (e: unknown) {
      info(`Failed to send message: ${e instanceof Error ? e.message : String(e)}`)
      return ['', {}]
    }
  }
}
