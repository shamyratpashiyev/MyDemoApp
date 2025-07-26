import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject, Observable } from 'rxjs';

export interface StreamingResponse {
  chunk?: string;
  isComplete?: boolean;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SignalrAiService {
  private hubConnection: signalR.HubConnection | null = null;
  private streamingSubject = new BehaviorSubject<StreamingResponse>({});
  
  public streaming$ = this.streamingSubject.asObservable();
  public isConnected = false;

  constructor() {
    this.initializeConnection();
  }

  private async initializeConnection(): Promise<void> {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('http://localhost:5000/aiStreamingHub', {
        withCredentials: false
      })
      .build();

    // Handle streaming events
    this.hubConnection.on('StreamStarted', (data) => {
      console.log('Stream started:', data);
      this.streamingSubject.next({ chunk: '', isComplete: false });
    });

    this.hubConnection.on('StreamChunk', (data) => {
      console.log('Stream chunk:', data);
      this.streamingSubject.next({ chunk: data.chunk, isComplete: false });
    });

    this.hubConnection.on('StreamCompleted', () => {
      console.log('Stream completed');
      this.streamingSubject.next({ isComplete: true });
    });

    this.hubConnection.on('StreamError', (data) => {
      console.error('Stream error:', data);
      this.streamingSubject.next({ error: data.error, isComplete: true });
    });

    try {
      await this.hubConnection.start();
      this.isConnected = true;
      console.log('SignalR connection established');
    } catch (error) {
      console.error('Error establishing SignalR connection:', error);
      this.isConnected = false;
    }
  }

  public async sendPrompt(prompt: string): Promise<void> {
    if (!this.hubConnection || !this.isConnected) {
      throw new Error('SignalR connection not established');
    }

    try {
      const response = await fetch('http://localhost:5000/gemini/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          connectionId: this.hubConnection.connectionId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send prompt');
      }

      const result = await response.json();
      console.log('Prompt sent:', result);
    } catch (error) {
      console.error('Error sending prompt:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (this.hubConnection) {
      await this.hubConnection.stop();
      this.isConnected = false;
    }
  }
}