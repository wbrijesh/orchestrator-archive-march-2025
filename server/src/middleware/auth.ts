import { Context, Next } from 'hono';
import jwt from 'jsonwebtoken';

type UserData = {
  userId: number;
  email: string;
};

declare module 'hono' {
  interface ContextVariableMap {
    user: UserData;
  }
}

export const authMiddleware = async (c: Context, next: Next) => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized - No token provided' }, 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as UserData;
    c.set('user', decoded);
    await next();
  } catch (error) {
    return c.json({ error: 'Unauthorized - Invalid token' }, 401);
  }
};
