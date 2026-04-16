import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  serverTimestamp 
} from "firebase/firestore";
import { db } from "../firebase";
import { UserProfile } from "../types/auth";

const USERS_COLLECTION = "users";

export async function getAllUsers(): Promise<UserProfile[]> {
  const q = query(collection(db, USERS_COLLECTION), orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data() as UserProfile);
}

export async function createOrUpdateUser(profile: Partial<UserProfile>) {
  if (!profile.uid) throw new Error("UID is required");
  
  const userRef = doc(db, USERS_COLLECTION, profile.uid);
  const data = {
    ...profile,
    updatedAt: serverTimestamp(),
  };

  // Nếu là tạo mới, thêm createdAt
  if (!profile.createdAt) {
    (data as any).createdAt = serverTimestamp();
  }

  await setDoc(userRef, data, { merge: true });
}

export async function deleteUser(uid: string) {
  const userRef = doc(db, USERS_COLLECTION, uid);
  await deleteDoc(userRef);
}
