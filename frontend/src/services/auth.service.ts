import { api } from "./api";
import type { MessageResponse, UserResponse } from "@/types/api";
import type { User } from "@/types/models";

export interface RegisterInput {
  fullName: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export const authService = {
  async register(input: RegisterInput): Promise<User> {
    const { data } = await api.post<UserResponse>("/auth/register", input);
    return data.user;
  },

  async login(input: LoginInput): Promise<User> {
    const { data } = await api.post<UserResponse>("/auth/login", input);
    return data.user;
  },

  async logout(): Promise<void> {
    await api.post<MessageResponse>("/auth/logout");
  },

  async me(): Promise<User> {
    const { data } = await api.get<{ success: boolean; user: User }>(
      "/auth/me"
    );
    return data.user;
  },
};
