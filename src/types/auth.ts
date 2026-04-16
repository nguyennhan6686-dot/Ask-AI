export type UserRole = "admin" | "user_type_1" | "user_type_2";

export interface UserProfile {
  uid: string;
  email: string;
  username: string;
  displayName: string;
  role: UserRole;
  createdAt: any;
  // Dynamic fields
  fieldA?: string; // For User Type 1
  fieldB?: string; // For User Type 2
  linkedUserType1Id?: string; // For User Type 2
}
