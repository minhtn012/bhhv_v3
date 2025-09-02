import requests
import json
import time
import os
from tqdm import tqdm

# --- Cấu hình ---
API_URL = "https://online.bhv.com.vn/3f2fb62a-662a-4911-afad-d0ec4925f29e"
PRODUCT_ID = "3588e406-6f89-4a14-839b-64460bbcea67"
INPUT_FILE = "car_automakers.json"
OUTPUT_FILE = "all_car_details.json"
REQUEST_DELAY_SECONDS = 0.5

# Headers cần thiết để giả lập một request từ trình duyệt
HEADERS = {
    'Accept': 'application/json, text/javascript, */*; q=0.01',
    'Content-Type': 'application/json; charset=UTF-8',
    'Origin': 'https://online.bhv.com.vn',
    'Referer': 'https://online.bhv.com.vn/bao-hiem-xe-co-gioi',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'X-Requested-With': 'XMLHttpRequest'
}

def fetch_details(session, root_id, child_code):
    """
    Hàm gửi request đến API và xử lý response có cấu trúc data là một chuỗi JSON.
    """
    inner_data = {
        "root_id": root_id,
        "child_code": child_code,
        "product_id": PRODUCT_ID
    }
    
    payload = {
        "action_name": "base/load/option/map",
        "data": json.dumps(inner_data),
        "d_info": {}
    }

    try:
        response = session.post(API_URL, headers=HEADERS, json=payload, timeout=15)
        response.raise_for_status()
        
        # **SỬA LỖI CỐT LÕI 1: XỬ LÝ DOUBLE JSON PARSING**
        response_json = response.json()
        data_string = response_json.get("data")

        if isinstance(data_string, str):
            # Parse chuỗi JSON bên trong để lấy dữ liệu thực
            actual_data = json.loads(data_string)
            return actual_data
        else:
            # Nếu data không phải là string, trả về trực tiếp (dự phòng)
            return data_string if data_string else []

    except requests.exceptions.RequestException as e:
        tqdm.write(f"Lỗi API cho root_id {root_id} ({child_code}): {e}")
        return []
    except json.JSONDecodeError:
        tqdm.write(f"Lỗi JSON Decode cho root_id {root_id} ({child_code}).")
        return []
    except Exception as e:
        tqdm.write(f"Lỗi không xác định: {e}")
        return []

def main():
    """
    Hàm chính để thực thi quá trình scrape dữ liệu.
    """
    if not os.path.exists(INPUT_FILE):
        print(f"Lỗi: Không tìm thấy file '{INPUT_FILE}'.")
        return

    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        brands = json.load(f)

    all_car_data = []
    
    with requests.Session() as session:
        brand_pbar = tqdm(brands, desc="Đang xử lý các hãng xe")
        
        for brand in brand_pbar:
            brand_name = brand.get("name")
            brand_id = brand.get("value")
            
            brand_pbar.set_description(f"Hãng: {brand_name.ljust(20)}")

            models = fetch_details(session, brand_id, "CAR_MODEL")
            time.sleep(REQUEST_DELAY_SECONDS)
            
            if not models:
                continue

            brand_data = {
                "brand_name": brand_name,
                "brand_id": brand_id,
                "models": []
            }
            
            for model in tqdm(models, desc=f"  -> Dòng xe", leave=False, bar_format='{l_bar}{bar}| {n_fmt}/{total_fmt}'):
                model_name = None
                model_id = None
                
                if isinstance(model, dict):
                    model_name = model.get("name")
                    # **SỬA LỖI CỐT LÕI 2: SỬ DỤNG KEY "id" THAY VÌ "value"**
                    model_id = model.get("id")
                elif isinstance(model, str):
                    model_name = model
                    model_id = None
                else:
                    tqdm.write(f"Cảnh báo: Bỏ qua dòng xe có kiểu dữ liệu lạ: {model}")
                    continue

                body_styles = []
                years = []

                if model_id:
                    body_styles = fetch_details(session, model_id, "CAR_BODY_STYLES")
                    time.sleep(REQUEST_DELAY_SECONDS)
                    years = fetch_details(session, model_id, "CAR_MODEL_YEAR")
                    time.sleep(REQUEST_DELAY_SECONDS)
                
                model_details = {
                    "model_name": model_name,
                    "model_id": model_id,
                    "body_styles": body_styles,
                    "years": years
                }
                brand_data["models"].append(model_details)
            
            all_car_data.append(brand_data)

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(all_car_data, f, ensure_ascii=False, indent=2)

    print(f"\n✅ Hoàn thành! Dữ liệu đã được lưu vào file '{OUTPUT_FILE}'.")

if __name__ == "__main__":
    main()