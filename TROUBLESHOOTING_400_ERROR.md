# Troubleshooting 400 Bad Request Error

## Steps to Debug the Issue

### 1. Test the Backend Endpoint Directly

First, test if the backend endpoint is working correctly:

1. Start your WebApi server
2. Navigate to `http://localhost:5134/test-endpoint.html`
3. Click "Test /gemini/stream/test" button
4. Check if you get a successful response

### 2. Check Server Console Output

When you make a request, check your WebApi server console for these debug messages:
- `"Received streaming request - Prompt: '...', ConnectionId: '...'"`
- `"Starting streaming..."`

If you see `"Request is null"` or `"Missing required fields"`, the JSON parsing is failing.

### 3. Verify SignalR Connection

In your browser console, check for:
- `"SignalR connection established"` - Connection successful
- Connection errors - SignalR failed to connect

### 4. Test with Browser Developer Tools

1. Open browser Developer Tools (F12)
2. Go to Network tab
3. Try to send a message
4. Look for the `/gemini/stream` request
5. Check the request payload and response

### 5. Common Issues and Solutions

#### Issue: "Request is null"
**Solution**: The JSON body isn't being parsed correctly.
- Verify `Content-Type: application/json` header is set
- Check that the request body is valid JSON

#### Issue: "Missing required fields"
**Solution**: The properties aren't being deserialized correctly.
- Check property names match exactly: `prompt` and `connectionId`
- Verify JSON property casing

#### Issue: "SignalR connection ID not available"
**Solution**: SignalR connection isn't fully established.
- Wait for connection to be established before sending messages
- Check SignalR hub URL is correct
- Verify CORS settings

### 6. Manual Testing with curl

Test the endpoint directly with curl:

```bash
curl -X POST http://localhost:5134/gemini/stream/test \
  -H "Content-Type: application/json" \
  -d '{"prompt":"test message","connectionId":"test-id"}'
```

Expected response:
```json
{
  "received": {
    "prompt": "test message",
    "connectionId": "test-id"
  },
  "message": "Test successful"
}
```

### 7. Check CORS Configuration

If testing from a different origin, ensure CORS is configured correctly:
- `http://localhost:4200` for Angular dev server
- `http://localhost:5134` for local testing

### 8. Verify Package Versions

Ensure you have compatible package versions:
- `Microsoft.AspNetCore.SignalR` version should match your .NET version
- Check that all packages are restored correctly

### 9. Enable Detailed Logging

Add this to your `appsettings.Development.json`:

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning",
      "Microsoft.AspNetCore.SignalR": "Debug"
    }
  }
}
```

### 10. Test Sequence

Follow this sequence to isolate the issue:

1. **Test basic endpoint**: `/gemini/stream/test`
2. **Test SignalR connection**: Check browser console for connection messages
3. **Test streaming endpoint**: `/gemini/stream` with valid connectionId
4. **Test from Angular**: Use the updated service

### Expected Flow

1. Angular service connects to SignalR hub
2. Service gets a connectionId from SignalR
3. Service sends POST to `/gemini/stream` with prompt and connectionId
4. Backend starts streaming via SignalR events
5. Angular receives real-time updates

If any step fails, focus on that specific area for debugging.