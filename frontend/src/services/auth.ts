import { api } from "./api";

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type User = {
  id: number;
  name: string;
  email: string;
};

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

export async function refreshRequest(
  refresh: string,
): Promise<{ access: string }> {
  const response = await api.post("/auth/login/refresh/", { refresh });
  return response.data;
}