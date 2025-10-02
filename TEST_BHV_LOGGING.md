# Test BHV Logging

## Verify logs are being saved to database

### 1. Check environment variables
```bash
# Make sure these are set in .env
ENABLE_DB_LOGGING=true
NODE_ENV=development
```

### 2. Test BHV submission
```bash
# Submit a contract to BHV (will fail if no valid cookies)
curl -X POST http://localhost:3000/api/contracts/YOUR_CONTRACT_ID/submit-to-bhv \
  -H "Content-Type: application/json" \
  -H "Cookie: token=YOUR_AUTH_TOKEN" \
  -d '{"cookies": {}}'
```

### 3. Check logs in admin panel
Visit: http://localhost:3000/admin/logs
- Filter by path: `/submit-to-bhv`
- Should see logs with full context

### 4. Check MongoDB directly
```bash
docker exec -it bhhv_mongodb mongosh -u dev -p dev123 --authenticationDatabase admin

use bhhv
db.systemlogs.find({ path: { $regex: "submit-to-bhv" } }).pretty()
```

### Expected log structure
```json
{
  "_id": "...",
  "timestamp": "2025-01-10T10:30:45.123Z",
  "level": "error",
  "message": "BHV Submission Failed - BHV API Returned Error",
  "context": {
    "contractId": "68de816011fe03fc4a6dccb8",
    "stage": "BHV API Returned Error",
    "error": "Invalid cookies",
    "duration": "2345ms",
    "errorMessage": "Invalid cookies",
    "rawResponse": {...},
    "requestData": {
      "action_name": "...",
      "d_info": {...}
    },
    "cookies": ["4c5234cd-80ac-4deb-ae8e-a79b531f901e"]
  },
  "method": "POST",
  "path": "/api/contracts/68de816011fe03fc4a6dccb8/submit-to-bhv",
  "metadata": {
    // Same as context
  }
}
```

### 5. Verify data completeness
Check that log contains:
- ✅ Full requestData (để replay)
- ✅ rawResponse từ BHV
- ✅ cookies list
- ✅ duration
- ✅ error message

### 6. Test cURL export
1. Go to /admin/logs
2. Click "Details" on BHV log
3. Click "🔧 cURL Command"
4. Should see complete curl command with request body
5. Click "📋 Copy cURL Command"
6. Paste and run (after replacing cookies)

## Troubleshooting

### Logs not appearing in DB?
1. Check `ENABLE_DB_LOGGING=true` in .env
2. Check MongoDB connection
3. Check logQueue is flushing: `console.log(logQueue.getQueueSize())`
4. Check SystemLog model indexes: `db.systemlogs.getIndexes()`

### Logs missing request data?
Check that `bhvError()` is receiving `additionalContext` parameter with:
- requestData
- rawResponse
- cookies
- duration

### Can't access /admin/logs?
1. Login as admin user
2. Check token in cookies
3. Check `withAdmin` middleware is working
