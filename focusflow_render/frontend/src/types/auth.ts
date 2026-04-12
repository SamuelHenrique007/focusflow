export interface User {
  id: number;
  name: string;
  email: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface UpdateMePayload {
  name: string;
  email: string;
}

export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
  confirm_new_password: string;
}

export interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  refreshAccessToken: () => Promise<string | null>;
  fetchMe: () => Promise<void>;
  updateProfile: (payload: UpdateMePayload) => Promise<void>;
  changePassword: (payload: ChangePasswordPayload) => Promise<void>;
}