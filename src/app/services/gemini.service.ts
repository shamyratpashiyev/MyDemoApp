import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, of, Subject } from 'rxjs';
import { catchError, map, takeUntil, filter } from 'rxjs/operators';
import * as signalR from '@microsoft/signalr';

export interface GeminiModel {
  id: string;
  name: string;
  description: string;
}

export interface StreamingMessage {
  chunk: string;
  isComplete: boolean;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private backendUrl = 'http://localhost:5134/gemini';
  private streamingUrl = 'http://localhost:5134/gemini/stream';
  private signalRUrl = 'http://localhost:5134/aiStreamingHub';
  
  // SignalR connection
  private hubConnection: signalR.HubConnection | null = null;
  private isSignalRConnected = false;

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
    this.initializeSignalRConnection();
  }

  /**
   * Initialize SignalR connection
   */
  private async initializeSignalRConnection(): Promise<void> {
    try {
      this.hubConnection = new signalR.HubConnectionBuilder()
        .withUrl(this.signalRUrl, {
          withCredentials: false
        })
        .build();

      await this.hubConnection.start();
      this.isSignalRConnected = true;
      console.log('SignalR connection established');
    } catch (error) {
      console.error('Error establishing SignalR connection:', error);
      this.isSignalRConnected = false;
    }
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
   * Send a message to the backend and get a streaming response
   * @param message The user's message
   * @returns An Observable with the AI's streaming response
   */
  sendMessage(message: string): Observable<string> {
    if (!this.isSignalRConnected || !this.hubConnection) {
      // Fallback to HTTP request if SignalR is not available
      console.warn('SignalR not connected, falling back to HTTP request');
      return this.sendMessageHttp(message);
    }

    return new Observable<string>(observer => {
      let fullResponse = '';
      let streamCompleted = false;

      // Set up SignalR event handlers for this specific request
      const onStreamStarted = (data: any) => {
        console.log('Stream started:', data);
        fullResponse = '';
      };

      const onStreamChunk = (data: any) => {
        console.log('Stream chunk received:', data);
        if (data.chunk) {
          fullResponse += data.chunk;
          // Emit the accumulated response so far
          observer.next(fullResponse);
        }
      };

      const onStreamCompleted = () => {
        console.log('Stream completed');
        streamCompleted = true;
        observer.complete();
      };

      const onStreamError = (data: any) => {
        console.error('Stream error:', data);
        observer.error(new Error(data.error || 'Streaming error occurred'));
      };

      // Register event handlers
      this.hubConnection!.on('StreamStarted', onStreamStarted);
      this.hubConnection!.on('StreamChunk', onStreamChunk);
      this.hubConnection!.on('StreamCompleted', onStreamCompleted);
      this.hubConnection!.on('StreamError', onStreamError);

      // Send the streaming request
      const connectionId = this.hubConnection!.connectionId;
      if (!connectionId) {
        observer.error(new Error('SignalR connection ID not available'));
        return;
      }
      
      this.sendStreamingRequest(message, connectionId)
        .catch(error => {
          console.error('Error sending streaming request:', error);
          observer.error(error);
        });

      // Cleanup function
      return () => {
        if (this.hubConnection) {
          this.hubConnection.off('StreamStarted', onStreamStarted);
          this.hubConnection.off('StreamChunk', onStreamChunk);
          this.hubConnection.off('StreamCompleted', onStreamCompleted);
          this.hubConnection.off('StreamError', onStreamError);
        }
      };
    });
  }

  /**
   * Send streaming request to the backend
   */
  private async sendStreamingRequest(prompt: string, connectionId: string): Promise<void> {
    const response = await fetch(this.streamingUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
        connectionId: connectionId
      })
    });

    if (!response.ok) {
      throw new Error('Failed to send streaming request');
    }
  }

  /**
   * Fallback HTTP method (original implementation)
   */
  private sendMessageHttp(message: string): Observable<string> {
    const params = new HttpParams().set('prompt', message);
    return this.http.post(`${this.backendUrl}`, null, { params, responseType: 'text' }).pipe(
      catchError(error => {
        console.error('Error fetching response from backend:', error);
        return of('Sorry, I encountered an error connecting to the backend.');
      })
    );
  }

  /**
   * Send a message and get streaming chunks (individual chunks, not accumulated)
   * @param message The user's message
   * @returns An Observable with individual streaming chunks
   */
  sendMessageStreaming(message: string): Observable<StreamingMessage> {
    if (!this.isSignalRConnected || !this.hubConnection) {
      // Fallback to HTTP request if SignalR is not available
      console.warn('SignalR not connected, falling back to HTTP request');
      return this.sendMessageHttp(message).pipe(
        map(response => ({ chunk: response, isComplete: true }))
      );
    }

    return new Observable<StreamingMessage>(observer => {
      // Set up SignalR event handlers for this specific request
      const onStreamStarted = (data: any) => {
        console.log('Stream started:', data);
        observer.next({ chunk: '', isComplete: false });
      };

      const onStreamChunk = (data: any) => {
        console.log('Stream chunk received:', data);
        if (data.chunk) {
          observer.next({ chunk: data.chunk, isComplete: false });
        }
      };

      const onStreamCompleted = () => {
        console.log('Stream completed');
        observer.next({ chunk: '', isComplete: true });
        observer.complete();
      };

      const onStreamError = (data: any) => {
        console.error('Stream error:', data);
        observer.next({ chunk: '', isComplete: true, error: data.error });
        observer.error(new Error(data.error || 'Streaming error occurred'));
      };

      // Register event handlers
      this.hubConnection!.on('StreamStarted', onStreamStarted);
      this.hubConnection!.on('StreamChunk', onStreamChunk);
      this.hubConnection!.on('StreamCompleted', onStreamCompleted);
      this.hubConnection!.on('StreamError', onStreamError);

      // Send the streaming request
      const connectionId = this.hubConnection!.connectionId;
      if (!connectionId) {
        observer.error(new Error('SignalR connection ID not available'));
        return;
      }
      
      this.sendStreamingRequest(message, connectionId)
        .catch(error => {
          console.error('Error sending streaming request:', error);
          observer.error(error);
        });

      // Cleanup function
      return () => {
        if (this.hubConnection) {
          this.hubConnection.off('StreamStarted', onStreamStarted);
          this.hubConnection.off('StreamChunk', onStreamChunk);
          this.hubConnection.off('StreamCompleted', onStreamCompleted);
          this.hubConnection.off('StreamError', onStreamError);
        }
      };
    });
  }

  /**
   * Get connection status
   */
  isConnected(): boolean {
    return this.isSignalRConnected;
  }

  /**
   * Disconnect SignalR connection
   */
  async disconnect(): Promise<void> {
    if (this.hubConnection) {
      await this.hubConnection.stop();
      this.isSignalRConnected = false;
    }
  }
}
