import time
import json
import re
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.support import expected_conditions as EC

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

    def get_clean_image_url(self, thumbnail_url):
        """Lấy link ảnh gốc từ thumbnail"""
        if not thumbnail_url:
            return ""
        if "/plain/" in thumbnail_url:
            return thumbnail_url.split("/plain/")[-1]
        return thumbnail_url

    def clean_price(self, price_str):
        """Chuyển đổi chuỗi tiền tệ thành số nguyên"""
        if not price_str: 
            return 0
        clean = re.sub(r'[^\d]', '', price_str)
        return int(clean) if clean else 0

    def parse_product_detail(self, link):
        print(f"[*] Đang xử lý: {link}")
        self.driver.get(link)
        time.sleep(2)

        try:
            # 1. Lấy thông tin cơ bản (Title)
            try:
                title = self.driver.find_element(By.CSS_SELECTOR, ".box-product-name h1").text.strip()
            except:
                title = "Unknown Product"

            # 2. Lấy Specifications (Thông số kỹ thuật)
            specifications = []
            try:
                text_box = self.driver.find_element(By.ID, "thong-so-ky-thuat")
                rows = text_box.find_elements(By.CLASS_NAME, "technical-content-item")

                for row in rows:
                    row_text = row.text.strip()
                    if "\n" in row_text:
                        key, value = row_text.split("\n", 1)
                    elif ":" in row_text:
                        key, value = row_text.split(":", 1)
                    else:
                        key = row_text
                        value = ""

                    if key:
                        specifications.append({
                            "key": key.strip(),
                            "value": value.strip()
                        })
            except Exception as e:
                print(f"    [!] Lỗi lấy spec: {e}")

            # 3. Lấy Mô tả
            try:
                intro_element = self.driver.find_element(By.CSS_SELECTOR, ".cps-content-introduction")
                description = intro_element.text.strip().replace("\n", " ")
                description_detail = ""
            except:
                description = "Đang cập nhật"
                description_detail = ""

            # 4. Lấy Variants (Màu sắc) và Ảnh đại diện theo màu
            main_name_color_list = []
            final_images_list = []
            
            try:
                print("    -> Đang lấy danh sách màu và ảnh...")
                variant_elements = self.driver.find_elements(By.CSS_SELECTOR, ".list-variants .item-variant a")
                variants_to_process = []

                for elem in variant_elements:
                    name = elem.get_attribute("title")
                    v_link = elem.get_attribute("href")
                    parent_li = elem.find_element(By.XPATH, "./..")
                    is_active = "active" in parent_li.get_attribute("class")
                    
                    variants_to_process.append({
                        "name": name,
                        "link": v_link,
                        "active": is_active
                    })

                # Lặp qua từng màu để lấy ảnh chính xác
                for variant in variants_to_process:
                    self.driver.get(variant['link'])
                    time.sleep(1.5)

                    try:
                        active_slide_img = WebDriverWait(self.driver, 5).until(
                            EC.presence_of_element_located((By.CSS_SELECTOR, ".swiper-slide.swiper-slide-active img"))
                        )
                        raw_src = active_slide_img.get_attribute("src")
                        clean_src = self.get_clean_image_url(raw_src)

                        main_name_color_list.append({
                            "color": variant['name'],
                            "main_image": str(clean_src)
                        })
                    except Exception:
                        pass

                # Lấy bộ sưu tập ảnh (Gallery)
                image_elements = self.driver.find_elements(By.CSS_SELECTOR, ".swiper-slide.button__view-gallery img")
                gallery_images = set()
                for img in image_elements:
                    try:
                        c_src = self.get_clean_image_url(img.get_attribute("src"))
                        if c_src and any(ext in c_src for ext in [".jpg", ".png", ".jpeg", ".webp"]):
                            gallery_images.add(c_src)
                    except:
                        continue
                final_images_list = list(gallery_images)

            except Exception as e:
                print(f"    [!] Lỗi khi xử lý ảnh: {e}")

            # 5. Lấy Giá theo từng Phiên bản (Dung lượng)
            version_price = []
            try:
                list_container = self.driver.find_element(By.CLASS_NAME, "list-linked")
                versions = list_container.find_elements(By.CLASS_NAME, "item-linked")
                count = len(versions)

                for i in range(count):
                    # Tìm lại element để tránh StaleElementReferenceException
                    try:
                        self.wait.until(
                            EC.presence_of_all_elements_located((By.CSS_SELECTOR, ".list-linked .item-linked"))
                        )
                    except:
                        print("    [!] Timeout chờ load danh sách version.")
                        continue
                    current_list = self.driver.find_elements(By.CSS_SELECTOR, ".list-linked .item-linked")
                    if i >= len(current_list):
                        print(f"    [!] Cảnh báo: Index {i} vượt quá số lượng phần tử tìm thấy ({len(current_list)}). Dừng vòng lặp giá.")
                        break
                    current_item = current_list[i]
                    
                    version_name = current_item.text.replace("\n", " ").strip()
                    item_link = current_item.get_attribute("href")
                    
                    # Click để lấy giá
                    self.driver.execute_script("arguments[0].click();", current_item)
                    time.sleep(2)
                    
                    try:
                        sale_price_elem = self.driver.find_element(By.CSS_SELECTOR, ".box-product-price .sale-price")
                        sale_price = self.clean_price(sale_price_elem.text)
                    except:
                        sale_price = 0
                    
                    try:
                        price_elem = self.driver.find_element(By.CSS_SELECTOR, ".box-product-price .base-price")
                        price = self.clean_price(price_elem.text)
                    except:
                        price = sale_price

                    # Tạo SKU dựa trên link của version
                    sku = item_link.split("/")[-1].replace(".html", "")

                    version_price.append({
                        "version": version_name,
                        "price": price,
                        "salePrice": sale_price,
                        "sku": sku
                    })

            except Exception as e:
                print(f"    [!] Lỗi khi lấy giá version: {e}")

            # 6. Tổng hợp Data (Cartesian Product: Version x Color)
            variants = []    
            for version in version_price:
                for image in main_name_color_list:
                    # Tạo list ảnh riêng cho từng biến thể
                    current_variant_images = list(final_images_list)
                    if image['main_image']:
                        current_variant_images.insert(0, image['main_image'])
                    
                    variant_item = {
                        "version": version['version'],
                        "colorName": image['color'],
                        "hexcode": "#000000",
                        "images": current_variant_images,
                        "quantity": 100,
                        "price": version['price'],
                        "salePrice": version['salePrice'],
                        "sku": version['sku']
                    }
                    variants.append(variant_item)

            # 7. Trả về kết quả
            return {
                "title": title,
                "brand": "Apple" if "iphone" in link else "Samsung",
                "description": description,
                "descriptionDetail": description_detail,
                "specifications": specifications,
                "variants": variants,
                "categoryId": "PLACEHOLDER_ID",
                "isHide": 0,
                "rating": 5
            }

        except Exception as e:
            print(f"[!] Critical Error: {e}")
            return None

    def save_to_json(self, data, filename="products_export.json"):
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=4)
        print(f"\n[*] Đã xuất {len(data)} sản phẩm ra file: {filename}")

    def test(self):
        url = "https://cellphones.com.vn/apple-macbook-air-13-m4-10cpu-8gpu-16gb-256gb-2025.html"
        data = self.parse_product_detail(url)
        if data:
            print(json.dumps(data, ensure_ascii=False, indent=4))
        else:
            print("Không lấy được dữ liệu.")
        
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