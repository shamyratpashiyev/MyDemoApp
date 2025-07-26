import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiModelService } from '../services/ai-model.service';
import { AiModel, CreateAiModel, UpdateAiModel } from '../models/ai-model.model';

@Component({
  selector: 'app-ai-models-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-container">
      <h2>AI Models Administration</h2>
      
      <!-- Add New Model Form -->
      <div class="add-model-section">
        <h3>Add New Model</h3>
        <form (ngSubmit)="createModel()" #modelForm="ngForm">
          <div class="form-row">
            <label>Model ID:</label>
            <input type="text" [(ngModel)]="newModel.modelId" name="modelId" required>
          </div>
          <div class="form-row">
            <label>Name:</label>
            <input type="text" [(ngModel)]="newModel.name" name="name" required>
          </div>
          <div class="form-row">
            <label>Description:</label>
            <textarea [(ngModel)]="newModel.description" name="description"></textarea>
          </div>
          <div class="form-row">
            <label>Provider:</label>
            <input type="text" [(ngModel)]="newModel.provider" name="provider">
          </div>
          <div class="form-row">
            <label>Version:</label>
            <input type="text" [(ngModel)]="newModel.version" name="version">
          </div>
          <div class="form-row">
            <label>Max Tokens:</label>
            <input type="number" [(ngModel)]="newModel.maxTokens" name="maxTokens">
          </div>
          <div class="form-row">
            <label>Temperature:</label>
            <input type="number" step="0.1" min="0" max="2" [(ngModel)]="newModel.temperature" name="temperature">
          </div>
          <div class="form-row">
            <label>Display Order:</label>
            <input type="number" [(ngModel)]="newModel.displayOrder" name="displayOrder">
          </div>
          <div class="form-row">
            <label>
              <input type="checkbox" [(ngModel)]="newModel.isActive" name="isActive"> Active
            </label>
            <label>
              <input type="checkbox" [(ngModel)]="newModel.isDefault" name="isDefault"> Default
            </label>
          </div>
          <button type="submit" [disabled]="!modelForm.valid">Add Model</button>
        </form>
      </div>

      <!-- Models List -->
      <div class="models-list-section">
        <h3>Existing Models</h3>
        <div class="models-grid">
          @for (model of allModels; track model.id) {
            <div class="model-card" [class.inactive]="!model.isActive">
              <div class="model-header">
                <h4>{{ model.name }}</h4>
                <div class="model-badges">
                  @if (model.isDefault) {
                    <span class="badge default">Default</span>
                  }
                  @if (!model.isActive) {
                    <span class="badge inactive">Inactive</span>
                  }
                </div>
              </div>
              <p><strong>Model ID:</strong> {{ model.modelId }}</p>
              <p><strong>Provider:</strong> {{ model.provider }} v{{ model.version }}</p>
              <p><strong>Description:</strong> {{ model.description }}</p>
              <p><strong>Max Tokens:</strong> {{ model.maxTokens }}</p>
              <p><strong>Temperature:</strong> {{ model.temperature }}</p>
              
              <div class="model-actions">
                <button (click)="setAsDefault(model.id)" [disabled]="model.isDefault">
                  Set as Default
                </button>
                <button (click)="toggleActive(model)" 
                        [class.activate]="!model.isActive"
                        [class.deactivate]="model.isActive">
                  {{ model.isActive ? 'Deactivate' : 'Activate' }}
                </button>
                <button (click)="deleteModel(model.id)" class="delete-btn">
                  Delete
                </button>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }

    .add-model-section {
      background: #f5f5f5;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
    }

    .form-row {
      margin-bottom: 15px;
    }

    .form-row label {
      display: block;
      margin-bottom: 5px;
      font-weight: bold;
    }

    .form-row input, .form-row textarea {
      width: 100%;
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }

    .models-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 20px;
    }

    .model-card {
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 15px;
      background: white;
    }

    .model-card.inactive {
      opacity: 0.6;
      background: #f9f9f9;
    }

    .model-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }

    .model-badges {
      display: flex;
      gap: 5px;
    }

    .badge {
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: bold;
    }

    .badge.default {
      background: #4CAF50;
      color: white;
    }

    .badge.inactive {
      background: #f44336;
      color: white;
    }

    .model-actions {
      display: flex;
      gap: 10px;
      margin-top: 15px;
      flex-wrap: wrap;
    }

    .model-actions button {
      padding: 5px 10px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
    }

    .model-actions button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .activate {
      background: #4CAF50;
      color: white;
    }

    .deactivate {
      background: #ff9800;
      color: white;
    }

    .delete-btn {
      background: #f44336;
      color: white;
    }
  `]
})
export class AiModelsAdminComponent implements OnInit {
  allModels: AiModel[] = [];
  newModel: CreateAiModel = {
    modelId: '',
    name: '',
    description: '',
    isActive: true,
    isDefault: false,
    provider: 'Google',
    version: '',
    maxTokens: 8192,
    temperature: 0.7,
    displayOrder: 0
  };

  constructor(private aiModelService: AiModelService) {}

  ngOnInit(): void {
    this.loadAllModels();
  }

  loadAllModels(): void {
    this.aiModelService.getAllModels().subscribe({
      next: (models) => {
        this.allModels = models;
      },
      error: (error) => {
        console.error('Error loading models:', error);
      }
    });
  }

  createModel(): void {
    this.aiModelService.createModel(this.newModel).subscribe({
      next: () => {
        this.resetForm();
        this.loadAllModels();
        alert('Model created successfully!');
      },
      error: (error) => {
        console.error('Error creating model:', error);
        alert('Error creating model. Please check the console for details.');
      }
    });
  }

  setAsDefault(id: number): void {
    this.aiModelService.setDefaultModel(id).subscribe({
      next: () => {
        this.loadAllModels();
        alert('Default model updated!');
      },
      error: (error) => {
        console.error('Error setting default model:', error);
      }
    });
  }

  toggleActive(model: AiModel): void {
    const updateData: UpdateAiModel = {
      name: model.name,
      description: model.description,
      isActive: !model.isActive,
      isDefault: model.isDefault,
      version: model.version,
      maxTokens: model.maxTokens,
      temperature: model.temperature,
      displayOrder: model.displayOrder
    };

    this.aiModelService.updateModel(model.id, updateData).subscribe({
      next: () => {
        this.loadAllModels();
      },
      error: (error) => {
        console.error('Error updating model:', error);
      }
    });
  }

  deleteModel(id: number): void {
    if (confirm('Are you sure you want to delete this model?')) {
      this.aiModelService.deleteModel(id).subscribe({
        next: () => {
          this.loadAllModels();
          alert('Model deleted successfully!');
        },
        error: (error) => {
          console.error('Error deleting model:', error);
          alert('Error deleting model. Please check the console for details.');
        }
      });
    }
  }

  private resetForm(): void {
    this.newModel = {
      modelId: '',
      name: '',
      description: '',
      isActive: true,
      isDefault: false,
      provider: 'Google',
      version: '',
      maxTokens: 8192,
      temperature: 0.7,
      displayOrder: 0
    };
  }
}