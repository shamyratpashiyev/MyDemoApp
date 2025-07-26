# AI Models Entity Framework Implementation Guide

This guide explains the complete Entity Framework Core implementation for AI Models management in the MyDemoApp project.

## Overview

The AI Models system is now fully implemented using Entity Framework Core with proper entity models, migrations, and services. This replaces any raw SQL scripts and provides a robust, maintainable solution.

## Architecture Components

### 1. Entity Model
**File**: `MyDemoApp.WebApi/Models/AiModel.cs`

The `AiModel` entity includes:
- **Id**: Primary key (auto-increment)
- **ModelId**: Unique identifier for the AI model (e.g., "gemini-1.5-flash")
- **Name**: Display name (e.g., "Gemini 1.5 Flash")
- **Description**: Model description
- **IsActive**: Whether the model is available for use
- **IsDefault**: Whether this is the default model
- **Provider**: AI provider (e.g., "Google", "OpenAI")
- **Version**: Model version
- **MaxTokens**: Maximum token limit
- **Temperature**: Model temperature setting
- **DisplayOrder**: Order for UI display
- **CreatedAt/UpdatedAt**: Audit timestamps

### 2. Database Context
**File**: `MyDemoApp.WebApi/Data/ApplicationDbContext.cs`

Features:
- DbSet for AiModels
- Model configuration with indexes
- Seed data for initial Gemini models
- Proper constraints and relationships

### 3. Migration
**File**: `MyDemoApp.WebApi/Migrations/20241231000000_AddAiModels.cs`

The migration creates:
- AiModels table with all required columns
- Unique index on ModelId
- Index on IsDefault for performance
- Seed data for Gemini 1.5 Flash and Gemini 2.0 Flash

### 4. Service Layer
**File**: `MyDemoApp.WebApi/Services/AiModelService.cs`

Provides complete CRUD operations:
- `GetActiveModelsAsync()`: Get all active models
- `GetAllModelsAsync()`: Get all models (including inactive)
- `GetModelByIdAsync(id)`: Get model by database ID
- `GetModelByModelIdAsync(modelId)`: Get model by ModelId
- `GetDefaultModelAsync()`: Get the default model
- `CreateModelAsync(dto)`: Create new model
- `UpdateModelAsync(id, dto)`: Update existing model
- `DeleteModelAsync(id)`: Delete model
- `SetDefaultModelAsync(id)`: Set model as default

### 5. DTOs
**File**: `MyDemoApp.WebApi/DTOs/AiModelDto.cs`

Includes:
- `AiModelDto`: For API responses
- `CreateAiModelDto`: For creating new models
- `UpdateAiModelDto`: For updating existing models

### 6. API Endpoints
**File**: `MyDemoApp.WebApi/Program.cs`

Complete REST API:
- `GET /api/ai-models`: Get active models
- `GET /api/ai-models/all`: Get all models
- `GET /api/ai-models/{id}`: Get specific model
- `GET /api/ai-models/default`: Get default model
- `POST /api/ai-models`: Create new model
- `PUT /api/ai-models/{id}`: Update model
- `DELETE /api/ai-models/{id}`: Delete model
- `POST /api/ai-models/{id}/set-default`: Set as default
- `POST /api/ai-models/set-current`: Set current model for Gemini service

## Database Setup

### Option 1: Using EF Core Migrations (Recommended)

#### Prerequisites
```bash
# Install EF Core tools globally
dotnet tool install --global dotnet-ef
```

#### Apply Migrations
```bash
# Navigate to the Web API project
cd MyDemoApp.WebApi

# Apply migrations to create the database and tables
dotnet ef database update
```

#### Using the Scripts
We've provided scripts to automate this process:

**Linux/macOS:**
```bash
./apply-migrations.sh
```

**Windows PowerShell:**
```powershell
.\apply-migrations.ps1
```

### Option 2: Manual Database Setup
If you prefer to run SQL manually, you can use the migration-generated SQL, but we recommend using EF Core migrations for consistency.

## Configuration

### Connection String
Ensure your `appsettings.json` has the correct MySQL connection string:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=MyDemoApp;User=root;Password=yourpassword;"
  }
}
```

### Dependency Injection
The following services are registered in `Program.cs`:
- `ApplicationDbContext`: Database context
- `IAiModelService`: AI model service interface
- `AiModelService`: AI model service implementation

## Usage Examples

### Frontend Integration
The Angular app can now fetch AI models from these endpoints:

```typescript
// Get active models for dropdown
this.http.get<AiModel[]>('/api/ai-models').subscribe(models => {
  this.availableModels = models;
});

// Get default model
this.http.get<AiModel>('/api/ai-models/default').subscribe(model => {
  this.selectedModel = model;
});

// Set current model
this.http.post('/api/ai-models/set-current', { modelId: 'gemini-2.0-flash-001' })
  .subscribe(response => {
    console.log('Model updated');
  });
```

### Adding New Models
```csharp
var newModel = new CreateAiModelDto
{
    ModelId = "gpt-4",
    Name = "GPT-4",
    Description = "OpenAI's most capable model",
    Provider = "OpenAI",
    Version = "4.0",
    MaxTokens = 8192,
    Temperature = 0.7m,
    DisplayOrder = 3
};

var created = await aiModelService.CreateModelAsync(newModel);
```

## Seed Data

The system comes with two pre-configured Gemini models:

1. **Gemini 1.5 Flash** (Default)
   - ModelId: `gemini-1.5-flash`
   - Best for complex tasks with faster response times

2. **Gemini 2.0 Flash**
   - ModelId: `gemini-2.0-flash-001`
   - Latest model, optimized for chat and simple tasks

## Benefits of This Implementation

1. **Type Safety**: Full C# type checking and IntelliSense support
2. **Maintainability**: Easy to modify and extend the model structure
3. **Migration Support**: Database schema changes are tracked and versioned
4. **Testability**: Services can be easily unit tested
5. **Consistency**: Follows Entity Framework conventions and best practices
6. **Performance**: Proper indexing and query optimization
7. **Validation**: Built-in data validation through attributes

## Troubleshooting

### Migration Issues
If you encounter migration issues:

```bash
# Check migration status
dotnet ef migrations list

# Generate a new migration if needed
dotnet ef migrations add YourMigrationName

# Reset database (WARNING: This will delete all data)
dotnet ef database drop
dotnet ef database update
```

### Connection Issues
- Verify MySQL server is running
- Check connection string in `appsettings.json`
- Ensure database exists or EF Core has permissions to create it

## Next Steps

1. ✅ Entity model created
2. ✅ Database context configured
3. ✅ Migration generated
4. ✅ Service layer implemented
5. ✅ API endpoints configured
6. ✅ DTOs defined
7. 🔄 Apply migrations to database
8. 🔄 Test API endpoints
9. 🔄 Update Angular frontend to use new endpoints

The AI Models system is now complete and ready for use with proper Entity Framework Core implementation!