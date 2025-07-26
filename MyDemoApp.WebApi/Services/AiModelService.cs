using Microsoft.EntityFrameworkCore;
using MyDemoApp.WebApi.Data;
using MyDemoApp.WebApi.DTOs;
using MyDemoApp.WebApi.Models;

namespace MyDemoApp.WebApi.Services;

public interface IAiModelService
{
    Task<List<AiModelDto>> GetActiveModelsAsync();
    Task<List<AiModelDto>> GetAllModelsAsync();
    Task<AiModelDto?> GetModelByIdAsync(int id);
    Task<AiModelDto?> GetModelByModelIdAsync(string modelId);
    Task<AiModelDto?> GetDefaultModelAsync();
    Task<AiModelDto> CreateModelAsync(CreateAiModelDto createDto);
    Task<AiModelDto?> UpdateModelAsync(int id, UpdateAiModelDto updateDto);
    Task<bool> DeleteModelAsync(int id);
    Task<bool> SetDefaultModelAsync(int id);
}

public class AiModelService : IAiModelService
{
    private readonly ApplicationDbContext _context;

    public AiModelService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<AiModelDto>> GetActiveModelsAsync()
    {
        return await _context.AiModels
            .Where(m => m.IsActive)
            .OrderBy(m => m.DisplayOrder)
            .ThenBy(m => m.Name)
            .Select(m => MapToDto(m))
            .ToListAsync();
    }

    public async Task<List<AiModelDto>> GetAllModelsAsync()
    {
        return await _context.AiModels
            .OrderBy(m => m.DisplayOrder)
            .ThenBy(m => m.Name)
            .Select(m => MapToDto(m))
            .ToListAsync();
    }

    public async Task<AiModelDto?> GetModelByIdAsync(int id)
    {
        var model = await _context.AiModels.FindAsync(id);
        return model != null ? MapToDto(model) : null;
    }

    public async Task<AiModelDto?> GetModelByModelIdAsync(string modelId)
    {
        var model = await _context.AiModels
            .FirstOrDefaultAsync(m => m.ModelId == modelId);
        return model != null ? MapToDto(model) : null;
    }

    public async Task<AiModelDto?> GetDefaultModelAsync()
    {
        var model = await _context.AiModels
            .FirstOrDefaultAsync(m => m.IsDefault && m.IsActive);
        
        // If no default is set, return the first active model
        if (model == null)
        {
            model = await _context.AiModels
                .Where(m => m.IsActive)
                .OrderBy(m => m.DisplayOrder)
                .FirstOrDefaultAsync();
        }
        
        return model != null ? MapToDto(model) : null;
    }

    public async Task<AiModelDto> CreateModelAsync(CreateAiModelDto createDto)
    {
        var model = new AiModel
        {
            ModelId = createDto.ModelId,
            Name = createDto.Name,
            Description = createDto.Description,
            IsActive = createDto.IsActive,
            IsDefault = createDto.IsDefault,
            Provider = createDto.Provider,
            Version = createDto.Version,
            MaxTokens = createDto.MaxTokens,
            Temperature = createDto.Temperature,
            DisplayOrder = createDto.DisplayOrder,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // If this is set as default, unset other defaults
        if (createDto.IsDefault)
        {
            await UnsetAllDefaultsAsync();
        }

        _context.AiModels.Add(model);
        await _context.SaveChangesAsync();

        return MapToDto(model);
    }

    public async Task<AiModelDto?> UpdateModelAsync(int id, UpdateAiModelDto updateDto)
    {
        var model = await _context.AiModels.FindAsync(id);
        if (model == null) return null;

        model.Name = updateDto.Name;
        model.Description = updateDto.Description;
        model.IsActive = updateDto.IsActive;
        model.Version = updateDto.Version;
        model.MaxTokens = updateDto.MaxTokens;
        model.Temperature = updateDto.Temperature;
        model.DisplayOrder = updateDto.DisplayOrder;
        model.UpdatedAt = DateTime.UtcNow;

        // Handle default setting
        if (updateDto.IsDefault && !model.IsDefault)
        {
            await UnsetAllDefaultsAsync();
            model.IsDefault = true;
        }
        else if (!updateDto.IsDefault && model.IsDefault)
        {
            model.IsDefault = false;
        }

        await _context.SaveChangesAsync();
        return MapToDto(model);
    }

    public async Task<bool> DeleteModelAsync(int id)
    {
        var model = await _context.AiModels.FindAsync(id);
        if (model == null) return false;

        _context.AiModels.Remove(model);
        await _context.SaveChangesAsync();

        // If we deleted the default model, set another one as default
        if (model.IsDefault)
        {
            var newDefault = await _context.AiModels
                .Where(m => m.IsActive)
                .OrderBy(m => m.DisplayOrder)
                .FirstOrDefaultAsync();
            
            if (newDefault != null)
            {
                newDefault.IsDefault = true;
                await _context.SaveChangesAsync();
            }
        }

        return true;
    }

    public async Task<bool> SetDefaultModelAsync(int id)
    {
        var model = await _context.AiModels.FindAsync(id);
        if (model == null || !model.IsActive) return false;

        await UnsetAllDefaultsAsync();
        model.IsDefault = true;
        model.UpdatedAt = DateTime.UtcNow;
        
        await _context.SaveChangesAsync();
        return true;
    }

    private async Task UnsetAllDefaultsAsync()
    {
        var defaultModels = await _context.AiModels
            .Where(m => m.IsDefault)
            .ToListAsync();

        foreach (var model in defaultModels)
        {
            model.IsDefault = false;
            model.UpdatedAt = DateTime.UtcNow;
        }
    }

    private static AiModelDto MapToDto(AiModel model)
    {
        return new AiModelDto
        {
            Id = model.Id,
            ModelId = model.ModelId,
            Name = model.Name,
            Description = model.Description,
            IsActive = model.IsActive,
            IsDefault = model.IsDefault,
            Provider = model.Provider,
            Version = model.Version,
            MaxTokens = model.MaxTokens,
            Temperature = model.Temperature,
            DisplayOrder = model.DisplayOrder
        };
    }
}