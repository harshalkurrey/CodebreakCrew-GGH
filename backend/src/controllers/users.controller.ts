import { Request, Response, NextFunction } from 'express';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getFirestore } from '../config/firebaseAdmin';
import { sendSuccess, sendError } from '../utils/apiResponse';

export class UsersController {
  private collection = 'users';

  async syncProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.uid) {
        sendError(res, 'UNAUTHORIZED', 'Authentication is required.', 401);
        return;
      }

      const db = getFirestore();
      const userRef = db.collection(this.collection).doc(req.user.uid);
      const snap = await userRef.get();

      const name = req.body.name || req.user.name || 'Campus Student';
      const email = req.user.email || req.body.email || '';
      const photoURL = req.body.photoURL || null;

      if (!snap.exists) {
        const newUser = {
          uid: req.user.uid,
          name,
          email,
          photoURL,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        };
        await userRef.set(newUser);
      } else {
        await userRef.update({
          name,
          ...(photoURL ? { photoURL } : {}),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }

      sendSuccess(res, { uid: req.user.uid, name, email, photoURL }, 'User profile synchronized.');
    } catch (error: any) {
      next(error);
    }
  }

  async getMyProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.uid) {
        sendError(res, 'UNAUTHORIZED', 'Authentication is required.', 401);
        return;
      }

      const db = getFirestore();
      const snap = await db.collection(this.collection).doc(req.user.uid).get();

      if (!snap.exists) {
        // Fallback from auth claims
        sendSuccess(res, {
          uid: req.user.uid,
          name: req.user.name || 'Campus Student',
          email: req.user.email || '',
          photoURL: null,
        }, 'Profile fetched.');
        return;
      }

      const d = snap.data()!;
      sendSuccess(res, {
        uid: d.uid,
        name: d.name,
        email: d.email,
        photoURL: d.photoURL || null,
        createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate().toISOString() : d.createdAt,
      }, 'Profile fetched.');
    } catch (error: any) {
      next(error);
    }
  }

  async getPublicProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { uid } = req.params;
      const db = getFirestore();
      const snap = await db.collection(this.collection).doc(uid).get();

      if (!snap.exists) {
        sendError(res, 'USER_NOT_FOUND', 'Student profile not found.', 404);
        return;
      }

      const d = snap.data()!;
      sendSuccess(res, {
        uid: d.uid,
        name: d.name,
        photoURL: d.photoURL || null,
      }, 'Public profile fetched.');
    } catch (error: any) {
      next(error);
    }
  }
}

export const usersController = new UsersController();
