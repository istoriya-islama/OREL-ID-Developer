import { ReCaptchaProvider } from '@/components/ReCaptchaProvider'
import { AuthProvider } from '@/lib/auth-context'
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
	title: 'OREL ID Developer',
	description: 'Developer portal for OREL ID platform',
	/*icons: {
		icon: '/favicon.ico',
	},*/
}

export default function RootLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<html lang='ru' className='dark'>
			<body className='min-h-screen bg-dark-bg text-gray-100'>
				<ReCaptchaProvider>
					<AuthProvider>{children}</AuthProvider>
				</ReCaptchaProvider>
			</body>
		</html>
	)
}
