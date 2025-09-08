import requests
import json
import time

# --- Cấu hình ---
API_URL = 'https://online.bhv.com.vn/3f2fb62a-662a-4911-afad-d0ec4925f29e'
HEADERS = {
    'Accept': 'application/json, text/javascript, */*; q=0.01',
    'Content-Type': 'application/json; charset=UTF-8',
    'Origin': 'https://online.bhv.com.vn',
    'Referer': 'https://online.bhv.com.vn/bao-hiem-xe-co-gioi',
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
    'X-Requested-With': 'XMLHttpRequest'
}
OUTPUT_FILE = 'vietnam_administrative_data_final.json'

# THAY ĐỔI 1: Nhúng trực tiếp dữ liệu tỉnh/thành phố đã có sẵn
# Dữ liệu này sẽ được dùng thay cho việc gọi API ở bước đầu tiên
PROVINCES_DATA = [
  { "name": "Thành phố Hà Nội", "value": "eee52932-0358-47d5-9984-be1132c7f01" },
  { "name": "Tỉnh Hà Giang", "value": "eee52932-0358-47d5-9984-be1132c7f02" },
  { "name": "Tỉnh Cao Bằng", "value": "eee52932-0358-47d5-9984-be1132c7f04" },
  { "name": "Tỉnh Bắc Kạn", "value": "eee52932-0358-47d5-9984-be1132c7f06" },
  { "name": "Tỉnh Tuyên Quang", "value": "eee52932-0358-47d5-9984-be1132c7f08" },
  { "name": "Tỉnh Lào Cai", "value": "eee52932-0358-47d5-9984-be1132c7f10" },
  { "name": "Tỉnh Điện Biên", "value": "eee52932-0358-47d5-9984-be1132c7f11" },
  { "name": "Tỉnh Lai Châu", "value": "eee52932-0358-47d5-9984-be1132c7f12" },
  { "name": "Tỉnh Sơn La", "value": "eee52932-0358-47d5-9984-be1132c7f14" },
  { "name": "Tỉnh Yên Bái", "value": "eee52932-0358-47d5-9984-be1132c7f15" },
  { "name": "Tỉnh Hoà Bình", "value": "eee52932-0358-47d5-9984-be1132c7f17" },
  { "name": "Tỉnh Thái Nguyên", "value": "eee52932-0358-47d5-9984-be1132c7f19" },
  { "name": "Tỉnh Lạng Sơn", "value": "eee52932-0358-47d5-9984-be1132c7f20" },
  { "name": "Tỉnh Quảng Ninh", "value": "eee52932-0358-47d5-9984-be1132c7f22" },
  { "name": "Tỉnh Bắc Giang", "value": "eee52932-0358-47d5-9984-be1132c7f24" },
  { "name": "Tỉnh Phú Thọ", "value": "eee52932-0358-47d5-9984-be1132c7f25" },
  { "name": "Tỉnh Vĩnh Phúc", "value": "eee52932-0358-47d5-9984-be1132c7f26" },
  { "name": "Tỉnh Bắc Ninh", "value": "eee52932-0358-47d5-9984-be1132c7f27" },
  { "name": "Tỉnh Hải Dương", "value": "eee52932-0358-47d5-9984-be1132c7f30" },
  { "name": "Thành phố Hải Phòng", "value": "eee52932-0358-47d5-9984-be1132c7f31" },
  { "name": "Tỉnh Hưng Yên", "value": "eee52932-0358-47d5-9984-be1132c7f33" },
  { "name": "Tỉnh Thái Bình", "value": "eee52932-0358-47d5-9984-be1132c7f34" },
  { "name": "Tỉnh Hà Nam", "value": "eee52932-0358-47d5-9984-be1132c7f35" },
  { "name": "Tỉnh Nam Định", "value": "eee52932-0358-47d5-9984-be1132c7f36" },
  { "name": "Tỉnh Ninh Bình", "value": "eee52932-0358-47d5-9984-be1132c7f37" },
  { "name": "Tỉnh Thanh Hóa", "value": "eee52932-0358-47d5-9984-be1132c7f38" },
  { "name": "Tỉnh Nghệ An", "value": "eee52932-0358-47d5-9984-be1132c7f40" },
  { "name": "Tỉnh Hà Tĩnh", "value": "eee52932-0358-47d5-9984-be1132c7f42" },
  { "name": "Tỉnh Quảng Bình", "value": "eee52932-0358-47d5-9984-be1132c7f44" },
  { "name": "Tỉnh Quảng Trị", "value": "eee52932-0358-47d5-9984-be1132c7f45" },
  { "name": "Tỉnh Thừa Thiên Huế", "value": "eee52932-0358-47d5-9984-be1132c7f46" },
  { "name": "Thành phố Đà Nẵng", "value": "eee52932-0358-47d5-9984-be1132c7f48" },
  { "name": "Tỉnh Quảng Nam", "value": "eee52932-0358-47d5-9984-be1132c7f49" },
  { "name": "Tỉnh Quảng Ngãi", "value": "eee52932-0358-47d5-9984-be1132c7f51" },
  { "name": "Tỉnh Bình Định", "value": "eee52932-0358-47d5-9984-be1132c7f52" },
  { "name": "Tỉnh Phú Yên", "value": "eee52932-0358-47d5-9984-be1132c7f54" },
  { "name": "Tỉnh Khánh Hòa", "value": "eee52932-0358-47d5-9984-be1132c7f56" },
  { "name": "Tỉnh Ninh Thuận", "value": "eee52932-0358-47d5-9984-be1132c7f58" },
  { "name": "Tỉnh Bình Thuận", "value": "eee52932-0358-47d5-9984-be1132c7f60" },
  { "name": "Tỉnh Kon Tum", "value": "eee52932-0358-47d5-9984-be1132c7f62" },
  { "name": "Tỉnh Gia Lai", "value": "eee52932-0358-47d5-9984-be1132c7f64" },
  { "name": "Tỉnh Đắk Lắk", "value": "eee52932-0358-47d5-9984-be1132c7f66" },
  { "name": "Tỉnh Đắk Nông", "value": "eee52932-0358-47d5-9984-be1132c7f67" },
  { "name": "Tỉnh Lâm Đồng", "value": "eee52932-0358-47d5-9984-be1132c7f68" },
  { "name": "Tỉnh Bình Phước", "value": "eee52932-0358-47d5-9984-be1132c7f70" },
  { "name": "Tỉnh Tây Ninh", "value": "eee52932-0358-47d5-9984-be1132c7f72" },
  { "name": "Tỉnh Bình Dương", "value": "eee52932-0358-47d5-9984-be1132c7f74" },
  { "name": "Tỉnh Đồng Nai", "value": "eee52932-0358-47d5-9984-be1132c7f75" },
  { "name": "Tỉnh Bà Rịa - Vũng Tàu", "value": "eee52932-0358-47d5-9984-be1132c7f77" },
  { "name": "Thành phố Hồ Chí Minh", "value": "eee52932-0358-47d5-9984-be1132c7f79" },
  { "name": "Tỉnh Long An", "value": "eee52932-0358-47d5-9984-be1132c7f80" },
  { "name": "Tỉnh Tiền Giang", "value": "eee52932-0358-47d5-9984-be1132c7f82" },
  { "name": "Tỉnh Bến Tre", "value": "eee52932-0358-47d5-9984-be1132c7f83" },
  { "name": "Tỉnh Trà Vinh", "value": "eee52932-0358-47d5-9984-be1132c7f84" },
  { "name": "Tỉnh Vĩnh Long", "value": "eee52932-0358-47d5-9984-be1132c7f86" },
  { "name": "Tỉnh Đồng Tháp", "value": "eee52932-0358-47d5-9984-be1132c7f87" },
  { "name": "Tỉnh An Giang", "value": "eee52932-0358-47d5-9984-be1132c7f89" },
  { "name": "Tỉnh Kiên Giang", "value": "eee52932-0358-47d5-9984-be1132c7f91" },
  { "name": "Thành phố Cần Thơ", "value": "eee52932-0358-47d5-9984-be1132c7f92" },
  { "name": "Tỉnh Hậu Giang", "value": "eee52932-0358-47d5-9984-be1132c7f93" },
  { "name": "Tỉnh Sóc Trăng", "value": "eee52932-0358-47d5-9984-be1132c7f94" },
  { "name": "Tỉnh Bạc Liêu", "value": "eee52932-0358-47d5-9984-be1132c7f95" },
  { "name": "Tỉnh Cà Mau", "value": "eee52932-0358-47d5-9984-be1132c7f96" }
]

def get_districts(root_id):
    """
    Hàm chỉ để gọi API lấy quận/huyện.
    """
    payload = {
        "action_name": "base/load/district",
        "data": json.dumps({"root_id": root_id}),
        "d_info": {}
    }

    try:
        response = requests.post(API_URL, headers=HEADERS, json=payload, timeout=20)
        response.raise_for_status()
        response_data = response.json()
        
        # Thêm kiểm tra để tránh lỗi khi 'data' không có hoặc rỗng
        if response_data.get('data') and isinstance(response_data['data'], str):
            return json.loads(response_data['data'])
        else:
            print(f"Cảnh báo: Không có dữ liệu quận/huyện cho root_id {root_id}")
            return []
            
    except requests.exceptions.RequestException as e:
        print(f"Lỗi khi gọi API cho root_id {root_id}: {e}")
        return None
    except json.JSONDecodeError as e:
        print(f"Lỗi giải mã JSON cho root_id {root_id}: {e}")
        return None


def main():
    provinces = PROVINCES_DATA # Sử dụng dữ liệu có sẵn
    print(f"Đã tải {len(provinces)} tỉnh/thành phố từ dữ liệu có sẵn.")
    
    all_data = []

    for province in provinces:
        # THAY ĐỔI 2: Sử dụng key 'value' thay vì 'id'
        province_id = province.get('value')
        province_name = province.get('name')
        
        if not province_id or not province_name:
            continue

        print(f"Đang lấy dữ liệu cho: {province_name}...")
        
        districts = get_districts(root_id=province_id)

        # Đổi tên key để thống nhất
        province_data = {
            'province_code': province_id,
            'province_name': province_name,
            'districts_and_wards': districts if districts else []
        }
        all_data.append(province_data)
        
        time.sleep(0.5)

    try:
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(all_data, f, ensure_ascii=False, indent=2)
        print(f"\n✅ Hoàn thành! Dữ liệu đã được lưu vào file '{OUTPUT_FILE}'")
    except IOError as e:
        print(f"Lỗi khi ghi file: {e}")

if __name__ == "__main__":
    main()