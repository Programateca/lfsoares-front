import { api } from "@/lib/axios";

export type Role = "User";

export type LoginResponseData = {
  refreshToken: string;
  token: string;
  user: {
    id: number;
    email: string;
    name: string;
    role: { id: number; name: Role };
  };
};

export type LoginCredentials = {
  email: string;
  password: string;
};

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponseData> {
    const response = await api.post<LoginResponseData>(
      "auth/email/login",
      credentials
    );
    return response.data;
  },
};
