import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GeminiService } from '../services/gemini.service';
import { ElevenLabsService } from '../services/eleven-labs.service';
import { ChatMessage } from '../models/message.model';
import { ModelSelectorComponent } from '../model-selector/model-selector.component';
import { Agent, AgentSelectorComponent } from '../agent-selector/agent-selector.component';
import { AiModel } from '../models/ai-model.model';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, ModelSelectorComponent, AgentSelectorComponent],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss'
})
export class ChatComponent implements OnInit {
  @ViewChild('audioPlayer') audioPlayer!: ElementRef<HTMLAudioElement>;
  messages: ChatMessage[] = [];
  newMessage: string = '';
  isLoading: boolean = false;
  isStreaming: boolean = false;
  currentModel: AiModel | null = null;
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

  onAgentSelected(agent: Agent) {
    // Send the prompt to the AI in the background without displaying it
    this.geminiService.sendMessage(agent.prompt).subscribe({
      next: (response) => {
        // Log the confirmation for debugging, but don't show it to the user
        console.log(`Agent set to ${agent.name}. AI confirmed:`, response);
      },
      complete: () => {
        console.log(`Agent ${agent.name} setup completed`);
      },
      error: (error) => {
        console.error(`Error setting agent to ${agent.name}:`, error);
        // Optionally, inform the user that the agent selection failed
        this.messages.push({
          content: `Sorry, I encountered an error trying to switch to the ${agent.name} agent. Please try again.`,
          isUser: false,
          timestamp: new Date()
        });
      }
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
    this.isStreaming = true;

    // Create a placeholder message for the AI response that will be updated
    const aiMessageIndex = this.messages.length;
    this.messages.push({
      content: '',
      isUser: false,
      timestamp: new Date()
    });

    // Get response from Gemini
    this.geminiService.sendMessage(userMessage).subscribe({
      next: (response) => {
        console.log('Raw AI Response:', response); // Log the raw response
        const formattedResponse = response.replace(/^"|"$/g, '').replace(/\n/g, '<br>');
        // Update the existing AI message instead of adding a new one
        this.messages[aiMessageIndex].content = formattedResponse;
      },
      complete: () => {
        this.isLoading = false;
        this.isStreaming = false;
        // Play audio only when streaming is complete
        if (this.isTextToSpeechEnabled && this.messages[aiMessageIndex].content) {
          // Remove HTML tags for audio playback
          const textForAudio = this.messages[aiMessageIndex].content.replace(/<br>/g, '\n').replace(/<[^>]*>/g, '');
          this.playAudio(textForAudio);
        }
      },
      error: (error) => {
        console.error('Error getting response:', error);
        const errorMessage = 'Sorry, I encountered an error processing your request.';
        // Update the AI message with error
        this.messages[aiMessageIndex].content = errorMessage;
        this.isLoading = false;
        this.isStreaming = false;
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
