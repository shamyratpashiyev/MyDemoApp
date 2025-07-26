import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GeminiService, GeminiModel } from '../services/gemini.service';
import { ElevenLabsService } from '../services/eleven-labs.service';
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
  @ViewChild('audioPlayer') audioPlayer!: ElementRef<HTMLAudioElement>;
  messages: ChatMessage[] = [];
  newMessage: string = '';
  isLoading: boolean = false;
  currentModel: GeminiModel | null = null;
  isTextToSpeechEnabled: boolean = true;

  constructor(private geminiService: GeminiService, private elevenLabsService: ElevenLabsService) {
    // Subscribe to model changes
    this.geminiService.currentModel$.subscribe(model => {
      this.currentModel = model;
      // Add a message when model changes (except on initial load)
      if (model && this.messages.length > 1) {
        const messageContent = `Model changed to ${model.name}. How can I help you?`;
        this.messages.push({
          content: messageContent,
          isUser: false,
          timestamp: new Date()
        });
      }
    });
  }

  ngOnInit(): void {
    const welcomeMessage = 'Hello! I\'m your AI assistant powered by Google Gemini. How can I help you today?';
    // Add a welcome message when the component initializes
    this.messages.push({
      content: welcomeMessage,
      isUser: false,
      timestamp: new Date()
    });
  }

  toggleTextToSpeech(): void {
    this.isTextToSpeechEnabled = !this.isTextToSpeechEnabled;
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
        if (this.isTextToSpeechEnabled) {
          this.playAudio(response);
        }
      },
      error: (error) => {
        console.error('Error getting response:', error);
        const errorMessage = 'Sorry, I encountered an error processing your request.';
        // Add error message to the chat
        this.messages.push({
          content: errorMessage,
          isUser: false,
          timestamp: new Date()
        });
        this.isLoading = false;
        if (this.isTextToSpeechEnabled) {
          this.playAudio(errorMessage);
        }
      }
    });
  }

  private playAudio(text: string): void {
    this.elevenLabsService.textToSpeech(text).subscribe({
      next: (audioBlob) => {
        if (audioBlob.size > 0) {
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = this.audioPlayer.nativeElement;
          audio.src = audioUrl;
          audio.load();
          audio.play();
          audio.addEventListener('ended', () => URL.revokeObjectURL(audioUrl), { once: true });
        } else {
          console.error('Received empty audio blob.');
        }
      },
      error: (err) => {
        console.error('Error playing audio:', err);
      }
    });
  }
}


// Helper function to generate a unique ID for messages
export function generateUniqueId(): string {
  return Math.random().toString(36).substring(2, 15);
}
