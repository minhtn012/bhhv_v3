Business Logic Questions:

  1. Insurance Calculator Edge Cases: Có case nào đặc biệt khác ngoài xe >10 năm không có AU009? Ví dụ: xe
  sang luxury có rule riêng?
  A: ko cần.
  2. OCR Accuracy: OCR service hiện tại độ chính xác như thế nào? Có cần test với nhiều format ảnh khác
  nhau?
  A; t đang dùng OCR của google, chất lượng tốt, phần này sau khi ocr cũng có human-loop nên dữ liệu chính xác
  3. Contract Number Generation: Logic BH + YYYYMMDD + random có risk collision không? Cần test uniqueness?
A: đây là số random, chưa xử lý, cũng ko cần quan tâm. 
  Test Data & Environment:

  4. Production Data: Có thể dùng anonymized production data để test không? Hay cần tạo synthetic data?
  A: chưa hiểu các thuật ngữ này
  5. Test Database: Cần setup MongoDB test instance riêng hay mock data trong memory?
  A: cách nào cũng dc, có thể instance riêng để tiện sử dụng
  6. Car Database: 4 collections (Car, Province/DistrictWard) có cần seed data không?
A: đây đều là dữ liệu chuẩn rồi
  Performance & Scale:

  7. Concurrent Users: Hệ thống cần handle bao nhiêu users đồng thời tạo contract?
  A: chỉ khoảng 10ng thôi
  8. File Upload Limits: Ảnh cavet/đăng kiểm có size limit? Cần test với large files?
A: limit dưới 10MB, hiện tại t chưa setup
  Workflow & Authorization:

  9. Role Permissions: Admin có thể override pricing calculations không? Cần test unauthorized access?
  A: có, admin dc toàn quyền
  10. Status Rollback: Có case nào cần rollback status không? (vd: khach_duyet → cho_duyet)
A: ko cần phức tạp. chỉ đi 1 chiều thôi

  Với thông tin này tôi sẽ đề xuất:
  - Jest + RTL cho unit/integration tests
  - Playwright cho E2E (tốt hơn Cypress cho complex forms)
  - MSW để mock APIs
  - Test containers cho database testing