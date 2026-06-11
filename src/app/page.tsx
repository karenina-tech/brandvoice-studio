'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApiKey } from '@/hooks/useApiKey';
import { SettingsPanel } from '@/components/SettingsPanel';
import { BrandVoiceForm } from '@/components/BrandVoiceForm';
import { OutputDisplay } from '@/components/OutputDisplay';
import { generatePrompt } from '@/services/apiService';
import { isErr } from '@/lib/result';
import { isApiError } from '@/lib/ai/errors';
import type { BrandVoiceInput, BrandVoiceResponse } from '@/lib/validation';

export default function Page() {
	const { t } = useTranslation();
	const aiSettings = useApiKey();
	const { isSettingsValid } = aiSettings;

	const [settingsOpen, setSettingsOpen] = useState(false);
	const [result, setResult] = useState<BrandVoiceResponse | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [errorMsg, setErrorMsg] = useState<string | null>(null);

	async function handleSubmit(data: BrandVoiceInput) {
		if (!isSettingsValid) {
			setErrorMsg(t('errors.api_key_missing'));
			setSettingsOpen(true);
			return;
		}
		setIsLoading(true);
		setErrorMsg(null);
		setResult(null);

		const generated = await generatePrompt(data, aiSettings.provider, aiSettings.apiKey);

		if (isErr(generated)) {
			const error = generated[0];
			if (isApiError(error)) {
				if (error.statusCode === 429) setErrorMsg(t('errors.rate_limit'));
				else if (error.statusCode === 502) setErrorMsg(t('errors.ai_service'));
				else setErrorMsg(error.message);
			} else {
				setErrorMsg(t('errors.network'));
			}
		} else {
			setResult(generated[1]);
		}

		setIsLoading(false);
	}

	return (
		<div className='min-h-screen bg-cream-100'>
			<header className='border-b border-cream-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10'>
				<div className='max-w-2xl mx-auto px-4 h-14 flex items-center justify-between'>
					<span className='font-display font-bold text-brand-700 text-xl tracking-tight'>
						{t('app.title')}
					</span>

					<button
						onClick={() => setSettingsOpen(true)}
						aria-label={t('settings.button')}
						className='flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-600 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-200 rounded-lg px-3 py-1.5'>
						<svg
							xmlns='http://www.w3.org/2000/svg'
							className='h-4 w-4'
							viewBox='0 0 20 20'
							fill='currentColor'>
							<path
								fillRule='evenodd'
								d='M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z'
								clipRule='evenodd'
							/>
						</svg>
						{t('settings.button')}
						{isSettingsValid && <span className='w-1.5 h-1.5 rounded-full bg-emerald-400' />}
					</button>
				</div>
			</header>

			<main className='max-w-2xl mx-auto px-4 py-10 space-y-8'>
				{!isSettingsValid && (
					<div
						role='alert'
						className='bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 flex items-center gap-2'>
						<span>⚠️</span>
						<span>
							{t('settings.missing')}{' '}
							<button
								onClick={() => setSettingsOpen(true)}
								className='font-semibold underline underline-offset-2 hover:no-underline'>
								{t('settings.button')}
							</button>
						</span>
					</div>
				)}

				<div className='bg-white rounded-2xl shadow-sm border border-gray-100 p-8'>
					<h1 className='font-display text-3xl font-bold text-gray-900 mb-1'>{t('form.title')}</h1>
					<p className='text-sm text-gray-400 mb-7'>{t('app.tagline')}</p>
					<BrandVoiceForm onSubmit={handleSubmit} isLoading={isLoading} />
				</div>

				{errorMsg && (
					<div
						role='alert'
						className='bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700'>
						{errorMsg}
					</div>
				)}

				{result && (
					<section aria-labelledby='output-heading'>
						<h2 id='output-heading' className='font-display text-2xl font-bold text-gray-900 mb-5'>
							{t('output.title')}
						</h2>
						<OutputDisplay result={result} onRegenerate={() => setResult(null)} />
					</section>
				)}
			</main>

			<SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} hook={aiSettings} />
		</div>
	);
}
