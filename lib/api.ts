import { fetchWithAuth } from './fetchWithAuth'

const API_URL = 'https://orel-insider-api.onrender.com'

// ─── Types ───────────────────────────────────────────────────────────────────

export type UserRole =
	| 'user'
	| 'insider'
	| 'developer'
	| 'developer_verified'
	| 'admin'

export interface User {
	_id: string
	name: string
	email: string
	role: UserRole
	isAdmin: boolean
	twoFactorEnabled?: boolean
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

export interface TwoFactorChallenge {
	twoFactorRequired: true
	challengeToken: string
	message: string
}

/** Ответ входа: либо вошли, либо нужен код 2FA */
export type LoginResult = LoginResponse | TwoFactorChallenge

export function isTwoFactorChallenge(r: LoginResult): r is TwoFactorChallenge {
	return 'twoFactorRequired' in r && r.twoFactorRequired === true
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

export interface OidcApp {
	clientId: string
	name: string
	redirectUris: string[]
	confidential: boolean
	requiredRole: UserRole | null
	firstParty: boolean
	active: boolean
	createdAt: string
	updatedAt: string
}

export interface CreateAppDto {
	name: string
	redirectUris: string[]
	/** true: серверное приложение с секретом. По умолчанию public + PKCE */
	confidential?: boolean
	/** Только админ */
	requiredRole?: UserRole
	/** Только админ */
	firstParty?: boolean
}

export interface UpdateAppDto {
	name?: string
	redirectUris?: string[]
	active?: boolean
	/** Только админ. 'none' снимает ограничение */
	requiredRole?: UserRole | 'none'
	/** Только админ */
	firstParty?: boolean
}

async function handle<T>(res: Response, fallback: string): Promise<T> {
	if (!res.ok) {
		const error = await res.json().catch(() => null)
		const message = Array.isArray(error?.message)
			? error.message.join(', ')
			: error?.message
		throw new Error(message || fallback)
	}
	return res.json()
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

	async login(data: LoginDto): Promise<LoginResult> {
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

	/** Шаг 2 входа, если у аккаунта включена 2FA: код из приложения или резервный код */
	async verifyTwoFactorLogin(
		challengeToken: string,
		code: string,
	): Promise<LoginResponse> {
		const res = await fetch(`${API_URL}/auth/2fa/verify-login`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'include',
			body: JSON.stringify({ challengeToken, code }),
		})
		if (!res.ok) {
			const error = await res.json()
			throw new Error(error.message || 'Verification failed')
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

	/**
	 * Тихая проверка входа для страниц, которые должны работать и без входа.
	 * В отличие от getCurrentUser: без редиректа на страницу входа и без выхода из аккаунта.
	 * Возвращает пользователя или null (не вошёл / нет сети).
	 */
	async getSession(): Promise<User | null> {
		const read = () => fetch(`${API_URL}/users/me`, { credentials: 'include' })
		try {
			let res = await read()
			if (res.status === 401) {
				await api.refreshToken()
				res = await read()
			}
			return res.ok ? ((await res.json()) as User) : null
		} catch {
			return null
		}
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

	// ── Приложения («Войти через OREL ID») ────────────────────────────────

	/** clientSecret приходит ТОЛЬКО здесь и только для confidential-приложений */
	async createApp(
		data: CreateAppDto,
	): Promise<{ app: OidcApp; clientSecret?: string }> {
		const res = await fetchWithAuth(`${API_URL}/developer/apps`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data),
		})
		return handle(res, 'Failed to create app')
	},

	async getApps(): Promise<OidcApp[]> {
		const res = await fetchWithAuth(`${API_URL}/developer/apps`)
		return handle(res, 'Failed to fetch apps')
	},

	async getApp(clientId: string): Promise<OidcApp> {
		const res = await fetchWithAuth(`${API_URL}/developer/apps/${clientId}`)
		return handle(res, 'App not found')
	},

	async updateApp(clientId: string, data: UpdateAppDto): Promise<OidcApp> {
		const res = await fetchWithAuth(`${API_URL}/developer/apps/${clientId}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data),
		})
		return handle(res, 'Failed to update app')
	},

	/** Новый секрет показывается один раз, старый перестаёт работать */
	async rotateAppSecret(clientId: string): Promise<{ clientSecret: string }> {
		const res = await fetchWithAuth(
			`${API_URL}/developer/apps/${clientId}/rotate-secret`,
			{ method: 'POST' },
		)
		return handle(res, 'Failed to rotate secret')
	},

	async deleteApp(clientId: string): Promise<{ message: string }> {
		const res = await fetchWithAuth(`${API_URL}/developer/apps/${clientId}`, {
			method: 'DELETE',
		})
		return handle(res, 'Failed to delete app')
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