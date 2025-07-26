import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GeminiService } from '../services/gemini.service';
import { AiModelService } from '../services/ai-model.service';
import { AiModel } from '../models/ai-model.model';

@Component({
  selector: 'app-model-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './model-selector.component.html',
  styleUrl: './model-selector.component.scss'
})
export class ModelSelectorComponent implements OnInit {
  models: AiModel[] = [];
  selectedModelId: number = 0;
  currentModel: AiModel | null = null;
  isLoading: boolean = true;

  constructor(
    private geminiService: GeminiService,
    private aiModelService: AiModelService
  ) {}

  ngOnInit(): void {
    // Subscribe to loading state
    this.aiModelService.loading$.subscribe(loading => {
      this.isLoading = loading;
    });
    
    // Subscribe to available models
    this.aiModelService.models$.subscribe(models => {
      this.models = models;
    });
    
    // Subscribe to current model
    this.aiModelService.currentModel$.subscribe(model => {
      this.currentModel = model;
      if (model) {
        this.selectedModelId = model.id;
      }
    });
  }

  selectModel(modelId: number): void {
    const model = this.models.find(m => m.id === modelId);
    if (model) {
      this.selectedModelId = modelId;
      this.aiModelService.setCurrentModel(model).subscribe({
        next: () => {
          console.log(`Model switched to: ${model.name}`);
        },
        error: (error) => {
          console.error('Error switching model:', error);
        }
      });
    }
  }
}
