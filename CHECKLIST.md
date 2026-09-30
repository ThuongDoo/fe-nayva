# Checklist kiểm thử

Mỗi yêu cầu gửi cho Claude được ghi lại ở đây kèm các bước kiểm thử. Tick `[x]` khi đã test xong.

- FE = frontend (`personal-template`), BE = backend (`nayva-be`).
- Trước khi test: deploy lại BE, deploy Firestore/Storage rules (`firebase deploy --only firestore:rules,storage`), cấu hình `.env.local` (FE) và `.env` (BE).
- Cần 2 tài khoản: một **user** thường và một **admin** (`users/{uid}.role = "admin"` sửa trong Firebase Console).

---

## 1. Đọc hiểu toàn bộ code

Chỉ giải thích, không có gì để test.

---

## 2. Kết nối Firebase: đăng nhập Google, lưu thông tin user, lưu dữ liệu lên Firebase

- [ ] Chưa đăng nhập: mở web → chỉ thấy màn hình đăng nhập, không vào được trình soạn thảo
- [ ] Đăng nhập bằng **Google** thành công
- [ ] Đóng popup đăng nhập giữa chừng → không hiện lỗi
- [ ] Firestore có `users/{uid}` với: tên, email, ảnh, providers, `createdAt`, `lastLoginAt`, `role: "user"`
- [ ] Sửa trang → sau ~1,5 giây toolbar báo "Đã lưu lên đám mây"; tải lại trang → nội dung còn nguyên
- [ ] Mở cùng tài khoản trên máy/trình duyệt khác → thấy đúng thiết kế
- [ ] Tải ảnh lên (nút trong bảng phải, và kéo thả tệp vào trang) → ảnh nằm trong Storage `users/{uid}/images/`, không phải base64
- [ ] Thả 1 ảnh lên hình khối → ảnh lấp vào hình
- [ ] Thiết kế cũ trong localStorage (bản trước Firebase) được chuyển lên đám mây ở lần đăng nhập đầu
- [ ] Sửa rồi đóng tab ngay (chưa kịp lưu) → trình duyệt hỏi xác nhận rời trang
- [ ] Đăng xuất → quay về màn hình đăng nhập; thay đổi đang chờ được lưu trước
- [ ] Rules: user A không đọc được dữ liệu của user B (thử bằng Rules Playground trong Console)

## 3. Đồng bộ rules giữa VS Code và Firebase

- [ ] `firebase use --add` đã nối đúng project (có file `.firebaserc`)
- [ ] `firebase deploy --only firestore:rules,storage` chạy thành công
- [ ] Rules trên Console giống hệt `firestore.rules` / `storage.rules` trong máy

## 4. Nút Lưu thủ công + Ctrl+S (giữ tự lưu)

- [ ] Nút **Lưu** trên toolbar → lưu ngay, báo "Đã lưu thiết kế lên đám mây"
- [ ] **Ctrl+S** lưu được, không mở hộp thoại "Lưu trang" của trình duyệt
- [ ] Ctrl+S khi đang gõ trong ô ở bảng thuộc tính → vẫn lưu
- [ ] Ctrl+S khi đang sửa chữ trực tiếp trên trang → kết thúc sửa, chữ được lưu
- [ ] Tự lưu (không bấm gì) vẫn hoạt động

## 5. Trang chủ: tạo trang trống, mở trang đã lưu, tạo từ mẫu

- [ ] Đăng nhập xong vào **trang chủ**, không vào thẳng trình soạn thảo
- [ ] "Trang trống" → tạo trang mới và mở trình soạn thảo
- [ ] Mục "Trang đã lưu": có ảnh thu nhỏ, thời gian sửa, trang sửa gần nhất đứng đầu
- [ ] Bấm một trang đã lưu → mở đúng trang đó
- [ ] Xoá trang (hỏi xác nhận) → biến mất khỏi danh sách và Firestore
- [ ] URL `#/d/<id>`: tải lại trang vẫn ở đúng trang; nút Back của trình duyệt về trang chủ và thay đổi được lưu
- [ ] Mở link của trang đã bị xoá → báo "không tồn tại" + nút về trang chủ
- [ ] Nút "Trang chủ" trong trình soạn thảo → lưu rồi về trang chủ

## 6. Giới hạn 3 trang mỗi user

- [ ] Bộ đếm "x/3" cạnh "Trang đã lưu"; đỏ khi đủ 3
- [ ] Đủ 3 trang → hiện thông báo, các ô tạo trang bị khoá
- [ ] Xoá 1 trang → tạo được lại
- [ ] Mở 2 tab, tạo trang ở cả hai khi đang có 2 trang → tab thứ hai bị chặn, báo lỗi và tải lại danh sách

## 7. Lấy thiết kế của user làm mẫu (admin)

- [ ] User thường **không** thấy nút "Quản trị"; vào thẳng `#/admin` → "Không có quyền truy cập"
- [ ] Admin thấy nút "Quản trị" trên trang chủ
- [ ] Tab "Người dùng": danh sách user, tìm theo tên/email, nhãn **Admin** cạnh admin
- [ ] Chọn user → thấy các trang của họ; "Xem" mở xem trước
- [ ] "Lưu làm mẫu" → nhập tên/mô tả → mẫu hiện trong tab "Mẫu đã tạo" và ở mục "Tạo trang mới" của mọi user
- [ ] Ảnh của mẫu được chép sang Storage `templates/images/` (cần cấu hình CORS `cors.json`)
- [ ] Admin mở trang của chính mình → toolbar có nút "Lưu làm mẫu"
- [ ] Xoá mẫu → biến mất khỏi trang chủ; trang user đã tạo từ mẫu không bị ảnh hưởng
- [ ] Admin **không sửa được** thiết kế của user (chỉ đọc)

## 8. Bỏ nút Mở, Tải JSON, Xuất HTML khỏi trình soạn thảo

- [ ] Toolbar không còn 3 nút này
- [ ] Xem trước → "Tab mới" vẫn mở trang dạng HTML

## 9. Hai role user/admin, mặc định user, đổi sang admin trong Firebase Console

- [ ] Tài khoản mới có `role: "user"`
- [ ] Tài khoản cũ chưa có role được thêm `role: "user"` khi đăng nhập
- [ ] Sửa `role` thành `admin` trong Console, tải lại web → có quyền admin
- [ ] User **không tự đổi được** role (thử ghi `role: "admin"` bằng Rules Playground → bị từ chối)
- [ ] User không xoá được hồ sơ của mình
- [ ] Đăng nhập lại không ghi đè role admin về user

## 10. Xoá 2 mẫu viết cứng trong code

- [ ] "Tạo trang mới" chỉ có "Trang trống" + các mẫu admin đã đăng
- [ ] Cột trái trình soạn thảo không còn mục "Mẫu trang"
- [ ] Trang đã tạo từ mẫu cũ vẫn mở bình thường

## 11. Xuất bản phải chờ admin duyệt (chống spam)

- [ ] Trình soạn thảo có nút **Xuất bản** → hộp thoại trạng thái
- [ ] Gửi yêu cầu → thay đổi đang dở được lưu trước; trạng thái "Đang chờ duyệt"
- [ ] Sửa trang sau khi gửi → admin xem/duyệt vẫn là **bản lúc gửi**
- [ ] Đang chờ duyệt → không gửi thêm được; "Huỷ yêu cầu" hoạt động
- [ ] Đang có 1 yêu cầu chờ duyệt (kể cả của trang khác) → không gửi thêm được (xem mục 21)
- [ ] Admin tab "Duyệt xuất bản": lọc Chờ duyệt / Đã duyệt / Đã từ chối
- [ ] "Xem" hiện đúng bản đã chụp
- [ ] "Từ chối" bắt buộc lý do → user thấy lý do trong hộp thoại xuất bản
- [ ] "Duyệt" → trang lên Vercel, user thấy link công khai
- [ ] Gọi thẳng `POST /api/designs/:id/deploy` → 404 (route đã bỏ)
- [ ] User thường gọi API `/api/admin/...` → 403
- [ ] Hai admin bấm duyệt cùng một yêu cầu → chỉ một người thành công

## 12. Icon + tiêu đề web; chọn tên miền khi xuất bản; không trùng; 1 tên miền/user; đổi phải chờ duyệt

- [ ] Cài đặt trang → mục **Website**: sửa tiêu đề, tải icon, bỏ icon
- [ ] Trang đã xuất bản có đúng tiêu đề tab và favicon
- [ ] Chưa có tên miền: hộp thoại xuất bản yêu cầu chọn tên miền; gợi ý sẵn từ tiêu đề (bỏ dấu)
- [ ] Kiểm tra tên khi gõ: ✓ dùng được / ✗ kèm lý do (quá ngắn, ký tự sai, tên hệ thống giữ, đã có người dùng)
- [ ] Nút "Gửi yêu cầu xuất bản" bị khoá khi chưa có tên miền
- [ ] Chọn tên lần đầu → có hỏi xác nhận, có hiệu lực ngay
- [ ] User B không chọn được tên user A đang dùng hoặc đang chờ duyệt
- [ ] Hai user chọn cùng một tên cùng lúc → chỉ một người được
- [ ] "Đổi tên miền" → gửi yêu cầu, tên mới được giữ chỗ, web vẫn chạy ở tên cũ
- [ ] Đang chờ đổi → không gửi yêu cầu đổi khác được; "Huỷ yêu cầu đổi" nhả tên đang giữ
- [ ] Admin tab "Đổi tên miền": duyệt / từ chối (bắt buộc lý do); user thấy lý do
- [ ] Nhập nguyên `ten.vercel.app` vào ô → vẫn hiểu là `ten`

## 13. Bỏ chờ 5 phút giữa các lần gửi yêu cầu xuất bản

- [ ] Bị từ chối → gửi lại ngay được
- [ ] Huỷ yêu cầu → gửi lại ngay được

## 14. Trang chủ hiện trạng thái xuất bản trên từng thiết kế

- [ ] Nhãn **Chờ duyệt** trên trang đang chờ (rê chuột thấy thời gian gửi)
- [ ] Nhãn **Đang xuất bản** + viền xanh + link công khai trên trang đang chạy
- [ ] Nhãn **Bản cập nhật chờ duyệt** khi trang đang chạy có bản sửa chờ duyệt
- [ ] Nhãn **Đang triển khai** ngay sau khi admin duyệt
- [ ] Nhãn **Bị từ chối** (rê chuột thấy lý do)
- [ ] Để trang chủ mở trong lúc admin duyệt → nhãn tự đổi trong ~20 giây, không cần tải lại
- [ ] Xoá trang đang xuất bản → hộp xác nhận có cảnh báo thêm
- [ ] Tắt BE → trang chủ vẫn dùng được, chỉ không có nhãn

## 15. Mỗi user chỉ 1 web; xuất bản thiết kế khác thì xoá web cũ trên Vercel rồi deploy lại

- [ ] Xuất bản trang A → trên Vercel có 1 project
- [ ] Gửi xuất bản trang B, admin duyệt → project của A **bị xoá** khỏi Vercel, chỉ còn project của B
- [ ] Tên miền hiển thị trang B
- [ ] Cập nhật lại chính trang B → không xoá project, chỉ deploy lại
- [ ] Trang chủ: nhãn "Đang xuất bản" chuyển từ A sang B

## 16. Cảnh báo cho user khi gửi yêu cầu; admin bấm duyệt không có cảnh báo

- [ ] Đang có web trang A, gửi xuất bản trang B → hiện hộp xác nhận "trang cũ sẽ bị XOÁ HẲN"; bấm Huỷ thì không gửi
- [ ] Lần xuất bản đầu tiên / cập nhật chính trang đang chạy → **không** hiện cảnh báo
- [ ] Admin bấm "Duyệt" → deploy ngay, không có hộp xác nhận

## 17. Admin chỉ cần bấm duyệt 1 lần khi chuyển sang thiết kế khác (lỗi "tên miền đã được dùng ở nơi khác trên Vercel")

- [ ] Đang có web trang A, admin duyệt trang B **một lần** → thành công, không còn lỗi 409
- [ ] Nút "Duyệt" có thể chờ tới ~30 giây, hiện "Đang xuất bản…"

## 18. Duyệt đổi tên miền thì cập nhật tên miền ở mọi nơi

- [ ] Sau khi duyệt: web chạy ở tên **mới**
- [ ] Tên **cũ** không còn chạy (gỡ khỏi Vercel)
- [ ] Tên cũ được nhả: user khác chọn được tên đó
- [ ] Trang chủ và hộp thoại xuất bản của user hiện tên mới
- [ ] Yêu cầu xuất bản đang chờ của user đó hiện tên miền mới trong tab duyệt của admin
- [ ] User chưa từng xuất bản đổi tên miền → duyệt vẫn thành công (không đụng Vercel)

## 19. Ghi mọi yêu cầu vào file checklist

- [ ] File này có mục cho mọi yêu cầu đã gửi, và được cập nhật khi có yêu cầu mới

## 20. Xoá ảnh trong Storage làm hỏng trang đang dùng ảnh đó

Video hiện chỉ là link YouTube (không nằm trong Storage) nên không bị ảnh hưởng.

- [ ] Xuất bản trang có ảnh thường + ảnh trong hình khối + favicon → xem nguồn trang trên Vercel: ảnh trỏ tới `/assets/…`, không còn link `firebasestorage.googleapis.com`
- [ ] Xoá các ảnh đó trong Firebase Storage → web đã xuất bản **vẫn hiện đủ ảnh và favicon**
- [ ] Ảnh dán link ngoài (không phải Storage) giữ nguyên link gốc
- [ ] Trình soạn thảo: ảnh đã bị xoá hiện khung đỏ "Ảnh không còn tồn tại" (ảnh thường và ảnh trong hình khối)
- [ ] Bảng thuộc tính: phần xem trước ảnh báo "Ảnh không còn tồn tại" + nhắc tải ảnh khác; tải ảnh mới → hết cảnh báo
- [ ] Favicon bị xoá → mục Website báo "Icon đã bị xoá"
- [ ] Xem trước (không phải trình soạn thảo): ảnh bị xoá hiện ô trống, không hiện biểu tượng ảnh vỡ
- [ ] Admin duyệt trang có ảnh đã bị xoá → vẫn xuất bản được, thông báo "x ảnh không còn trong Storage nên đã bị bỏ trống"
- [ ] Đang có web cũ, duyệt trang mới mà tải ảnh lỗi (VD mất mạng) → web cũ **không** bị xoá
- [ ] Web xuất bản **trước** bản sửa này vẫn còn dùng link Storage → xuất bản lại để được đóng gói ảnh

## 21. Chặn nhiều yêu cầu xuất bản cùng lúc (mỗi user chỉ 1 web)

- [ ] Trang A đang chờ duyệt → mở trang B, hộp thoại xuất bản báo "Trang A đang chờ duyệt xuất bản", nút gửi bị khoá
- [ ] Huỷ yêu cầu của A → gửi được yêu cầu cho B
- [ ] Gửi yêu cầu cho A và B gần như cùng lúc (2 tab) → chỉ một yêu cầu được nhận, tab kia báo lỗi
- [ ] Gọi thẳng API gửi yêu cầu cho B khi A đang chờ → 409
- [ ] Trang A đang triển khai (admin vừa duyệt) → B cũng bị chặn cho tới khi xong
- [ ] Hai admin duyệt 2 thao tác của **cùng một user** cùng lúc (VD: xuất bản + đổi tên miền) → một bên chạy, bên kia báo "Trang web của người dùng này đang được cập nhật", thử lại sau thì được
- [ ] Sau các thao tác trên: Vercel chỉ có **1 project** cho user đó, tên miền trỏ đúng trang, nhãn "Đang xuất bản" ở trang chủ đúng trang
- [ ] Admin duyệt thao tác của 2 user **khác nhau** cùng lúc → cả hai chạy bình thường

## 22. Xoay các phần tử trong trang chỉnh sửa

- [ ] Chọn phần tử → có nút tròn phía trên khung chọn; kéo để xoay quanh tâm
- [ ] Giữ **Shift** khi xoay → nhảy từng 15°
- [ ] Bật nam châm: xoay gần 0°/45°/90°… tự hít vào; giữ **Alt** để tắt hít
- [ ] Nhấp đúp nút xoay → về 0°
- [ ] Nhãn kích thước hiện góc, VD "300 × 200 · 30°"
- [ ] Bảng thuộc tính → "Góc xoay": nhập số, nút xoay trái/phải 90°, nút "0°"
- [ ] Nhập 190° → tự thành -170°
- [ ] Xoay được mọi loại: tiêu đề, đoạn văn, nút, ảnh, khối màu, đường kẻ, video, hình khối
- [ ] Phần tử khoá: không có nút xoay
- [ ] Đổi cỡ phần tử đã xoay (kéo cạnh và góc): cạnh/góc đối diện đứng yên; Shift + góc giữ tỉ lệ
- [ ] Di chuyển phần tử đã xoay: đường gióng bám theo mép **nhìn thấy** của phần tử
- [ ] Sửa chữ trực tiếp (nhấp đúp) trên phần tử đã xoay vẫn được
- [ ] Hình khối có ảnh, đã xoay: kéo ảnh (crop) di chuyển đúng hướng; cuộn chuột phóng quanh con trỏ
- [ ] Thả tệp ảnh lên hình khối đã xoay → ảnh vào đúng hình (kể cả ở góc bị xoay ra ngoài khung cũ)
- [ ] Hoàn tác (Ctrl+Z): cả một lần kéo xoay là 1 bước
- [ ] Nhân bản / sao chép-dán giữ nguyên góc xoay
- [ ] Xem trước, ảnh thu nhỏ ở trang chủ, và trang **đã xuất bản** trên Vercel đều hiện đúng góc xoay
- [ ] Trang cũ (tạo trước khi có tính năng xoay) mở bình thường, không bị xoay

## 23. Phần tử Âm thanh với hiệu ứng nhảy theo nhạc

Cần deploy lại Storage rules (thêm thư mục `audio`). Để hiệu ứng trong **trình soạn thảo/xem trước** nhảy theo đúng nhạc, bucket cần cấu hình CORS (`cors.json`, như mục 7); thiếu CORS thì vẫn phát được nhưng hiệu ứng chạy theo mẫu giả lập.

- [ ] Cột trái có nhóm "Âm thanh" (xem mục 24); kéo/nhấp một kiểu để thêm → khung tối "Tải tệp âm thanh ở bảng bên phải"
- [ ] Tải lên MP3 / M4A / WAV / OGG → tên tệp hiện trong bảng; tệp nằm ở Storage `users/{uid}/audio/`
- [ ] Tệp không phải âm thanh hoặc > 20MB → báo lỗi, không tải lên
- [ ] "Đổi tệp", "Bỏ tệp" hoạt động
- [ ] Bấm nút ▶ ngay trên trang soạn thảo → phát được, **không** kéo/di chuyển phần tử; bấm lại để dừng
- [ ] Đổi kiểu hiệu ứng, Số thanh ở bảng bên phải và Màu 1/Màu 2 trên thanh công cụ nhỏ → cập nhật ngay
- [ ] Khi phát: hiệu ứng nhảy theo nhạc (nhịp trống làm các thanh bên trái vọt lên); khi dừng: từ từ lắng xuống
- [ ] "Phát lặp lại": hết bài tự phát lại
- [ ] Hai phần tử âm thanh trên cùng trang: phát cái này thì cái kia tự dừng
- [ ] Đổi cỡ / xoay / đổi màu nền / bo góc phần tử âm thanh → hiệu ứng vẽ lại đúng, không bị mờ khi zoom
- [ ] Xem trước: phát được, hiệu ứng chạy
- [ ] Trang **đã xuất bản**: phát được, hiệu ứng nhảy theo nhạc; tệp âm thanh nằm trong `/assets/…` của Vercel (xoá khỏi Storage vẫn nghe được)
- [ ] Trình duyệt điện thoại (iOS Safari, Android Chrome) phát được trên trang đã xuất bản
- [ ] Xoá tệp âm thanh khỏi Storage → trong trình soạn thảo nút phát mờ đi, rê chuột báo "Không phát được"
- [ ] Admin "Lưu làm mẫu" một trang có âm thanh → mẫu phát được
- [ ] Trang không có âm thanh → HTML xuất bản không chứa đoạn script âm thanh

## 24. Âm thanh là một nhóm (như Hình khối) với nhiều kiểu

- [ ] Cột trái: mục "Thành phần" không còn ô Âm thanh; có nhóm riêng **"Âm thanh"** dưới "Hình khối"
- [ ] Nhóm có 7 ô, mỗi ô có icon riêng: Cột sóng, Đối xứng, Sóng, Đèn LED, Bong bóng, Vòng tròn, Nhịp đập
- [ ] Kéo thả **và** nhấp từng ô → tạo phần tử đúng kiểu, đúng màu và kích thước riêng (Vòng tròn / Nhịp đập là khung vuông)
- [ ] Phát nhạc: cả 7 kiểu đều nhảy theo nhạc
  - Đèn LED: các ô sáng dần từ dưới lên, màu chuyển từ Màu 1 (dưới) sang Màu 2 (trên)
  - Bong bóng: các chấm tròn phồng lên theo nhạc
  - Nhịp đập: khối tròn giữa co giãn theo tiếng trầm, viền ngoài uốn theo nhạc
- [ ] Vòng tròn / Nhịp đập: nút phát nằm giữa; các kiểu khác: nút ở góc dưới trái và hiệu ứng không đè lên nút
- [ ] Bảng thuộc tính: tiêu đề hiện "Âm thanh · <tên kiểu>"; ô "Kiểu" là danh sách chọn đủ 7 kiểu
- [ ] Bảng "Lớp" và bảng thuộc tính hiện đúng tên kiểu
- [ ] Phần tử âm thanh tạo từ mục 23 (trước khi có nhóm) vẫn mở và phát bình thường
- [ ] Trang đã xuất bản hiện đúng cả 7 kiểu

## 25. Màu nền mặc định của âm thanh là trong suốt

- [ ] Thêm phần tử âm thanh mới (mọi kiểu) → không có nền, thấy nền trang phía sau; ô "Màu nền" trên thanh công cụ nhỏ là trong suốt
- [ ] Chưa có tệp: khung chờ màu sáng "Âm thanh – Tải tệp âm thanh ở bảng bên phải"
- [ ] Trên nền trang trắng: hiệu ứng và nút phát vẫn nhìn rõ
- [ ] Vẫn đổi được sang màu nền khác như trước
- [ ] Phần tử âm thanh tạo **trước** thay đổi này giữ nguyên nền tối đã lưu

## 26. Bật/tắt tự động phát âm thanh (mặc định bật)

- [ ] Phần tử âm thanh mới: bảng thuộc tính có "Tự động phát khi mở trang", **đã bật sẵn**
- [ ] Trang chỉnh sửa: **không** tự phát (kể cả khi bật)
- [ ] Xem trước / trang đã xuất bản, khi trình duyệt cho phép: nhạc tự phát ngay khi mở
- [ ] Khi trình duyệt chặn (thường gặp ở lần đầu vào trang): nhạc tự bắt đầu ở lần **chạm/nhấp/gõ phím đầu tiên** vào bất kỳ chỗ nào trên trang
- [ ] Lần tương tác đầu tiên là bấm nút phát của chính phần tử đó → phát (không bị phát rồi dừng ngay)
- [ ] Trang có nhiều âm thanh cùng bật tự động phát → chỉ **cái đầu tiên** tự phát
- [ ] Tắt tự động phát → chỉ phát khi bấm nút
- [ ] Khi tự phát trước lúc người xem tương tác: nhạc có tiếng, hiệu ứng chạy theo mẫu; sau lần chạm đầu tiên hiệu ứng bám đúng theo nhạc
- [ ] Điện thoại (iOS Safari / Android Chrome): chạm lần đầu vào trang thì nhạc bắt đầu
- [ ] Phần tử âm thanh tạo trước thay đổi này cũng mặc định tự phát

## 27. Nhóm "Chữ" riêng trong cột trái

- [ ] Cột trái: nhóm **"Chữ"** ở trên cùng; mục "Thành phần" không còn Tiêu đề / Đoạn văn (còn Nút bấm, Hình ảnh, Khối màu, Đường kẻ, Video)
- [ ] Nhóm Chữ có 8 kiểu, mỗi kiểu có icon: Tiêu đề lớn, Tiêu đề, Tiêu đề phụ, Đoạn văn, Trích dẫn, Danh sách, Chú thích, Nhãn
- [ ] Kéo thả **và** nhấp từng kiểu → tạo chữ đúng cỡ, độ đậm, màu và nội dung mẫu
  - Trích dẫn: chữ nghiêng, nền tím nhạt, bo góc
  - Danh sách: 3 dòng có dấu •
  - Nhãn: chữ nhỏ, in hoa, giãn chữ, màu tím
- [ ] Nhấp đúp để sửa chữ trực tiếp; mọi chỉnh sửa chữ/màu/phông ở bảng bên phải hoạt động như trước
- [ ] Bảng "Lớp" hiện nội dung chữ; bảng thuộc tính hiện "Tiêu đề" hoặc "Đoạn văn"
- [ ] Trang cũ có tiêu đề/đoạn văn vẫn mở và xuất bản bình thường
- [ ] Trang đã xuất bản hiện đúng các kiểu chữ

## 28. Nhóm "Nút bấm" riêng trong cột trái

- [ ] Cột trái: nhóm **"Nút bấm"** ngay dưới nhóm Chữ; mục "Thành phần" không còn ô Nút bấm
- [ ] Nhóm có 8 kiểu, mỗi ô có **nút mẫu thu nhỏ** đúng màu/viền/bo góc: Nút chính, Viền, Bo tròn, Nhạt, Chuyển màu, Nổi, Liên kết, Nút lớn
- [ ] Kéo thả **và** nhấp từng kiểu → tạo nút đúng kiểu
  - Chuyển màu: nền chuyển tím → hồng, bo tròn
  - Nổi: nền trắng, có bóng đổ
  - Liên kết: chữ gạch chân "Xem thêm →", không nền
  - Nút lớn: to hơn, chữ "Bắt đầu ngay"
- [ ] Sửa chữ, liên kết khi nhấn, "Mở trong tab mới", màu nền, viền, bo góc ở bảng bên phải hoạt động như trước
- [ ] Nút "Chuyển màu": ô Màu nền hiện chuỗi `linear-gradient(...)`, sửa được hoặc chọn màu trơn thay thế
- [ ] Xem trước / trang đã xuất bản: nút bấm được, mở đúng liên kết
- [ ] Trang cũ có nút bấm vẫn hiển thị và xuất bản bình thường

## 29. Nút icon trong nhóm Nút bấm

- [ ] Nhóm Nút bấm có thêm 2 ô: **"Nút icon"** (nền tím tròn, icon trắng) và **"Icon"** (không nền, icon tím); ô mẫu hiện đúng icon
- [ ] Kéo thả / nhấp để thêm → nút icon trên trang
- [ ] Bảng thuộc tính → "Icon": lưới chọn icon chia theo nhóm (xem mục 30); icon đang chọn được tô sáng
- [ ] Chọn icon khác → đổi ngay trên trang
- [ ] "Màu icon" (thanh công cụ nhỏ) đổi màu; "Cỡ icon" (20–100%) và "Độ dày nét" (bảng thuộc tính) hoạt động
- [ ] Nền, bo góc, viền, bóng, độ mờ, xoay, đổi cỡ dùng như phần tử khác
- [ ] "Khi bấm": nhập đường dẫn (https://, `tel:`, `mailto:`), "Mở trong tab mới", "Mô tả"
- [ ] Trang chỉnh sửa: bấm vào nút icon chỉ chọn phần tử, không mở liên kết
- [ ] Xem trước / trang đã xuất bản: bấm vào icon mở đúng đường dẫn (tab mới nếu bật); `tel:` gọi điện trên điện thoại
- [ ] Rê chuột lên icon ở trang đã xuất bản → hiện tên (Mô tả, hoặc tên icon nếu để trống)
- [ ] Bảng "Lớp" hiện "Nút icon" với biểu tượng ngôi sao

## 30. Thêm nhiều icon (99 icon, 7 nhóm) + tìm icon

- [ ] Bảng chọn icon có 7 nhóm: Mạng xã hội (12), Liên hệ (14), Mua sắm (12), Đời sống (13), Đa phương tiện (8), Chung (30), Mũi tên (10)
- [ ] Icon mạng xã hội mới: Zalo, Messenger, WhatsApp, Telegram, Pinterest, GitHub
- [ ] Ô "Tìm trong 99 icon…": gõ có dấu hoặc không dấu đều tìm được (VD "dien thoai", "giao hang", "zalo")
- [ ] Đang tìm: chỉ hiện các nhóm có kết quả; không có kết quả → "Không tìm thấy icon nào"
- [ ] Chọn một icon mới → đổi ngay trên trang; trang đã xuất bản hiện đúng icon đó
- [ ] Nút icon tạo trước khi thêm icon mới vẫn giữ nguyên icon cũ

## 31. Mọi ô màu chọn được Đơn sắc hoặc Chuyển màu (gradient)

Ô màu nào cũng có 2 nút **Đơn sắc / Chuyển màu** (trừ Màu 1/Màu 2 của Âm thanh, vốn đã là chuyển màu giữa 2 màu).

- [ ] Chuyển màu: thanh xem trước, 8 mẫu có sẵn, Tuyến tính / Toả tròn, thanh chỉnh góc (tuyến tính), 2–5 điểm màu (đổi màu, kéo vị trí, xoá, "Thêm điểm màu")
- [ ] Bấm "Đơn sắc" khi đang chuyển màu → giữ màu của điểm đầu tiên
- [ ] Kéo thanh góc / vị trí liên tục rồi Ctrl+Z → hoàn tác cả lần kéo, không phải từng bước nhỏ
- [ ] Áp dụng và hiển thị đúng (trang chỉnh sửa, Xem trước, ảnh thu nhỏ trang chủ, trang **đã xuất bản**) cho:
  - [ ] Màu nền trang
  - [ ] Màu nền phần tử (chữ, nút, ảnh, khối màu, video, nút icon, âm thanh)
  - [ ] Màu chữ (tiêu đề, đoạn văn, nút) — gạch chân vẫn thấy được
  - [ ] Màu viền — viền gradient vẫn bo góc đúng, kể cả nút bo tròn
  - [ ] Đường kẻ — cả nét liền, nét đứt, chấm
  - [ ] Hình khối: màu nền (khi không có ảnh) và màu viền/viền giấy
  - [ ] Màu icon của nút icon (kể cả icon có chấm nhỏ như Instagram)
- [ ] Đang sửa chữ trực tiếp (nhấp đúp) trên chữ gradient → tạm hiện màu đầu tiên; sửa xong hiện lại gradient
- [ ] Nút "Chuyển màu" có sẵn trong nhóm Nút bấm mở ra đúng chế độ Chuyển màu
- [ ] Trang cũ (màu đơn sắc) không bị thay đổi gì

## 32. Các nhóm ở cột trái thu gọn, có nút phóng to xem đủ

- [ ] Mặc định mỗi nhóm (Chữ, Nút bấm, Thành phần, Hình khối, Âm thanh) chỉ hiện **2 phần tử đầu**, cạnh tên nhóm có số lượng (VD "NÚT BẤM 10")
- [ ] Nút ⛶ cạnh tên nhóm **hoặc** liên kết "Xem tất cả n" → mở rộng nhóm, hiện đủ phần tử (lưới 3 cột) và dòng gợi ý của nhóm
- [ ] Bấm lại nút (đổi thành biểu tượng thu gọn) → thu về 2 phần tử
- [ ] Mở/thu từng nhóm độc lập với nhau
- [ ] Tải lại trang / mở trang khác → các nhóm vẫn giữ trạng thái mở/thu như lần trước (trên cùng trình duyệt)
- [ ] Kéo thả và nhấp để thêm vẫn hoạt động ở cả 2 trạng thái

## 33. Tự dọn ảnh/âm thanh không còn dùng trong Storage

Tệp "thừa" = tệp trong `users/{uid}/images` hoặc `users/{uid}/audio` mà không thiết kế nào của user, không yêu cầu xuất bản đang chờ/đang triển khai nào, và không mẫu trang nào dùng. Tệp chỉ bị xoá khi đã thừa **liên tục hơn 24 giờ**.

- [ ] Tải ảnh lên thiết kế rồi xoá phần tử ảnh → về trang chủ: ảnh **chưa** bị xoá ngay (Firestore có `storageCleanups/user_<uid>` ghi nhận tệp chờ)
- [ ] Sau hơn 24 giờ, về trang chủ lần nữa (hoặc admin bấm "Dọn dung lượng") → ảnh bị xoá khỏi Storage
- [ ] Xoá ảnh rồi Ctrl+Z trong vòng 24 giờ → ảnh vẫn còn, không bị xoá (vì lại được dùng)
- [ ] Ảnh/âm thanh vẫn còn trong **bất kỳ** thiết kế nào của user → không bị xoá
- [ ] Ảnh nằm trong yêu cầu xuất bản đang chờ duyệt (dù đã bị xoá khỏi thiết kế) → không bị xoá; admin duyệt vẫn đủ ảnh
- [ ] Xoá cả một trang → sau 24 giờ các ảnh chỉ trang đó dùng bị dọn
- [ ] Favicon và ảnh trong hình khối cũng được tính là "đang dùng"
- [ ] Trang đã xuất bản (sau mục 20) vẫn đủ ảnh sau khi ảnh gốc bị dọn
- [ ] Trang quản trị → nút **"Dọn dung lượng"** → hỏi xác nhận → báo số tệp đã xoá, dung lượng giải phóng, số tệp còn chờ
- [ ] Xoá một mẫu trang → sau 24 giờ, "Dọn dung lượng" xoá ảnh trong `templates/images` mà không mẫu nào dùng
- [ ] Về trang chủ liên tục → backend chỉ dọn tối đa 1 lần/phút cho mỗi user
- [ ] Tắt backend → trang chủ vẫn dùng bình thường (chỉ ghi cảnh báo trong console)

## 34. Hiệu ứng khi đang tải ảnh / âm thanh lên

- [ ] Kéo thả tệp ảnh vào chỗ trống trên trang → ngay tại chỗ thả hiện **khung chờ** (nền tím, viền đứt, ánh sáng chạy qua) với vòng xoay "Đang xử lý…" rồi "Đang tải lên x%"; xong thì khung được thay bằng ảnh
- [ ] Thả nhiều ảnh một lúc → mỗi ảnh có khung chờ riêng (xếp lệch nhau), tải song song, ảnh nào xong trước hiện trước
- [ ] Thả ảnh lên hình khối → lớp phủ tối + vòng tiến trình **trên chính hình khối** đó
- [ ] Bảng thuộc tính: "Tải ảnh lên / Đổi ảnh" (ảnh, hình khối), "Tải tệp lên" (âm thanh), "Tải icon lên" (favicon) → chữ nút đổi thành "Đang xử lý…" / "Đang tải lên x%", thanh tiến trình chạy dưới đáy nút, nút bị khoá trong lúc tải
- [ ] Tải ảnh/âm thanh qua bảng thuộc tính → phần tử tương ứng trên trang cũng hiện lớp phủ tiến trình
- [ ] Vòng tiến trình và chữ giữ nguyên kích thước dù phóng to/thu nhỏ trang
- [ ] Phần tử đang tải đã xoay → lớp phủ xoay theo
- [ ] Tải lỗi (VD mất mạng) → khung chờ / lớp phủ biến mất, có thông báo lỗi
- [ ] Tệp lớn (âm thanh ~10–20MB): phần trăm tăng dần, không đứng yên

## 35. Hiệu ứng âm thanh nhảy theo nhịp nhạc thật

Nguyên nhân cũ: bucket Storage chưa bật CORS nên trong trang chỉnh sửa/xem trước trình duyệt không đọc được dữ liệu nhạc → hiệu ứng chạy giả lập. **Đã bật** CORS (chỉ đọc, mọi nguồn) cho bucket `nayva-e79e1.firebasestorage.app` bằng `npm run setup:cors` ở backend; project Firebase mới cần chạy lại lệnh này một lần.

- [ ] Đã chạy `npm run setup:cors`; lệnh in ra cấu hình CORS của bucket với đúng tên miền frontend
- [ ] Trang chỉnh sửa: phát nhạc có trống rõ → các thanh nảy lên **đúng mỗi phách**, hạ nhanh giữa các phách; không có nhãn "Mô phỏng"
- [ ] Nhạc nhỏ tiếng vẫn nhảy cao (tự cân độ lớn)
- [ ] Vòng tròn: vòng phình theo phách; Nhịp đập: khối giữa đập theo tiếng trống
- [ ] Đoạn nhạc lặng → các thanh hạ thấp, không nhảy loạn
- [ ] Chưa bật CORS (hoặc tệp ở máy chủ khác chặn): nhạc vẫn phát, hiệu ứng chạy nhịp giả lập 120 bpm, và **trong trang chỉnh sửa** có nhãn "Mô phỏng" ở góc (rê chuột thấy giải thích); trang đã xuất bản không có nhãn này
- [ ] Trang đã xuất bản: nhảy đúng nhịp nhạc (tệp nằm cùng tên miền nên không cần CORS)

## 36. Sóng âm khác nhau theo nhạc thật (đã bật CORS cho bucket)

- [ ] Tải lại hẳn trang chỉnh sửa (Ctrl+F5) → phát nhạc: hình sóng **khác nhau theo từng đoạn** của bài (đoạn lặng thấp, đoạn trống/điệp khúc cao), không lặp lại một mẫu
- [ ] Hai bài nhạc khác nhau cho hình sóng khác nhau
- [ ] Web đã xuất bản từ trước (còn dùng link Storage) cũng nhảy theo nhạc thật

## 37. Hạn mức 100MB tải lên mỗi user + thanh dung lượng + quản lý tệp

Cần deploy: backend, **Storage rules** và **Firestore rules** (`firebase deploy --only firestore:rules,storage`).

- [ ] Trang chỉnh sửa: cuối cột trái có thanh "x MB / 100 MB" (luôn dính ở đáy); trang chủ: thanh nổi ở góc trái dưới
- [ ] Thanh chuyển màu cam khi dùng ≥ 70%, đỏ khi ≥ 90%
- [ ] Tải ảnh/âm thanh/favicon lên → con số tăng ngay
- [ ] Bấm thanh → bảng "Dung lượng đã dùng": tổng dung lượng, % và số tệp; danh sách tệp có ảnh thu nhỏ / icon âm thanh, **tên tệp gốc** (tệp tải trước khi có tính năng này hiện tên tự sinh), dung lượng, ngày tải lên
- [ ] Mỗi tệp ghi rõ "Đang dùng: <tên trang>", "Trong yêu cầu xuất bản đang chờ duyệt" hoặc "Không dùng ở trang nào"
- [ ] Lọc Tất cả / Ảnh / Âm thanh / Không dùng; sắp xếp Mới nhất / Lớn nhất; nút mở tệp
- [ ] Xoá một tệp không dùng → biến mất khỏi danh sách, dung lượng giảm, tệp mất khỏi Storage
- [ ] Xoá tệp đang dùng → hỏi xác nhận, nêu tên các trang dùng nó; sau khi xoá trang đó báo "Ảnh không còn tồn tại"
- [ ] "Xoá n tệp không dùng" xoá hết tệp không dùng một lần (không đụng tệp trong yêu cầu xuất bản đang chờ)
- [ ] Dùng gần hết 100MB → tải thêm tệp làm vượt hạn mức bị chặn với thông báo "Bạn đã dùng hết 100 MB…" (ở bảng thuộc tính và khi thả tệp vào trang)
- [ ] Cố tải thẳng lên Storage bằng SDK khi đã vượt hạn mức → bị Storage rules từ chối
- [ ] Ảnh admin chép sang mẫu trang (`templates/images`) **không** bị tính vào hạn mức của admin
- [ ] Dọn tệp thừa tự động (mục 33) cũng làm dung lượng giảm tương ứng
- [ ] Không xoá được tệp của người khác (gọi API với đường dẫn tệp user khác → 403)

## 38. Chọn nhiều tệp để xoá cùng lúc trong bảng dung lượng

- [ ] Mỗi tệp có ô chọn ở đầu; tệp được chọn có viền/nền tím nhạt
- [ ] "Chọn tất cả" chọn/bỏ chọn **các tệp đang hiển thị** (theo bộ lọc Ảnh / Âm thanh / Không dùng); chọn một phần thì ô hiện dấu "−"
- [ ] Có tệp được chọn → hiện nút đỏ "Xoá n tệp đã chọn (dung lượng)" và "Bỏ chọn"; nút "Xoá n tệp không dùng" tạm ẩn
- [ ] Chọn cả tệp đang dùng → hộp xác nhận nêu tên các trang bị ảnh hưởng
- [ ] Xoá nhiều tệp → chỉ 1 lần gọi máy chủ, danh sách và dung lượng cập nhật ngay, lựa chọn được xoá sạch
- [ ] Đổi bộ lọc không làm mất các tệp đã chọn trước đó
- [ ] Không xoá được tệp của người khác / ngoài thư mục ảnh-âm thanh (API trả 403)

## 39. Chèn video vào hình khối (ngoài ảnh)

Cần deploy: backend + Storage rules (thư mục `users/{uid}/videos`).

- [ ] Chọn một hình khối → bảng "Ảnh / video trong hình" có nút chuyển **Ảnh | Video**
- [ ] Chọn Video → "Tải video lên" (MP4/WebM/MOV, tối đa 30MB): có tiến trình tải lên trên nút và trên hình
- [ ] Video trong hình: tự phát, **tắt tiếng**, lặp lại, bị cắt đúng theo hình (tim, sao, tròn, giấy rách, …)
- [ ] Viền hình, vân giấy, đổ bóng vẫn hiện quanh hình có video
- [ ] Nhấp đúp vào hình có video (hoặc nút "Chỉnh video" trên thanh công cụ nhỏ) → kéo để dời, cuộn chuột để phóng; toàn khung video hiện mờ phía sau khi đang chỉnh; các thanh Ngang / Dọc / Thu phóng và "Đặt lại vị trí video" hoạt động
- [ ] Hình khối đã xoay chứa video → video xoay theo, vẫn cắt đúng
- [ ] Dán đường dẫn video (link .mp4 trực tiếp) → phát trong hình
- [ ] "Bỏ video" → hình trở lại màu nền; chuyển Ảnh ↔ Video làm trống hình (tệp cũ không hợp kiểu mới)
- [ ] Kéo thả tệp video từ máy **lên một hình khối** → video vào hình đó; thả video ra chỗ trống → thông báo "Thả video vào một hình khối…"
- [ ] Tệp > 30MB hoặc làm vượt hạn mức 100MB → bị chặn với thông báo rõ ràng
- [ ] Bảng dung lượng: có bộ lọc "Video", video hiện icon video, tính vào dung lượng, xoá được
- [ ] Xoá video khỏi Storage → trong trang chỉnh sửa hình báo "Video không còn tồn tại"
- [ ] Ảnh thu nhỏ ở trang chủ: video đứng yên (không tự phát)
- [ ] Xem trước và trang **đã xuất bản**: video phát trong hình; tệp video nằm trong `/assets/…` của Vercel (xoá khỏi Storage vẫn phát)
- [ ] Trên điện thoại (iOS Safari): video tự phát trong hình (vì đã tắt tiếng + playsinline)
- [ ] Dọn tệp thừa (mục 33) cũng xoá video không còn dùng sau 24 giờ
- [ ] Admin "Lưu làm mẫu" trang có video trong hình → mẫu vẫn phát video

## 40. Mẫu portfolio đầy đủ (nhiều phần, cuộn dọc)

Đã ghi vào Firestore bằng `npm run seed:templates` ở backend (chạy lại chỉ cập nhật, không tạo trùng; `-- --preview <thư mục>` để xem trước HTML mà không ghi). Hai mẫu một-màn-hình cũ ("Tối giản", "Link in bio") đã được gỡ.

- [ ] Trang chủ → "Tạo trang mới" có 4 mẫu: **Portfolio – Nhà thiết kế** (nền tối), **Portfolio – Lập trình viên** (nền sáng), **Portfolio – Nhiếp ảnh**, **Portfolio – Sáng tạo nội dung** (tông cam)
- [ ] Mỗi mẫu có đủ các phần: thanh menu, phần mở đầu, giới thiệu/con số, dịch vụ hoặc kỹ năng, dự án/tác phẩm, kinh nghiệm hoặc bảng giá, cảm nhận khách hàng, liên hệ, chân trang
- [ ] Tạo trang từ từng mẫu → mở đúng bố cục, cuộn hết trang không có chỗ chồng chéo
- [ ] Sửa được mọi thứ: chữ, màu/gradient, ảnh (ảnh thường và ảnh trong hình khối), nút + đường dẫn, icon mạng xã hội
- [ ] Các nút liên hệ mở đúng `mailto:` / `tel:`; nút GitHub mở tab mới
- [ ] Ảnh minh hoạ là ảnh mẫu từ picsum.photos → thay bằng ảnh của mình; tên/email/số điện thoại là dữ liệu giả
- [ ] Xuất bản một trang tạo từ mẫu → hiển thị giống trong trình soạn thảo, thu nhỏ vừa màn hình điện thoại
- [ ] Admin xoá được các mẫu này ở tab "Mẫu đã tạo"

## 41. Duyệt xuất bản báo "Vercel: Not authorized"

Nguyên nhân: token Vercel của backend hết hạn / bị thu hồi (Vercel trả `invalidToken: true` cho mọi lệnh gọi).

- [ ] Đã tạo token mới trên Vercel (Account Settings → Tokens), đúng phạm vi team chứa các project, hạn dùng đủ dài
- [ ] Đã cập nhật `VERCEL_TOKEN` (và `VERCEL_TEAM_ID` nếu project thuộc team) ở `.env` **và** ở biến môi trường nơi backend đang chạy, rồi deploy lại backend
- [ ] Bấm "Duyệt" lại yêu cầu đang chờ → xuất bản thành công
- [ ] Khi token hỏng, dòng lỗi trong tab duyệt ghi rõ "Token Vercel (VERCEL_TOKEN) không hợp lệ hoặc đã hết hạn…" thay vì "Not authorized"

## 42. Thanh công cụ nhanh nổi trên phần tử đang chọn

- [ ] Chọn một phần tử → thanh công cụ nhỏ hiện phía trên (trên cả nút xoay); phần tử sát mép trên vùng làm việc (không đủ chỗ phía trên) → thanh hiện phía dưới
- [ ] Thanh giữ nguyên kích thước khi phóng to/thu nhỏ trang; không che bảng thuộc tính
- [ ] Đang kéo / đổi cỡ / xoay → thanh tạm ẩn, thả chuột hiện lại; đang căn ảnh/video trong hình khối → ẩn
- [ ] **Chữ** (tiêu đề, đoạn văn, nút): phông chữ, cỡ chữ (−/+ bước 2, gõ số trực tiếp), **B** / *I* / U (nút sáng khi đang bật), màu chữ ("A" gạch màu), màu nền, căn lề (bấm để đổi trái → giữa → phải → đều)
- [ ] **Khối màu / video**: màu nền, bo góc; **ảnh**: bo góc
- [ ] **Hình khối**: màu nền; nút màu viền chỉ hiện khi hình có viền
- [ ] **Nút icon**: màu icon (biểu tượng ngôi sao gạch màu), màu nền
- [ ] **Đường kẻ**: màu, độ dày; **Âm thanh**: Màu 1, Màu 2 (đơn sắc), màu nền
- [ ] Mọi loại: Nhân bản, Xoá
- [ ] Bấm ô màu → bảng chọn màu mở ngay dưới (Đơn sắc / Chuyển màu, trừ màu âm thanh chỉ đơn sắc); bấm ra ngoài → đóng
- [ ] Mọi thay đổi trên thanh cập nhật ngay trên trang; Ctrl+Z hoàn tác được (bấm −/+ liên tục gộp thành 1 bước)
- [ ] Dùng thanh công cụ không làm bỏ chọn hay kéo lệch phần tử
- [ ] Gõ số trong ô cỡ chữ không kích hoạt phím tắt (Delete, mũi tên…)

## 43. Thanh công cụ nhanh: độ mờ, giãn dòng, giãn chữ

- [ ] Mọi loại phần tử: nút **Độ mờ** (hình tròn nửa đậm) → bảng có thanh trượt 0–100%, phần tử mờ dần ngay khi kéo
- [ ] Chữ (tiêu đề, đoạn văn, nút): nút **Khoảng cách** → bảng có 2 thanh trượt: **Giãn dòng** (0,8–3) và **Giãn chữ** (−5 đến 30px)
- [ ] Giá trị hiện cạnh tên thanh trượt (VD "1.60", "2px", "80%") đúng với phần tử
- [ ] Mở bảng này thì bảng màu / bảng kia tự đóng; bấm ra ngoài → đóng
- [ ] Kéo thanh trượt liên tục rồi Ctrl+Z → hoàn tác cả lần kéo
- [ ] Độ mờ / giãn dòng / giãn chữ hiển thị đúng ở Xem trước và trang đã xuất bản

## 44. Lật ảnh / hình khối và bo góc trên thanh công cụ nhanh

- [ ] Chọn **ảnh** → thanh có: bo góc (icon góc bo + −/+), **Lật ngang**, **Lật dọc**
- [ ] Chọn **hình khối** → thanh có: màu nền, (màu viền nếu có viền), **bo góc** (chỉ với hình Thoi, Tam giác, Lục giác, Ngôi sao), Lật ngang, Lật dọc
- [ ] Lật ngang / dọc: nút sáng lên khi đang bật; bấm lại để bỏ lật; ảnh/video bên trong hình lật theo
- [ ] Nhãn kích thước và tay nắm của khung chọn **không** bị lật ngược chữ
- [ ] Phần tử vừa xoay vừa lật hiển thị đúng; đổi cỡ vẫn bình thường
- [ ] Hình khối đã lật có ảnh: nhấp đúp để căn ảnh → kéo và cuộn chuột vẫn đúng hướng tay
- [ ] Bo góc hình khối: các đỉnh tròn dần theo số px; ảnh/video bên trong và viền cũng tròn theo
- [ ] Hình tròn, trái tim, mái vòm, hình cong, giấy rách: **không** có ô bo góc
- [ ] Xem trước, ảnh thu nhỏ trang chủ và trang **đã xuất bản** hiển thị đúng lật và bo góc

## 45. Nút "Chỉnh ảnh" (kéo ảnh trực tiếp) trên thanh công cụ nhanh

- [ ] Chọn hình khối **có ảnh** → đầu thanh công cụ có nút "Chỉnh ảnh" (hình có video → "Chỉnh video"); hình không có ảnh/video → không có nút này
- [ ] Bấm → vào chế độ kéo ảnh: toàn khung ảnh hiện mờ phía sau, thanh công cụ ẩn, thanh "− % + · Kéo để dời · cuộn chuột để phóng · Xong" hiện ra
- [ ] Kéo để dời, cuộn chuột để phóng, "Xong" hoặc Esc để thoát → thanh công cụ hiện lại
- [ ] Ảnh cũ chưa có kích thước gốc: bấm nút → "Đang tải…" rồi vào chế độ kéo ảnh
- [ ] Hình khối đang khoá → nút bị mờ, không bấm được

## 46. Phóng to / thu nhỏ ảnh trong hình bằng cách kéo góc (chế độ kéo ảnh)

- [ ] Vào chế độ kéo ảnh (nút "Chỉnh ảnh" trên thanh công cụ hoặc nhấp đúp hình) → khung toàn bộ ảnh có **4 tay nắm tròn ở 4 góc**
- [ ] Kéo một góc ra ngoài → ảnh to lên; kéo vào trong → ảnh nhỏ lại; **góc đối diện đứng yên** (tỉ lệ: xem mục 47)
- [ ] Số % trên thanh "− % +" cập nhật theo; vẫn dùng được nút −/+ và cuộn chuột
- [ ] Kéo phần ảnh (không phải góc) vẫn là dời ảnh như cũ
- [ ] Hình khối đã **xoay** và/hoặc **lật** → tay nắm nằm đúng góc ảnh, kéo ra ngoài vẫn to lên, góc đối diện đứng yên
- [ ] Ảnh tràn xuống dưới hình → thanh "− % + · Xong" nằm **dưới khung ảnh**, không che tay nắm góc dưới
- [ ] Kéo góc xong Ctrl+Z → hoàn tác cả lần kéo
- [ ] Làm được với cả video trong hình

## 47. Kéo góc ảnh trong hình: co giãn tự do, giữ Shift để giữ tỉ lệ

- [ ] Chế độ kéo ảnh → kéo góc **không giữ phím**: chiều rộng và chiều cao đổi độc lập (VD kéo ngang chỉ làm ảnh rộng ra, không cao thêm) → ảnh bị kéo giãn theo ý
- [ ] Kéo góc **giữ Shift**: ảnh giữ đúng tỉ lệ, số % trên thanh thay đổi
- [ ] Cả hai cách: góc đối diện đứng yên; hình đã xoay/lật vẫn đúng hướng
- [ ] Thanh gợi ý và bảng thuộc tính ghi "kéo góc để co giãn (giữ Shift để giữ tỉ lệ)"
- [ ] "Đặt lại vị trí ảnh" hoặc đổi ảnh mới → ảnh trở về tỉ lệ gốc
- [ ] Ảnh đã kéo giãn hiển thị giống hệt ở Xem trước và trang **đã xuất bản**; video trong hình cũng co giãn được

## 48. Ảnh trong hình không bị giới hạn bởi khung — kéo ra ngoài hẳn được

- [ ] Chế độ kéo ảnh → kéo ảnh sang một bên thật xa: ảnh **không dừng ở mép hình** mà đi tiếp, có thể ra ngoài hoàn toàn (hình khi đó chỉ còn màu nền)
- [ ] Ảnh vừa khít hình (thu phóng 100%) vẫn dời được theo cả hai chiều
- [ ] Phần ảnh nằm ngoài hình hiện mờ kèm khung + tay nắm góc; **bấm vào khung mờ bên ngoài** vẫn kéo ảnh về lại được
- [ ] Cuộn chuột trên phần ảnh nằm ngoài hình → vẫn phóng to/thu nhỏ quanh con trỏ
- [ ] Phóng to/thu nhỏ (cuộn, nút − +, kéo góc, giữ Shift) khi ảnh đã lệch ra ngoài → không bị kéo giật về trong khung
- [ ] Hình đã xoay/lật: kéo ảnh ra ngoài theo đúng hướng tay kéo
- [ ] Bảng thuộc tính: thanh Ngang / Dọc hiển thị vị trí tâm ảnh (50% = giữa); kéo được từ −50% đến 150%, giá trị ngoài khoảng này (do kéo trên trang) vẫn hiện đúng số
- [ ] "Đặt lại vị trí ảnh" và đổi ảnh mới → ảnh về giữa hình, vừa khít
- [ ] Thiết kế **cũ** (lưu trước bản cập nhật này) mở ra: ảnh giữ nguyên vị trí như trước
- [ ] Xem trước và trang **đã xuất bản** (cần deploy lại backend): ảnh bị cắt theo hình ở đúng vị trí đã kéo; video trong hình cũng kéo ra ngoài được

## 49. Thanh công cụ nhỏ luôn nằm trên cùng, không bị sidebar che

- [ ] Chọn phần tử sát mép trái / phải của vùng làm việc (hoặc cuộn ngang để phần tử lấp dưới sidebar) → thanh công cụ **nổi đè lên sidebar**, hiện đầy đủ, không bị cắt
- [ ] Thanh công cụ luôn nằm gọn trong cửa sổ (không tràn ra ngoài mép trái/phải màn hình)
- [ ] Cuộn vùng làm việc, đổi mức zoom, thu/phóng cửa sổ → thanh bám theo phần tử ngay
- [ ] Phần tử bị cuộn ra khỏi vùng nhìn thấy → thanh dừng ở mép vùng làm việc, không che thanh tiêu đề phía trên
- [ ] Bấm các nút trên thanh (màu, cỡ chữ, độ mờ…) → bảng chọn mở bình thường, cũng nổi trên sidebar; phần tử **vẫn đang được chọn**
- [ ] Hộp thoại (xuất bản, dọn dẹp dung lượng…) mở ra vẫn nằm **trên** thanh công cụ
- [ ] Đang kéo / xoay / chỉnh ảnh → thanh ẩn như trước; bỏ chọn → thanh biến mất

## 50. Thêm nhiều phông chữ đa dạng (76 phông, đều gõ được tiếng Việt)

- [ ] Chọn chữ → bấm ô phông chữ trên thanh công cụ nhỏ → mở danh sách có ô tìm kiếm và các nhóm: Không chân, Có chân, Tiêu đề nổi bật, Viết tay, Đơn cách
- [ ] Mỗi tên phông hiển thị bằng chính phông đó; phông đang dùng được tô màu và cuộn tới sẵn
- [ ] Gõ tìm (VD "vibes", "garamond", không phân biệt dấu) → lọc đúng; bấm nhóm → chỉ hiện phông nhóm đó
- [ ] Phím ↑ ↓ di chuyển, Enter chọn, Esc đóng (phần tử vẫn được chọn); bấm ra ngoài → đóng
- [ ] Đổi sang từng nhóm phông (VD Great Vibes, Oswald, Merriweather, Bungee, JetBrains Mono) → chữ tiếng Việt có dấu hiển thị đúng, không bị lẫn phông khác ở chữ có dấu
- [ ] In đậm / in nghiêng với phông nhiều độ đậm (Roboto, Montserrat…) hoạt động
- [ ] Thiết kế cũ dùng Be Vietnam Pro / Inter / Montserrat / Playfair / Lora / Hệ thống / Monospace vẫn hiển thị như trước
- [ ] Mở lại thiết kế, Xem trước, ảnh thu nhỏ ở trang chủ → chữ hiển thị đúng phông đã chọn
- [ ] Trang **đã xuất bản** (cần deploy lại backend) hiển thị đúng phông; trang chỉ tải những phông nó dùng

## 51. Đổi icon của nút icon ngay trên thanh công cụ nhỏ

- [ ] Chọn một nút icon (hoặc Icon) → nút đầu tiên trên thanh công cụ hiện **icon đang dùng** kèm mũi tên; rê chuột thấy "Đổi icon (đang dùng: …)"
- [ ] Bấm → bảng icon mở ngay dưới thanh: ô tìm kiếm (con trỏ nằm sẵn trong ô), các nhóm icon, icon đang dùng được tô màu
- [ ] Gõ tìm (VD "dien thoai", "facebook", không cần dấu) → lọc đúng; không có kết quả → "Không tìm thấy icon nào."
- [ ] Bấm một icon → icon trên trang đổi ngay, bảng tự đóng, phần tử vẫn được chọn; Ctrl+Z hoàn tác được
- [ ] Bảng dài thì cuộn được bên trong, không tràn khỏi màn hình; bấm ra ngoài → đóng
- [ ] Bảng thuộc tính bên phải (mục Icon) vẫn tìm / chọn icon như trước và đồng bộ với thanh công cụ

## 52. Bảng thuộc tính bên phải bỏ những mục đã có trên thanh công cụ nhỏ

- [ ] **Mọi loại**: đầu bảng không còn nút Nhân bản / Xoá (còn các nút lớp + Khoá); không còn thanh "Độ mờ" ở đâu trong bảng
- [ ] **Tiêu đề / đoạn văn / nút**: mục "Chữ" chỉ còn **Độ đậm** và **Căn dọc** (phông, cỡ, màu chữ, căn ngang, nghiêng, gạch chân, giãn dòng, giãn chữ nằm trên thanh công cụ); mục "Nền & viền" không còn Màu nền (còn Bo góc, Khoảng đệm, Viền, Đổ bóng)
- [ ] **Khối màu, video YouTube**: "Nền & viền" không còn Màu nền, Bo góc
- [ ] **Ảnh**: "Nền & viền" không còn Bo góc (vẫn còn Màu nền)
- [ ] **Hình khối**: không còn mục "Màu nền"; "Hình dạng" không còn Bo góc, Màu viền (vẫn còn Viền, Vân giấy, Đổ bóng); "Vị trí ảnh trong hình" không còn nút kéo ảnh (dùng "Chỉnh ảnh" trên thanh / nhấp đúp), vẫn còn Ngang / Dọc / Thu phóng / Đặt lại
- [ ] **Nút icon**: mục "Icon" không còn lưới chọn icon và Màu icon (còn Cỡ icon, Độ dày nét, Khi bấm)
- [ ] **Đường kẻ**: chỉ còn "Kiểu" (màu, độ dày trên thanh); **Âm thanh**: "Hiệu ứng" không còn Màu 1 / Màu 2
- [ ] Các mục đã bỏ vẫn chỉnh được đầy đủ trên thanh công cụ nhỏ cho đúng loại phần tử đó; phím tắt Ctrl+D / Delete vẫn hoạt động

## 53. Nút bấm / nút icon cuộn trong trang (xem cách chọn vị trí ở mục 54–55)

- [ ] Chọn nút bấm (hoặc nút icon) → bảng thuộc tính có "Khi nhấn": **Mở đường dẫn** / **Cuộn tới vị trí**
- [ ] "Mở đường dẫn" hoạt động như cũ (đường dẫn + "Mở trong tab mới"); nút cũ đã có link vẫn ở chế độ này
- [ ] Xem trước: bấm nút → trang **cuộn mượt** tới vị trí đã chọn; trình chỉnh sửa không bị đổi trang / thoát ra
- [ ] Xem trước: nút có link trống ("#") bấm không làm gì, không bị nhảy về trang chủ
- [ ] Trang **đã xuất bản** (cần deploy lại backend): bấm nút cuộn mượt, thanh địa chỉ không đổi; tick "Mở trong tab mới" không ảnh hưởng tới nút cuộn
- [ ] Nhân bản nút → bản sao cuộn tới cùng vị trí; đổi lại "Mở đường dẫn" → ô đường dẫn trống để nhập

## 54. Chấm một vị trí trên trang làm điểm cuộn tới

- [ ] Nút bấm / nút icon → bấm **"Cuộn tới vị trí"** (hoặc sau đó bấm **"Chấm vị trí trên trang"**) → nút đổi thành "Bấm lên trang để chọn… (Esc để huỷ)", thanh công cụ nhỏ ẩn, con trỏ thành dấu +
- [ ] Rê chuột trên trang → đường gạch cam chạy theo, nhãn "Cuộn tới đây · cách đỉnh …px"; cuộn vùng làm việc để chấm ở phần dưới trang được
- [ ] Bật hít (nam châm): rê gần mép trên một phần tử → đường chuyển **xanh lá**, ghi "(bám mép phần tử)" và dính đúng mép; tắt hít → không dính
- [ ] Bấm → chọn xong: ô số "Vị trí (cách đỉnh trang)" hiện đúng số px, sửa tay được; trên trang hiện đường gạch cam "Nút này cuộn tới đây"
- [ ] Esc hoặc bấm lại nút khi đang chấm → huỷ, không đổi gì; chọn phần tử khác / mở Xem trước cũng huỷ
- [ ] Bỏ chọn nút → đường gạch cam biến mất; chọn lại → hiện lại đúng chỗ
- [ ] Xem trước: bấm nút → cuộn mượt tới đúng vị trí đã chấm (vị trí đó nằm ở mép trên màn hình, trừ khi đã tới cuối trang)
- [ ] Trang **đã xuất bản** (cần deploy lại backend): cuộn tới đúng vị trí trên cả máy tính và điện thoại (trang thu nhỏ vẫn đúng chỗ); thanh địa chỉ không đổi
- [ ] Ctrl+Z sau khi chấm → trở lại đích cũ

## 55. Bỏ cuộn tới phần tử — chỉ còn cuộn tới vị trí đã chấm

- [ ] "Khi nhấn" chỉ còn **Mở đường dẫn** / **Cuộn tới vị trí**; không còn danh sách "Cuộn tới" (Đầu trang / các phần tử)
- [ ] Bấm "Cuộn tới vị trí" → **vào ngay chế độ chấm** trên trang (đường gạch cam theo chuột); Esc → huỷ chấm, nút vẫn ở chế độ cuộn với vị trí 0px (đầu trang)
- [ ] Muốn cuộn về đầu trang → nhập 0 vào ô "Vị trí (cách đỉnh trang)"
- [ ] Nút tạo trước bản này đang cuộn tới "Đầu trang" hoặc một phần tử → vẫn cuộn đúng ở Xem trước / trang xuất bản; bảng thuộc tính hiện nó là vị trí tương ứng (0px, hoặc mép trên phần tử) kèm đường gạch cam; sửa số / chấm lại → chuyển sang vị trí mới

## 56. Mẫu "Portfolio – Poster pastel"

- [ ] Trang chủ → "Tạo trang mới" có mẫu **Portfolio – Poster pastel** (đứng đầu danh sách mẫu)
- [ ] Phần đầu giống poster: nền chuyển cam đào → hồng, chữ "PORT FOLIO" lớn màu xám đậm, khung ảnh trắng có thanh hồng phía trên và thanh hồng → xanh ngọc bên trái, ảnh chân dung, thẻ hồng bán trong suốt đè góc ảnh với "XIN CHÀO, TÔI LÀ / MAI ANH / NGUYỄN" (đủ dấu ngã), hai cột chấm tròn
- [ ] Các phần tiếp theo cùng tông: Về mình (3 con số), Dịch vụ (3 thẻ), Dự án (ảnh trên nền lệch màu), Kinh nghiệm (dòng thời gian), khối Liên hệ chuyển màu, mạng xã hội, chân trang
- [ ] Tạo trang từ mẫu → sửa chữ, đổi ảnh chân dung (Ảnh → Tải ảnh lên), đổi màu được như trang thường
- [ ] Xem trước và xuất bản → hiển thị giống trong trình chỉnh sửa

## 57. Mẫu "Portfolio – Bìa tạp chí đỏ rượu"

- [ ] Trang chủ → "Tạo trang mới" có mẫu **Portfolio – Bìa tạp chí đỏ rượu** (đứng đầu danh sách mẫu)
- [ ] Phần đầu kiểu bìa tạp chí: nền đỏ rượu, chữ **PORTFOLIO** trắng khổng lồ, ảnh chân dung hình vòm đè lên chân chữ, tên "KHÁNH LINH" dưới góc phải tiêu đề, ảnh nhỏ viền trắng bên trái, đoạn giới thiệu chữ hoa nhỏ góc trái dưới, "NHÀ SÁNG TẠO / THÁNG 8 / 2026" góc phải dưới
- [ ] Các tiêu đề font Anton (NHÌN THẾ GIỚI QUA MÀU SẮC, MÌNH LÀM GÌ, TÁC PHẨM CHỌN LỌC, LIÊN HỆ) hiển thị **đủ dấu**, không bị cắt
- [ ] Phần thân nền kem: Về mình (3 con số), 3 thẻ dịch vụ đỏ rượu, lưới 4 dự án có ảnh + tên, khối Liên hệ đỏ rượu với nút email và mạng xã hội
- [ ] Tạo trang từ mẫu → đổi ảnh trong hình vòm (chọn hình → "Đổi ảnh" hoặc "Chỉnh ảnh" để kéo lại khung), sửa chữ được
- [ ] Xem trước và xuất bản → hiển thị giống trong trình chỉnh sửa

## 58. Nhóm "Trang trí": chấm mực, loang màu nước, vệt cọ, văng sơn…

- [ ] Bảng element bên trái có nhóm **Trang trí (10)**: Chấm mực, Loang màu nước, Vệt cọ, Văng sơn, Bút highlight, Mũi tên vẽ tay, Vòng khoanh, Lấp lánh, Băng dính washi, Lưới chấm bi — mỗi ô có hình xem trước nhỏ
- [ ] Bấm hoặc kéo thả từng mẫu vào trang → hiện đúng hình; bảng "Lớp" ghi đúng tên mẫu, có icon giọt mực
- [ ] Thanh công cụ nhỏ: **Màu** (đơn sắc hoặc chuyển màu — chuyển màu trải đều trên cả hình), **Tạo hình khác** (vẽ lại nét mới, giữ màu/kích thước; không có ở Lưới chấm bi), nút **Hoà trộn**, Độ mờ, Nhân bản, Xoá; Mũi tên / Vòng khoanh có thêm **Độ dày nét**
- [ ] Bật **Hoà trộn**: đặt Bút highlight / Loang màu nước đè lên chữ hoặc ảnh → chữ/ảnh bên dưới vẫn hiện rõ như mực in lên (không bị che); tắt → che bình thường
- [ ] Bảng thuộc tính → mục "Trang trí": đổi **Kiểu** sang mẫu khác; Văng sơn có **Mật độ**, Lưới chấm bi có **Khoảng cách** + **Cỡ chấm**, Băng dính có **Hoạ tiết** (Sọc chéo / Chấm bi / Trơn); không còn mục "Nền & viền"
- [ ] Kéo góc co giãn → hình vẽ lại theo khung mới, không bị méo nét; xoay / lật được
- [ ] Mỗi hình giữ nguyên nét vẽ sau khi lưu, mở lại, Xem trước, ảnh thu nhỏ ở trang chủ và trang **đã xuất bản** (cần deploy lại backend)
- [ ] Nhiều hình trang trí cùng dùng màu chuyển trên một trang → không hình nào bị lẫn màu của hình khác

## 59. Chấm mực có 7 dạng vết mực

- [ ] Chọn một **Chấm mực** → thanh công cụ nhỏ có nút **Dạng vết mực** (biểu tượng thanh trượt) → bảng 7 ô có hình xem trước: Chấm tròn, Bắn tia, Chảy giọt, Phun xịt, Vệt giọt, Văng một phía, Mực khô; dạng đang dùng được tô màu
- [ ] Bấm từng dạng → hình trên trang đổi ngay, giữ màu / kích thước
  - Bắn tia: nhiều tia nhọn toả ra, có giọt ở đầu tia
  - Chảy giọt: mảng mực phía trên, các dòng chảy xuống thon dần, đầu dòng có giọt tròn
  - Phun xịt: mảng mực viền mờ, xung quanh lấm tấm bụi mực (đôi khi có một vệt chảy)
  - Vệt giọt: chuỗi giọt lớn → nhỏ theo đường cong (khung đứng → dọc, khung ngang → ngang)
  - Văng một phía: vết mực với các vệt dài văng về một bên + một vệt chảy dài xuống
  - Mực khô: mảng loang lổ có các lỗ trống nhỏ, mép sần
- [ ] "Tạo hình khác" với mỗi dạng → ra biến thể mới cùng dạng
- [ ] Đổi màu (kể cả chuyển màu), bật Hoà trộn, co giãn / xoay → vẫn đúng; lưu, mở lại, Xem trước, trang **đã xuất bản** (cần deploy lại backend) giống trong trình chỉnh sửa

## 60. Nhóm "Trang trí" để trống (thay cho mục 58–59 về bảng element)

- [ ] Bảng element bên trái vẫn có nhóm **Trang trí** với số lượng **0** và dòng "Chưa có mẫu trang trí nào."; không có nút phóng to / "Xem tất cả"
- [ ] Không còn cách thêm chấm mực, vệt cọ… mới từ bảng element (các bước "thêm từ bảng element" ở mục 58–59 bỏ qua)
- [ ] Thiết kế **đã có sẵn** hình trang trí (tạo trước bản này) → vẫn hiển thị đúng, chọn vào vẫn đổi màu / dạng vết mực / "Tạo hình khác" / hoà trộn được; Xem trước và trang xuất bản vẫn đúng

## 61. Vết mực thật lấy từ ink.jpg (16 vết)

- [ ] Nhóm **Trang trí** trong bảng element có **16** ô "Vết mực 1 … 16", mỗi ô là hình thu nhỏ của đúng vết đó trong ảnh `ink.jpg`
- [ ] Bấm / kéo thả một vết vào trang → hình giống hệt vết trong ảnh gốc (tia bắn, giọt, mép răng cưa), đúng tỉ lệ, cạnh dài 240px
- [ ] Thanh công cụ nhỏ: **Màu** (đơn sắc / chuyển màu), **Đổi vết mực** (bảng 16 vết, vết đang dùng được tô màu; chọn vết khác → giữ chiều rộng, chiều cao tự theo tỉ lệ vết mới), **Hoà trộn**, Độ mờ, Nhân bản, Xoá
- [ ] Phóng to rất lớn (VD 1000px) → nét vẫn sắc, không vỡ hạt
- [ ] Bật Hoà trộn và đặt vết mực đè lên chữ / ảnh → nội dung bên dưới vẫn thấy rõ
- [ ] Lưu, mở lại, Xem trước, ảnh thu nhỏ trang chủ, trang **đã xuất bản** (cần deploy lại backend) → vết mực hiển thị giống trong trình chỉnh sửa
- [ ] (Bản quyền) Nếu dùng giấy phép miễn phí của Freepik: trang web xuất bản có dùng vết mực cần ghi nguồn "Designed by starline / Freepik"

## 62. Vết mực là một element duy nhất, đổi được nhiều hình dạng

- [ ] Nhóm **Trang trí** chỉ còn **1** ô **Vết mực** (thay cho 16 ô ở mục 61)
- [ ] Thêm Vết mực vào trang → chọn nó → **Đổi vết mực** trên thanh công cụ nhỏ → chọn được đủ 16 hình dạng; mỗi lần đổi giữ màu, hoà trộn, chiều rộng (chiều cao theo tỉ lệ hình mới)
- [ ] Vết mực đã thêm theo cách cũ (từ 16 ô) vẫn hiển thị và đổi hình được như thường

## 63. Mẫu "Portfolio – Mực đỏ" (kết hợp vết mực)

- [ ] Trang chủ → "Tạo trang mới" có mẫu **Portfolio – Mực đỏ** (đứng đầu danh sách mẫu)
- [ ] Phần đầu: tên **NGUYỄN MINH TRANG** đỏ đậm (đủ dấu), "VỀ TÔI" + đoạn giới thiệu + danh sách chữ đỏ, nút "Liên hệ với tôi"; bên phải ảnh chân dung khung vòm đặt trên **vết mực đỏ thật**, có giọt mực vương và một vết mực in đè (hoà trộn) lên góc ảnh; vết mực không đè lên chữ tên
- [ ] Bên dưới: 3 con số trên vết mực nhạt, 3 thẻ dịch vụ có icon trên chấm mực đỏ, 3 dự án có giọt mực in lên góc ảnh, dòng thời gian kinh nghiệm với chấm mực, khối liên hệ chữ trắng nằm gọn trong vết mực tròn lớn, mạng xã hội + chân trang (có ghi nguồn vết mực starline / Freepik)
- [ ] Tạo trang từ mẫu → chọn từng vết mực: đổi màu, **Đổi vết mực**, hoà trộn được; đổi ảnh chân dung được
- [ ] Xem trước và xuất bản → hiển thị giống trong trình chỉnh sửa

## 64. 9 mẫu theo bộ slide trong src/assets/tl

Mỗi mẫu là một trang dài gồm 8–9 phần, mỗi phần tương ứng một slide trong ảnh mẫu (1200 × 750).

- [ ] Trang chủ → "Tạo trang mới" có đủ 9 mẫu (đứng đầu danh sách):
  - [ ] **Nâu rượu & nét vẽ tay** (mau-portfolio-1): nền be, chữ nâu rượu cỡ lớn, ảnh đen trắng, mũi tên / trái tim vẽ tay
  - [ ] **Hồng phấn cổ điển** (mau-portfolio-2): nền hồng phấn, chữ có chân, khung chữ tím hồng, "Let's work together" chữ viết tay
  - [ ] **Đen trắng chữ lớn** (mau-portfolio-3): nền đen, chữ trắng khổng lồ, chữ EDUCATION xoay dọc, nhãn viền bo tròn
  - [ ] **Cam đỏ năng động** (mau-portfolio-4): xen kẽ nền sáng / đen, chữ cam đỏ, chữ viết tay "project", "together"
  - [ ] **Bìa tạp chí đỏ rượu** (mau-portfolio-5): đỏ rượu – xanh lá – kem, đủ 9 phần (thay bản chỉ có phần đầu ở mục 57)
  - [ ] **Mực đỏ** (content-marketing): nền trắng, chữ đỏ, vết mực đỏ thật, đủ 9 phần (thay bản ở mục 63)
  - [ ] **Marketing sắc màu** (marketing): xen kẽ sáng / xám đậm, tiêu đề xanh lá – đỏ mận – xanh dương – vàng – cam, icon quả địa cầu
  - [ ] **Xanh ngọc mạng xã hội** (social-media): nền bạc hà với mảng cong nhạt, chữ xanh ngọc đậm (8 phần)
  - [ ] **Thiết kế đồ hoạ cam xám** (thiet-ke-do-hoa): bìa chữ nhạt lặp lại, tia bắn cam sau ảnh, dòng thời gian, lời khen khách hàng, case study quán cà phê
- [ ] Mỗi mẫu: tiêu đề lớn không bị cắt / tràn dòng, chữ tiếng Việt đủ dấu, ảnh hiện đủ (không ô trống)
- [ ] Tạo trang từ mẫu → sửa chữ, đổi ảnh, đổi màu, mũi tên / vết mực / tia bắn chỉnh được như phần tử trang trí
- [ ] Xem trước và xuất bản → hiển thị giống trong trình chỉnh sửa; cuộn qua từng phần mượt, không có khoảng trắng lạ giữa các phần

## 65. Trang chủ bố cục mới: cột trang đã lưu + trình chiếu mẫu

- [ ] Bên trái là một **cột nhỏ**: trên cùng nút **Trang trắng** (khung nét đứt), dưới là **Trang đã lưu x/3** dạng danh sách gọn (ảnh nhỏ, tên, giờ sửa, nhãn Đang xuất bản / Chờ duyệt / Bị từ chối, link trang đang chạy); rê chuột → hiện nút xoá
- [ ] Bấm một trang đã lưu → mở trình chỉnh sửa; bấm **Trang trắng** → tạo trang trống
- [ ] Phần còn lại là **danh sách mẫu** 2 cột, cuộn lên xuống (xem mục 82)
- [ ] Đủ 3/3 trang → nút Trang trắng và "Dùng mẫu này" bị khoá, cột trái hiện nhắc xoá bớt trang
- [ ] Thanh dung lượng góc trái dưới không che danh sách trang
- [ ] Điện thoại: cột trang đã lưu nằm trên, danh sách mẫu bên dưới

## 66. Hỏi link Threads khi gửi yêu cầu xuất bản (chỉ lần đầu)

- [ ] Tài khoản **chưa từng** gửi xuất bản: mở "Xuất bản" → bước 3 **Liên hệ Threads** có ô "Link tài khoản Threads"; nút "Tiếp tục" bị khoá cho tới khi nhập link hợp lệ (xem mục 67)
- [ ] Nhập sai (VD link Instagram, có dấu cách) → hiện "Link chưa đúng…"; nhập `@tentaikhoan`, `threads.net/@ten`, hoặc link một bài đăng → hiện "Sẽ lưu là https://www.threads.com/@ten" và cho gửi
- [ ] Gửi xong → trong Firestore, `users/{uid}` có trường **threadsUrl**; yêu cầu xuất bản có `contact.threadsUrl`
- [ ] Các lần xuất bản sau (kể cả trang khác, sau khi đăng xuất / đăng nhập lại) → **không hỏi lại**, gửi được ngay
- [ ] Gọi thẳng API không kèm link khi chưa có link đã lưu → máy chủ từ chối với lời nhắc nhập link Threads
- [ ] Trang **Quản trị** → danh sách yêu cầu xuất bản: mỗi yêu cầu có dòng "Liên hệ: Threads @ten", bấm mở đúng trang Threads
- [ ] (Cần deploy lại backend)

## 67. Xuất bản theo từng bước (hộp thoại lớn, chữ to)

- [ ] Bấm **Xuất bản** → hộp thoại lớn, chữ to, thanh 4 bước: **1 Tiêu đề & icon → 2 Tên miền → 3 Liên hệ Threads → 4 Xác nhận**; bước đang làm tô tím, bước xong có dấu ✓ và đường nối tô màu
- [ ] **Bước 1**: sửa tiêu đề web (xoá trống → "Tiếp tục" bị khoá: "Hãy nhập tiêu đề web"); tải / đổi / bỏ icon web ngay trong bước (có thanh tiến trình); thay đổi áp dụng ngay vào trang (mục Website ở bảng Cài đặt trang cũng đổi theo)
- [ ] **Bước 2**: chưa có tên miền → ô chọn tên miền, "Tiếp tục" bị khoá tới khi chọn xong; đã có → hiện tên miền to, nút "Đổi tên miền" (chờ duyệt như cũ)
- [ ] **Bước 3**: chưa lưu Threads → ô nhập bắt buộc; đã lưu → chỉ hiện link đã lưu, bấm "Tiếp tục" luôn
- [ ] **Bước 4**: tóm tắt tiêu đề + icon, tên miền, Threads (mỗi dòng có "Sửa" để quay về bước đó); cảnh báo nếu tên miền đang chạy trang khác; nút **Gửi yêu cầu xuất bản** (hoặc "Gửi bản cập nhật để duyệt" nếu trang đang chạy)
- [ ] "Quay lại" về bước trước; bấm số bước trên thanh để nhảy về bước đã qua (không nhảy tới bước chưa làm được)
- [ ] Trang đang **chờ duyệt / đang triển khai** → mở hộp thoại vào thẳng bước 4 với trạng thái, có nút "Huỷ yêu cầu xuất bản"
- [ ] Nút ✕ / Esc / bấm ra ngoài → đóng; điện thoại: thanh bước chỉ hiện số, vẫn dùng được

## 68. 9 mẫu theo bộ slide gói gọn trong 1 màn hình (thay mục 64)

- [ ] 9 mẫu (Nâu rượu & nét vẽ tay, Hồng phấn cổ điển, Đen trắng chữ lớn, Cam đỏ năng động, Bìa tạp chí đỏ rượu, Mực đỏ, Marketing sắc màu, Xanh ngọc mạng xã hội, Thiết kế đồ hoạ cam xám) giờ chỉ cao **800px – vừa một màn hình**, không cần cuộn
- [ ] Mỗi mẫu vẫn giữ chất riêng của bộ slide gốc (chữ PORTFOLIO khổng lồ, ảnh đè lên chữ, mảng màu, vết mực / mũi tên / chữ viết tay) và đủ các phần: tên + giới thiệu, kỹ năng, học vấn / kinh nghiệm, dự án (ảnh nhỏ), liên hệ
- [ ] Không chữ nào bị cắt / tràn dòng (đặc biệt chữ PORTFOLIO, CONTACT ME, tên có dấu)
- [ ] Trang chủ → khung trình chiếu mẫu hiển thị trọn cả mẫu, gần như không cần cuộn
- [ ] Tạo trang từ mẫu → sửa chữ, đổi ảnh, đổi màu vết mực / mũi tên được; Xem trước và xuất bản giống trình chỉnh sửa

## 69. Giải thích ngắn vì sao cần link Threads

- [ ] Bước 3 "Liên hệ Threads" có khung xanh lá, icon khiên, tiêu đề to **"Vì sao cần link Threads?"** và một câu: "Để chúng tôi nhắn tin báo cho bạn khi trang web đã hoàn thiện. Chỉ cần link trang cá nhân, không cần mật khẩu."
- [ ] Khung hiện cả khi đã lưu Threads trước đó (bước 3 chỉ hiển thị link đã lưu)
- [ ] Chữ đủ to, dễ đọc; trên điện thoại khung không bị tràn

## 70. Thông báo đã gửi yêu cầu xuất bản

- [ ] Bước 4 bấm **Gửi yêu cầu xuất bản** (hoặc "Gửi bản cập nhật để duyệt") thành công → hộp thoại chuyển sang thông báo: dấu ✓ xanh lá, **"Đã gửi yêu cầu thành công!"**, "Yêu cầu xuất bản đang chờ quản trị viên xử lý…", nút **OK**
- [ ] Bấm **OK** (hoặc Enter vì nút OK được chọn sẵn, Esc, bấm ra ngoài) → đóng hộp thoại; mở lại "Xuất bản" → vào thẳng bước 4 với trạng thái "Đang chờ quản trị viên duyệt"
- [ ] Gửi lỗi (mất mạng, chưa lưu được…) → không hiện thông báo thành công, lỗi hiện ngay trong hộp thoại như cũ

## 71. Hạn dùng trang web: dùng thử 3 ngày, gia hạn 3 / 6 / 12 tháng

- [ ] Admin duyệt xuất bản một trang → trang có hạn **3 ngày dùng thử** (Quản trị → tab **Trang web & hạn dùng**: nhãn vàng "Dùng thử · Còn 3 ngày (đến …)")
- [ ] Tab **Trang web & hạn dùng**: dòng tổng (số trang đang chạy / sắp hết hạn / đã hết hạn); mỗi trang có tên miền (link), chủ trang + email, link Threads, nhãn hạn dùng (xanh: còn lâu, vàng: ≤ 3 ngày, đỏ: đã hết hạn), lịch sử gia hạn; xếp trang sắp hết hạn lên đầu
- [ ] Người dùng đã thanh toán → bấm **+3 tháng / +6 tháng / +12 tháng** → hộp xác nhận ghi rõ ngày hết hạn mới → OK → thông báo "Đã gia hạn … đến …", nhãn cập nhật; gia hạn được cộng từ hạn hiện tại (hoặc từ hôm nay nếu đã hết hạn)
- [ ] Quá hạn mà chưa gia hạn → trong vòng ~10 phút (hoặc bấm **"Tạm ngưng các trang hết hạn ngay"**) mở tên miền thấy trang "⏳ Trang web đã hết hạn … liên hệ quản trị viên để gia hạn"; tên miền và thiết kế vẫn giữ
- [ ] Gia hạn một trang **đã hết hạn** → trang tự bật lại đúng bản đã duyệt (chờ vài giây để Vercel triển khai)
- [ ] Trang đã trả tiền mà người dùng gửi **bản cập nhật** → sau khi duyệt vẫn giữ nguyên ngày hết hạn đã trả (không bị về 3 ngày)
- [ ] Người dùng: hộp thoại Xuất bản (bước 4) hiện "Hạn dùng: Còn X ngày (đến …)", khi đang dùng thử có lời nhắc thanh toán để gia hạn; trang hết hạn hiện khung đỏ "Trang web đã hết hạn"; màn hình "Đã gửi yêu cầu" nhắc dùng thử 3 ngày
- [ ] Trang chủ: trang sắp hết hạn có nhãn vàng "Còn X ngày" / "Hết hạn hôm nay", trang hết hạn có nhãn đỏ "Đã hết hạn"
- [ ] Trang xuất bản **trước** khi có tính năng này hiện "Chưa đặt hạn" và không tự hết hạn; admin bấm gia hạn một lần để đặt hạn cho nó
- [ ] (Cần deploy lại backend; máy chủ phải chạy liên tục để tự kiểm tra hết hạn mỗi 10 phút)

## 72. Bộ lọc ở trang Quản trị

Mỗi tab có thanh lọc: ô tìm kiếm (không cần gõ dấu), chọn khoảng thời gian (Hôm nay / 7 ngày / 30 ngày / Tháng này / Tuỳ chọn từ ngày → đến ngày), sắp xếp, chip trạng thái, dòng "Hiển thị X / Y" và nút **Xoá bộ lọc**.

- [ ] **Duyệt xuất bản**: chip Chờ duyệt / Đã duyệt / Đã từ chối; lọc theo **ngày gửi**; tìm theo tên trang, người gửi, email, tên miền, Threads; mặc định xếp **gửi lâu nhất trước** (duyệt theo thứ tự)
- [ ] **Trang web & hạn dùng**: chip có số lượng — Tất cả, Đang chạy, Đang dùng thử, Đã gia hạn, Sắp hết hạn (≤ 3 ngày), Đã hết hạn, Chưa đặt hạn; lọc theo **ngày hết hạn** (Trong 3 / 7 / 30 ngày tới, Đã qua, Tuỳ chọn); tìm theo tên miền, tên trang, chủ trang, email; mặc định **hết hạn sớm nhất trước**
- [ ] **Đổi tên miền**: chip trạng thái, lọc ngày gửi, tìm theo người gửi / tên miền cũ / mới
- [ ] **Người dùng**: chip Quản trị viên / Người dùng (có số lượng), lọc theo **đăng nhập gần nhất**, tìm theo tên / email
- [ ] **Mẫu đã tạo**: tìm theo tên / mô tả mẫu
- [ ] Không có kết quả → "Không có … khớp bộ lọc."; bấm **Xoá bộ lọc** → về mặc định
- [ ] Chọn "Tuỳ chọn…" → hiện 2 ô ngày; "Đến ngày" tính trọn cả ngày đó

## 73. Huỷ hạn dùng (đưa hạn về 0) ở trang Quản trị

- [ ] Tab **Trang web & hạn dùng**: trang đang còn hạn (dùng thử hoặc đã gia hạn) có nút đỏ **Huỷ hạn dùng**; trang đã hết hạn / chưa đặt hạn không có nút này
- [ ] Bấm → hộp xác nhận ghi rõ huỷ "thời gian dùng thử" hoặc "hạn dùng còn lại (đến …)" và cảnh báo trang sẽ tạm ngưng NGAY → OK → thông báo "Đã huỷ hạn dùng của … Trang đã tạm ngưng."; nhãn chuyển đỏ "Đã hết hạn"
- [ ] Mở tên miền (chờ vài giây) → thấy trang "Trang web đã hết hạn"; người dùng thấy "Đã hết hạn" ở trang chủ và hộp thoại Xuất bản
- [ ] Dòng **Lịch sử** ghi "Huỷ hạn (ngày)" cùng các lần "+X tháng"
- [ ] Sau khi huỷ, bấm **+3 / +6 / +12 tháng** → trang bật lại, hạn tính từ hôm nay
- [ ] (Cần deploy lại backend)

## 74. Icon logo ứng dụng Zalo (đổi màu được)

- [ ] Chọn nút icon → "Đổi icon" (thanh công cụ nhỏ) → nhóm Mạng xã hội có **Zalo (logo ứng dụng)** cạnh icon Zalo nét; tìm "zalo" ra cả hai
- [ ] Logo là ô vuông tô màu icon, bong bóng chat khoét rỗng (lộ màu nền nút) và chữ "Zalo" bên trong
- [ ] **Đổi màu icon** được như icon thường (kể cả chuyển màu): màu icon xanh #0068FF + nền trắng → giống logo Zalo thật; màu trắng + nền xanh → logo đảo màu
- [ ] Với logo này bảng thuộc tính không có "Độ dày nét" (vẫn có Cỡ icon); đổi lại icon thường → "Độ dày nét" hiện lại
- [ ] Nhiều nút logo Zalo khác màu trên cùng trang → mỗi nút đúng màu, không lẫn nhau
- [ ] Gắn link (VD `https://zalo.me/0901234567`) → Xem trước / trang **đã xuất bản** (cần deploy lại backend) hiển thị đúng, bấm mở Zalo

## 75. Mọi template mẫu đều có icon liên hệ Facebook · Zalo · Threads

- [ ] Nhóm Mạng xã hội có icon mới **Threads** (hình chữ @ cuộn); tìm "threads" ra icon này, đổi màu / độ dày nét như icon thường
- [ ] Trang chủ → lướt qua cả 14 template mẫu: template nào cũng có hàng icon **Facebook, Zalo (logo), Threads** ở khu liên hệ, không đè lên chữ/ảnh khác
- [ ] 5 template dài (Pastel, Designer, Developer, Photographer, Creator): hàng mạng xã hội là Facebook · Zalo · Threads + 1 icon riêng (Instagram/LinkedIn/GitHub/TikTok)
- [ ] 9 template một trang (Doodle, Blush, Noir, Avery, Maroon, Ink đỏ, My, Teal, Adora): 3 icon nằm cạnh email/số điện thoại, màu hợp với template
- [ ] Mở một template → chọn từng icon → đã gắn sẵn link mẫu (facebook.com/…, zalo.me/…, threads.com/@…), mở tab mới; sửa thành link thật được
- [ ] Xem trước trang tạo từ template → bấm icon mở đúng link
- [ ] Các web **đã xuất bản trước đó** và các trang đã lưu của user **không thay đổi** (không tự có thêm icon)

## 76. Hiệu ứng chuyển động cho thành phần (xoay tròn quanh tâm…)

- [ ] Chọn một thành phần bất kỳ (chữ, nút, icon, ảnh, hình, trang trí…) → thanh công cụ nhỏ có nút **Chuyển động** (quả bóng có vệt gió), mặc định "Không" (xem mục 77)
- [ ] Chọn **Xoay tròn** → thành phần xoay quanh tâm của nó ngay trong khung soạn thảo; đổi **Chiều xoay** Thuận/Ngược chiều → đổi hướng
- [ ] Thử lần lượt: Lật xoay (3D), Phập phồng, Nhịp tim, Bay lơ lửng, Nảy, Lắc lư, Rung, Nhấp nháy → mỗi kiểu chạy lặp mãi
- [ ] **Mỗi vòng** (giây): số nhỏ → nhanh hơn, số lớn → chậm hơn; **Bắt đầu sau**: hiệu ứng chờ đúng số giây rồi mới chạy
- [ ] Thành phần đã có **Góc xoay** / lật gương vẫn giữ góc đó, hiệu ứng cộng thêm lên trên
- [ ] Kéo, đổi cỡ, xoay thành phần đang chuyển động vẫn bình thường; khi gõ chữ (bấm đúp) hoặc chỉnh ảnh trong hình thì thành phần đứng yên, xong lại chạy tiếp
- [ ] Hoàn tác (Ctrl+Z) bỏ được thay đổi hiệu ứng; nhân bản thành phần thì bản sao giữ hiệu ứng
- [ ] Xem trước và trang **đã xuất bản** (cần deploy lại backend) chạy hiệu ứng giống khung soạn thảo; trang không dùng hiệu ứng thì không thay đổi gì
- [ ] Máy bật chế độ "giảm chuyển động" (Windows: Cài đặt → Trợ năng → Hiệu ứng hình ảnh → tắt Hiệu ứng động) → trang xuất bản đứng yên

## 77. Chuyển động trên thanh công cụ nhỏ

- [ ] Chọn thành phần → thanh công cụ nhỏ có nút **Chuyển động** (quả bóng có vệt gió) cạnh nút Độ mờ; bảng thuộc tính bên phải **không còn** mục Chuyển động
- [ ] Bấm nút → bảng hiện 10 ô: Không, Xoay tròn, Lật xoay (3D), Phập phồng, Nhịp tim, Bay lơ lửng, Nảy, Lắc lư, Rung, Nhấp nháy; mỗi ô có hình nhỏ đang chạy đúng kiểu đó
- [ ] Bấm một ô → thành phần chạy hiệu ứng ngay, ô đó được tô đậm, nút Chuyển động trên thanh sáng lên (kể cả khi đã đóng bảng)
- [ ] Thanh trượt **Mỗi vòng** (0.2–20 giây) và **Bắt đầu sau** (0–10 giây) đổi tốc độ / độ trễ ngay khi kéo; kéo xong bấm Ctrl+Z một lần là về giá trị cũ
- [ ] Xoay tròn / Lật xoay có thêm nút **Thuận chiều / Ngược chiều**; các kiểu khác không có
- [ ] Chọn **Không** → thành phần đứng yên, thanh trượt ẩn đi, nút hết sáng
- [ ] Bấm ra ngoài → bảng đóng

## 78. Template "Âm nhạc – Đĩa than xoay" + chuyển động Sóng toả / Nhảy theo nhạc

- [ ] Trang chủ → template **Âm nhạc – Đĩa than xoay** đứng đầu danh sách mẫu
- [ ] Mở template: đĩa than có rãnh, **avatar giữa đĩa xoay tròn** cùng đĩa (8 giây/vòng); vệt sáng trên đĩa và cần đọc đĩa đứng yên
- [ ] Quanh đĩa: vòng **sóng nhạc** hồng/tím nhảy liên tục — đây là thành phần **Âm thanh** (kiểu Vòng tròn), xem mục 79
- [ ] Từ đĩa có 3 **vòng sóng âm toả ra** rồi mờ dần, nối tiếp nhau
- [ ] Bấm vào avatar → đổi ảnh được (ảnh mới vẫn xoay); đổi tên, chữ, link nút "Nghe nhạc" / "Mời biểu diễn", icon Facebook · Zalo · Threads · TikTok
- [ ] Chọn một vòng sóng toả → nút Chuyển động trên thanh công cụ sáng, bảng hiện đúng hiệu ứng **Sóng toả**
- [ ] Bảng Chuyển động có thêm 2 ô mới: **Sóng toả**, **Nhảy theo nhạc** (bảng xếp 4 cột); dùng được cho thành phần bất kỳ
- [ ] Xem trước và trang xuất bản (cần deploy lại backend) chạy hiệu ứng giống trong khung soạn thảo

## 79. Âm thanh: "Luôn nhảy" và "Khoảng trống giữa" (sóng nhạc của template Đĩa than)

- [ ] Template Đĩa than → chọn vòng sóng quanh đĩa → bảng bên phải là **Âm thanh**, kiểu **Vòng tròn**, có tích **Luôn nhảy (cả khi chưa phát nhạc)**, chưa có tệp
- [ ] Chưa có tệp mà sóng vẫn nhảy theo nhịp mẫu (trong khung soạn thảo, Xem trước và trang xuất bản); không có nút phát
- [ ] **Tải tệp nhạc lên** → nút phát hiện ở giữa đĩa (trên avatar); bấm phát → sóng nhảy theo nhạc thật; tạm dừng → sóng vẫn nhảy theo nhịp mẫu
- [ ] Bỏ tích "Luôn nhảy" → khi dừng nhạc sóng lặng xuống như trước; nếu không có tệp thì hiện ô "Âm thanh – Tải tệp âm thanh…" trong khung soạn thảo
- [ ] Kiểu Vòng tròn / Nhịp đập có thanh **Khoảng trống giữa** (10–40%): kéo lên → lỗ giữa rộng ra, sóng ôm ra ngoài; kiểu khác không có thanh này
- [ ] Để chọn avatar (nằm dưới lớp âm thanh), chọn trong bảng **Lớp** rồi đổi ảnh
- [ ] Thành phần Âm thanh cũ (không tích Luôn nhảy) hoạt động y như trước

## 80. Tự động phát nhạc trên trang đã xuất bản (sửa lỗi điện thoại)

Lưu ý: trình duyệt luôn chặn nhạc có tiếng khi khách vừa mở trang và chưa bấm gì. Nhạc sẽ bắt đầu ở lần chạm/bấm/gõ phím đầu tiên, không thể phát trước đó. Cần **deploy lại backend** rồi **xuất bản lại trang** thì trang mới được sửa.

- [ ] Tích "Tự động phát khi mở trang" → xuất bản → mở trang ở tab ẩn danh: nhạc chưa phát, **nút phát nhấp nháy vòng sáng** gợi ý
- [ ] Máy tính: bấm vào chỗ bất kỳ trên trang (không phải nút phát) → nhạc phát ngay, nút thôi nhấp nháy, đổi thành nút Tạm dừng
- [ ] **Điện thoại** (Android Chrome, iPhone Safari): chạm vào chỗ bất kỳ → nhạc phát ngay ở lần chạm đầu (trước đây chạm mãi không phát)
- [ ] Chạm thẳng vào nút phát → phát bình thường (không bị phát rồi dừng ngay)
- [ ] Nhấn một phím (VD phím cách) thay vì bấm chuột → nhạc cũng phát
- [ ] Xem trước trong trình chỉnh sửa vẫn phát ngay như cũ

## 81. Template "Meme – Trang chủ cợt nhả"

- [ ] Trang chủ → template **Meme – Trang chủ cợt nhả** đứng đầu danh sách mẫu
- [ ] Mở template: nền vàng chói, băng đỏ trên cùng "TRANG WEB ĐANG XÂY DỰNG…" **nhấp nháy**
- [ ] Tiêu đề WordArt "TUẤN ĐẸP TRAI" màu cầu vồng, nghiêng và **lắc lư**; không đè lên dòng "Xin chào" hay đoạn giới thiệu
- [ ] Ảnh meme chó pug có dòng chú thích trắng + chữ "OK SẾP"; sticker "HOT!!!" phập phồng, "MỚI 100%" đập như nhịp tim, 😂 xoay tròn, 💯 nảy
- [ ] 4 thanh "Kỹ năng đặc biệt" dài đúng theo % (100, 99, 100, 7)
- [ ] Hộp thoại "Loi.exe" kiểu Windows 98; bấm "OK" / "Cũng OK" mở Zalo
- [ ] Nút "BẤM VÀO ĐÂY ĐỂ NHẬN IPHONE" **rung** liên tục, bấm mở Facebook
- [ ] Bộ đếm "000069" chữ xanh lá nhấp nháy; hàng icon Facebook · Zalo · Threads · TikTok bấm được
- [ ] Đổi tên, chữ, ảnh, link được như template thường; Xem trước và trang xuất bản chạy đủ hiệu ứng

## 82. Trang chủ: danh sách mẫu 2 cột, cuộn lên xuống

- [ ] Bên phải trang chủ có tiêu đề **Mẫu trang** + "N mẫu · bấm vào ảnh để xem toàn trang"; bên dưới là các mẫu xếp **2 mẫu mỗi hàng**
- [ ] Mỗi ô: ảnh màn hình đầu của mẫu, tên, mô tả (tối đa 2 dòng), nút **Dùng mẫu này**; rê chuột → viền ô sáng lên, góc ảnh hiện "Xem toàn trang"
- [ ] **Cuộn chuột** trong vùng mẫu → cuộn lên xuống xem hết các mẫu; cột trang đã lưu bên trái đứng yên
- [ ] Bấm vào **ảnh** một mẫu → mở khung xem **toàn trang** (cuộn được tới cuối mẫu dài), có tên, mô tả, nút Dùng mẫu này; bấm ✕, phím **Esc** hoặc bấm ra ngoài → đóng
- [ ] **Dùng mẫu này** (ở ô hoặc trong khung xem) → tạo trang từ mẫu và mở trình chỉnh sửa; đang tạo thì nút hiện "Đang tạo…"
- [ ] Đủ 3/3 trang → mọi nút Dùng mẫu này bị khoá
- [ ] Không còn nút ‹ › , hàng chấm và phím ← → chuyển mẫu như trước
- [ ] Màn hình hẹp / điện thoại: danh sách trang đã lưu ở trên, bên dưới là mẫu **1 cột**, ảnh rộng kín ô, không đè lên danh sách trang đã lưu

## 83. Admin ẩn / hiện mẫu cho người dùng

- [ ] Quản trị → tab **Mẫu đã tạo**: mỗi mẫu có nút tròn góc trái trên — xanh **"Đang hiện"** (có hình con mắt)
- [ ] Bấm nút → đổi thành xám **"Đang ẩn"** (mắt gạch chéo), ảnh + chữ của mẫu mờ đi; bấm lại → hiện lại. Lúc đang lưu nút hiện "Đang lưu…"
- [ ] Hàng lọc có **Tất cả / Đang hiện / Đang ẩn** kèm số lượng, số đổi ngay khi ẩn/hiện; bấm "Đang ẩn" → chỉ còn các mẫu đang ẩn
- [ ] Đăng nhập bằng tài khoản thường (hoặc tải lại trang chủ) → mẫu đang ẩn **không có** trong danh sách mẫu; mẫu hiện lại thì xuất hiện trở lại
- [ ] Trang người dùng đã tạo từ mẫu bị ẩn vẫn mở và sửa bình thường
- [ ] Bấm ảnh mẫu (kể cả mẫu đang ẩn) ở tab admin → vẫn xem trước được; nút xoá mẫu vẫn hoạt động
- [ ] Chạy lại `npm run seed:templates` ở backend → mẫu mẫu đang ẩn **vẫn giữ ẩn**

## 84. Gắn sao và nhãn cho trang web (tab Trang web & hạn dùng)

Cần **deploy lại backend** trước khi thử.

- [ ] Mỗi trang web có **ngôi sao** bên trái: bấm → sao vàng, cả dòng nền vàng nhạt; bấm lại → bỏ sao. Tải lại trang → vẫn giữ
- [ ] Nút **Nhãn** (bên phải mỗi dòng) → menu tick chọn: Cần liên hệ, Đã thanh toán, Khách VIP, Có vấn đề, Theo dõi; tick → nhãn màu hiện cạnh tên miền ngay; bấm ra ngoài hoặc Esc → đóng menu
- [ ] Bấm **×** trên một nhãn cạnh tên miền → bỏ nhãn đó
- [ ] Hàng **Đánh dấu:** dưới bộ lọc — Tất cả / ★ Gắn sao / từng nhãn, kèm số trang; bấm → chỉ còn các trang đó (dùng chung được với bộ lọc trạng thái + ô tìm kiếm)
- [ ] Menu Nhãn → **Quản lý nhãn…** → đổi tên, chọn màu, xoá nhãn (hỏi lại nếu đang gắn trên trang nào), **Thêm nhãn**; tên trống → nút Lưu bị khoá; Lưu → danh sách + màu cập nhật ngay, admin khác tải lại cũng thấy
- [ ] Xoá một nhãn đang gắn → nhãn biến mất khỏi các trang; đang lọc theo nhãn đó thì tự về "Tất cả"
- [ ] Mất mạng khi bấm sao / nhãn → trả về như cũ, hiện thông báo "Không lưu được đánh dấu…"
- [ ] Người dùng xuất bản lại (cùng trang hoặc trang khác) → sao và nhãn **vẫn giữ**
- [ ] Người dùng thường không thấy sao / nhãn ở đâu cả

## 85. Bỏ đăng nhập bằng Facebook

- [ ] Màn hình đăng nhập chỉ còn nút **Tiếp tục với Google**; không còn nút Facebook
- [ ] Bấm nút → hiện "Đang đăng nhập…", đăng nhập Google bình thường; đóng popup giữa chừng → không báo lỗi
- [ ] Tài khoản trước đây đã đăng nhập bằng Google vẫn vào được, thấy đủ trang đã lưu

## 86. Đổi tên web thành "Web Siêu Lỏ", lời giới thiệu đăng nhập gọn lại

- [ ] Tab trình duyệt hiện **"Web Siêu Lỏ — Thiết kế web kéo thả"**
- [ ] Màn hình đăng nhập: tiêu đề **Web Siêu Lỏ**, dưới là một dòng "Kéo thả để làm trang web của riêng bạn.", rồi nút Tiếp tục với Google
- [ ] Trang chủ: góc trái trên ghi **Web Siêu Lỏ**
- [ ] Template Designer / Developer: dòng cuối trang ghi "… bằng Web Siêu Lỏ"; không còn chỗ nào ghi "Kéo Thả Web"

## 87. Template "Thú cưng – Hồ sơ Boss mèo"

- [ ] Trang chủ → template **Thú cưng – Hồ sơ Boss mèo** đứng đầu danh sách mẫu
- [ ] Mở template: nền kem, tên "MÍT" chữ cam lớn, lời giới thiệu, ảnh mèo lớn trong khung vòm trên mảng màu đào
- [ ] Bóng chat "Meo~ 😽" bay lên xuống, tim hồng đập, dấu chân 🐾 bay nhẹ
- [ ] Thẻ **Thông tin cơ bản** (sinh nhật, cân nặng, giống, tiêm phòng, nơi ở, giờ ngủ), hai ô **Tui thích / Tui ghét**
- [ ] 3 ảnh polaroid nghiêng có chú thích viết tay
- [ ] Dưới cùng: "Thấy tui đi lạc? Gọi sen…" + số điện thoại + icon Facebook · Zalo · Threads bấm được
- [ ] Đổi ảnh vòm / polaroid thành ảnh mèo của mình, sửa tên, thông tin được như template thường

## 88. Template "Meme – Mọi thứ đều ổn 👍"

- [ ] Trang chủ → template **Meme – Mọi thứ đều ổn 👍** đứng đầu danh sách mẫu
- [ ] Nền xanh xám có chấm lưới và vệt mưa đen chéo kiểu truyện tranh; khung tiêu đề hồng viền đen "MỌI THỨ ĐỀU ỔN 👍" (đủ dấu)
- [ ] Bong bóng thoại trắng, 4 dòng tình hình (Deadline, Ví tiền, Ngủ, Crush) mỗi dòng có nhãn "ỔN 👍" hồng, hơi lệch nghiêng
- [ ] Khung hồng lớn viền đen bên phải có 👍 to nhảy nảy, nhãn "ỔN MÀ 👍" phía trên
- [ ] **Thả ảnh meme** (kéo tệp ảnh) vào khung hồng → ảnh lấp vào hình, viền đen vẫn giữ; xoá 👍 và hai vệt má hồng nếu không cần
- [ ] Nút đen "BẤM ĐỂ ĐƯỢC KHEN 👍" phập phồng, mở Facebook; icon Facebook · Zalo · Threads bấm được
