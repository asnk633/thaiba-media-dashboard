export type UserRole = "admin" | "team_member" | "institution"

export interface UserProfile {
  id: string
  email: string
  full_name: string
  role: UserRole
  institution_id?: string
  created_at: string
  updated_at: string
}

export interface Institution {
  id: string
  name: string
  contact_email: string
  created_at: string
}
