import { http } from "./http";

export type LoginRequest = {
  username: string;
  password: string;
};

export type RegisterRequest = {
  username: string;
  email: string;
  password: string;
  rolIds?: number[];
};

export type UsuarioResponse = {
  id: number;
  createdAt: string;
  updatedAt: string;
  active: boolean;
  empresaId: number;
  username: string;
  email: string;
  roles: Array<{ id: number; nombre: string }>;
};

export type LoginResponse = {
  token: string;
  type: string;
  usuario: UsuarioResponse;
};

export const authService = {
  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await http.post<LoginResponse>("/api/auth/login", data);
    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("usuario", JSON.stringify(response.data.usuario));
    }
    return response.data;
  },

  async register(data: RegisterRequest): Promise<LoginResponse> {
    const response = await http.post<LoginResponse>("/api/auth/register", data);
    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("usuario", JSON.stringify(response.data.usuario));
    }
    return response.data;
  },

  logout(): void {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
  },

  getToken(): string | null {
    return localStorage.getItem("token");
  },

  getUsuario(): UsuarioResponse | null {
    const usuario = localStorage.getItem("usuario");
    return usuario ? JSON.parse(usuario) : null;
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
};
