# Kiểm tra giá trong bảng so sánh

Đã kiểm tra 363 sản phẩm: 360 sản phẩm có ít nhất một trường giá tiền, 3 sản phẩm chưa có giá trong dữ liệu đã nhập.

## Sửa cách hiển thị

- Giá NPP Offline và giá NPP / phân phối cùng hiển thị ở hàng đối chiếu “Giá NPP / phân phối”, có nhãn nguồn cột gốc.
- Giá NPP Online, giá buôn, giá bán tối thiểu, giá niêm yết và giá bán lẻ vẫn tách riêng. Không lấy giá số lượng lớn thay cho giá NPP.
- Bảng chi tiết hiển thị mọi trường giá có dữ liệu trong các sản phẩm đang chọn; không giới hạn vào danh sách cột cố định.
- Giá có dữ liệu không bị tô xám chỉ vì sản phẩm còn lại thiếu cột tương ứng.
- Dữ liệu và giá gốc không bị đổi.

Ví dụ Hare HR-CD1208: giá NPP / phân phối 690.000đ, giá bán tối thiểu 1.190.000đ, giá niêm yết 1.845.000đ.

## Ba mã chưa có giá

| Hãng | Mã | Sản phẩm |
|---|---|---|
| Kailer | KL-266 | Ấm đun bếp từ 3,5L |
| Kaisa Villa | KV-QKC6622 | Quạt không cánh |
| Kailer | KL-NC86 | Nồi nấu cháo chậm đa năng |

Các mã này cần báo giá xác nhận; ô thiếu giá được giữ trống.
