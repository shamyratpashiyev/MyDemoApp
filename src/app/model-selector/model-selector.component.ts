import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GeminiService, GeminiModel } from '../services/gemini.service';

@Component({
  selector: 'app-model-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './model-selector.component.html',
  styleUrl: './model-selector.component.scss'
})
export class ModelSelectorComponent implements OnInit {
  models: GeminiModel[] = [];
  selectedModelId: string = '';
  currentModel: GeminiModel | null = null;
  isLoading: boolean = true;

  constructor(private geminiService: GeminiService) {}

  ngOnInit(): void {
    // Subscribe to loading state
    this.geminiService.modelsLoading$.subscribe(loading => {
      this.isLoading = loading;
      
      // Get available models when loading is complete
      if (!loading) {
        this.models = this.geminiService.getAvailableModels();
      }
    });
    
    // Set initial selected model
    this.geminiService.currentModel$.subscribe(model => {
      this.currentModel = model;
      if (model) {
        this.selectedModelId = model.id;
      }
    });
  }

  selectModel(modelId: string): void {
    this.selectedModelId = modelId;
    this.geminiService.setCurrentModel(modelId);
  }
}
