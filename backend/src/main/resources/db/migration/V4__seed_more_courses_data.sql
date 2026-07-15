-- V4__seed_more_courses_data.sql

-- JAVA ADDITIONAL CHAPTERS
INSERT INTO chapters (id, title, description, "order", group_name, language, created_at)
VALUES 
('c0a80121-7f8e-4a6c-9a4f-564a9e5b9a12', 'Lập trình Hướng đối tượng (OOP)', 'Các khái niệm OOP trong Java', 2, 'Trung cấp', 'java', NOW()),
('c0a80121-7f8e-4a6c-9a4f-564a9e5b9a13', 'Cấu trúc dữ liệu', 'Collections framework', 3, 'Nâng cao', 'java', NOW());

INSERT INTO lessons (id, chapter_id, title, content, "order", has_challenge, challenge_description, challenge_test_cases, created_at, updated_at)
VALUES
('b0a80121-7f8e-4a6c-9a4f-564a9e5b9b11', 'c0a80121-7f8e-4a6c-9a4f-564a9e5b9a12', 'Class và Object', '<h2>Class và Object</h2><p>Class là bản thiết kế, Object là thực thể.</p>', 1, false, null, null, NOW(), NOW()),
('b0a80121-7f8e-4a6c-9a4f-564a9e5b9b12', 'c0a80121-7f8e-4a6c-9a4f-564a9e5b9a12', 'Tính Đóng gói (Encapsulation)', '<h2>Đóng gói</h2><p>Bảo vệ dữ liệu bằng private và getter/setter.</p>', 2, true, 'Viết class Person có thuộc tính private name', '{"cases": [{"input": "", "expected": ""}]}', NOW(), NOW()),
('b0a80121-7f8e-4a6c-9a4f-564a9e5b9b13', 'c0a80121-7f8e-4a6c-9a4f-564a9e5b9a13', 'ArrayList', '<h2>ArrayList</h2><p>Mảng động trong Java.</p>', 1, false, null, null, NOW(), NOW());

-- C COURSE
INSERT INTO chapters (id, title, description, "order", group_name, language, created_at)
VALUES 
('c0a80121-7f8e-4a6c-9a4f-564a9e5b9c11', 'Cơ bản về C', 'Nhập môn ngôn ngữ C', 1, 'Cơ bản', 'c', NOW()),
('c0a80121-7f8e-4a6c-9a4f-564a9e5b9c12', 'Con trỏ & Bộ nhớ', 'Hiểu về pointer trong C', 2, 'Trung cấp', 'c', NOW());

INSERT INTO lessons (id, chapter_id, title, content, "order", has_challenge, challenge_description, challenge_test_cases, created_at, updated_at)
VALUES
('b0a80121-7f8e-4a6c-9a4f-564a9e5b9d11', 'c0a80121-7f8e-4a6c-9a4f-564a9e5b9c11', 'Hello World (C)', '<h2>Hello World trong C</h2><p>Sử dụng printf để in ra màn hình.</p>', 1, true, 'In ra Hello C', '{"cases": [{"input": "", "expected": "Hello C\n"}]}', NOW(), NOW()),
('b0a80121-7f8e-4a6c-9a4f-564a9e5b9d12', 'c0a80121-7f8e-4a6c-9a4f-564a9e5b9c11', 'Kiểu dữ liệu trong C', '<h2>Kiểu dữ liệu</h2><p>int, float, char...</p>', 2, false, null, null, NOW(), NOW()),
('b0a80121-7f8e-4a6c-9a4f-564a9e5b9d13', 'c0a80121-7f8e-4a6c-9a4f-564a9e5b9c12', 'Khái niệm Con trỏ', '<h2>Con trỏ (Pointer)</h2><p>Con trỏ lưu địa chỉ bộ nhớ của biến khác.</p>', 1, false, null, null, NOW(), NOW());

-- PYTHON COURSE
INSERT INTO chapters (id, title, description, "order", group_name, language, created_at)
VALUES 
('c0a80121-7f8e-4a6c-9a4f-564a9e5b9e11', 'Làm quen Python', 'Cú pháp cơ bản của Python', 1, 'Cơ bản', 'python', NOW()),
('c0a80121-7f8e-4a6c-9a4f-564a9e5b9e12', 'Cấu trúc dữ liệu Python', 'List, Tuple, Dictionary', 2, 'Trung cấp', 'python', NOW());

INSERT INTO lessons (id, chapter_id, title, content, "order", has_challenge, challenge_description, challenge_test_cases, created_at, updated_at)
VALUES
('b0a80121-7f8e-4a6c-9a4f-564a9e5b9f11', 'c0a80121-7f8e-4a6c-9a4f-564a9e5b9e11', 'Python Basics', '<h2>Hello Python</h2><p>Sử dụng hàm print().</p>', 1, true, 'In ra Hello Python', '{"cases": [{"input": "", "expected": "Hello Python\n"}]}', NOW(), NOW()),
('b0a80121-7f8e-4a6c-9a4f-564a9e5b9f12', 'c0a80121-7f8e-4a6c-9a4f-564a9e5b9e11', 'Biến & Kiểu dữ liệu', '<h2>Variables</h2><p>Python không cần khai báo kiểu dữ liệu tĩnh.</p>', 2, false, null, null, NOW(), NOW()),
('b0a80121-7f8e-4a6c-9a4f-564a9e5b9f13', 'c0a80121-7f8e-4a6c-9a4f-564a9e5b9e12', 'Lists & Dictionaries', '<h2>Lists & Dictionaries</h2><p>Cấu trúc dữ liệu rất linh hoạt trong Python.</p>', 1, false, null, null, NOW(), NOW());
