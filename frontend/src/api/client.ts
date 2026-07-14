import axios from 'axios';

// Giả lập user ID cố định cho môi trường dev/test khi chưa có auth module
const MOCK_USER_ID = '3fa85f64-5717-4562-b3fc-2c963f66afa6';

export const apiClient = axios.create({
  baseURL: 'http://localhost:8080/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  // Lấy userId từ localStorage (nếu có hệ thống auth sau này), tạm thời dùng mock
  const userId = localStorage.getItem('userId') || MOCK_USER_ID;
  if (userId) {
    config.headers['X-User-Id'] = userId;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Có thể xử lý toast lỗi chung tại đây
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);
