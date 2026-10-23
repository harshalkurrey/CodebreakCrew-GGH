import { getFirestore, isFirebaseConfigured } from '../config/firebaseAdmin';

async function verifyFirestoreAccess() {
  console.log('=== VERIFYING LIVE FIRESTORE ACCESS ===\n');
  
  if (!isFirebaseConfigured()) {
    console.error('[FAILED] Firebase Admin is not configured with credentials.');
    process.exit(1);
  }

  try {
    const db = getFirestore();
    console.log('1. Attempting live Firestore write to _connectivity_test/ping...');
    const testRef = db.collection('_connectivity_test').doc('ping');
    await testRef.set({
      status: 'connected',
      timestamp: new Date().toISOString(),
      verifiedBy: 'CampusCycle Backend Test',
    });
    console.log('✓ Document written successfully.');

    console.log('2. Attempting live Firestore read from _connectivity_test/ping...');
    const snap = await testRef.get();
    if (snap.exists) {
      console.log('✓ Document read successfully. Data:', JSON.stringify(snap.data()));
    } else {
      console.error('[FAILED] Test document written but not found upon retrieval.');
      process.exit(1);
    }

    console.log('3. Cleaning up temporary test document...');
    await testRef.delete();
    console.log('✓ Temporary test document cleaned up.\n');

    console.log('======================================================');
    console.log('LIVE FIRESTORE CONNECTIVITY VERIFIED SUCCESSFULLY! ✓');
    console.log('======================================================');
  } catch (err: any) {
    console.error('\n[ERROR] Live Firestore access failed:', err?.message || err);
    process.exit(1);
  }
}

verifyFirestoreAccess();
