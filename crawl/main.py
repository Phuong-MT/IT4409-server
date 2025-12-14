import time
import json
import re
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from webdriver_manager.chrome import ChromeDriverManager

class CellphoneSJsonCrawler:
    def __init__(self):
        self.options = Options()
        self.options.add_argument("--window-size=1920,1080")
        self.options.add_argument("--disable-notifications")
        
        self.driver = webdriver.Chrome(
            service=Service(ChromeDriverManager().install()), 
            options=self.options
        )
        self.wait = WebDriverWait(self.driver, 10)

    def get_clean_image_url(thumbnail_url):
        """
        Biến đổi link thumbnail thành link full HD.
        Ví dụ: '.../insecure/rs:fill:58:58/q:90/plain/https://...' 
        -> 'https://...'
        """
        if not thumbnail_url:
            return ""
        
        # Logic: Link gốc thường nằm sau chữ "/plain/"
        if "/plain/" in thumbnail_url:
            return thumbnail_url.split("/plain/")[-1]
        return thumbnail_url

    def clean_price(self, price_str):
        """Chuyển đổi '20.990.000₫' -> 20990000"""
        if not price_str: return 0
        clean = re.sub(r'[^\d]', '', price_str)
        return int(clean) if clean else 0

    def parse_product_detail(self, link):
        """
        Vào trang chi tiết, lấy dữ liệu và map về đúng cấu trúc Schema
        """
        print(f"  -> Đang xử lý: {link}")
        self.driver.get(link)
        time.sleep(2) # Chờ load

        try:
            # 1. Lấy thông tin cơ bản
            try:
                title_element = self.driver.find_element(By.CSS_SELECTOR, ".box-product-name h1")
                title = title_element.text.strip()
            except:
                title = "Unknown Product"

            # 2. Lấy giá (Sale & Gốc)
            try:
                # Class này có thể thay đổi tùy thời điểm, cần inspect lại nếu lỗi
                sale_price_elem = self.driver.find_element(By.CSS_SELECTOR, ".box-product-price .sale-price")
                sale_price = self.clean_price(sale_price_elem.text)
            except:
                sale_price = 0
            
            try:
                price_elem = self.driver.find_element(By.CSS_SELECTOR, ".box-product-price .base-price")
                price = self.clean_price(price_elem.text)
            except:
                price = sale_price # Nếu không có giá gốc thì lấy giá sale làm giá gốc

            # 3. Lấy Specifications (Thông số kỹ thuật) -> Map vào [specItemSchema]
            specifications = []
            try:
                text_box = self.driver.find_element(By.ID, "thong-so-ky-thuat")
                rows = text_box.find_elements(By.CLASS_NAME, "technical-content-item")

                print(f"[*] Tìm thấy {len(rows)} dòng thông số.")

                # Lấy các dòng trong bảng thông số
                for row in rows:
        # Lấy toàn bộ text trong dòng. 
        # Ví dụ kết quả sẽ là: "Kích thước màn hình\n6.7 inches" hoặc "Chipset: Apple A17"
                    row_text = row.text.strip()
                    
                    # 3. Tách Key và Value
                    # Logic: Thông thường text sẽ ngăn cách bởi dấu xuống dòng (\n) hoặc dấu hai chấm (:)
                    if "\n" in row_text:
                        key, value = row_text.split("\n", 1)
                    elif ":" in row_text:
                        key, value = row_text.split(":", 1)
                    else:
                        # Trường hợp lạ, ta tạm gán key là text, value rỗng để không mất dữ liệu
                        key = row_text
                        value = ""

                    # Chỉ thêm vào nếu có dữ liệu
                    if key:
                        spec_item = {
                            "key": key.strip(),
                            "value": value.strip()
                        }
                        specifications.append(spec_item)
            except Exception as e:
                print(f"    [!] Lỗi lấy spec: {e}")

            # 4. Lấy Mô tả -> Map vào descriptionDetail
            try:
                intro_element = self.driver.find_element(By.CSS_SELECTOR, ".cps-content-introduction")

                # 2. Lấy Text thuần (Selenium tự động biến <a>link</a> thành text thường)
                # Ví dụ: "iPhone 17 là <a>phiên bản xịn</a>" -> "iPhone 17 là phiên bản xịn"
                raw_text = intro_element.text.strip()

                # 3. Gom lại thành 1 chuỗi description (Xử lý xuống dòng nếu có nhiều thẻ p)
                # Thay thế các dấu xuống dòng (\n) bằng dấu cách để thành 1 đoạn văn liền mạch (nếu muốn)
                # Hoặc giữ nguyên cấu trúc đoạn văn thì để nguyên. Ở đây mình replace để nó thành 1 khối text đẹp.
                description = raw_text.replace("\n", " ")

                # 4. Gán Description Detail là Null theo yêu cầu
                # description_detail = desc_elem.get_attribute("innerHTML") # Lấy HTML để giữ format
                # description = desc_elem.text[:250] + "..." # Lấy đoạn text ngắn
                description_detail = ""
            except:
                description = "Đang cập nhật"
                description_detail = ""

            # 5. Xử lý Variant (Mô phỏng) -> Map vào [productVariantSchema]
            # Giả định lấy được 1 ảnh đại diện
            try:
                print("[*] Đang lấy danh sách ảnh sản phẩm...")

                # 1. Tìm tất cả các thẻ ảnh trong slider
                # Dựa vào ảnh: class "swiper-slide button__view-gallery" chứa thẻ img
                # Lưu ý: Class này dùng cho cả nút xem video, nên cần lọc thẻ img có src hợp lệ
                image_elements = self.driver.find_elements(By.CSS_SELECTOR, ".swiper-slide.button__view-gallery img")
                print(f"[*] Tìm thấy {len(image_elements)} thẻ ảnh trong slider.")
                # Dùng Set để tự động loại bỏ ảnh trùng lặp (do slider thường duplicate ảnh để chạy vòng lặp)
                gallery_images = set()

                for img in image_elements:
                    try:
                        # print(img)
                        # Lấy link thô (thumbnail)
                        raw_src = img.get_attribute("src")
                        print(f"    - Tìm thấy ảnh thô: {raw_src}")
                        # Làm sạch để lấy link gốc chất lượng cao
                        clean_src = self.get_clean_image_url(raw_src)
                        
                        # Chỉ lấy nếu link có đuôi ảnh (.jpg, .png, .webp...) để tránh icon rác
                        if clean_src and any(ext in clean_src for ext in [".jpg", ".png", ".jpeg", ".webp"]):
                            gallery_images.add(clean_src)
                            
                    except Exception as e:
                        continue

                # Chuyển về list để dễ lưu vào JSON/DB
                final_images_list = list(gallery_images)

                print(f"[*] Đã tìm thấy {len(final_images_list)} ảnh chất lượng cao.")
                print(final_images_list)

            except Exception as e:
                print(f"[!] Lỗi khi lấy ảnh: {e}")

            sku = link.split("/")[-1].replace(".html", "")

            variant = {
                "version": "Standard",      # Cần logic click button để lấy version thật
                "colorName": "Mặc định",    # Cần logic click màu
                "hexcode": "#000000",
                "images": final_images_list if final_images_list else [],
                "quantity": 100,
                "price": price,
                "salePrice": sale_price,
                "sku": sku
            }

            # 6. TỔNG HỢP DATA (Khớp 100% với Schema Mongoose)
            product_schema_data = {
                "title": title,
                "brand": "Apple" if "iphone" in link else "Samsung", # Logic tạm
                "description": description,
                "descriptionDetail": description_detail,
                "specifications": specifications,
                "variants": [variant], # Mảng chứa variant
                "categoryId": "PLACEHOLDER_ID_65f2a...", # Lưu String vì JSON không hiểu ObjectId
                "isHide": 0,
                "rating": 5
            }
            
            return product_schema_data

        except Exception as e:
            print(f"[!] Lỗi crash khi parse: {e}")
            return None

    def save_to_json(self, data, filename="products_export.json"):
        """Lưu list dict ra file JSON"""
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=4)
        print(f"\n[*] Đã xuất {len(data)} sản phẩm ra file: {filename}")

    def test(self):
        url = "https://cellphones.com.vn/iphone-17-pro-max.html"
        data = self.parse_product_detail(url)
        print(json.dumps(data, ensure_ascii=False, indent=4))
        
    def run(self):
        url = "https://cellphones.com.vn/mobile/apple.html"
        all_products = []
        
        try:
            self.driver.get(url)
            print("[*] Đang lấy danh sách link...")
            
            # Scroll nhẹ để load thêm sản phẩm
            self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight/2);")
            time.sleep(2)
            
            # Lấy list 5 link đầu tiên để test
            links_elems = self.driver.find_elements(By.CSS_SELECTOR, ".product-info-container a")
            links = list(set([l.get_attribute("href") for l in links_elems]))[:5] # Lấy 5 cái test
            
            print(f"[*] Tìm thấy {len(links)} link. Bắt đầu crawl...")

            for link in links:
                data = self.parse_product_detail(link)
                if data:
                    all_products.append(data)
            
            # Lưu kết quả
            self.save_to_json(all_products)

        finally:
            self.driver.quit()

if __name__ == "__main__":
    crawler = CellphoneSJsonCrawler()
    crawler.test()
    # crawler.run()