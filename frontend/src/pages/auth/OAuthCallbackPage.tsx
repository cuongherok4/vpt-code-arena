import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import type { AuthResponse, Role } from '@/api/auth.api';

export default function OAuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const acceptOAuth = useAuthStore((state) => state.acceptOAuth);

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');
    const userId = searchParams.get('userId');
    const publicId = searchParams.get('publicId') ?? undefined;
    const email = searchParams.get('email');
    const name = searchParams.get('name');
    const role = searchParams.get('role') as Role | null;

    if (!accessToken || !refreshToken || !userId || !email || !name || !role) {
      navigate('/login?oauthError=OAuth callback is missing required data', { replace: true });
      return;
    }

    const response: AuthResponse = {
      accessToken,
      refreshToken,
      expiresIn: Number(searchParams.get('expiresIn') || 900),
      user: {
        id: userId,
        publicId,
        email,
        name,
        role,
        emailVerified: searchParams.get('emailVerified') === 'true',
      },
    };

    acceptOAuth(response);
    navigate('/profile', { replace: true });
  }, [acceptOAuth, navigate, searchParams]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="flex items-center gap-3 text-slate-300">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Dang hoan tat dang nhap...</span>
      </div>
    </main>
  );
}
