# Kết quả kiểm tra bản Vũ Gia V2

Kiểm tra trên Windows, Node.js 20 và Chrome. Dữ liệu dùng kiểm thử độc lập với thư mục `data` của người sử dụng.

| Hạng mục | Kết quả thực tế |
|---|---|
| Chuẩn hóa đơn vị và thương hiệu | Đạt: ml/l, kW/W, kg/g, cm/mm; giữ nguyên đầu vào |
| Ghép tương đương | Đạt: tối đa 3, ngưỡng 50, lý do và điểm từng tiêu chí |
| Khoảng trống / thiếu dữ liệu | Đạt: phân biệt theo độ đầy đủ danh mục |
| Tài chính | Đạt: gộp, ròng, hòa vốn, mục tiêu, hoàn hàng, chiết khấu, trường hợp không xác định |
| Trọng số cạnh tranh | Đạt: đổi trọng số làm đổi điểm; thiếu nguồn hoặc dữ liệu thì không có điểm tổng |
| Excel | Đạt: đọc 2 dòng .xlsx, nhận cột, xem trước, kiểm tra, nhập thực, phát hiện trùng; tải mẫu và xuất lại |
| Phân quyền API | Đạt: Kinh doanh không đọc/sửa giá nhập; Marketing chỉ cập nhật nội dung; Mua hàng sửa giá nhập nhưng không duyệt |
| Kiểm duyệt ghép | Đạt: đổi và hủy ghép được phản ánh trong dữ liệu trả về |
| Nhật ký | Đạt: thay đổi có người và thời gian; lịch sử giá được lọc theo quyền |
| Bền vững dữ liệu | Đạt: khởi động lại máy chủ, sản phẩm, lịch sử nhập, trọng số và phiên còn hạn vẫn tồn tại |
| Giao diện | Đạt: mở được 12 màn hình, chi tiết đúng sản phẩm, so sánh 2 và 5 sản phẩm, chặn sản phẩm thứ 6 |
| Điện thoại | Đạt: kiểm tra khung 390 px, không tràn ngang toàn trang |
| PDF | Đã tạo được PDF bằng chức năng in của Chrome, bố cục A4 ngang |

Lệnh kiểm tra cuối: `UI_TEST=1` cùng `npm test` (thiết lập biến môi trường theo cú pháp hệ điều hành). Kết quả: **10 bài kiểm thử đạt, 0 thất bại**. Bài kiểm thử API bao gồm các kiểm tra giao diện khi bật `UI_TEST`.

Các ảnh kiểm tra và PDF mẫu nằm trong `test-results` của thư mục làm việc, không đóng gói dữ liệu kiểm thử vào bản phát hành.

## Phạm vi chưa nghiệm thu

- PostgreSQL và Docker: có cấu hình và lớp kết nối, chưa chạy trên máy này vì không có Docker.
- Chưa triển khai tên miền/HTTPS, kiểm thử tải nhiều người dùng hoặc kết nối kho/sàn bên ngoài.
- Ghép cặp dùng quy tắc, không dùng mô hình nhận dạng hình ảnh.
- PDF dùng hộp thoại In / Lưu PDF. Ảnh và video hiện dùng đường dẫn HTTP/HTTPS.
- Dữ liệu thực, logo chính thức và đánh giá thị trường cần công ty cung cấp.
