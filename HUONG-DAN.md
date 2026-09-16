# Phần mềm so sánh sản phẩm Vũ Gia — V2

Ứng dụng HTML/React tiếng Việt, máy chủ Node.js và cơ sở dữ liệu lưu thực. Không mở trực tiếp `index.html` bằng cách nhấp đúp: đăng nhập, Excel và lưu dữ liệu cần máy chủ đang chạy.

## Mở trên máy Windows này

1. Nhấp đúp **CHAY-VU-GIA.cmd** trong thư mục này.
2. Mở **http://localhost:4173** bằng Chrome hoặc Edge.
3. Lần đầu, tạo tài khoản quản trị bằng tên, email và mật khẩu từ 10 ký tự. Không có tài khoản hay mật khẩu mặc định.
4. Chọn **Nhập dữ liệu Excel → Tải Excel mẫu**, điền dữ liệu rồi nhập. Hoặc chọn **Nạp dữ liệu minh họa** trên Tổng quan khi danh mục trống.
5. Giữ cửa sổ máy chủ mở khi sử dụng. Nếu máy chủ đã chạy, chỉ cần mở đường dẫn trên, không khởi động thêm lần nữa.

Các thư viện và bản giao diện biên dịch sẵn đã có trong thư mục làm việc hiện tại. Khi chuyển sang máy khác, cần Node.js 20 trở lên và chạy `npm ci`, `npm run build`, `npm start` tại thư mục dự án. Lần cài thư viện cần Internet; giao diện vẫn dùng phông chữ hệ thống nếu không tải được Google Fonts.

## Dữ liệu và sao lưu

- Chế độ mặc định lưu SQLite tại `data/vugia.sqlite`. Dữ liệu không nằm trong bộ nhớ tạm của trình duyệt; đóng/mở trình duyệt không làm mất danh mục.
- Chế độ SQLite dành cho một tiến trình máy chủ cục bộ. Không chạy nhiều tiến trình cùng ghi một file.
- Để sao lưu cục bộ, dừng máy chủ rồi sao chép toàn bộ thư mục `data` vào vị trí lưu trữ nội bộ. Khôi phục bằng cách dừng máy chủ và đặt lại thư mục đã sao lưu.
- Dữ liệu minh họa được đánh dấu rõ và dùng thương hiệu đối thủ giả định. Giá, lượt bán, điểm và chi phí minh họa không phải khảo sát thực tế.
- Không xóa thư mục `data` khi cập nhật mã nguồn. Không gửi bản sao cơ sở dữ liệu chứa giá nhập và tài khoản ra ngoài phạm vi công ty.

## Quy trình nhập Excel

File mẫu có bốn trang: Sản phẩm, Hướng dẫn, Danh mục, Thông số mở rộng. Dữ liệu được đọc từ trang **Sản phẩm** (hoặc trang đầu nếu không có).

- Bắt buộc mã, tên, thương hiệu và nhóm ngành hàng; các trường khác được phép trống.
- Mỗi lần tối đa 2.000 dòng, file tối đa 10 MB. File có công thức phải chuyển thành giá trị trước khi nhập.
- Tiền là đồng/sản phẩm. Phí sàn, thuế, chiết khấu, hoàn hàng là phần trăm: nhập `8` nghĩa là `8%`.
- Đơn vị cần ghi rõ, ví dụ `3000 ml`, `1,2 kg`, `20 x 30 cm`, `1.5 kW`.
- Xem trước → kiểm tra ánh xạ cột → kiểm tra lỗi → chọn xử lý trùng → xác nhận nhập.
- Cập nhật trùng chỉ áp dụng cho các cột được ánh xạ; ô trống trong cột đã ánh xạ sẽ xóa giá trị cũ của trường đó. Hệ thống yêu cầu xác nhận trước khi thực hiện.
- Chế độ “Tạo mới” sinh mã có hậu tố để bảo đảm mã duy nhất.
- Các dòng lỗi phải được sửa trong file rồi tải lại. Có thể tải danh sách lỗi CSV.
- Thông số mở rộng nhập theo dạng `Tên: giá trị`, mỗi dòng một trường trong cột tương ứng. Trang Thông số mở rộng của file mẫu là hướng dẫn.

## Ghép cặp và quyết định

- Lock&King được nhận diện không phân biệt chữ hoa, khoảng trắng và dấu `&`.
- Ghép tối đa 3 ứng viên đạt từ 50 điểm. Nhãn “AI đề xuất” chỉ thuật toán đối chiếu theo quy tắc, không gọi mô hình AI bên ngoài.
- Mỗi kết quả hiển thị lý do và điểm từng tiêu chí. Không có thông số thì không cộng điểm; giá và kiểu dáng riêng lẻ không đủ để ghép.
- Tiêu chí dung tích/kích thước và công suất cho phép chênh lệch 15%. Phân khúc giá cho phép chênh lệch 25%.
- Kiểu dáng được so sánh bằng trường văn bản đã xác nhận; chưa có nhận diện hình ảnh bằng máy học.
- Người dùng có quyền đổi, xác nhận hoặc hủy ghép. Quyết định đã duyệt được giữ lại khi danh mục thay đổi; cần tự duyệt lại khi thông số đã thay đổi nhiều.
- Khoảng trống chỉ được kết luận trong phạm vi danh mục đã nhập và đủ thông số chính. Danh mục thiếu dữ liệu hiển thị riêng, không được coi là cơ hội đã xác định.
- Điểm cạnh tranh dùng trọng số đã cấu hình. Đánh giá định tính cần nguồn/lý do; thiếu dữ liệu thì không có điểm tổng hoặc kết luận nhập hàng.
- Giá, lợi nhuận, điểm cạnh tranh và đề xuất là công cụ hỗ trợ. Người dùng chịu trách nhiệm xác minh nguồn và phê duyệt.

## Giá và lợi nhuận

Giá thực nhận = giá bán × (1 − chiết khấu).

Chi phí cố định = quảng cáo + vận chuyển + bảo hành + quà tặng + chi phí khác + chi phí hoàn phân bổ.

Chi phí hoàn phân bổ = chi phí mỗi đơn hoàn × tỷ lệ hoàn / (1 − tỷ lệ hoàn). Giả định hàng hoàn thu hồi được giá vốn; nhập tổn thất hàng vào chi phí mỗi đơn hoàn nếu cần.

Lợi nhuận ròng = giá thực nhận − giá nhập − chi phí cố định − giá thực nhận × (phí sàn + thuế).

Giá hòa vốn = (giá nhập + chi phí cố định) / (1 − phí sàn − thuế).

Giá bán mục tiêu sau chiết khấu = (giá nhập + chi phí cố định) / (1 − phí sàn − thuế − biên ròng mục tiêu).

Số bán thành công dự kiến = số lượng × (1 − tỷ lệ hoàn). Doanh thu và lợi nhuận toàn kỳ dùng số bán thành công này.

Ba kịch bản hiển thị rõ hệ số giá, số lượng, quảng cáo và hoàn hàng. Chỉnh các đầu vào để thử; chỉ lưu khi bấm **Lưu giả định**.

## Báo cáo

- **Excel** xuất dữ liệu và kết quả tính tại thời điểm tải, không tự cập nhật khi mở file. Quyền xem giá nhập được kiểm tra ở máy chủ.
- **PDF**: chọn **In / Lưu PDF**, rồi chọn **Lưu dưới dạng PDF** trong cửa sổ in của trình duyệt. Có bố cục in A4 ngang và hỗ trợ tiếng Việt.
- Báo cáo có dấu hiệu nhận diện Vũ Gia dạng chữ V, ngày lập, người lập, nguồn, kết luận, đề xuất và ô ký phê duyệt. Chưa có file logo chính thức do công ty cung cấp.
- Ảnh hiện dùng URL HTTP/HTTPS. Ảnh chi tiết dùng nhiều URL, mỗi dòng một ảnh; video dùng đường dẫn. Không có ảnh sản phẩm giả được tự gán cho dữ liệu thật.

## Quyền truy cập

| Vai trò | Quyền |
|---|---|
| Ban lãnh đạo | Toàn bộ sản phẩm, giá nhập, trọng số và duyệt nhập |
| Kinh doanh | Giá bán/thị trường, dữ liệu thị trường, ghép cặp và báo cáo; không xem giá nhập |
| Marketing | Hình ảnh, nội dung, đường dẫn và tài liệu tư vấn; không xem giá nhập |
| Mua hàng | Nhà cung cấp, giá nhập, MOQ, giao hàng, lấy mẫu, vòng quay vốn, rủi ro và cơ hội |
| Quản trị viên | Toàn bộ dữ liệu, tài khoản, vai trò và nhật ký |

Quyền được kiểm tra ở API. Mật khẩu băm bcrypt; cookie phiên HttpOnly, SameSite=Strict và hết hạn sau 8 giờ. Có giới hạn số lần đăng nhập. Thay đổi/khóa tài khoản làm mất hiệu lực phiên cũ.

## Chạy với PostgreSQL trên máy chủ

1. Cài Docker có Docker Compose.
2. Sao chép `.env.example` thành `.env`, thay `POSTGRES_PASSWORD` bằng mật khẩu riêng dài, chỉ dùng chữ, số và dấu gạch dưới để tránh ký tự URL.
3. Chạy `docker compose up -d --build`.
4. Mở `http://localhost:4173` và tạo quản trị viên đầu tiên trên cơ sở dữ liệu mới.

Docker Compose tạo PostgreSQL và volume bền vững, chỉ công bố ứng dụng trên localhost. Để dùng trong mạng công ty/Internet, cấu hình HTTPS reverse proxy, tên miền, sao lưu PostgreSQL định kỳ và đặt `COOKIE_SECURE=true`. Ứng dụng chưa được triển khai lên máy chủ bên ngoài trong lần bàn giao này.

Nếu dùng PostgreSQL có sẵn, đặt biến môi trường `DATABASE_URL` trước khi chạy. Không tự động di chuyển dữ liệu SQLite sang PostgreSQL; có thể xuất/nhập sản phẩm bằng Excel, nhưng lịch sử, tài khoản và kiểm duyệt cần kế hoạch di chuyển riêng.

Mô hình lưu trữ hiện tại dùng bảng `records(collection, id, body)` với khóa chính kép, chứa các bản ghi JSON cho products, users, sessions, matches, opportunities, proposals, settings, imports, importDrafts, follows và audit. Quan hệ được kiểm tra trong lớp nghiệp vụ; phù hợp bản V2 chạy thực ban đầu, chưa tối ưu truy vấn phân tích ở quy mô lớn.

## Mã nguồn và kiểm thử

- `src/main.tsx`: giao diện và 12 phân hệ.
- `src/styles.css`: giao diện máy tính, điện thoại và bố cục in.
- `shared/domain.js`: chuẩn hóa, ghép cặp, tài chính, điểm cạnh tranh, đề xuất và quyền theo trường.
- `server/index.js`: API, xác thực, nhập/xuất Excel, nhật ký.
- `server/db.js`: SQLite cục bộ / PostgreSQL.
- `tests/domain.test.js`, `tests/api.test.js`: kiểm thử nghiệp vụ và API, dùng dữ liệu riêng trong `test-results`.

Chạy `npm test` để kiểm tra nghiệp vụ và API. Trên Windows có Chrome, đặt `UI_TEST=1` trước khi chạy để thêm kiểm thử giao diện; dùng `BROWSER_PATH` nếu Chrome ở vị trí khác. Kiểm thử PDF dùng Chrome headless, không cần thư viện PDF bên ngoài.

Đã kiểm tra bản SQLite trên máy hiện tại. Cấu hình PostgreSQL/Docker được bàn giao nhưng chưa chạy nghiệm thu trên máy này vì không có Docker. Nên thực hiện kiểm thử tải, sao lưu/khôi phục PostgreSQL và nghiệm thu dữ liệu công ty trước khi đưa vào vận hành nhiều người.
