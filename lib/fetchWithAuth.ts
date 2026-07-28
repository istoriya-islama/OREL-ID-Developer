import { api } from './api'

let isRefreshing = false
let refreshSubscribers: ((token: string) => void)[] = []

function subscribeTokenRefresh(cb: (token: string) => void) {
    refreshSubscribers.push(cb)
}

function onTokenRefreshed(token: string) {
	refreshSubscribers.forEach(cb => cb(token))
	refreshSubscribers = []
}

export async function fetchWithAuth(
	url: string,
	options: RequestInit = {},
): Promise<Response> {
	const config: RequestInit = {
		...options,
		credentials: 'include',
	}

	let response = await fetch(url, config)

	if (response.status === 401) {
		if (isRefreshing) {
			return new Promise(resolve => {
				subscribeTokenRefresh(async () => {
					const retryResponse = await fetch(url, config)
					resolve(retryResponse)
				})
			})
		}

		isRefreshing = true

		try {
			await api.refreshToken()

			isRefreshing = false
			onTokenRefreshed('new-token')

			response = await fetch(url, config)
		} catch (error) {
			isRefreshing = false
			refreshSubscribers = []

			try {
				await api.logout()
			} catch {}

			if (typeof window !== 'undefined') {
				console.log("Not Account OREL ID")
			}

			throw error
		}
	}

    return response
}
