import { Request, Response, NextFunction } from 'express';
import { getAuth } from '../config/firebaseAdmin';
import { sendError } from '../utils/apiResponse';

export async function verifyAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendError(
      res,
      'TOKEN_MISSING',
      'Authentication required. Authorization header missing or malformed.',
      401
    );
    return;
  }

  const token = authHeader.split('Bearer ')[1].trim();

  try {
    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(token);

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      name: (decodedToken.name as string) || '',
    };

    next();
  } catch (error) {
    sendError(
      res,
      'TOKEN_INVALID',
      'Authentication failed. Token is invalid or expired.',
      401
    );
  }
}

export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1].trim();
    try {
      const auth = getAuth();
      const decodedToken = await auth.verifyIdToken(token);
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email || '',
        name: (decodedToken.name as string) || '',
      };
    } catch {
      // Ignore token failure for optional endpoints; user continues as guest
    }
  }

  next();
}
