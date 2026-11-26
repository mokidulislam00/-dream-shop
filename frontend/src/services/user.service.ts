import { api } from "./api";
import type { MessageResponse, UserResponse } from "@/types/api";
import type { User } from "@/types/models";

export interface UpdateProfileInput {
  fullName?: string;
  email?: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export const userService = {
  async getProfile(): Promise<User> {
    const { data } = await api.get<UserResponse>("/users/profile");
    return data.user;
  },

  async updateProfile(input: UpdateProfileInput): Promise<User> {
    const { data } = await api.patch<UserResponse>("/users/profile", input);
    return data.user;
  },

  // The backend signs out other sessions and re-issues this device's cookie.
  async changePassword(input: ChangePasswordInput): Promise<string> {
    const { data } = await api.patch<MessageResponse>(
      "/users/change-password",
      input
    );
    return data.message;
  },
};
