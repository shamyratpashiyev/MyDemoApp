using Microsoft.EntityFrameworkCore;
using MyDemoApp.WebApi.Models;

namespace MyDemoApp.WebApi.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<AiModel> AiModels { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        
        // Configure AiModel
        modelBuilder.Entity<AiModel>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.ModelId).IsUnique();
            entity.HasIndex(e => e.IsDefault);
            entity.Property(e => e.Temperature).HasPrecision(3, 2);
        });

        // Seed initial data with static DateTime values
        modelBuilder.Entity<AiModel>().HasData(
            new AiModel
            {
                Id = 1,
                ModelId = "gemini-1.5-flash",
                Name = "Gemini 1.5 Flash",
                Description = "Best for complex tasks with faster response times",
                IsActive = true,
                IsDefault = true,
                Provider = "Google",
                Version = "1.5",
                MaxTokens = 8192,
                Temperature = 0.7m,
                DisplayOrder = 1,
                CreatedAt = new DateTime(2024, 12, 31, 0, 0, 0, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2024, 12, 31, 0, 0, 0, DateTimeKind.Utc)
            },
            new AiModel
            {
                Id = 2,
                ModelId = "gemini-2.0-flash-001",
                Name = "Gemini 2.0 Flash",
                Description = "Latest model, optimized for chat and simple tasks",
                IsActive = true,
                IsDefault = false,
                Provider = "Google",
                Version = "2.0",
                MaxTokens = 8192,
                Temperature = 0.7m,
                DisplayOrder = 2,
                CreatedAt = new DateTime(2024, 12, 31, 0, 0, 0, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2024, 12, 31, 0, 0, 0, DateTimeKind.Utc)
            }
        );
    }
}
