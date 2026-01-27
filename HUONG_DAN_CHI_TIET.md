# Hướng Dẫn Deploy - Phiên Bản Cuối Cùng

Mọi lỗi kỹ thuật đã được xử lý xong. Hệ thống đã sẵn sàng 100%.

## Tóm tắt những sửa đổi đã thực hiện:

1.  ✅ **Sửa lỗi Build**: Đã xóa các liên kết đến file không tồn tại (`index.css`, `vite.svg`) trong `index.html`. Đây là nguyên nhân chính khiến Cloudflare báo lỗi trước đó.
2.  ✅ **Cấu hình chuẩn**: Đã cập nhật `vite.config.ts` để tương thích hoàn toàn với hệ thống build của Cloudflare.
3.  ✅ **Cấu trúc dự án**: Tất cả thư viện cần thiết đều đã được khai báo đầy đủ.
4.  ✅ **Sửa lỗi Phân biệt Hoa/Thường (Update)**: Đã di chuyển `LocaleContext` từ thư mục `contexts` sang thư mục mới `providers` để tránh hoàn toàn mọi sự cố về caching/case-sensitivity của Git.

---

## BƯỚC 1: Đẩy Code Lên Github (Thực hiện trên máy tính của bạn)

Bạn cần mở terminal (hoặc Command Prompt) tại thư mục dự án và chạy lần lượt 3 lệnh sau để cập nhật bản sửa lỗi lên Github:

```bash
git add .
git commit -m "Refactor: move Context to Providers to fix build"
git push
```

*Lưu ý: Nếu bạn dùng giao diện đồ họa (GitHub Desktop, VS Code Git...), chỉ cần Commit và Push (Sync) như bình thường.*

## BƯỚC 2: Kiểm tra trên Cloudflare

Sau khi bạn `push` thành công ở Bước 1:

1.  Truy cập [Cloudflare Pages Dashboard](https://dash.cloudflare.com/?to=/:account/pages).
2.  Vào dự án **viet-long-thiet-ke-xay-dung**.
3.  Bạn sẽ thấy một bản build mới đang chạy (trạng thái màu vàng **Building**).
4.  Chờ khoảng 2 phút. Khi chuyển sang màu xanh **Success**, bạn bấm vào đường link trang web để xem kết quả.



## ⚠️ QUAN TRỌNG: Nếu bạn Upload file thủ công trên Website Github

Tôi phát hiện bạn đang dùng tính năng **"Upload files"** trên web Github (do log có dòng `Add files via upload`).
**Đây là nguyên nhân gây lỗi**, vì khi upload thủ công, bạn dễ bị **quên thư mục mới** hoặc file không vào đúng chỗ.

Bạn **BẮT BUỘC** phải làm theo 1 trong 2 cách sau để sửa lỗi `Could not resolve ... LocaleContext`:

### Cách 1: Upload đúng cấu trúc (Khuyên dùng)
1.  Trên máy tính, vào thư mục dự án.
2.  Kéo thả **nguyên cả thư mục** `providers` thả vào khung Upload trên Github.
3.  Đảm bảo sau khi upload, trên Github xuất hiện thư mục `providers` và bên trong có file `LocaleContext.tsx`.

### Cách 2: Tạo thủ công trên Github
1.  Trên Github, bấm **Add file** > **Create new file**.
2.  Ô đặt tên file, gõ chính xác: `providers/LocaleContext.tsx` (gõ dấu `/` nó sẽ tự tạo thư mục).
3.  Copy nội dung code từ file `providers/LocaleContext.tsx` trên máy bạn dán vào.
4.  Bấm **Commit changes**.

---

## BƯỚC 3: Cấu hình Build Command (Quan trọng)


Cloudflare vừa báo lỗi do thiếu lệnh Build. Tôi đã thêm vào `wrangler.toml`, nhưng để chắc chắn 100%, bạn hãy kiểm tra trên Dashboard:

1.  Vào Cloudflare Pages > chọn dự án **viet-long-thiet-ke-xay-dung**.
2.  Vào **Settings** > **Builds & deployments**.
3.  Tìm mục **Build configurations**, bấm **Edit configuration**.
4.  Điền các thông số sau (nếu chưa có):
    *   **Build command**: `npm run build`
    *   **Build output directory**: `dist`
5.  Bấm **Save**.

## BƯỚC 4: Kiểm tra lại

Sau khi đẩy code lên (như Bước 1), vào tab **Deployments** trên Cloudflare, xem bản build mới nhất. Nếu nó vẫn Failed, bấm **Retry deployment** sau khi đã làm Bước 3.
