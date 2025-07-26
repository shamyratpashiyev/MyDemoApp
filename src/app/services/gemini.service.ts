import { Injectable } from '@angular/core';
import { GoogleGenAI } from '@google/genai';
import { Observable, from, BehaviorSubject } from 'rxjs';
import { ChatMessage } from '../models/message.model';

export interface GeminiModel {
  id: string;
  name: string;
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private genAi!: GoogleGenAI;
  private GEMINI_API_KEY: string = 'AIzaSyA0saeZPd0LNlwqdJuIqfy4FQS8mUBWTUM';

  // Model descriptions for the models we want to display
  private modelDescriptions: Record<string, string> = {
    'gemini-1.5-flash': 'Best for complex tasks with faster response times',
    'gemini-2.0-flash-001': 'Latest model, optimized for chat and simple tasks'
  };

  // Models we want to display (will be populated from API)
  private availableModels: GeminiModel[] = [];

  // Current model (will be set after fetching models)
  private _currentModel = new BehaviorSubject<GeminiModel | null>(null);
  public currentModel$ = this._currentModel.asObservable();

  // Loading state for models
  private _modelsLoading = new BehaviorSubject<boolean>(true);
  public modelsLoading$ = this._modelsLoading.asObservable();

  constructor() {
    try {
      this.genAi = new GoogleGenAI({ apiKey: this.GEMINI_API_KEY });
      this.fetchAvailableModels();
    } catch (error) {
      console.error('Error initializing Gemini service:', error);
      this._modelsLoading.next(false);
    }
  }

  /**
   * Fetch available models from the API
   */
  private async fetchAvailableModels(): Promise<void> {
    try {
      this._modelsLoading.next(true);

      // Get models from API - this is a workaround since we can't directly access the models
      // In a real app, we would use the proper API to get the models

      // For now, let's just use our hardcoded models with correct IDs
      const modelsList: Array<{name: string}> = [
        { name: 'gemini-1.5-flash' }, // Using flash instead of pro to avoid quota issues
        { name: 'gemini-2.0-flash-001' }
      ];

      // Filter to only include the models we want to display
      const filteredModels = modelsList.filter((model: {name: string}) =>
        model.name === 'gemini-1.5-flash' || model.name === 'gemini-2.0-flash-001'
      );

      // Map to our GeminiModel interface
      this.availableModels = filteredModels.map((model: {name: string}) => ({
        id: model.name,
        name: this.formatModelName(model.name),
        description: this.modelDescriptions[model.name] || 'A Gemini AI model'
      }));

      // Set default model if we have models
      if (this.availableModels.length > 0) {
        this._currentModel.next(this.availableModels[0]);
      } else {
        // Fallback to hardcoded models if no matching models found
        this.setFallbackModels();
      }

      this._modelsLoading.next(false);
    } catch (error) {
      console.error('Error fetching models:', error);
      this.setFallbackModels();
      this._modelsLoading.next(false);
    }
  }

  /**
   * Set fallback models if API fails
   */
  private setFallbackModels(): void {
    this.availableModels = [
      {
        id: 'gemini-1.5-flash',
        name: 'Gemini 1.5 Flash',
        description: this.modelDescriptions['gemini-1.5-flash']
      },
      {
        id: 'gemini-2.0-flash-001',
        name: 'Gemini 2.0 Flash',
        description: this.modelDescriptions['gemini-2.0-flash-001']
      }
    ];

    this._currentModel.next(this.availableModels[0]);
  }

  /**
   * Format model name for display
   */
  private formatModelName(modelId: string): string {
    if (modelId === 'gemini-1.5-flash') {
      return 'Gemini 1.5 Flash';
    } else if (modelId === 'gemini-2.0-flash-001') {
      return 'Gemini 2.0 Flash';
    }

    // Default formatting for other models
    return modelId
      .replace('gemini-', 'Gemini ')
      .replace(/-/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase());
  }

  /**
   * Get all available models
   */
  getAvailableModels(): GeminiModel[] {
    return [...this.availableModels];
  }

  /**
   * Set the current model
   */
  setCurrentModel(modelId: string): void {
    const model = this.availableModels.find(m => m.id === modelId);
    if (model) {
      this._currentModel.next(model);
    }
  }

  /**
   * Send a message to the Gemini API and get a response
   * @param message The user's message
   * @returns An Observable with the AI's response
   */
  sendMessage(message: string): Observable<string> {
    return from(this.generateResponse(message));
  }

  /**
   * Private method to handle the actual API call
   */
  private async generateResponse(message: string): Promise<string> {
    try {
      // Get current model
      const currentModel = this._currentModel.value;
      if (!currentModel) {
        return 'Sorry, no AI model is currently selected or models are still loading. Please try again in a moment.';
      }

      // Use the selected model
      const result = await this.genAi.models.generateContent({
        model: currentModel.id,
        contents: message,
      });
      return result.text ?? 'Sorry, I encountered an error processing your request.';
    } catch (error) {
      console.error('Error generating response:', error);
      if (error instanceof Error) {
        return `Sorry, I encountered an error: ${error.message}`;
      }
      return 'Sorry, I encountered an error processing your request.';
    }
  }
}
