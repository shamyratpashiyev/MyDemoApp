using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace MyDemoApp.WebApi.Migrations
{
    /// <inheritdoc />
    public partial class Initial_Migration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "AiModels",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    ModelId = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Name = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Description = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IsActive = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    IsDefault = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    Provider = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Version = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    MaxTokens = table.Column<int>(type: "int", nullable: false),
                    Temperature = table.Column<decimal>(type: "decimal(3,2)", precision: 3, scale: 2, nullable: false),
                    DisplayOrder = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AiModels", x => x.Id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.InsertData(
                table: "AiModels",
                columns: new[] { "Id", "CreatedAt", "Description", "DisplayOrder", "IsActive", "IsDefault", "MaxTokens", "ModelId", "Name", "Provider", "Temperature", "UpdatedAt", "Version" },
                values: new object[,]
                {
                    { 1, new DateTime(2025, 7, 26, 12, 17, 10, 834, DateTimeKind.Utc).AddTicks(4687), "Best for complex tasks with faster response times", 1, true, true, 8192, "gemini-1.5-flash", "Gemini 1.5 Flash", "Google", 0.7m, new DateTime(2025, 7, 26, 12, 17, 10, 834, DateTimeKind.Utc).AddTicks(4754), "1.5" },
                    { 2, new DateTime(2025, 7, 26, 12, 17, 10, 834, DateTimeKind.Utc).AddTicks(4818), "Latest model, optimized for chat and simple tasks", 2, true, false, 8192, "gemini-2.0-flash-001", "Gemini 2.0 Flash", "Google", 0.7m, new DateTime(2025, 7, 26, 12, 17, 10, 834, DateTimeKind.Utc).AddTicks(4818), "2.0" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_AiModels_IsDefault",
                table: "AiModels",
                column: "IsDefault");

            migrationBuilder.CreateIndex(
                name: "IX_AiModels_ModelId",
                table: "AiModels",
                column: "ModelId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AiModels");
        }
    }
}
