# 🔍 Debug Loading Issue - Step by Step

## Current Status
The frontend is still stuck on "Loading available models..." which means the HTTP request to `/api/ai-models` is either:
1. **Failing** (network error, CORS, backend not running)
2. **Hanging** (request never completes)
3. **Returning empty data** (database has no records)

## 🚀 Step-by-Step Debugging

### Step 1: Check Backend is Running
```bash
cd MyDemoApp.WebApi
dotnet run
```

**Expected output:**
```
info: Microsoft.Hosting.Lifetime[14]
      Now listening on: http://localhost:5134
```

### Step 2: Test API Directly
Open a new terminal and test the API:
```bash
curl http://localhost:5134/api/ai-models
```

**Expected output:**
```json
[
  {
    "id": 1,
    "modelId": "gemini-1.5-flash",
    "name": "Gemini 1.5 Flash",
    "description": "Best for complex tasks with faster response times",
    "isActive": true,
    "isDefault": true,
    "provider": "Google",
    "version": "1.5",
    "maxTokens": 8192,
    "temperature": 0.7,
    "displayOrder": 1,
    "createdAt": "2024-12-31T00:00:00Z",
    "updatedAt": "2024-12-31T00:00:00Z"
  },
  {
    "id": 2,
    "modelId": "gemini-2.0-flash-001",
    "name": "Gemini 2.0 Flash",
    "description": "Latest model, optimized for chat and simple tasks",
    "isActive": true,
    "isDefault": false,
    "provider": "Google",
    "version": "2.0",
    "maxTokens": 8192,
    "temperature": 0.7,
    "displayOrder": 2,
    "createdAt": "2024-12-31T00:00:00Z",
    "updatedAt": "2024-12-31T00:00:00Z"
  }
]
```

### Step 3: Check Database
If API returns empty `[]`, check the database:
```bash
# Connect to MySQL
mysql -u root -p

# Use your database
USE MyDemoApp;

# Check if table exists
SHOW TABLES;

# Check if data exists
SELECT * FROM AiModels;
```

**Expected output:**
```
+----+----------------------+-------------------+--------------------------------------------------+---------+-----------+---------------------+---------------------+----------+---------+-----------+-------------+--------------+
| Id | ModelId              | Name              | Description                                      | IsActive| IsDefault | CreatedAt           | UpdatedAt           | Provider | Version | MaxTokens | Temperature | DisplayOrder |
+----+----------------------+-------------------+--------------------------------------------------+---------+-----------+---------------------+---------------------+----------+---------+-----------+-------------+--------------+
|  1 | gemini-1.5-flash     | Gemini 1.5 Flash  | Best for complex tasks with faster response times|       1 |         1 | 2024-12-31 00:00:00 | 2024-12-31 00:00:00 | Google   | 1.5     |      8192 |        0.70 |            1 |
|  2 | gemini-2.0-flash-001 | Gemini 2.0 Flash  | Latest model, optimized for chat and simple tasks|       1 |         0 | 2024-12-31 00:00:00 | 2024-12-31 00:00:00 | Google   | 2.0     |      8192 |        0.70 |            2 |
+----+----------------------+-------------------+--------------------------------------------------+---------+-----------+---------------------+---------------------+----------+---------+-----------+-------------+--------------+
```

### Step 4: Check Frontend Console
1. Open browser Developer Tools (F12)
2. Go to **Console** tab
3. Look for these messages:

**Expected (Success):**
```
Loading models from: http://localhost:5134/api/ai-models
Models loaded successfully: [Array of 2 models]
```

**If Error:**
```
Loading models from: http://localhost:5134/api/ai-models
Error loading models: [Error details]
Error details: {status: 404, statusText: "Not Found", url: "...", message: "..."}
```

### Step 5: Check Network Tab
1. In Developer Tools, go to **Network** tab
2. Refresh the page
3. Look for the request to `/api/ai-models`

**Check:**
- ✅ **Status**: Should be `200 OK`
- ❌ **Status**: `404` = API endpoint not found
- ❌ **Status**: `500` = Server error
- ❌ **Status**: `0` or `CORS error` = CORS issue
- ❌ **No request** = Frontend not making the call

## 🔧 Common Fixes

### Fix 1: Database Not Seeded
```bash
cd MyDemoApp.WebApi
dotnet ef database drop --force
dotnet ef database update
```

### Fix 2: Backend Not Running
```bash
cd MyDemoApp.WebApi
dotnet run
```

### Fix 3: CORS Issue
Check that `Program.cs` has CORS configured:
```csharp
app.UseCors("AllowAll");
```

### Fix 4: Wrong API URL
Check `ai-model.service.ts` has correct URL:
```typescript
private baseUrl = 'http://localhost:5134/api/ai-models';
```

### Fix 5: Migration Not Applied
```bash
cd MyDemoApp.WebApi
dotnet ef migrations list
dotnet ef database update
```

## 🎯 Quick Test Commands

**Test everything in sequence:**
```bash
# 1. Apply migration
cd MyDemoApp.WebApi
dotnet ef database update

# 2. Start backend
dotnet run &

# 3. Test API
curl http://localhost:5134/api/ai-models

# 4. Check database
mysql -u root -p -e "USE MyDemoApp; SELECT COUNT(*) FROM AiModels;"
```

## 📊 Expected Results

After fixing:
1. **Backend**: Returns 2 models from API
2. **Database**: Contains 2 AiModel records
3. **Frontend**: Shows model selector with 2 options
4. **Console**: Shows "Models loaded successfully"
5. **Network**: Shows successful 200 response

## 🚨 If Still Not Working

Please share:
1. **Backend console output** when starting `dotnet run`
2. **API response** from `curl http://localhost:5134/api/ai-models`
3. **Database query result** from `SELECT * FROM AiModels;`
4. **Browser console errors** from Developer Tools
5. **Network tab** showing the HTTP request status

This will help identify exactly where the issue is occurring.