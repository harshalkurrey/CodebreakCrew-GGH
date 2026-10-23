import { Timestamp } from 'firebase-admin/firestore';

export interface UserDocument {
  uid: string;
  name: string;
  email: string;
  photoURL?: string | null;
  createdAt: Timestamp;
}
