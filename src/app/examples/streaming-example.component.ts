import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GeminiService } from '../services/gemini.service';

@Component({
  selector: 'app-streaming-example',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="streaming-example">
      <h2>Gemini Service Streaming Example</h2>
      
      <div class="connection-status">
        <span [class]="geminiService.isConnected() ? 'connected' : 'disconnected'">
          {{ geminiService.isConnected() ? 'SignalR Connected' : 'SignalR Disconnected (using HTTP fallback)' }}
        </span>
      </div>

      <div class="input-section">
        <textarea 
          [(ngModel)]="prompt" 
          placeholder="Enter your prompt here..."
          rows="3"
          class="prompt-input"
          [disabled]="isLoading">
        </textarea>
        <button 
          (click)="sendMessage()" 
          [disabled]="!prompt.trim() || isLoading"
          class="send-button">
          {{ isLoading ? 'Streaming...' : 'Send Message' }}
        </button>
      </div>

      <div class="response-section">
        <h3>Response:</h3>
        <div class="response-container">
          <div class="response-text" [innerHTML]="response"></div>
          <div *ngIf="isLoading" class="loading-indicator">
            <span class="streaming-dots">●●●</span>
            <span>Streaming response...</span>
          </div>
        </div>
      </div>

      <div class="example-section">
        <h3>How to use in your components:</h3>
        <pre class="code-example">{{ codeExample }}</pre>
      </div>
    </div>
  `,
  styles: [`
    .streaming-example {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      font-family: Arial, sans-serif;
    }

    .connection-status {
      text-align: center;
      margin-bottom: 20px;
      padding: 10px;
      border-radius: 5px;
      background-color: #f8f9fa;
    }

    .connected {
      color: #28a745;
      font-weight: bold;
    }

    .disconnected {
      color: #ffc107;
      font-weight: bold;
    }

    .input-section {
      margin-bottom: 30px;
    }

    .prompt-input {
      width: 100%;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 5px;
      margin-bottom: 10px;
      font-size: 14px;
      resize: vertical;
    }

    .send-button {
      padding: 10px 20px;
      background-color: #007bff;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-size: 14px;
    }

    .send-button:disabled {
      background-color: #6c757d;
      cursor: not-allowed;
    }

    .response-section {
      margin-bottom: 30px;
    }

    .response-container {
      border: 1px solid #ddd;
      border-radius: 5px;
      padding: 15px;
      min-height: 100px;
      background-color: #f8f9fa;
    }

    .response-text {
      white-space: pre-wrap;
      line-height: 1.5;
    }

    .loading-indicator {
      display: flex;
      align-items: center;
      gap: 10px;
      color: #007bff;
      font-style: italic;
      margin-top: 10px;
    }

    .streaming-dots {
      animation: pulse 1.5s infinite;
    }

    @keyframes pulse {
      0%, 50%, 100% { opacity: 1; }
      25%, 75% { opacity: 0.5; }
    }

    .example-section {
      background-color: #f8f9fa;
      padding: 20px;
      border-radius: 5px;
      border-left: 4px solid #007bff;
    }

    .code-example {
      background-color: #2d3748;
      color: #e2e8f0;
      padding: 15px;
      border-radius: 5px;
      overflow-x: auto;
      font-size: 12px;
      line-height: 1.4;
    }
  `]
})
export class StreamingExampleComponent {
  prompt: string = '';
  response: string = '';
  isLoading: boolean = false;

  codeExample = `// Using the updated sendMessage method with streaming:

constructor(private geminiService: GeminiService) {}

sendMessage() {
  this.geminiService.sendMessage(this.prompt).subscribe({
    next: (accumulatedResponse) => {
      // This receives the accumulated response as it streams
      this.response = accumulatedResponse;
    },
    complete: () => {
      console.log('Streaming completed');
      this.isLoading = false;
    },
    error: (error) => {
      console.error('Error:', error);
      this.isLoading = false;
    }
  });
}

// Alternative: Using sendMessageStreaming for individual chunks:

sendMessageWithChunks() {
  this.geminiService.sendMessageStreaming(this.prompt).subscribe({
    next: (streamingMessage) => {
      if (streamingMessage.chunk) {
        this.response += streamingMessage.chunk; // Append each chunk
      }
      if (streamingMessage.isComplete) {
        this.isLoading = false;
      }
    },
    error: (error) => {
      console.error('Error:', error);
      this.isLoading = false;
    }
  });
}`;

  constructor(public geminiService: GeminiService) {}

  sendMessage(): void {
    if (!this.prompt.trim()) return;

    this.isLoading = true;
    this.response = '';

    // Using the updated sendMessage method
    this.geminiService.sendMessage(this.prompt).subscribe({
      next: (accumulatedResponse) => {
        // This receives the accumulated response as it streams
        this.response = accumulatedResponse;
      },
      complete: () => {
        console.log('Streaming completed');
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error:', error);
        this.response = 'Error: ' + error.message;
        this.isLoading = false;
      }
    });
  }
}