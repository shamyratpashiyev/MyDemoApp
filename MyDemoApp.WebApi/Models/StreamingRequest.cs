using System.Text.Json.Serialization;

namespace MyDemoApp.WebApi.Models;

public class StreamingRequest
{
    [JsonPropertyName("prompt")]
    public string Prompt { get; set; } = string.Empty;
    
    [JsonPropertyName("connectionId")]
    public string ConnectionId { get; set; } = string.Empty;
}

public class SetCurrentModelRequest
{
    [JsonPropertyName("modelId")]
    public string ModelId { get; set; } = string.Empty;
}