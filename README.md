# sosanhgia

Phần mềm Vũ Gia quản lý và so sánh sản phẩm, bảng giá theo hãng, với tab riêng cho từng hãng và xuất Excel thành các sheet riêng.

## Mở trực tiếp index.html — không cần server

Tải dự án về, giải nén và nhấp đúp **index.html** bằng Chrome hoặc Edge. Không cần Node.js, Internet hoặc đăng nhập để dùng bản HTML. Tệp này đã chứa mã giao diện và thư viện Excel.

Bản HTML có danh mục hãng, tìm kiếm, thêm/sửa/xóa sản phẩm, chọn ảnh từ máy, so sánh giá và thông số, nhập Excel, xuất mỗi hãng một sheet, in PDF và sao lưu/khôi phục JSON gồm cả ảnh. Dữ liệu chỉnh sửa lưu trong trình duyệt; hãy tải bản sao lưu trước khi chuyển máy hoặc xóa dữ liệu duyệt web. Bản HTML là bản cá nhân, không có phân quyền nhiều người hay đồng bộ server.

Kho Git không chứa dữ liệu kinh doanh hiện tại. Hãy nhập Excel hoặc khôi phục bản sao lưu JSON. Trên máy làm việc, `BAN-OFFLINE/index.html` là bản một tệp đã đóng gói sẵn danh mục và ảnh; có thể sao chép riêng tệp đó sang máy khác.

## Bản server (tùy chọn)

Nhấp đúp **CHAY-VU-GIA.cmd** hoặc dùng các lệnh dưới đây. Bản này có đăng nhập, phân quyền và các quy trình quản trị đầy đủ.

Yêu cầu Node.js và npm.

```sh
npm ci
npm run build
npm start
```

Mở http://localhost:4173 và tạo tài khoản quản trị ở lần chạy đầu tiên.

## Kiểm tra

```sh
npm test
```

Để xây dựng lại bản HTML sau khi sửa mã: `npm run build:offline`. Trên máy có cơ sở dữ liệu riêng, dùng `npm run build:offline:data` để tạo thêm bản một tệp tại `BAN-OFFLINE/index.html`. Dữ liệu cá nhân và bản có sẵn dữ liệu không được đưa vào Git.

## Dữ liệu

Kho Git chứa mã nguồn và tài liệu. Cơ sở dữ liệu vận hành, tài khoản, ảnh sản phẩm đã nhập và tệp tạm trong `data/`, `tmp/` được lưu riêng trên máy, không đưa vào Git. Bản cài mới cần nhập dữ liệu hoặc khôi phục từ bản sao lưu phù hợp.

Xem [hướng dẫn sử dụng và triển khai](HUONG-DAN.md).
