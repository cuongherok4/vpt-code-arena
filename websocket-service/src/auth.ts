import crypto from 'crypto';
import type { ExtendedError, Socket } from 'socket.io';

export type AuthUser = {
  userId: string;
  name?: string;
  token?: string;
};

type JwtPayload = {
  sub?: string;
  userId?: string;
  name?: string;
  exp?: number;
};

export function authenticateSocket(secret: string, authDisabled: boolean) {
  return (socket: Socket, next: (err?: ExtendedError) => void) => {
    if (authDisabled) {
      socket.data.user = {
        userId: String(socket.handshake.auth?.userId || socket.handshake.query?.userId || socket.id),
        name: String(socket.handshake.auth?.name || 'Dev User')
      } satisfies AuthUser;
      next();
      return;
    }

    const rawToken = socket.handshake.auth?.token || socket.handshake.headers.authorization;
    const token = typeof rawToken === 'string' ? rawToken.replace(/^Bearer\s+/i, '') : '';
    const payload = verifyHs256Jwt(token, secret);
    if (!payload) {
      next(new Error('UNAUTHORIZED'));
      return;
    }

    const userId = payload.userId || payload.sub;
    if (!userId) {
      next(new Error('UNAUTHORIZED'));
      return;
    }

    socket.data.user = {
      userId,
      name: payload.name,
      token
    } satisfies AuthUser;
    next();
  };
}

export function verifyHs256Jwt(token: string, secret: string): JwtPayload | null {
  const parts = token.split('.');
  if (parts.length !== 3 || !secret) return null;

  const [headerPart, payloadPart, signaturePart] = parts;
  try {
    const header = JSON.parse(base64UrlDecode(headerPart).toString('utf8')) as { alg?: string };
    if (header.alg !== 'HS256') return null;

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${headerPart}.${payloadPart}`)
      .digest('base64url');
    if (!timingSafeEqual(signaturePart, expectedSignature)) return null;

    const payload = JSON.parse(base64UrlDecode(payloadPart).toString('utf8')) as JwtPayload;
    if ((!payload.sub && !payload.userId) || (payload.exp && payload.exp * 1000 < Date.now())) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

function base64UrlDecode(value: string): Buffer {
  return Buffer.from(value, 'base64url');
}

function timingSafeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}
