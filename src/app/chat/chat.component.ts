import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GeminiService, GeminiModel } from '../services/gemini.service';
import { ChatMessage } from '../models/message.model';
import { ModelSelectorComponent } from '../model-selector/model-selector.component';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, ModelSelectorComponent],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss'
})
export class ChatComponent implements OnInit {
  messages: ChatMessage[] = [];
  newMessage: string = '';
  isLoading: boolean = false;
  currentModel: GeminiModel | null = null;

  constructor(private geminiService: GeminiService) {
    // Subscribe to model changes
    this.geminiService.currentModel$.subscribe(model => {
      this.currentModel = model;
      // Add a message when model changes (except on initial load)
      if (model && this.messages.length > 1) {
        this.messages.push({
          content: `Model changed to ${model.name}. How can I help you?`,
          isUser: false,
          timestamp: new Date()
        });
      }
    });
  }

  ngOnInit(): void {
    // Add a welcome message when the component initializes
    this.messages.push({
      content: 'Hello! I\'m your AI assistant powered by Google Gemini. How can I help you today?',
      isUser: false,
      timestamp: new Date()
    });
  }

  /**
   * Send a message to the AI and get a response
   */
  sendMessage(): void {
    if (!this.newMessage.trim()) return;
    
    // Add user message to the chat
    this.messages.push({
      content: this.newMessage,
      isUser: true,
      timestamp: new Date()
    });
    
    const userMessage = this.newMessage;
    this.newMessage = ''; // Clear input field
    this.isLoading = true;
    
    // Get response from Gemini
    this.geminiService.sendMessage(userMessage).subscribe({
      next: (response) => {
        // Add AI response to the chat
        this.messages.push({
          content: response,
          isUser: false,
          timestamp: new Date()
        });
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error getting response:', error);
        // Add error message to the chat
        this.messages.push({
          content: 'Sorry, I encountered an error processing your request.',
          isUser: false,
          timestamp: new Date()
        });
        this.isLoading = false;
      }
    });
  }
}
