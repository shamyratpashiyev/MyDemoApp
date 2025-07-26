# SignalR AI Streaming Implementation

This implementation adds real-time AI response streaming to your application using SignalR.

## What's Been Added

### Backend (WebApi)

1. **SignalR Hub** (`Hubs/AiStreamingHub.cs`)
   - Manages SignalR connections
   - Handles client groups and disconnections

2. **Streaming Service** (`Services/AiStreamingService.cs`)
   - Orchestrates the streaming process
   - Sends real-time chunks to connected clients

3. **Enhanced GeminiService** (`Services/GeminiService.cs`)
   - Added `GenerateTextStreamingAsync()` method
   - Yields text chunks as they're generated

4. **Updated Program.cs**
   - Added SignalR services and hub mapping
   - Updated CORS policy for SignalR compatibility
   - New `/gemini/stream` endpoint

### Frontend (Angular)

1. **SignalR Service** (`services/signalr-ai.service.ts`)
   - Manages SignalR connection
   - Provides streaming observables
   - Handles connection lifecycle

2. **Streaming Chat Component** (`streaming-chat/streaming-chat.component.ts`)
   - Example implementation showing real-time streaming
   - Complete chat interface with streaming indicators

## How It Works

1. **Connection**: Client establishes SignalR connection to `/aiStreamingHub`
2. **Request**: Client sends POST to `/gemini/stream` with prompt and connectionId
3. **Streaming**: Server streams AI response chunks via SignalR events:
   - `StreamStarted`: Indicates streaming has begun
   - `StreamChunk`: Contains each text chunk as it's generated
   - `StreamCompleted`: Indicates streaming is finished
   - `StreamError`: Reports any errors

## Usage

### Testing with HTML (Simple)

1. Start your WebApi server
2. Navigate to `http://localhost:5000/test-signalr.html`
3. Enter a prompt and click "Send"
4. Watch the response stream in real-time

### Using in Angular

1. Install SignalR client: `npm install @microsoft/signalr`
2. Import and use `SignalrAiService` in your components
3. Subscribe to `streaming$` observable for real-time updates

```typescript
constructor(private signalrService: SignalrAiService) {}

ngOnInit() {
  this.signalrService.streaming$.subscribe(response => {
    if (response.chunk) {
      // Handle streaming chunk
    }
    if (response.isComplete) {
      // Handle completion
    }
  });
}

async sendMessage(prompt: string) {
  await this.signalrService.sendPrompt(prompt);
}
```

## API Endpoints

- **GET** `/test-signalr.html` - Test page for SignalR streaming
- **POST** `/gemini` - Original endpoint (still available)
- **POST** `/gemini/stream` - New streaming endpoint
- **SignalR Hub** `/aiStreamingHub` - SignalR connection endpoint

## Configuration Notes

- Default Angular dev server: `http://localhost:4200`
- Default WebApi server: `http://localhost:5000`
- CORS is configured for SignalR with credentials support
- SignalR requires `AllowCredentials()` in CORS policy

## Next Steps

1. Run `npm install` to install the SignalR client package
2. Start your WebApi server
3. Test with the HTML page or integrate the Angular service
4. Customize the streaming behavior as needed

The original `/gemini` endpoint remains unchanged for backward compatibility.