import { api } from "./api";

type RegisterPayload = {
  username: string;
  email: string;
  password: string;
};

type LoginPayload = {
  email: string;
  password: string;
};

export async function register(data: RegisterPayload) {
  const response = await api.post("/auth/register/", data);

  if (response.data.access) {
    localStorage.setItem("access", response.data.access);
  }

  if (response.data.refresh) {
    localStorage.setItem("refresh", response.data.refresh);
  }

  return response.data;
}

export async function login(data: LoginPayload) {
  const response = await api.post("/auth/login/", data);

  if (response.data.access) {
    localStorage.setItem("access", response.data.access);
  }

  if (response.data.refresh) {
    localStorage.setItem("refresh", response.data.refresh);
  }

  return response.data;
}