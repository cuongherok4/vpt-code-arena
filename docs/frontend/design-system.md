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

## Quy ước

- Card radius mặc định 8px, icon/button nhỏ 6px.
- Ưu tiên cyan cho action chính, violet chỉ là accent phụ.
- Không dùng hero/section marketing cho app surface.
- Form/table/dashboard cần dense, gọn, dễ thao tác lặp lại.
- Khi làm mới màn hình, ưu tiên dùng class hệ thống trước khi viết Tailwind dài tại chỗ.
