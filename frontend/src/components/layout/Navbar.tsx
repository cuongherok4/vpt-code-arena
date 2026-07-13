
import { Link } from 'react-router-dom';
import { Code2, Trophy, BookOpen, MessageSquare, User } from 'lucide-react';

export const Navbar = () => {
  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <Code2 className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg hidden sm:inline-block">VPT Arena</span>
        </Link>
        
        <div className="flex items-center space-x-6 text-sm font-medium">
          <Link to="/learn" className="flex items-center space-x-1 hover:text-primary transition-colors">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline-block">Học tập</span>
          </Link>
          <Link to="/exam" className="flex items-center space-x-1 hover:text-primary transition-colors">
            <Code2 className="h-4 w-4" />
            <span className="hidden sm:inline-block">Kỳ thi</span>
          </Link>
          <Link to="/battle" className="flex items-center space-x-1 hover:text-primary transition-colors">
            <Trophy className="h-4 w-4" />
            <span className="hidden sm:inline-block">Thách đấu</span>
          </Link>
          <Link to="/chat" className="flex items-center space-x-1 hover:text-primary transition-colors">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline-block">Cộng đồng</span>
          </Link>
        </div>
        
        <div className="flex items-center space-x-4">
          <Link to="/profile" className="flex items-center space-x-2 border rounded-full px-3 py-1.5 hover:bg-muted transition-colors">
            <User className="h-4 w-4" />
            <span className="text-sm font-medium hidden sm:inline-block">Tài khoản</span>
          </Link>
        </div>
      </div>
    </nav>
  );
};
