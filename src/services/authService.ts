import { 
  signInWithEmailAndPassword, 
  User as FirebaseUser 
} from "firebase/auth";
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  serverTimestamp 
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { UserProfile, UserRole } from "../types/auth";

/**
 * Logic đăng nhập linh hoạt: Username hoặc Email
 */
export async function loginWithUsernameOrEmail(identifier: string, password: string) {
  let email = identifier;

  // Nếu không chứa '@', coi là Username và tìm Email tương ứng trong Firestore
  if (!identifier.includes("@")) {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("username", "==", identifier.trim()));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error("Không tìm thấy người dùng với tên đăng nhập này.");
    }
    
    // Lấy email từ document đầu tiên tìm thấy
    email = querySnapshot.docs[0].data().email;
  }

  // Đăng nhập bằng Firebase Auth
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Đồng bộ Auth và Database
  return await syncUserWithDatabase(user);
}

/**
 * Đồng bộ thông tin User giữa Auth và Firestore
 * Nếu chưa có document, tự động tạo và cấp quyền ADMIN
 */
async function syncUserWithDatabase(user: FirebaseUser): Promise<UserProfile> {
  const userDocRef = doc(db, "users", user.uid);
  const userDocSnap = await getDoc(userDocRef);

  if (!userDocSnap.exists()) {
    // Trường hợp User có trong Auth nhưng chưa có trong DB
    // Tự động tạo hồ sơ mới và MẶC ĐỊNH CẤP QUYỀN ADMIN
    const newProfile: UserProfile = {
      uid: user.uid,
      email: user.email || "",
      username: user.email?.split("@")[0] || user.uid, // Fallback username
      displayName: user.displayName || "Admin mới",
      role: "admin", // Mặc định cấp quyền Admin theo yêu cầu
      createdAt: serverTimestamp(),
    };

    await setDoc(userDocRef, newProfile);
    return newProfile;
  }

  return userDocSnap.data() as UserProfile;
}

/**
 * Lấy profile hiện tại của user
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const docRef = doc(db, "users", uid);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? (docSnap.data() as UserProfile) : null;
}
