# sosanhgia

Phần mềm Vũ Gia quản lý và so sánh sản phẩm, bảng giá theo hãng, với tab riêng cho từng hãng và xuất Excel thành các sheet riêng.

## Chạy phần mềm

Trên Windows: giải nén dự án rồi nhấp đúp **CHAY-VU-GIA.cmd**. Trình duyệt tự mở khi phần mềm sẵn sàng. Không chạy ứng dụng bằng cách nhấp đúp `index.html`; file này sẽ hiển thị hướng dẫn mở.

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

## Dữ liệu

Kho Git chứa mã nguồn và tài liệu. Cơ sở dữ liệu vận hành, tài khoản, ảnh sản phẩm đã nhập và tệp tạm trong `data/`, `tmp/` được lưu riêng trên máy, không đưa vào Git. Bản cài mới cần nhập dữ liệu hoặc khôi phục từ bản sao lưu phù hợp.

Xem [hướng dẫn sử dụng và triển khai](HUONG-DAN.md).
