import { getFirestore, isFirebaseConfigured } from '../config/firebaseAdmin';
import { DEFAULT_SEEDED_ITEMS } from '../services/items.service';
import { FieldValue } from 'firebase-admin/firestore';

async function seedFirestore() {
  console.log('=== SEEDING LIVE FIRESTORE WITH CAMPUSCYCLE INVENTORY ===\n');

  if (!isFirebaseConfigured()) {
    console.error('[FAILED] Firebase Admin is not configured with credentials.');
    process.exit(1);
  }

  try {
    const db = getFirestore();
    const batch = db.batch();

    console.log('1. Seeding 5 verified campus equipment listings into items collection...');
    for (const item of DEFAULT_SEEDED_ITEMS) {
      const docRef = db.collection('items').doc(item.itemId);
      batch.set(
        docRef,
        {
          ...item,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      console.log(`   + Staged: [${item.itemId}] ${item.title} (₹${item.rentalPrice} / ${item.pricingModel})`);
    }

    console.log('\n2. Seeding demo student profile for Priya Patel into users collection...');
    const userRef = db.collection('users').doc('usr_priya_101');
    batch.set(
      userRef,
      {
        uid: 'usr_priya_101',
        name: 'Priya Patel',
        email: 'priya.patel@campus.edu',
        photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    console.log('   + Staged: [usr_priya_101] Priya Patel (priya.patel@campus.edu)');

    await batch.commit();
    console.log('\n======================================================');
    console.log('LIVE FIRESTORE SEEDING COMMITTED SUCCESSFULLY! ✓');
    console.log('======================================================');
  } catch (err: any) {
    console.error('\n[ERROR] Live Firestore seeding failed:', err?.message || err);
    process.exit(1);
  }
}

seedFirestore();
