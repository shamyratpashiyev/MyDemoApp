import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SignalrAiService, StreamingResponse } from '../services/signalr-ai.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-streaming-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="streaming-chat">
      <h2>Real-time AI Streaming Chat</h2>
      
      <div class="connection-status">
        <span [class]="isConnected ? 'connected' : 'disconnected'">
          {{ isConnected ? 'Connected' : 'Disconnected' }}
        </span>
      </div>

      <div class="chat-container">
        <div class="messages">
          <div *ngFor="let message of messages" 
               [class]="'message ' + (message.isUser ? 'user' : 'ai')">
            <div class="message-content" [innerHTML]="message.content"></div>
            <div class="message-time">{{ message.timestamp | date:'short' }}</div>
          </div>
          
          <div *ngIf="isStreaming" class="message ai streaming">
            <div class="message-content" [innerHTML]="currentStreamingMessage"></div>
            <div class="streaming-indicator">●●●</div>
          </div>
        </div>

        <div class="input-area">
          <input 
            type="text" 
            [(ngModel)]="newMessage" 
            (keyup.enter)="sendMessage()"
            placeholder="Type your message..."
            [disabled]="!isConnected || isStreaming"
            class="message-input">
          <button 
            (click)="sendMessage()" 
            [disabled]="!isConnected || isStreaming || !newMessage.trim()"
            class="send-button">
            {{ isStreaming ? 'Streaming...' : 'Send' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .streaming-chat {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }

    .connection-status {
      margin-bottom: 20px;
      text-align: center;
    }

    .connected {
      color: green;
      font-weight: bold;
    }

    .disconnected {
      color: red;
      font-weight: bold;
    }

    .chat-container {
      border: 1px solid #ddd;
      border-radius: 8px;
      height: 500px;
      display: flex;
      flex-direction: column;
    }

    .messages {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
      background-color: #f9f9f9;
    }

    .message {
      margin-bottom: 15px;
      padding: 10px;
      border-radius: 8px;
      max-width: 70%;
    }

    .message.user {
      background-color: #007bff;
      color: white;
      margin-left: auto;
      text-align: right;
    }

    .message.ai {
      background-color: white;
      border: 1px solid #ddd;
    }

    .message.streaming {
      border-color: #007bff;
      background-color: #f0f8ff;
    }

    .message-content {
      margin-bottom: 5px;
      white-space: pre-wrap;
    }

    .message-time {
      font-size: 0.8em;
      opacity: 0.7;
    }

    .streaming-indicator {
      color: #007bff;
      font-weight: bold;
      animation: pulse 1.5s infinite;
    }

    @keyframes pulse {
      0%, 50%, 100% { opacity: 1; }
      25%, 75% { opacity: 0.5; }
    }

    .input-area {
      display: flex;
      padding: 20px;
      border-top: 1px solid #ddd;
      background-color: white;
    }

    .message-input {
      flex: 1;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      margin-right: 10px;
    }

    .send-button {
      padding: 10px 20px;
      background-color: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }

    .send-button:disabled {
      background-color: #ccc;
      cursor: not-allowed;
    }
  `]
})
export class StreamingChatComponent implements OnInit, OnDestroy {
  messages: Array<{content: string, isUser: boolean, timestamp: Date}> = [];
  newMessage: string = '';
  isStreaming: boolean = false;
  currentStreamingMessage: string = '';
  isConnected: boolean = false;
  
  private streamingSubscription?: Subscription;

  constructor(private signalrService: SignalrAiService) {}

  ngOnInit(): void {
    this.isConnected = this.signalrService.isConnected;
    
    // Subscribe to streaming responses
    this.streamingSubscription = this.signalrService.streaming$.subscribe(
      (response: StreamingResponse) => {
        if (response.chunk !== undefined) {
          if (response.chunk === '' && !response.isComplete) {
            // Stream started
            this.isStreaming = true;
            this.currentStreamingMessage = '';
          } else if (response.chunk) {
            // New chunk received
            this.currentStreamingMessage += response.chunk;
          }
        }
        
        if (response.isComplete) {
          // Stream completed
          if (this.currentStreamingMessage) {
            this.messages.push({
              content: this.currentStreamingMessage,
              isUser: false,
              timestamp: new Date()
            });
          }
          
          if (response.error) {
            this.messages.push({
              content: `Error: ${response.error}`,
              isUser: false,
              timestamp: new Date()
            });
          }
          
          this.isStreaming = false;
          this.currentStreamingMessage = '';
        }
      }
    );

    // Add welcome message
    this.messages.push({
      content: 'Hello! I\'m your AI assistant with real-time streaming. How can I help you today?',
      isUser: false,
      timestamp: new Date()
    });
  }

  ngOnDestroy(): void {
    if (this.streamingSubscription) {
      this.streamingSubscription.unsubscribe();
    }
    this.signalrService.disconnect();
  }

  async sendMessage(): Promise<void> {
    if (!this.newMessage.trim() || !this.isConnected || this.isStreaming) {
      return;
    }

    // Add user message
    this.messages.push({
      content: this.newMessage,
      isUser: true,
      timestamp: new Date()
    });

    const message = this.newMessage;
    this.newMessage = '';

    try {
      await this.signalrService.sendPrompt(message);
    } catch (error) {
      console.error('Error sending message:', error);
      this.messages.push({
        content: 'Error sending message. Please try again.',
        isUser: false,
        timestamp: new Date()
      });
    }
  }
}