import { createBrowserRouter } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';


const Home = () => (
  <div className="text-center py-20">
    <h1 className="text-4xl font-bold mb-4">Chào mừng đến với VPT Code Arena</h1>
    <p className="text-lg text-muted-foreground">Nền tảng thi đấu và rèn luyện kỹ năng lập trình hàng đầu</p>
  </div>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: <PageLayout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: 'learn',
        element: <div>Learn Module (Coming soon)</div>,
      },
      {
        path: 'exam',
        element: <div>Exam Module (Coming soon)</div>,
      },
      {
        path: 'battle',
        element: <div>Battle Module (Coming soon)</div>,
      },
      {
        path: 'chat',
        element: <div>Chat Module (Coming soon)</div>,
      },
      {
        path: 'profile',
        element: <div>User Profile (Coming soon)</div>,
      },
    ],
  },
]);
