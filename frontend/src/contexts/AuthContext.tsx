import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { api } from "@/services/api";
import {
  loginRequest,
  meRequest,
  refreshRequest,
  registerRequest,
  updateMeRequest,
  changePasswordRequest,
} from "@/services/auth";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setTokens,
} from "@/services/token";
import { AuthContext } from "./auth-context";
import type {
  AuthContextType,
  LoginPayload,
  RegisterPayload,
  User,
  UpdateMePayload,
  ChangePasswordPayload,
} from "@/types/auth";

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessTokenState] = useState<string | null>(
    getAccessToken(),
  );
  const [isLoading, setIsLoading] = useState(true);

  const isRefreshingRef = useRef(false);
  const refreshPromiseRef = useRef<Promise<string | null> | null>(null);

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
    setAccessTokenState(null);
    delete api.defaults.headers.common.Authorization;
  }, []);

  const fetchMe = useCallback(async () => {
    const me = await meRequest();
    setUser(me);
  }, []);

  const updateProfile = useCallback(async (data: UpdateMePayload) => {
    const response = await updateMeRequest(data);
    setUser(response.user);
  }, []);

  const changePassword = useCallback(
    async (data: ChangePasswordPayload) => {
      await changePasswordRequest(data);
    },
    [],
  );

  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    const refresh = getRefreshToken();

    if (!refresh) {
      logout();
      return null;
    }

    if (isRefreshingRef.current && refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    isRefreshingRef.current = true;

    refreshPromiseRef.current = (async () => {
      try {
        const response = await refreshRequest(refresh);
        const newAccess = response.access;

        setAccessToken(newAccess);
        setAccessTokenState(newAccess);
        api.defaults.headers.common.Authorization = `Bearer ${newAccess}`;

        return newAccess;
      } catch {
        logout();
        return null;
      } finally {
        isRefreshingRef.current = false;
        refreshPromiseRef.current = null;
      }
    })();

    return refreshPromiseRef.current;
  }, [logout]);

  const login = useCallback(
    async (data: LoginPayload) => {
      const response = await loginRequest(data);

      setTokens(response.access, response.refresh);
      setAccessTokenState(response.access);
      api.defaults.headers.common.Authorization = `Bearer ${response.access}`;

      if (response.user) {
        setUser(response.user);
      } else {
        await fetchMe();
      }
    },
    [fetchMe],
  );

  const register = useCallback(
    async (data: RegisterPayload) => {
      const response = await registerRequest(data);

      setTokens(response.access, response.refresh);
      setAccessTokenState(response.access);
      api.defaults.headers.common.Authorization = `Bearer ${response.access}`;

      if (response.user) {
        setUser(response.user);
      } else {
        await fetchMe();
      }
    },
    [fetchMe],
  );

  useEffect(() => {
    const requestInterceptor = api.interceptors.request.use(
      (config) => {
        const token = getAccessToken();

        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
      },
      (error) => Promise.reject(error),
    );

    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        const isUnauthorized = error.response?.status === 401;
        const alreadyRetried = originalRequest?._retry;
        const requestUrl = originalRequest?.url || "";

        const isAuthRoute =
          requestUrl.includes("/auth/login/") ||
          requestUrl.includes("/auth/register/") ||
          requestUrl.includes("/auth/login/refresh/");

        if (isUnauthorized && !alreadyRetried && !isAuthRoute) {
          originalRequest._retry = true;

          const newAccess = await refreshAccessToken();

          if (newAccess) {
            originalRequest.headers = originalRequest.headers ?? {};
            originalRequest.headers.Authorization = `Bearer ${newAccess}`;
            return api(originalRequest);
          }
        }

        return Promise.reject(error);
      },
    );

    return () => {
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
    };
  }, [refreshAccessToken]);

  useEffect(() => {
    async function bootstrapAuth() {
      try {
        const access = getAccessToken();

        if (access) {
          api.defaults.headers.common.Authorization = `Bearer ${access}`;
          await fetchMe();
        } else {
          const newAccess = await refreshAccessToken();

          if (newAccess) {
            api.defaults.headers.common.Authorization = `Bearer ${newAccess}`;
            await fetchMe();
          }
        }
      } catch {
        logout();
      } finally {
        setIsLoading(false);
      }
    }

    bootstrapAuth();
  }, [fetchMe, logout, refreshAccessToken]);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      accessToken,
      isAuthenticated: !!user && !!accessToken,
      isLoading,
      login,
      register,
      logout,
      fetchMe,
      refreshAccessToken,
      updateProfile,
      changePassword,
    }),
    [
      user,
      accessToken,
      isLoading,
      login,
      register,
      logout,
      fetchMe,
      refreshAccessToken,
      updateProfile,
      changePassword,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}