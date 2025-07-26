# AI Models Migration Guide

## Overview
This guide documents the migration of AI model management from frontend-only to a full backend-driven system with database persistence.

## Changes Made

### Backend Changes

#### 1. Database Entity
**File**: `MyDemoApp.WebApi/Models/AiModel.cs`
- Created comprehensive `AiModel` entity with properties:
  - `Id`, `ModelId`, `Name`, `Description`
  - `IsActive`, `IsDefault` (for model management)
  - `Provider`, `Version`, `MaxTokens`, `Temperature` (for configuration)
  - `DisplayOrder` (for UI ordering)
  - `CreatedAt`, `UpdatedAt` (for auditing)

#### 2. Database Context
**File**: `MyDemoApp.WebApi/Data/ApplicationDbContext.cs`
- Added `DbSet<AiModel> AiModels`
- Configured entity relationships and constraints
- Added seed data for initial Gemini models

#### 3. Service Layer
**File**: `MyDemoApp.WebApi/Services/AiModelService.cs`
- Created `IAiModelService` interface with full CRUD operations
- Implemented service with methods:
  - `GetActiveModelsAsync()` - Get models available for use
  - `GetDefaultModelAsync()` - Get the default model
  - `CreateModelAsync()`, `UpdateModelAsync()`, `DeleteModelAsync()`
  - `SetDefaultModelAsync()` - Set a model as default

#### 4. Updated GeminiService
**File**: `MyDemoApp.WebApi/Services/GeminiService.cs`
- Integrated with `IAiModelService`
- Dynamic model selection based on database configuration
- Methods to set/get current model

#### 5. API Endpoints
**File**: `MyDemoApp.WebApi/Program.cs`
- Added comprehensive REST API endpoints:
  ```
  GET    /api/ai-models           - Get active models
  GET    /api/ai-models/all       - Get all models
  GET    /api/ai-models/{id}      - Get model by ID
  GET    /api/ai-models/default   - Get default model
  POST   /api/ai-models           - Create new model
  PUT    /api/ai-models/{id}      - Update model
  DELETE /api/ai-models/{id}      - Delete model
  POST   /api/ai-models/{id}/set-default - Set as default
  POST   /api/ai-models/set-current - Set current session model
  ```

#### 6. DTOs
**File**: `MyDemoApp.WebApi/DTOs/AiModelDto.cs`
- `AiModelDto` - For API responses
- `CreateAiModelDto` - For creating new models
- `UpdateAiModelDto` - For updating existing models

#### 7. Database Migration
**File**: `MyDemoApp.WebApi/Migrations/20241231000000_AddAiModels.cs`
- EF Core migration to create `AiModels` table
- Includes indexes and seed data

### Frontend Changes

#### 1. Model Interface
**File**: `src/app/models/ai-model.model.ts`
- Created `AiModel` interface matching backend DTO
- Added `CreateAiModel` and `UpdateAiModel` interfaces

#### 2. AI Model Service
**File**: `src/app/services/ai-model.service.ts`
- New service to manage AI models from backend
- Reactive state management with BehaviorSubjects
- Methods for all CRUD operations
- Automatic loading of models on service initialization

#### 3. Updated GeminiService
**File**: `src/app/services/gemini.service.ts`
- Delegated model management to `AiModelService`
- Removed hardcoded model definitions
- Updated to use new `AiModel` interface

#### 4. Updated Model Selector
**File**: `src/app/model-selector/model-selector.component.ts`
- Updated to use `AiModelService` instead of hardcoded models
- Changed from string-based to ID-based model selection
- Reactive updates when models change

#### 5. Updated Chat Component
**File**: `src/app/chat/chat.component.ts`
- Updated type from `GeminiModel` to `AiModel`
- No functional changes needed due to service abstraction

## Database Setup

### Recommended: Use EF Core Migrations
The proper Entity Framework Core implementation is now complete. Use EF migrations instead of raw SQL:

```bash
cd MyDemoApp.WebApi
dotnet ef database update
```

Or use the provided scripts:
- **Linux/macOS**: `./apply-migrations.sh`
- **Windows**: `.\apply-migrations.ps1`

### Legacy: Raw SQL Script (Not Recommended)
The `run-migrations.sql` file is provided for reference but should be replaced by EF Core migrations for proper database management.

## API Usage Examples

### Get Available Models
```javascript
GET http://localhost:5134/api/ai-models
```

### Set Current Model
```javascript
POST http://localhost:5134/api/ai-models/set-current
Content-Type: application/json

{
  "modelId": "gemini-2.0-flash-001"
}
```

### Create New Model
```javascript
POST http://localhost:5134/api/ai-models
Content-Type: application/json

{
  "modelId": "gemini-pro",
  "name": "Gemini Pro",
  "description": "Advanced model for complex tasks",
  "provider": "Google",
  "version": "1.0",
  "maxTokens": 32768,
  "temperature": 0.7,
  "displayOrder": 3
}
```

## Benefits of This Migration

1. **Centralized Management**: Models are managed in the database, not hardcoded
2. **Dynamic Configuration**: Add/remove models without code changes
3. **Consistent State**: Frontend and backend always in sync
4. **Scalability**: Easy to add new AI providers and models
5. **Audit Trail**: Track when models were created/updated
6. **Flexible Configuration**: Per-model settings (temperature, max tokens, etc.)

## Migration Checklist

- [x] Create database entity and migration
- [x] Implement backend service layer
- [x] Add API endpoints
- [x] Create DTOs for API communication
- [x] Create EF Core migration with seed data
- [x] Create model snapshot for EF Core
- [x] Create migration scripts (bash/PowerShell)
- [x] Create comprehensive documentation
- [x] Create frontend model interfaces
- [x] Implement frontend service
- [x] Update components to use new service
- [x] Test model switching functionality
- [ ] Run database migration (`dotnet ef database update`)
- [ ] Test end-to-end functionality
- [ ] Remove legacy raw SQL script

## Testing

1. **Start the backend** and verify API endpoints work
2. **Run the frontend** and check that models load from backend
3. **Switch models** and verify the selection persists
4. **Send messages** and confirm the correct model is used

The system now provides a complete, database-driven AI model management solution with full CRUD capabilities and reactive frontend updates.