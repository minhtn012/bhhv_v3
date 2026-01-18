Pacific Cross API Flow

  1. POST /cert (is_quote=1)
     → Server tạo cert, redirect về /cert/{cert_id}/edit

  2. Cert ID format: "306726::d3C2kw3WJS"
     → {number}::{hash}

  3. GET /cert/{cert_id}/history
     → Trả về JSON với revision history

  Từ URL redirect https://paris.pacificcross.com.vn/cert/306726::d3C2kw3WJS/edit, ta extract được cert_no = 306726.

  ---
  Tổng kết đủ info để implement
  ┌──────────────────┬────────────────────────────────────────┐
  │       Item       │                 Status                 │
  ├──────────────────┼────────────────────────────────────────┤
  │ Form fields      │ ✅ Đã có từ HTML                       │
  ├──────────────────┼────────────────────────────────────────┤
  │ Request payload  │ ✅ Đã có từ curl.txt                   │
  ├──────────────────┼────────────────────────────────────────┤
  │ Cert ID format   │ ✅ {number}::{hash}                    │
  ├──────────────────┼────────────────────────────────────────┤
  │ Auth             │ ✅ Cookie-based (XSRF-TOKEN + session) │
  ├──────────────────┼────────────────────────────────────────┤
  │ Quote vs Confirm │ ✅ is_quote=1 / is_quote=0             │
  └──────────────────┴────────────────────────────────────────┘
  ---
  Bạn muốn tôi bắt đầu tạo plan implementation cho Travel Insurance không? Hoặc có thêm API calls nào cần capture? (ví dụ: login endpoint, get cert detail, confirm to final contract)
