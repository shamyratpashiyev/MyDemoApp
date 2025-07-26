import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { AiModel, CreateAiModel, UpdateAiModel } from '../models/ai-model.model';

@Injectable({
  providedIn: 'root'
})
export class AiModelService {
  private baseUrl = 'http://localhost:5134/api/ai-models';
  
  // Current models state
  private _models = new BehaviorSubject<AiModel[]>([]);
  public models$ = this._models.asObservable();
  
  // Current selected model
  private _currentModel = new BehaviorSubject<AiModel | null>(null);
  public currentModel$ = this._currentModel.asObservable();
  
  // Loading state
  private _loading = new BehaviorSubject<boolean>(false);
  public loading$ = this._loading.asObservable();

  constructor(private http: HttpClient) {
    this.loadModels().subscribe();
  }

  /**
   * Load all active models from the backend
   */
  loadModels(): Observable<AiModel[]> {
    console.log('Loading models from:', this.baseUrl);
    this._loading.next(true);
    
    return this.http.get<AiModel[]>(this.baseUrl).pipe(
      tap(models => {
        console.log('Models loaded successfully:', models);
        this._models.next(models);
        
        // Set current model to default if not already set
        if (!this._currentModel.value) {
          const defaultModel = models.find(m => m.isDefault) || models[0];
          if (defaultModel) {
            this._currentModel.next(defaultModel);
          }
        }
        
        this._loading.next(false);
      }),
      catchError(error => {
        console.error('Error loading models:', error);
        console.error('Error details:', {
          status: error.status,
          statusText: error.statusText,
          url: error.url,
          message: error.message
        });
        
        this._loading.next(false);
        this._models.next([]);
        
        // Return empty array to continue the stream
        return of([]);
      })
    );
  }

  /**
   * Get all models (including inactive ones)
   */
  getAllModels(): Observable<AiModel[]> {
    return this.http.get<AiModel[]>(`${this.baseUrl}/all`);
  }

  /**
   * Get model by ID
   */
  getModelById(id: number): Observable<AiModel> {
    return this.http.get<AiModel>(`${this.baseUrl}/${id}`);
  }

  /**
   * Get default model
   */
  getDefaultModel(): Observable<AiModel> {
    return this.http.get<AiModel>(`${this.baseUrl}/default`);
  }

  /**
   * Create a new model
   */
  createModel(model: CreateAiModel): Observable<AiModel> {
    return this.http.post<AiModel>(this.baseUrl, model).pipe(
      tap(() => this.loadModels().subscribe())
    );
  }

  /**
   * Update an existing model
   */
  updateModel(id: number, model: UpdateAiModel): Observable<AiModel> {
    return this.http.put<AiModel>(`${this.baseUrl}/${id}`, model).pipe(
      tap(() => this.loadModels().subscribe())
    );
  }

  /**
   * Delete a model
   */
  deleteModel(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      tap(() => this.loadModels().subscribe())
    );
  }

  /**
   * Set a model as default
   */
  setDefaultModel(id: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/${id}/set-default`, {}).pipe(
      tap(() => this.loadModels().subscribe())
    );
  }

  /**
   * Set current model for the session
   */
  setCurrentModel(model: AiModel): Observable<any> {
    return this.http.post(`${this.baseUrl}/set-current`, { modelId: model.modelId }).pipe(
      tap(() => {
        this._currentModel.next(model);
      })
    );
  }

  /**
   * Get current models array
   */
  getCurrentModels(): AiModel[] {
    return this._models.value;
  }

  /**
   * Get current selected model
   */
  getCurrentModel(): AiModel | null {
    return this._currentModel.value;
  }
}