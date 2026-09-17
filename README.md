# sosanhgia

Phần mềm Vũ Gia quản lý và so sánh sản phẩm, bảng giá theo hãng, với tab riêng cho từng hãng và xuất Excel thành các sheet riêng.

## Mở trực tiếp index.html — không cần server

Tải dự án về, giải nén và nhấp đúp **index.html** bằng Chrome hoặc Edge. Không cần Node.js, Internet hoặc đăng nhập để dùng bản HTML. Tệp này đã chứa mã giao diện và thư viện Excel.

Bản HTML có danh mục hãng, tìm kiếm, thêm/sửa/xóa sản phẩm, chọn ảnh từ máy, so sánh giá và thông số, nhập Excel, xuất mỗi hãng một sheet, in PDF và sao lưu/khôi phục JSON gồm cả ảnh. Dữ liệu chỉnh sửa lưu trong trình duyệt; hãy tải bản sao lưu trước khi chuyển máy hoặc xóa dữ liệu duyệt web. Bản HTML là bản cá nhân, không có phân quyền nhiều người hay đồng bộ server.

Kho Git hiện có danh mục sản phẩm, cơ sở dữ liệu và thư mục ảnh `data/assets`. Khi tải từ GitHub, hãy giải nén cả thư mục dự án rồi mở `index.html` để giữ đầy đủ ảnh. Trên máy làm việc, `BAN-OFFLINE/index.html` là bản một tệp đã đóng gói cả danh mục và ảnh; có thể sao chép riêng tệp đó sang máy khác.

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

Để xây dựng lại bản HTML từ cơ sở dữ liệu hiện có: `npm run build:offline`. Dùng `npm run build:offline:data` để tạo thêm bản một tệp tại `BAN-OFFLINE/index.html`; thư mục này không được đưa vào Git.

Khi sao lưu JSON từ bản `index.html` thông thường, Chrome/Edge sẽ yêu cầu chọn thư mục dự án chứa `data/assets` để đưa cả ảnh vào bản sao lưu. Bản một tệp đã nhúng ảnh không cần bước chọn thư mục này. Nếu thiếu ảnh, phần mềm báo lỗi và không báo sao lưu đầy đủ.

## Dữ liệu

Kho Git hiện theo dõi `data/vugia.sqlite`, danh mục xuất ra JSON và ảnh sản phẩm. Thay đổi trong trình duyệt của bản HTML lưu riêng trong IndexedDB; chúng không tự ghi vào SQLite hoặc tự đẩy lên GitHub. Dùng sao lưu JSON để chuyển các chỉnh sửa này sang máy khác. Các thư mục `tmp/`, `data/backups/` và `BAN-OFFLINE/` không được đưa vào Git.

Xem [hướng dẫn sử dụng và triển khai](HUONG-DAN.md).
