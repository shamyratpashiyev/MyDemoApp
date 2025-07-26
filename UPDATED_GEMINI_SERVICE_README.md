# Updated Gemini Service with SignalR Streaming

The `GeminiService` has been updated to support real-time AI response streaming via SignalR while maintaining backward compatibility.

## Key Features

- **Real-time streaming**: AI responses are streamed as they're generated
- **Backward compatibility**: Existing code using `sendMessage()` continues to work
- **Automatic fallback**: Falls back to HTTP requests if SignalR is unavailable
- **Two streaming modes**: Accumulated responses or individual chunks

## Updated Methods

### 1. `sendMessage(message: string): Observable<string>`

**Behavior Changed**: Now streams responses in real-time via SignalR

```typescript
// Usage remains the same, but now streams in real-time
this.geminiService.sendMessage('Hello AI').subscribe({
  next: (accumulatedResponse) => {
    // Receives the full response as it builds up
    console.log('Current response:', accumulatedResponse);
    this.displayText = accumulatedResponse;
  },
  complete: () => {
    console.log('Streaming completed');
  },
  error: (error) => {
    console.error('Error:', error);
  }
});
```

### 2. `sendMessageStreaming(message: string): Observable<StreamingMessage>`

**New Method**: Provides individual chunks for more granular control

```typescript
this.geminiService.sendMessageStreaming('Hello AI').subscribe({
  next: (streamingMessage) => {
    if (streamingMessage.chunk && !streamingMessage.isComplete) {
      // Handle individual chunk
      this.displayText += streamingMessage.chunk;
    }
    
    if (streamingMessage.isComplete) {
      console.log('Streaming completed');
      this.isLoading = false;
    }
    
    if (streamingMessage.error) {
      console.error('Stream error:', streamingMessage.error);
    }
  },
  error: (error) => {
    console.error('Error:', error);
  }
});
```

### 3. `isConnected(): boolean`

**New Method**: Check SignalR connection status

```typescript
if (this.geminiService.isConnected()) {
  console.log('SignalR is connected - streaming available');
} else {
  console.log('SignalR disconnected - will use HTTP fallback');
}
```

### 4. `disconnect(): Promise<void>`

**New Method**: Manually disconnect SignalR connection

```typescript
await this.geminiService.disconnect();
```

## StreamingMessage Interface

```typescript
export interface StreamingMessage {
  chunk: string;        // The text chunk received
  isComplete: boolean;  // Whether streaming is complete
  error?: string;       // Error message if any
}
```

## Migration Guide

### Existing Code (No Changes Required)

Your existing code will continue to work but now benefits from real-time streaming:

```typescript
// This code doesn't need to change
this.geminiService.sendMessage(prompt).subscribe(response => {
  this.aiResponse = response; // Now updates in real-time!
});
```

### Enhanced Usage (Optional)

For better user experience, you can add loading states:

```typescript
export class MyComponent {
  isStreaming = false;
  response = '';

  sendMessage(prompt: string) {
    this.isStreaming = true;
    this.response = '';

    this.geminiService.sendMessage(prompt).subscribe({
      next: (accumulatedResponse) => {
        this.response = accumulatedResponse;
      },
      complete: () => {
        this.isStreaming = false;
      },
      error: (error) => {
        console.error('Error:', error);
        this.isStreaming = false;
      }
    });
  }
}
```

## Configuration

The service automatically connects to SignalR on initialization. Update the URLs in the service if your backend runs on a different port:

```typescript
// In gemini.service.ts
private backendUrl = 'http://localhost:5134/gemini';           // HTTP fallback
private streamingUrl = 'http://localhost:5134/gemini/stream';  // Streaming endpoint
private signalRUrl = 'http://localhost:5134/aiStreamingHub';   // SignalR hub
```

## Error Handling

The service includes comprehensive error handling:

1. **SignalR Connection Failure**: Automatically falls back to HTTP requests
2. **Streaming Errors**: Reported via the error callback
3. **Network Issues**: Handled gracefully with appropriate error messages

## Performance Benefits

- **Perceived Performance**: Users see responses as they're generated
- **Better UX**: No waiting for complete responses
- **Real-time Feedback**: Immediate indication that processing has started

## Example Component

See `src/app/examples/streaming-example.component.ts` for a complete working example demonstrating both streaming modes.

## Troubleshooting

### SignalR Not Connecting

1. Ensure your WebApi server is running
2. Check that the SignalR hub URL is correct
3. Verify CORS settings allow SignalR connections
4. Check browser console for connection errors

### Fallback to HTTP

If SignalR fails, the service automatically falls back to HTTP requests. Check the console for "SignalR not connected, falling back to HTTP request" messages.

### No Streaming Effect

If responses appear all at once instead of streaming:
1. Verify SignalR connection is established
2. Check that the backend streaming endpoint is working
3. Ensure the AI service is actually streaming (not buffering responses)