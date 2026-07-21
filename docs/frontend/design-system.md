# Frontend Design System

## Mục tiêu

Phase 10.1 chuẩn hóa nền giao diện để các màn hình tiếp theo dùng cùng tokens, spacing và trạng thái UI. Hệ thống ưu tiên giao diện tối, gọn, dễ scan, phù hợp app học/thi đấu lập trình thay vì landing page trang trí.

## Tokens

Tokens chính nằm trong `frontend/src/index.css`.

| Token | Mục đích |
|---|---|
| `--color-app-bg` | Nền toàn app |
| `--color-app-surface` | Nền surface nổi |
| `--color-app-surface-muted` | Nền card/panel nhẹ |
| `--color-app-border` | Border mặc định |
| `--color-app-border-strong` | Border focus/accent |
| `--color-app-text` | Text chính |
| `--color-app-text-muted` | Text phụ |
| `--color-app-text-subtle` | Text rất phụ/meta |
| `--color-app-primary` | Action chính |
| `--color-app-secondary` | Accent phụ |
| `--color-app-success` | Trạng thái thành công |
| `--color-app-warning` | Trạng thái cảnh báo |
| `--color-app-danger` | Trạng thái lỗi/nguy hiểm |
| `--radius-app-sm` | Radius control nhỏ |
| `--radius-app-md` | Radius card/control chuẩn |

## Component Classes

Các class dùng lại trong `@layer components`:

| Class | Dùng cho |
|---|---|
| `.app-page` | Wrapper page chuẩn |
| `.app-page-heading` | H1 page |
| `.app-page-subtitle` | Mô tả page |
| `.app-kicker` | Label nhỏ kèm icon ở đầu page |
| `.app-card` | Card độc lập |
| `.app-panel` | Panel/table/form section |
| `.app-panel-header` | Header trong panel |
| `.app-field` | Input/select/textarea |
| `.app-button` | Base button |
| `.app-button-primary` | CTA chính |
| `.app-button-secondary` | Action phụ |
| `.app-button-danger` | Action nguy hiểm |
| `.app-icon-button` | Button icon |
| `.app-table` | Table chuẩn |
| `.app-alert` | Alert base |
| `.app-alert-error` | Alert lỗi |
| `.app-alert-muted` | Alert loading/empty |
| `.app-badge` | Badge/pill nhỏ |

## Layout & Navigation

- `PageLayout` dùng top navigation cố định và main content có padding responsive.
- Desktop (`lg` trở lên): navigation hiển thị trong top bar để thao tác nhanh.
- Mobile/tablet nhỏ: navigation chuyển xuống bottom bar dạng icon + label ngắn, tránh chen chúc trong header.
- Bottom bar là phần của `Navbar`, vì vậy page content cần giữ `pb-24` ở mobile để không bị che.
- Header chỉ giữ các khu chính: Học tập, Kỳ thi, Thách đấu và Admin nếu có quyền.
- Chat không nằm trong header vì đã có `ChatDock` toàn app.
- Bạn bè nằm trong trang thông tin cá nhân/Profile; badge lời mời kết bạn hiển thị trên nút profile.
- Bảng xếp hạng được đặt trong khu Kỳ thi bằng entry point ở `ExamListPage`.
- Các thông báo realtime như friend request và battle invite dùng vị trí `fixed`, có `max-width` để không tràn màn hình nhỏ.
- `ChatDock` nằm trong `PageLayout`, mở/đóng ở góc dưới để người dùng vừa thao tác trên trang hiện tại vừa nhắn global chat hoặc DM bạn bè.
- `ChatDock` ẩn tại route `/chat` để tránh trùng trải nghiệm với trang chat đầy đủ.

## Quy ước

- Card radius mặc định 8px, icon/button nhỏ 6px.
- Ưu tiên teal/cyan cho action chính, indigo/violet chỉ là accent phụ.
- Không dùng hero/section marketing cho app surface.
- Form/table/dashboard cần dense, gọn, dễ thao tác lặp lại.
- Khi làm mới màn hình, ưu tiên dùng class hệ thống trước khi viết Tailwind dài tại chỗ.
