using System.ComponentModel.DataAnnotations;

namespace MyDemoApp.WebApi.Models;

public class AiModel
{
    [Key]
    public int Id { get; set; }
    
    [Required]
    [MaxLength(100)]
    public string ModelId { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;
    
    [MaxLength(500)]
    public string Description { get; set; } = string.Empty;
    
    public bool IsActive { get; set; } = true;
    
    public bool IsDefault { get; set; } = false;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Additional properties for model configuration
    [MaxLength(50)]
    public string Provider { get; set; } = "Google"; // Google, OpenAI, etc.
    
    [MaxLength(50)]
    public string Version { get; set; } = string.Empty;
    
    public int MaxTokens { get; set; } = 8192;
    
    public decimal Temperature { get; set; } = 0.7m;
    
    public int DisplayOrder { get; set; } = 0;
}