import { api } from "./api";
import type {
  RegisterPayload,
  LoginPayload,
  User,
  UpdateMePayload,
  ChangePasswordPayload,
} from "@/types/auth";

export type AuthResponse = {
  user?: User;
  access: string;
  refresh: string;
};

export async function registerRequest(
  data: RegisterPayload,
): Promise<AuthResponse> {
  const response = await api.post("/auth/register/", data);
  return response.data;
}

export async function loginRequest(
  data: LoginPayload,
): Promise<AuthResponse> {
  const response = await api.post("/auth/login/", data);
  return response.data;
}

export async function meRequest(): Promise<User> {
  const response = await api.get("/auth/me/");
  return response.data;
}

export async function updateMeRequest(
  data: UpdateMePayload,
): Promise<{ message: string; user: User }> {
  const response = await api.patch("/auth/me/", data);
  return response.data;
}

export async function changePasswordRequest(
  data: ChangePasswordPayload,
): Promise<{ message: string }> {
  const response = await api.post("/auth/change-password/", data);
  return response.data;
}

export async function refreshRequest(
  refresh: string,
): Promise<{ access: string }> {
  const response = await api.post("/auth/login/refresh/", { refresh });
  return response.data;
}

export type {
  RegisterPayload,
  LoginPayload,
  User,
  UpdateMePayload,
  ChangePasswordPayload,
};