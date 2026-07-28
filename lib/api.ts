import { fetchWithAuth } from './fetchWithAuth'

const API_URL = 'https://orel-insider-api.onrender.com'

// ─── Types ───────────────────────────────────────────────────────────────────

export type UserRole = 'user' | 'developer' | 'developer_verified' | 'admin'

export interface User {
	_id: string
	name: string
	email: string
	role: UserRole
	isAdmin: boolean
	filesCount: number
	createdAt: string
	updatedAt: string
}

export interface CreateUserDto {
	name: string
	email: string
	password: string
	recaptchaToken?: string
}

export interface LoginDto {
	email: string
	password: string
}

export interface LoginResponse {
	message: string
	user: User
}

export interface StorageFile {
	_id: string
	userId: string
	fileName: string
	megaLink: string
	size: number
	createdAt: string
	updatedAt: string
}

// ─── API (аккаунт + Storage) ──────────────────────────────────────────────────

export const api = {
	// ── Без автообновления ────────────────────────────────────────────────

	async register(data: CreateUserDto): Promise<User> {
		const res = await fetch(`${API_URL}/users`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'include',
			body: JSON.stringify(data),
		})
		if (!res.ok) {
			const error = await res.json()
			throw new Error(error.message || 'Registration failed')
		}
		return res.json()
	},

	async login(data: LoginDto): Promise<LoginResponse> {
		const res = await fetch(`${API_URL}/auth/login`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'include',
			body: JSON.stringify(data),
		})
		if (!res.ok) {
			const error = await res.json()
			throw new Error(error.message || 'Login failed')
		}
		return res.json()
	},

	async refreshToken(): Promise<{ message: string }> {
		const res = await fetch(`${API_URL}/auth/refresh`, {
			method: 'POST',
			credentials: 'include',
		})
		if (!res.ok) {
			throw new Error('Refresh failed')
		}
		return res.json()
	},

	async forgotPassword(email: string): Promise<{ message: string }> {
		const res = await fetch(`${API_URL}/auth/forgot-password`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email }),
		})
		if (!res.ok) {
			const error = await res.json()
			throw new Error(error.message || 'Request failed')
		}
		return res.json()
	},

	async resetPassword(
		token: string,
		password: string,
	): Promise<{ message: string }> {
		const res = await fetch(`${API_URL}/auth/reset-password`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ token, password }),
		})
		if (!res.ok) {
			const error = await res.json()
			throw new Error(error.message || 'Reset failed')
		}
		return res.json()
	},

	// ── С автообновлением ─────────────────────────────────────────────────

	async logout(): Promise<{ message: string }> {
		const res = await fetchWithAuth(`${API_URL}/auth/logout`, {
			method: 'POST',
		})
		if (!res.ok) {
			throw new Error('Logout failed')
		}
		return res.json()
	},

	async getCurrentUser(): Promise<User> {
		const res = await fetchWithAuth(`${API_URL}/users/me`)
		if (!res.ok) {
			throw new Error('Not authenticated')
		}
		return res.json()
	},

	async updateUser(
		id: string,
		data: { name?: string; email?: string; password?: string },
	): Promise<User> {
		const res = await fetchWithAuth(`${API_URL}/users/${id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data),
		})
		if (!res.ok) {
			const error = await res.json()
			throw new Error(error.message || 'Update failed')
		}
		return res.json()
	},

	async deleteUser(id: string): Promise<{ message: string }> {
		const res = await fetchWithAuth(`${API_URL}/users/${id}`, {
			method: 'DELETE',
		})
		if (!res.ok) {
			const error = await res.json()
			throw new Error(error.message || 'Delete failed')
		}
		return res.json()
	},

	async becomeDeveloper(): Promise<{ message: string }> {
		const res = await fetchWithAuth(`${API_URL}/users/become-developer`, {
			method: 'POST',
		})
		if (!res.ok) {
			const error = await res.json()
			throw new Error(error.message || 'Failed')
		}
		return res.json()
	},

	// ── Storage ───────────────────────────────────────────────────────────

	async uploadFile(file: File): Promise<{ message: string; link: string }> {
		const formData = new FormData()
		formData.append('file', file)

		const res = await fetchWithAuth(`${API_URL}/storage/upload`, {
			method: 'POST',
			body: formData,
		})
		if (!res.ok) {
			const error = await res.json()
			throw new Error(error.message || 'Upload failed')
		}
		return res.json()
	},

	async getMyFiles(): Promise<StorageFile[]> {
		const res = await fetchWithAuth(`${API_URL}/storage`)
		if (!res.ok) {
			throw new Error('Failed to fetch files')
		}
		return res.json()
	},

	async deleteFile(id: string): Promise<{ message: string }> {
		const res = await fetchWithAuth(`${API_URL}/storage/${id}`, {
			method: 'DELETE',
		})
		if (!res.ok) {
			// Сервер может вернуть пустой body — пробуем json, иначе текст
			const text = await res.text()
			let msg = 'Delete failed'
			try { msg = JSON.parse(text)?.message || msg } catch {}
			throw new Error(msg)
		}
		// 204 No Content — пустой body, json() упадёт
		const text = await res.text()
		if (!text) return { message: 'Deleted' }
		try { return JSON.parse(text) } catch { return { message: 'Deleted' } }
	},
}