import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface GeminiModel {
  id: string;
  name: string;
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private backendUrl = 'http://localhost:5134/gemini';

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

  constructor(private http: HttpClient) {
    this.fetchAvailableModels();
  }

  /**
   * Fetch available models from the API
   */
  private fetchAvailableModels(): void {
    // This part is now client-side only, as the backend handles the model logic.
    // We can keep this to display model options in the UI.
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
    this._modelsLoading.next(false);
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
   * Send a message to the backend and get a response
   * @param message The user's message
   * @returns An Observable with the AI's response
   */
  sendMessage(message: string): Observable<string> {
    const params = new HttpParams().set('prompt', message);
    return this.http.post(`${this.backendUrl}`, null, { params, responseType: 'text' }).pipe(
      catchError(error => {
        console.error('Error fetching response from backend:', error);
        return of('Sorry, I encountered an error connecting to the backend.');
      })
    );
  }
}
