namespace MyDemoApp.WebApi.DTOs;

public class AiModelDto
{
    public int Id { get; set; }
    public string ModelId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public bool IsDefault { get; set; }
    public string Provider { get; set; } = string.Empty;
    public string Version { get; set; } = string.Empty;
    public int MaxTokens { get; set; }
    public decimal Temperature { get; set; }
    public int DisplayOrder { get; set; }
}

public class CreateAiModelDto
{
    public string ModelId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public bool IsDefault { get; set; } = false;
    public string Provider { get; set; } = "Google";
    public string Version { get; set; } = string.Empty;
    public int MaxTokens { get; set; } = 8192;
    public decimal Temperature { get; set; } = 0.7m;
    public int DisplayOrder { get; set; } = 0;
}

public class UpdateAiModelDto
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public bool IsDefault { get; set; }
    public string Version { get; set; } = string.Empty;
    public int MaxTokens { get; set; }
    public decimal Temperature { get; set; }
    public int DisplayOrder { get; set; }
}