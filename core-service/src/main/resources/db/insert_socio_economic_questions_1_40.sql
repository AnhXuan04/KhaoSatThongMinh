-- Insert day du 45 cau hoi cho "Phieu dieu tra kinh te - xa hoi".
-- Cach dung: thay 123 bang id cua survey can them cau hoi.
-- Luu y: script nay chi INSERT, khong xoa cau hoi cu.

DO $$
DECLARE
    v_survey_id BIGINT := 123;
    v_question_id BIGINT;
BEGIN
    INSERT INTO questions (title, type, kind, required, question_order, survey_id)
    VALUES ('Tên đầy đủ của bạn là gì?', 'short_text', 'short_answer', TRUE, 1, v_survey_id)
    RETURNING id INTO v_question_id;

    INSERT INTO questions (title, type, kind, required, question_order, survey_id)
    VALUES ('Bạn là?', 'multiple_choice', 'multiple_choice', TRUE, 2, v_survey_id)
    RETURNING id INTO v_question_id;
    INSERT INTO options (text, option_order, question_id) VALUES
        ('Nam', 1, v_question_id),
        ('Nữ', 2, v_question_id);

    INSERT INTO questions (title, type, kind, required, question_order, survey_id)
    VALUES ('Bạn bao nhiêu tuổi?', 'multiple_choice', 'dropdown', TRUE, 3, v_survey_id)
    RETURNING id INTO v_question_id;
    INSERT INTO options (text, option_order, question_id) VALUES
        ('18-30', 1, v_question_id),
        ('31-40', 2, v_question_id),
        ('41-50', 3, v_question_id),
        ('51-60', 4, v_question_id),
        ('61-70', 5, v_question_id),
        ('71-80', 6, v_question_id),
        ('Trên 80', 7, v_question_id);

    INSERT INTO questions (title, type, kind, required, question_order, survey_id)
    VALUES ('Địa chỉ hộ gia đình của bạn?', 'short_text', 'paragraph', TRUE, 4, v_survey_id)
    RETURNING id INTO v_question_id;

    INSERT INTO questions (title, type, kind, required, question_order, survey_id)
    VALUES ('Nguồn thu nhập chính của gia đình bạn là gì?', 'checkbox', 'checkbox', TRUE, 5, v_survey_id)
    RETURNING id INTO v_question_id;
    INSERT INTO options (text, option_order, question_id) VALUES
        ('Trồng trọt (làm lúa, rau màu các loại)', 1, v_question_id),
        ('Chăn nuôi gia súc, gia cầm', 2, v_question_id),
        ('Nuôi trồng, đánh bắt thủy sản', 3, v_question_id),
        ('Buôn bán - dịch vụ', 4, v_question_id),
        ('Làm công tự do', 5, v_question_id),
        ('Công nhân', 6, v_question_id),
        ('Thợ hồ', 7, v_question_id),
        ('Khác', 8, v_question_id);

    INSERT INTO questions (title, type, kind, required, question_order, survey_id)
    VALUES ('Kinh tế của bạn thuộc diện nào?', 'multiple_choice', 'multiple_choice', TRUE, 6, v_survey_id)
    RETURNING id INTO v_question_id;
    INSERT INTO options (text, option_order, question_id) VALUES
        ('Nghèo', 1, v_question_id),
        ('Vừa đủ', 2, v_question_id),
        ('Khá', 3, v_question_id),
        ('Có tiết kiệm chút ít', 4, v_question_id);

    INSERT INTO questions (title, type, kind, required, question_order, survey_id)
    VALUES ('Trình độ học vấn của bạn?', 'multiple_choice', 'multiple_choice', TRUE, 7, v_survey_id)
    RETURNING id INTO v_question_id;
    INSERT INTO options (text, option_order, question_id) VALUES
        ('Tiểu học', 1, v_question_id),
        ('Biết đọc - biết viết', 2, v_question_id),
        ('Trung học cơ sở', 3, v_question_id),
        ('Trung học phổ thông', 4, v_question_id),
        ('Đại học (Cử nhân, Kĩ sư)', 5, v_question_id);

    INSERT INTO questions (title, type, kind, required, question_order, survey_id)
    VALUES ('Bạn có bao giờ sử dụng điện thoại di động không?', 'multiple_choice', 'multiple_choice', TRUE, 8, v_survey_id)
    RETURNING id INTO v_question_id;
    INSERT INTO options (text, option_order, question_id) VALUES
        ('Có', 1, v_question_id),
        ('Không sử dụng', 2, v_question_id);

    INSERT INTO questions (title, type, kind, required, question_order, survey_id)
    VALUES ('Số điện thoại di động của bạn là gì?', 'short_text', 'short_answer', FALSE, 9, v_survey_id)
    RETURNING id INTO v_question_id;

    INSERT INTO questions (title, type, kind, required, question_order, survey_id)
    VALUES ('Bạn đã sống ở địa phương này bao lâu?', 'short_text', 'short_answer', TRUE, 12, v_survey_id)
    RETURNING id INTO v_question_id;

    INSERT INTO questions (title, type, kind, required, question_order, survey_id)
    VALUES ('Nhà ở của bạn là loại nhà nào?', 'multiple_choice', 'multiple_choice', TRUE, 13, v_survey_id)
    RETURNING id INTO v_question_id;
    INSERT INTO options (text, option_order, question_id) VALUES
        ('Cấp 4', 1, v_question_id),
        ('Cấp 3', 2, v_question_id),
        ('Nhà tạm', 3, v_question_id);

    INSERT INTO questions (title, type, kind, required, question_order, survey_id)
    VALUES ('Trong những năm gần đây, lũ lụt gây ra những thiệt hại nào cho gia đình bạn?', 'checkbox', 'checkbox', TRUE, 14, v_survey_id)
    RETURNING id INTO v_question_id;
    INSERT INTO options (text, option_order, question_id) VALUES
        ('Hư hại nhà cửa, đồ dùng', 1, v_question_id),
        ('Gián đoạn sinh hoạt, sản xuất', 2, v_question_id),
        ('Tính mạng, sức khỏe', 3, v_question_id),
        ('Môi trường bị ô nhiễm', 4, v_question_id),
        ('Không thiệt hại', 5, v_question_id),
        ('Khác', 6, v_question_id);

    INSERT INTO questions (title, type, kind, required, question_order, survey_id)
    VALUES ('Trong những năm gần đây, trận lụt những năm nào gây thiệt hại nặng nề nhất cho gia đình bạn?', 'checkbox', 'checkbox', FALSE, 15, v_survey_id)
    RETURNING id INTO v_question_id;
    INSERT INTO options (text, option_order, question_id) VALUES
        ('1992', 1, v_question_id),
        ('1998', 2, v_question_id),
        ('1999', 3, v_question_id),
        ('2002', 4, v_question_id),
        ('2006', 5, v_question_id),
        ('2008', 6, v_question_id),
        ('2009', 7, v_question_id),
        ('2013', 8, v_question_id),
        ('Không nhớ', 9, v_question_id);

    INSERT INTO questions (title, type, kind, required, question_order, survey_id)
    VALUES ('Yếu tố nào của lũ là nguyên nhân gây thiệt hại cho gia đình bạn?', 'checkbox', 'checkbox', TRUE, 16, v_survey_id)
    RETURNING id INTO v_question_id;
    INSERT INTO options (text, option_order, question_id) VALUES
        ('Độ sâu / mực nước ngập', 1, v_question_id),
        ('Thời gian ngập', 2, v_question_id),
        ('Tốc độ dòng nước lũ', 3, v_question_id);

    INSERT INTO questions (title, type, kind, required, question_order, survey_id)
    VALUES ('Gia đình bạn có hưởng lợi gì từ lũ lụt không?', 'multiple_choice', 'multiple_choice', FALSE, 17, v_survey_id)
    RETURNING id INTO v_question_id;
    INSERT INTO options (text, option_order, question_id) VALUES
        ('Không', 1, v_question_id),
        ('Có phù sa / diệt chuột', 2, v_question_id),
        ('Khác', 3, v_question_id);

    INSERT INTO questions (title, type, kind, required, question_order, survey_id)
    VALUES ('Sau khi có hồ chứa / thủy điện thì thiệt hại sau mỗi trận lũ đối với gia đình bạn như thế nào?', 'multiple_choice', 'multiple_choice', TRUE, 18, v_survey_id)
    RETURNING id INTO v_question_id;
    INSERT INTO options (text, option_order, question_id) VALUES
        ('Thiệt hại giảm đáng kể', 1, v_question_id),
        ('Không thay đổi', 2, v_question_id),
        ('Thiệt hại tăng', 3, v_question_id),
        ('Thiệt hại ngày càng trầm trọng', 4, v_question_id),
        ('Không còn thiệt hại', 5, v_question_id),
        ('Không biết', 6, v_question_id);

    INSERT INTO questions (title, type, kind, required, question_order, survey_id)
    VALUES ('Gia đình bạn có nhận được sự hỗ trợ của ai / tổ chức nào trong mùa lũ không?', 'checkbox', 'checkbox', TRUE, 19, v_survey_id)
    RETURNING id INTO v_question_id;
    INSERT INTO options (text, option_order, question_id) VALUES
        ('Không nhận được sự hỗ trợ nào cả', 1, v_question_id),
        ('Bạn bè, người thân, hàng xóm', 2, v_question_id),
        ('Chính quyền, địa phương', 3, v_question_id),
        ('Công an, bộ đội', 4, v_question_id),
        ('Tổ chức từ thiện', 5, v_question_id),
        ('Doanh nghiệp địa phương', 6, v_question_id);

    INSERT INTO questions (title, type, kind, required, question_order, survey_id)
    VALUES ('Sau khi lũ lụt đi qua, gia đình bạn mất bao lâu để sinh hoạt bình thường?', 'multiple_choice', 'multiple_choice', TRUE, 20, v_survey_id)
    RETURNING id INTO v_question_id;
    INSERT INTO options (text, option_order, question_id) VALUES
        ('Ngay khi lũ kết thúc', 1, v_question_id),
        ('1 đến 7 ngày', 2, v_question_id),
        ('1 đến 4 tuần', 3, v_question_id),
        ('1 đến 2 tháng', 4, v_question_id),
        ('Trên 2 tháng', 5, v_question_id);


    INSERT INTO questions (title, type, kind, required, question_order, survey_id)
    VALUES ('Khoảng bao lâu trước khi lũ đến bạn nhận được cảnh báo đầu tiên?', 'multiple_choice', 'multiple_choice', TRUE, 23, v_survey_id)
    RETURNING id INTO v_question_id;
    INSERT INTO options (text, option_order, question_id) VALUES
        ('Dưới 1 giờ', 1, v_question_id),
        ('1 đến 6 giờ', 2, v_question_id),
        ('7 đến 12 giờ', 3, v_question_id),
        ('13 đến 24 giờ', 4, v_question_id),
        ('Hơn 1 ngày', 5, v_question_id),
        ('Không nhận được cảnh báo', 6, v_question_id);

    INSERT INTO questions (title, type, kind, required, question_order, survey_id)
    VALUES ('Bạn nhận được cảnh báo từ nguồn nào?', 'checkbox', 'checkbox', TRUE, 24, v_survey_id)
    RETURNING id INTO v_question_id;
    INSERT INTO options (text, option_order, question_id) VALUES
        ('Chính quyền địa phương', 1, v_question_id),
        ('Đài Khí Tượng Thủy Văn Trung Trung Bộ', 2, v_question_id),
        ('Tivi', 3, v_question_id),
        ('Kinh nghiệm cá nhân', 4, v_question_id),
        ('Không nhận được bất kỳ cảnh báo nào', 5, v_question_id);

    INSERT INTO questions (title, type, kind, required, question_order, survey_id)
    VALUES ('Theo bạn, độ chính xác của những bản tin cảnh báo và thông tin lũ lụt như trên như thế nào?', 'multiple_choice', 'multiple_choice', TRUE, 25, v_survey_id)
    RETURNING id INTO v_question_id;
    INSERT INTO options (text, option_order, question_id) VALUES
        ('Hoàn toàn chính xác', 1, v_question_id),
        ('Chính xác hầu hết', 2, v_question_id),
        ('Chính xác một số lần', 3, v_question_id);

    INSERT INTO questions (title, type, kind, required, question_order, survey_id)
    VALUES ('Bạn có nghĩ rằng nếu được cung cấp thông tin về lũ thì gia đình bạn tránh được thiệt hại trong mùa lũ vừa qua không?', 'multiple_choice', 'multiple_choice', TRUE, 26, v_survey_id)
    RETURNING id INTO v_question_id;
    INSERT INTO options (text, option_order, question_id) VALUES
        ('Có', 1, v_question_id),
        ('Không', 2, v_question_id),
        ('Không chắc', 3, v_question_id);

    INSERT INTO questions (title, type, kind, required, question_order, survey_id)
    VALUES ('Bạn muốn biết thông tin cảnh báo lụt trước khi lũ đến bao lâu?', 'multiple_choice', 'multiple_choice', TRUE, 27, v_survey_id)
    RETURNING id INTO v_question_id;
    INSERT INTO options (text, option_order, question_id) VALUES
        ('Dưới 30 phút', 1, v_question_id),
        ('1 - 2 giờ', 2, v_question_id),
        ('Trên 2 giờ', 3, v_question_id);

    INSERT INTO questions (title, type, kind, required, question_order, survey_id)
    VALUES ('Trong mùa lũ, bạn muốn nhận thông tin về lũ qua phương thức gì?', 'checkbox', 'checkbox', TRUE, 28, v_survey_id)
    RETURNING id INTO v_question_id;
    INSERT INTO options (text, option_order, question_id) VALUES
        ('Đài phát thanh', 1, v_question_id),
        ('Đài truyền hình', 2, v_question_id),
        ('Internet', 3, v_question_id),
        ('Gọi điện thoại', 4, v_question_id),
        ('Tin nhắn SMS', 5, v_question_id),
        ('Thông báo tại nhà', 6, v_question_id),
        ('Hệ thống loa phát địa phương', 7, v_question_id);

    INSERT INTO questions (title, type, kind, required, question_order, survey_id)
    VALUES ('Nếu biết thông tin lũ sắp đến bạn sẽ làm gì?', 'checkbox', 'checkbox', TRUE, 29, v_survey_id)
    RETURNING id INTO v_question_id;
    INSERT INTO options (text, option_order, question_id) VALUES
        ('Ở trong nhà, chờ đợi sự hướng dẫn của cơ quan chức năng', 1, v_question_id),
        ('Nghe đài phát thanh, đài truyền hình để biết thêm thông tin', 2, v_question_id),
        ('Chạy ra bờ sông để kiểm tra mực nước', 3, v_question_id),
        ('Di chuyển tài sản đến nơi an toàn', 4, v_question_id),
        ('Di chuyển gia súc đến nơi an toàn', 5, v_question_id),
        ('Sơ tán người đến nơi an toàn', 6, v_question_id),
        ('Thu gom quần áo, thức ăn, nước uống, thuốc men', 7, v_question_id),
        ('Liên lạc, giúp đỡ hàng xóm', 8, v_question_id);

    INSERT INTO questions (title, type, kind, required, question_order, survey_id)
    VALUES ('Gia đình có được hướng dẫn về các biện pháp phòng chống lũ lụt hay không?', 'multiple_choice', 'multiple_choice', FALSE, 30, v_survey_id)
    RETURNING id INTO v_question_id;
    INSERT INTO options (text, option_order, question_id) VALUES
        ('Không', 1, v_question_id),
        ('Có, từ chính quyền địa phương', 2, v_question_id),
        ('Có, từ hội chữ thập đỏ', 3, v_question_id),
        ('Có, từ bà con/người dân xung quanh', 4, v_question_id),
        ('Có, hướng dẫn di chuyển đồ đạc hoặc gia súc đến nơi an toàn', 5, v_question_id),
        ('Khác', 6, v_question_id);

    INSERT INTO questions (title, type, kind, required, question_order, survey_id)
    VALUES ('Gia đình bạn có thực hiện bất kỳ biện pháp nào dưới đây để phòng chống lũ lụt?', 'checkbox', 'checkbox', TRUE, 31, v_survey_id)
    RETURNING id INTO v_question_id;
    INSERT INTO options (text, option_order, question_id) VALUES
        ('Di dời nhà lên vùng không bị ngập lụt', 1, v_question_id),
        ('Gia cố nhà, công trình', 2, v_question_id),
        ('Có thuyền dự phòng', 3, v_question_id),
        ('Trong nhà có gác xép', 4, v_question_id),
        ('Dự trữ lương thực', 5, v_question_id),
        ('Kê đồ lên ghế, bàn', 6, v_question_id),
        ('Không bị tác động', 7, v_question_id);

    INSERT INTO questions (title, type, kind, required, question_order, survey_id)
    VALUES ('Hiện trạng hệ thống công trình phòng chống lũ như: đê, đập, cống, nơi tránh lũ,... ở địa phương theo bạn hoạt động có hiệu quả không?', 'multiple_choice', 'multiple_choice', TRUE, 32, v_survey_id)
    RETURNING id INTO v_question_id;
    INSERT INTO options (text, option_order, question_id) VALUES
        ('Hiệu quả', 1, v_question_id),
        ('Không hiệu quả', 2, v_question_id),
        ('Không hoạt động', 3, v_question_id),
        ('Không có', 4, v_question_id);

    INSERT INTO questions (title, type, kind, required, question_order, survey_id)
    VALUES ('Hệ thống thông tin liên lạc khi xảy ra lũ ở địa phương hoạt động như thế nào?', 'multiple_choice', 'multiple_choice', TRUE, 33, v_survey_id)
    RETURNING id INTO v_question_id;
    INSERT INTO options (text, option_order, question_id) VALUES
        ('Hoạt động bình thường', 1, v_question_id),
        ('Chập chờn', 2, v_question_id),
        ('Tê liệt hoàn toàn', 3, v_question_id);

    INSERT INTO questions (title, type, kind, required, question_order, survey_id)
    VALUES ('Hệ thống giao thông trong mùa lũ ở địa phương hoạt động như thế nào?', 'multiple_choice', 'multiple_choice', TRUE, 34, v_survey_id)
    RETURNING id INTO v_question_id;
    INSERT INTO options (text, option_order, question_id) VALUES
        ('Hoạt động bình thường', 1, v_question_id),
        ('Di chuyển khó khăn', 2, v_question_id),
        ('Tê liệt hoàn toàn', 3, v_question_id);

    INSERT INTO questions (title, type, kind, required, question_order, survey_id)
    VALUES ('Khi có lũ, dịch vụ y tế công cộng tại địa phương hỗ trợ người dân như thế nào?', 'multiple_choice', 'multiple_choice', TRUE, 35, v_survey_id)
    RETURNING id INTO v_question_id;
    INSERT INTO options (text, option_order, question_id) VALUES
        ('Tốt', 1, v_question_id),
        ('Bình thường', 2, v_question_id),
        ('Không đáng kể', 3, v_question_id),
        ('Không hỗ trợ gì', 4, v_question_id);

    INSERT INTO questions (title, type, kind, required, question_order, survey_id)
    VALUES ('Sau khi lũ xảy ra, vệ sinh môi trường ở địa phương như thế nào?', 'multiple_choice', 'multiple_choice', TRUE, 36, v_survey_id)
    RETURNING id INTO v_question_id;
    INSERT INTO options (text, option_order, question_id) VALUES
        ('Không bị ảnh hưởng', 1, v_question_id),
        ('Có bị bẩn nhưng không đáng kể', 2, v_question_id),
        ('Bùn, rác bẩn tương đối nhiều', 3, v_question_id),
        ('Bùn, rác bẩn và chất thải nhiều', 4, v_question_id),
        ('Bùn, rác bẩn và chất thải gây mất vệ sinh nghiêm trọng', 5, v_question_id);

    INSERT INTO questions (title, type, kind, required, question_order, survey_id)
    VALUES ('Trong mùa lũ, chính quyền địa phương đã giúp đỡ, hỗ trợ người dân vấn đề gì?', 'checkbox', 'checkbox', TRUE, 37, v_survey_id)
    RETURNING id INTO v_question_id;
    INSERT INTO options (text, option_order, question_id) VALUES
        ('Di chuyển lên vùng cao', 1, v_question_id),
        ('Gia cố / tự sửa nhà cửa, công trình', 2, v_question_id),
        ('Cứu trợ lương thực, thực phẩm', 3, v_question_id),
        ('Khắc phục hệ thống giao thông, thông tin liên lạc', 4, v_question_id),
        ('Hỗ trợ khắc phục, vệ sinh môi trường', 5, v_question_id),
        ('Hỗ trợ tiền', 6, v_question_id),
        ('Không hỗ trợ gì cả', 7, v_question_id),
        ('Có thể tự xoay sở', 8, v_question_id);

    INSERT INTO questions (title, type, kind, required, question_order, survey_id)
    VALUES ('Theo bạn, giữa người dân và chính quyền, ai đóng vai trò quan trọng nhất trong công tác giảm thiểu tổn thất do lũ lụt?', 'multiple_choice', 'multiple_choice', TRUE, 38, v_survey_id)
    RETURNING id INTO v_question_id;
    INSERT INTO options (text, option_order, question_id) VALUES
        ('Người dân', 1, v_question_id),
        ('Chính quyền', 2, v_question_id);

    INSERT INTO questions (title, type, kind, required, question_order, survey_id)
    VALUES ('Theo bạn, sự hỗ trợ của chính quyền ở giai đoạn nào là quan trọng nhất trong việc giảm nhẹ tổn thương do lũ lụt?', 'multiple_choice', 'multiple_choice', TRUE, 39, v_survey_id)
    RETURNING id INTO v_question_id;
    INSERT INTO options (text, option_order, question_id) VALUES
        ('Trước khi lũ đến (dự báo, xây dựng công trình phòng chống lũ, nâng cấp giao thông)', 1, v_question_id),
        ('Sau khi lũ đi qua (hỗ trợ sản xuất, xây dựng lại nhà cửa, giảm thuế,...)', 2, v_question_id);

    INSERT INTO questions (title, type, kind, required, question_order, survey_id)
    VALUES ('Theo bạn, để khắc phục những thiệt hại do lũ lụt gây ra trên địa bàn thì cần phải ưu tiên làm gì?', 'checkbox', 'checkbox', TRUE, 40, v_survey_id)
    RETURNING id INTO v_question_id;
    INSERT INTO options (text, option_order, question_id) VALUES
        ('Xây dựng nhiều công trình phòng chống lũ (hồ chứa, đê kè, trạm bơm,...)', 1, v_question_id),
        ('Nâng cao nhận thức, khả năng ứng phó lũ lụt của người dân', 2, v_question_id),
        ('Xây dựng nhà kiên cố, cảnh báo sớm', 3, v_question_id),
        ('Chuẩn bị các phương tiện chống lũ', 4, v_question_id),
        ('Hỗ trợ sau lũ, xây dựng nhà cửa', 5, v_question_id),
        ('Sống chung với lũ', 6, v_question_id),
        ('Không chịu nhiều tác động của lũ, không cần thay đổi', 7, v_question_id),
        ('Không có ý kiến', 8, v_question_id),
        ('Cả 4 phương án', 9, v_question_id);

    INSERT INTO questions (title, type, kind, required, question_order, survey_id)
    VALUES ('Bạn đánh giá mức độ ảnh hưởng tổng thể của lũ lụt đến đời sống gia đình bạn như thế nào? (1 = không ảnh hưởng, 5 = ảnh hưởng rất nghiêm trọng)', 'short_text', 'linear_scale', TRUE, 41, v_survey_id)
    RETURNING id INTO v_question_id;

    INSERT INTO questions (title, type, kind, required, question_order, survey_id)
    VALUES ('Bạn đánh giá mức độ hiệu quả chung của các công trình và biện pháp phòng chống lũ tại địa phương như thế nào? (1 = rất không hiệu quả, 5 = rất hiệu quả)', 'short_text', 'linear_scale', TRUE, 42, v_survey_id)
    RETURNING id INTO v_question_id;

    INSERT INTO questions (title, type, kind, required, question_order, survey_id)
    VALUES ('Bạn đánh giá mức độ hài lòng với sự hỗ trợ của chính quyền trong mùa lũ như thế nào? (1 = rất không hài lòng, 5 = rất hài lòng)', 'short_text', 'linear_scale', TRUE, 43, v_survey_id)
    RETURNING id INTO v_question_id;

    INSERT INTO questions (title, type, kind, required, question_order, survey_id)
    VALUES ('Bạn đánh giá khả năng gia đình mình tự chuẩn bị và ứng phó khi có lũ xảy ra như thế nào? (1 = rất thấp, 5 = rất cao)', 'short_text', 'linear_scale', TRUE, 44, v_survey_id)
    RETURNING id INTO v_question_id;

    INSERT INTO questions (title, type, kind, required, question_order, survey_id)
    VALUES ('Bạn đánh giá mức độ cần thiết của việc cải thiện hệ thống cảnh báo lũ sớm tại địa phương như thế nào? (1 = không cần thiết, 5 = rất cần thiết)', 'short_text', 'linear_scale', TRUE, 45, v_survey_id)
    RETURNING id INTO v_question_id;
END $$;

