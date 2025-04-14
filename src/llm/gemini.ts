import { info, warning } from '@actions/core'
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai'
import { getTokenCount } from '../tokenizer'
import { LLMOptions, LLMProvider, LLMResponse } from './provider'

// Basic map to store conversations
const conversationMap = new Map<string, {
  history: Array<{role: string, parts: Array<{text: string}>}>,
  model: GenerativeModel
}>()

export class GeminiProvider implements LLMProvider {
  private model: GenerativeModel | null = null
  private options: LLMOptions | null = null
  private generativeAI: GoogleGenerativeAI | null = null

  initialize(options: LLMOptions): void {
    this.options = options
    
    if (!options.apiKey) {
      throw new Error('Gemini API key is required')
    }

    this.generativeAI = new GoogleGenerativeAI(options.apiKey)
    
    // Configure the model
    this.model = this.generativeAI.getGenerativeModel({
      model: options.model,
      generationConfig: {
        temperature: options.temperature || 0.0,
        // Additional Gemini-specific parameters can be added here
      }
    })
  }

  async sendMessage(message: string, parentMessageId?: string): Promise<LLMResponse> {
    if (!this.model || !this.options) {
      throw new Error('Gemini provider not initialized')
    }

    const start = Date.now()
    if (!message) {
      return { text: '' }
    }

    let responseText = ''
    let conversationId = parentMessageId || `conversation-${Date.now()}`
    
    try {
      // If this is a follow-up message in a conversation
      if (parentMessageId && conversationMap.has(parentMessageId)) {
        const conversation = conversationMap.get(parentMessageId)!
        
        // Add the user message to the history
        conversation.history.push({
          role: 'user',
          parts: [{ text: message }]
        })
        
        // Use the chat feature for multi-turn conversations
        const result = await conversation.model.generateContent({
          contents: conversation.history
        })
        
        responseText = result.response.text()
        
        // Add the model's response to the history
        conversation.history.push({
          role: 'model',
          parts: [{ text: responseText }]
        })
      } 
      // If this is a new conversation
      else {
        // For new conversations, include system message if provided
        const systemMessage = this.options.systemMessage || '';
        const initialHistory = systemMessage
          ? [{ role: 'system', parts: [{ text: systemMessage }] }]
          : [];
          
        initialHistory.push({
          role: 'user',
          parts: [{ text: message }]
        });
        
        // Start a chat session
        const result = await this.model.generateContent({
          contents: initialHistory
        });
        
        responseText = result.response.text();
        
        // Create a new conversation in the map
        conversationMap.set(conversationId, {
          history: [
            ...initialHistory,
            {
              role: 'model',
              parts: [{ text: responseText }]
            }
          ],
          model: this.model
        });
      }
    } catch (e: unknown) {
      warning(`Error generating content with Gemini: ${e instanceof Error ? e.message : String(e)}`)
      return { text: '' }
    }
    
    const end = Date.now()
    info(`Gemini sendMessage response time: ${end - start} ms`)
    
    // Trim any "with " prefix for consistency with OpenAI
    if (responseText.startsWith('with ')) {
      responseText = responseText.substring(5)
    }
    
    // Generate a unique ID for this response
    const responseId = `gemini-response-${Date.now()}`
    
    return {
      text: responseText,
      id: responseId,
      conversationId: conversationId
    }
  }

  countTokens(text: string): number {
    // Gemini doesn't have a built-in token counter
    // For simplicity, we'll use the same tokenizer as OpenAI for now
    // In a production environment, you might want to use a different counting mechanism for Gemini
    return getTokenCount(text)
  }
} 