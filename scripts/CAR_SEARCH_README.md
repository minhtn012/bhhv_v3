# Car Search MongoDB Scripts

Các script Node.js để import và tìm kiếm dữ liệu xe trong MongoDB cho hệ thống bảo hiểm BHV.

## 📁 Files

- `import-car-data.js` - Import dữ liệu xe từ JSON vào MongoDB
- `setup-car-indexes.js` - Tạo indexes tối ưu cho tìm kiếm
- `test-car-search.js` - Test và demo tính năng tìm kiếm
- `CAR_SEARCH_README.md` - Tài liệu hướng dẫn

## 🚀 Cài đặt

1. Đảm bảo MongoDB đang chạy:
```bash
# Start MongoDB (local)
mongod

# Hoặc sử dụng Docker
docker run -d -p 27017:27017 mongo
```

2. Cấu hình environment variables (tùy chọn):
```bash
export MONGODB_URI="mongodb://localhost:27017"
export DB_NAME="bhv_insurance"
```

## 📖 Sử dụng

### 1. Import dữ liệu xe

```bash
# Import tất cả dữ liệu xe từ bd_json/all_car_details.json
node scripts/import-car-data.js
```

Output:
```
🚀 Starting car data import...
📖 Reading car data file...
📊 Found 156 brands to process
🔌 Connecting to MongoDB...
🗑️  Clearing existing car data...
📝 Prepared 2847 car records for import
📥 Imported 2847/2847 records...
✅ Car data import completed successfully!
```

### 2. Thiết lập indexes

```bash
# Tạo indexes cho text search và performance
node scripts/setup-car-indexes.js
```

Output:
```
🚀 Setting up car collection indexes...
📝 Creating text search index...
🔍 Creating brand+model compound index...
📊 Creating individual field indexes...
✅ Car indexes setup completed successfully!
```

### 3. Test tìm kiếm

```bash
# Chạy tất cả tests
node scripts/test-car-search.js

# Tìm kiếm cụ thể
node scripts/test-car-search.js "kia k3"
node scripts/test-car-search.js "bmw"
node scripts/test-car-search.js "suv"
```

## 🔍 Tính năng tìm kiếm

### Text Search
Sử dụng MongoDB text index với trọng số ưu tiên:
- Brand name (10) - Ưu tiên cao nhất
- Model name (8) - Ưu tiên cao
- Search keywords (5) - Ưu tiên trung bình

### Regex Search
Tìm kiếm partial match, case-insensitive:
```javascript
// Tìm tất cả xe có chứa "bmw" và "x5"
searchService.regexSearch("bmw x5")
```

### Exact Match
Tìm chính xác brand + model:
```javascript
// Tìm chính xác BMW X5
searchService.exactSearch("BMW", "X5")
```

### Smart Search
Kết hợp tất cả phương pháp:
```javascript
const results = await searchService.smartSearch("kia k3");
// Trả về: { textSearch: [...], regexSearch: [...], exactMatch: {...} }
```

## 📊 Cấu trúc dữ liệu MongoDB

```javascript
{
  "_id": ObjectId("..."),
  "brand_name": "KIA",
  "brand_id": "b07cadc0-b84d-4863-b374-fe018b3194c123",
  "model_name": "K3",
  "model_id": "f07080e9-c23f-449f-83e9-f8c2a8778d0456",
  "body_styles": [
    {
      "id": "cb3464e5-bb4d-4268-a08d-b432252dee92",
      "code": "CAR_BODY_STYLES",
      "name": "SEDAN"
    }
  ],
  "years": [
    {
      "id": "5d716993-a5b6-4435-916a-daf5f2e4190f0789",
      "code": "CAR_MODEL_YEAR", 
      "name": "1.6 AT"
    }
  ],
  "search_keywords": ["kia", "k3", "sedan", "1.6 at"],
  "created_at": ISODate("2025-09-03T..."),
  "updated_at": ISODate("2025-09-03T...")
}
```

## 🎯 Use Cases

### 1. Auto-complete trong form
```javascript
const CarSearchService = require('./test-car-search').CarSearchService;
const searchService = new CarSearchService();
await searchService.connect();

// User gõ "ki"
const suggestions = await searchService.regexSearch("ki", 5);
// Trả về: KIA models, Kính xe, etc.
```

### 2. Mapping user input thành UUID
```javascript
// User chọn "KIA K3 SEDAN 1.6 AT"
const exactMatch = await searchService.exactSearch("KIA", "K3");
const carInfo = {
  car_automaker: exactMatch.brand_id,
  car_model: exactMatch.model_id,
  car_body_styles: exactMatch.body_styles[0].id, // SEDAN
  car_model_year: exactMatch.years[0].id // 1.6 AT
};
```

### 3. Lấy danh sách cho dropdown
```javascript
// Lấy tất cả brands
const brands = await searchService.getAllBrands();

// Lấy models theo brand
const kiaModels = await searchService.getModelsByBrand("KIA");
```

## 🔧 Cấu hình

### Environment Variables
- `MONGODB_URI` - MongoDB connection string (default: `mongodb://localhost:27017`)
- `DB_NAME` - Database name (default: `bhv_insurance`)

### MongoDB Indexes
- `car_text_search` - Text search trên brand_name, model_name, search_keywords
- `brand_model_search` - Compound index cho exact search
- `brand_name_search` - Index cho filter theo brand
- `model_name_search` - Index cho filter theo model

## 🚨 Troubleshooting

### 1. Connection Error
```bash
# Kiểm tra MongoDB có chạy không
mongosh # hoặc mongo

# Kiểm tra port 27017
netstat -an | grep 27017
```

### 2. Import Failed
```bash
# Kiểm tra file tồn tại
ls -la bd_json/all_car_details.json

# Kiểm tra JSON valid
node -e "console.log(JSON.parse(require('fs').readFileSync('bd_json/all_car_details.json', 'utf8')).length)"
```

### 3. Search không hoạt động
```bash
# Chạy lại setup indexes
node scripts/setup-car-indexes.js

# Kiểm tra indexes
mongosh bhv_insurance --eval "db.cars.getIndexes()"
```

## 📈 Performance

- **Text Search**: ~5-10ms cho query phổ biến
- **Regex Search**: ~10-50ms tùy complexity
- **Exact Match**: ~1-5ms với compound index
- **Memory Usage**: ~50MB cho 3000+ records

## 🔄 Workflow Integration

```javascript
// Integration với BHV automation
async function mapUserInputToUUIDs(userQuery) {
  const searchService = new CarSearchService();
  await searchService.connect();
  
  const results = await searchService.smartSearch(userQuery);
  
  // Ưu tiên exact match
  if (results.exactMatch) {
    return {
      car_automaker: results.exactMatch.brand_id,
      car_model: results.exactMatch.model_id,
      // User sẽ chọn body_style và year từ options
      body_style_options: results.exactMatch.body_styles,
      year_options: results.exactMatch.years
    };
  }
  
  // Fallback to suggestions
  return {
    suggestions: results.textSearch.slice(0, 5)
  };
}
```