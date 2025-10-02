import { db } from "../../../lib/firebase/firebase";
import { collection, addDoc, getDocs } from "firebase/firestore";

export async function GET() {
  try {
    console.log('Testing Firestore connection...');
    
    // Try to add a test document
    const testDoc = await addDoc(collection(db, 'test'), {
      message: 'Hello Firestore!',
      timestamp: new Date(),
    });
    
    console.log('Test document added with ID:', testDoc.id);
    
    // Try to read documents
    const querySnapshot = await getDocs(collection(db, 'test'));
    console.log('Found', querySnapshot.size, 'test documents');
    
    return Response.json({ 
      success: true, 
      testDocId: testDoc.id,
      docCount: querySnapshot.size 
    });
  } catch (error) {
    console.error('Firestore test failed:', error);
    return Response.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
