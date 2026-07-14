-- V2__seed_learn_data.sql
INSERT INTO chapters (id, title, description, "order", group_name, created_at)
VALUES 
('c0a80121-7f8e-4a6c-9a4f-564a9e5b9a11', 'Làm quen với Java', 'Các khái niệm cơ bản nhất về Java', 1, 'Cơ bản', NOW());

INSERT INTO lessons (id, chapter_id, title, content, "order", has_challenge, challenge_description, challenge_test_cases, created_at, updated_at)
VALUES
('b0a80121-7f8e-4a6c-9a4f-564a9e5b9a11', 'c0a80121-7f8e-4a6c-9a4f-564a9e5b9a11', 'Bài 1: Hello World', 'Học cách in ra Hello World', 1, true, 'In ra chuỗi Hello World', '{"cases": [{"input": "", "expected": "Hello World\n"}]}', NOW(), NOW()),
('b0a80121-7f8e-4a6c-9a4f-564a9e5b9a12', 'c0a80121-7f8e-4a6c-9a4f-564a9e5b9a11', 'Bài 2: Biến', 'Khai báo biến trong Java', 2, false, null, null, NOW(), NOW()),
('b0a80121-7f8e-4a6c-9a4f-564a9e5b9a13', 'c0a80121-7f8e-4a6c-9a4f-564a9e5b9a11', 'Bài 3: Kiểu dữ liệu', 'Các kiểu dữ liệu cơ bản', 3, true, 'Khai báo kiểu int', '{"cases": [{"input": "", "expected": ""}]}', NOW(), NOW()),
('b0a80121-7f8e-4a6c-9a4f-564a9e5b9a14', 'c0a80121-7f8e-4a6c-9a4f-564a9e5b9a11', 'Bài 4: Toán tử', 'Toán tử + - * /', 4, false, null, null, NOW(), NOW()),
('b0a80121-7f8e-4a6c-9a4f-564a9e5b9a15', 'c0a80121-7f8e-4a6c-9a4f-564a9e5b9a11', 'Bài 5: Vòng lặp', 'Vòng lặp for, while', 5, true, 'In ra số 1 đến 5', '{"cases": [{"input": "", "expected": "1\n2\n3\n4\n5\n"}]}', NOW(), NOW());
