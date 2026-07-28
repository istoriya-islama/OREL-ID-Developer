'use client'

import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3'

export function ReCaptchaProvider({ children }: { children: React.ReactNode }) {
	return (
		<GoogleReCaptchaProvider reCaptchaKey='6LfWLF0sAAAAAEVMjBJ_Hu1amaR0VdPUP7a2yFCo'>
			{children}
		</GoogleReCaptchaProvider>
	)
}