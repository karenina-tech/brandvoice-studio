'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { BrandVoiceResponse } from '@/lib/validation';

interface Props {
	result: BrandVoiceResponse;
	onRegenerate: () => void;
}

function PromptButton({ text, label }: { text: string; label: string }) {
	const { t } = useTranslation();
	const [copied, setCopied] = useState(false);

	async function handlePrompt() {
		await navigator.clipboard.writeText(text);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	}

	return (
		<button
			onClick={() => void handlePrompt()}
			aria-label={label}
			className='text-xs font-medium text-brand-600 hover:text-brand-800 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-200 rounded px-2 py-1'>
			{copied ? t('output.copied') : label}
		</button>
	);
}

export function OutputDisplay({ result, onRegenerate }: Props) {
	const { t } = useTranslation();

	return (
		<div className='space-y-5 animate-in fade-in duration-300'>
			<div className='bg-white rounded-2xl border border-brand-100 shadow-sm p-6'>
				<div className='flex items-center justify-between mb-3'>
					<h3 className='font-display font-bold text-gray-900 text-lg'>{t('output.caption_label')}</h3>
					<PromptButton text={result.instagramCaption} label={t('output.Prompt_caption')} />
				</div>
				<p className='text-gray-700 leading-relaxed text-base whitespace-pre-wrap'>
					{result.instagramCaption}
				</p>
			</div>

			<div className='bg-gray-50 rounded-2xl border border-gray-100 p-6'>
				<div className='flex items-center justify-between mb-3'>
					<h3 className='font-semibold text-gray-700 text-sm uppercase tracking-wide'>
						{t('output.prompt_label')}
					</h3>
					<PromptButton text={result.imageGenerationPrompt} label={t('output.Prompt_prompt')} />
				</div>
				<p className='text-gray-500 text-sm leading-relaxed font-mono'>{result.imageGenerationPrompt}</p>
			</div>

			<button
				onClick={onRegenerate}
				className='w-full border border-brand-200 text-brand-600 hover:bg-brand-50 font-medium text-sm rounded-xl py-2.5 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-300'>
				{t('output.regenerate')}
			</button>
		</div>
	);
}
