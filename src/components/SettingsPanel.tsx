'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AI_PROVIDERS } from '@/lib/validation';
import type { AiProvider } from '@/lib/validation';
import type { useApiKey } from '@/hooks/useApiKey';

interface Props {
	isOpen: boolean;
	onClose: () => void;
	hook: ReturnType<typeof useApiKey>;
	credits: number | null;
}

const PROVIDER_HINT_KEY: Record<AiProvider, string> = {
	google: 'settings.format_hint_google',
	openai: 'settings.format_hint_openai',
	anthropic: 'settings.format_hint_anthropic'
};

const PROVIDER_PLACEHOLDER_KEY: Record<AiProvider, string> = {
	google: 'settings.key_placeholder_google',
	openai: 'settings.key_placeholder_openai',
	anthropic: 'settings.key_placeholder_anthropic'
};

// Matches INITIAL_CREDITS in db-service — used only for the progress bar visual
const MAX_CREDITS = 15;

function IconKey({ className }: { className?: string }) {
	return (
		<svg
			xmlns='http://www.w3.org/2000/svg'
			fill='none'
			viewBox='0 0 24 24'
			strokeWidth={1.5}
			stroke='currentColor'
			className={className}>
			<path
				strokeLinecap='round'
				strokeLinejoin='round'
				d='M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z'
			/>
		</svg>
	);
}

function IconSparkles({ className }: { className?: string }) {
	return (
		<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor' className={className}>
			<path
				fillRule='evenodd'
				d='M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813A3.75 3.75 0 007.466 7.89l.813-2.846A.75.75 0 019 4.5zM18 1.5a.75.75 0 01.728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 010 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 01-1.456 0l-.258-1.036a2.625 2.625 0 00-1.91-1.91l-1.036-.258a.75.75 0 010-1.456l1.036-.258a2.625 2.625 0 001.91-1.91l.258-1.036A.75.75 0 0118 1.5z'
				clipRule='evenodd'
			/>
		</svg>
	);
}

function IconCheckCircle({ className }: { className?: string }) {
	return (
		<svg
			xmlns='http://www.w3.org/2000/svg'
			fill='none'
			viewBox='0 0 24 24'
			strokeWidth={2}
			stroke='currentColor'
			className={className}>
			<path
				strokeLinecap='round'
				strokeLinejoin='round'
				d='M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
			/>
		</svg>
	);
}

function IconExternalLink({ className }: { className?: string }) {
	return (
		<svg
			xmlns='http://www.w3.org/2000/svg'
			fill='none'
			viewBox='0 0 24 24'
			strokeWidth={2}
			stroke='currentColor'
			className={className}>
			<path
				strokeLinecap='round'
				strokeLinejoin='round'
				d='M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25'
			/>
		</svg>
	);
}

export function SettingsPanel({ isOpen, onClose, hook, credits }: Props) {
	const { t } = useTranslation();
	const { mode, provider: savedProvider, isSettingsValid, saveSettings, removeSettings, switchMode } = hook;

	const [draftProvider, setDraftProvider] = useState<AiProvider>(savedProvider);
	const [draftKey, setDraftKey] = useState('');
	const [feedback, setFeedback] = useState<'idle' | 'saved' | 'error'>('idle');
	const inputRef = useRef<HTMLInputElement>(null);
	const [showRechargeSoon, setShowRechargeSoon] = useState(false);
	const [isWizardOpen, setIsWizardOpen] = useState(false);

	useEffect(() => {
		if (isOpen) {
			setDraftProvider(savedProvider);
			setDraftKey('');
			setFeedback('idle');
			setShowRechargeSoon(false);
			setIsWizardOpen(false);
			if (mode === 'byok') {
				setTimeout(() => inputRef.current?.focus(), 50);
			}
		}
	}, [isOpen, savedProvider, mode]);

	function handleSave() {
		const saved = saveSettings(draftProvider, draftKey.trim());
		if (saved) {
			switchMode('byok');
			setFeedback('saved');
			setTimeout(onClose, 900);
		} else {
			setFeedback('error');
		}
	}

	function handleRemove() {
		removeSettings();
		setDraftKey('');
		setFeedback('idle');
	}

	function handleRecharge() {
		// Stub — replace with Stripe Checkout session creation in production
		setShowRechargeSoon(true);
	}

	if (!isOpen) return null;

	const creditCount = credits ?? 0;
	const creditPct = credits === null ? 0 : Math.min(100, (creditCount / MAX_CREDITS) * 100);

	const guideSteps = [
		{ title: t('wizard.guide.step1.title'), desc: t('wizard.guide.step1.desc') },
		{ title: t('wizard.guide.step2.title'), desc: t('wizard.guide.step2.desc') },
		{ title: t('wizard.guide.step3.title'), desc: t('wizard.guide.step3.desc') },
		{ title: t('wizard.guide.step4.title'), desc: t('wizard.guide.step4.desc') },
		{ title: t('wizard.guide.step5.title'), desc: t('wizard.guide.step5.desc') }
	];

	return (
		<div
			role='dialog'
			aria-modal='true'
			aria-labelledby='settings-title'
			className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4'
			onClick={(e) => e.target === e.currentTarget && onClose()}>
			<div className='bg-white rounded-2xl shadow-2xl w-full max-w-md relative max-h-[92vh] overflow-y-auto'>
				{/* ── Header ──────────────────────────────────────────────────────── */}

				<div className='px-8 pt-8 pb-0'>
					<button
						onClick={onClose}
						aria-label='Cerrar'
						className='absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors'>
						<svg
							xmlns='http://www.w3.org/2000/svg'
							className='h-5 w-5'
							viewBox='0 0 20 20'
							fill='currentColor'>
							<path
								fillRule='evenodd'
								d='M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z'
								clipRule='evenodd'
							/>
						</svg>
					</button>

					<h2 id='settings-title' className='font-display text-xl font-bold text-gray-900 mb-1 pr-6'>
						{t('wizard.title')}
					</h2>
					<p className='text-xs text-gray-400 mb-5 leading-relaxed'>{t('settings.description')}</p>

					{/* ── Mode selector cards ──────────────────────────────────────── */}
					<div className='grid grid-cols-2 gap-3 mb-6'>
						<button
							onClick={() => {
								switchMode('byok');
								setFeedback('idle');
							}}
							className={`rounded-xl border-2 p-4 text-left transition-all focus:outline-none focus:ring-2 focus:ring-brand-200 ${
								mode === 'byok'
									? 'border-brand-400 bg-brand-50'
									: 'border-gray-200 bg-white hover:border-brand-200 hover:bg-cream-50'
							}`}>
							<IconKey className={`h-6 w-6 mb-2 ${mode === 'byok' ? 'text-brand-600' : 'text-gray-400'}`} />
							<div
								className={`font-semibold text-sm leading-tight ${mode === 'byok' ? 'text-brand-800' : 'text-gray-700'}`}>
								{t('wizard.byok_card_title')}
							</div>
							<div className='text-xs text-emerald-600 font-medium mt-1.5'>{t('wizard.byok_card_badge')}</div>
							{mode === 'byok' && isSettingsValid && (
								<div className='mt-1.5'>
									<span className='inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full'>
										<span className='w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block' />
										{t('wizard.active_badge')}
									</span>
								</div>
							)}
						</button>

						<button
							onClick={() => {
								switchMode('managed');
								setFeedback('idle');
							}}
							className={`rounded-xl border-2 p-4 text-left transition-all focus:outline-none focus:ring-2 focus:ring-brand-200 ${
								mode === 'managed'
									? 'border-brand-400 bg-brand-50'
									: 'border-gray-200 bg-white hover:border-brand-200 hover:bg-cream-50'
							}`}>
							<IconSparkles
								className={`h-6 w-6 mb-2 ${mode === 'managed' ? 'text-brand-600' : 'text-gray-400'}`}
							/>
							<div
								className={`font-semibold text-sm leading-tight ${mode === 'managed' ? 'text-brand-800' : 'text-gray-700'}`}>
								{t('wizard.managed_card_title')}
							</div>
							<div className='text-xs text-brand-500 font-medium mt-1.5'>
								{t('wizard.managed_card_badge')}
							</div>
							{mode === 'managed' && (
								<div className='mt-1.5'>
									<span className='inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full'>
										<span className='w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block' />
										{t('wizard.active_badge')}
									</span>
								</div>
							)}
						</button>
					</div>
				</div>

				<div className='border-t border-gray-100 mx-8 mb-6' />

				{/* ── Content area ────────────────────────────────────────────────── */}
				<div className='px-8 pb-8'>
					{mode === 'byok' ? (
						/* ── Path A: BYOK ─────────────────────────────────────────────── */
						<div className='space-y-5'>
							{/* Collapsible 5-step guide */}
							<div className='rounded-xl border border-amber-200 bg-amber-50 overflow-hidden'>
								{/* Toggle trigger */}
								<button
									type='button'
									onClick={() => setIsWizardOpen((v) => !v)}
									aria-expanded={isWizardOpen}
									className='w-full flex items-center justify-between px-5 py-4 text-left focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-200'>
									<span className='text-xs font-medium text-amber-800'>
										{t('wizard.guide.toggle')}
									</span>
									<svg
										className={`h-4 w-4 text-amber-600 flex-shrink-0 transition-transform duration-300 ${isWizardOpen ? 'rotate-180' : ''}`}
										fill='none'
										viewBox='0 0 24 24'
										stroke='currentColor'
										strokeWidth={2}>
										<path strokeLinecap='round' strokeLinejoin='round' d='M19 9l-7 7-7-7' />
									</svg>
								</button>

								{/* Smooth height reveal via CSS grid trick */}
								<div
									className={`grid transition-all duration-300 ease-in-out ${isWizardOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
									<div className='overflow-hidden'>
										<div className='px-5 pb-4 border-t border-amber-200'>
											<p className='text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-5 mt-4'>
												{t('wizard.guide.title')}
											</p>

											<div>
												{guideSteps.map((step, i) => (
													<div key={i} className='relative flex gap-4 pb-6 last:pb-0'>
														{/* Vertical connecting line between badges */}
														{i < guideSteps.length - 1 && (
															<div className='absolute left-[19px] top-10 bottom-0 w-0.5 bg-amber-300' />
														)}

														{/* Step number badge */}
														<div className='relative z-10 flex-shrink-0 w-10 h-10 rounded-full bg-brand-500 text-white font-bold text-sm flex items-center justify-center shadow-sm ring-2 ring-amber-50'>
															{i + 1}
														</div>

														{/* Step content */}
														<div className='flex-1 min-w-0 pt-1.5'>
															<p className='text-sm font-semibold text-gray-800 leading-snug'>{step.title}</p>
															<p className='text-xs text-gray-500 mt-1 leading-relaxed'>{step.desc}</p>

															{/* Step 1 — clickable link to the platform */}
															{i === 0 && (
																<a
																	href='https://aistudio.google.com'
																	target='_blank'
																	rel='noopener noreferrer'
																	className='mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 underline underline-offset-2 transition-colors'>
																	aistudio.google.com
																	<IconExternalLink className='h-3 w-3 flex-shrink-0' />
																</a>
															)}

															{/* Step 4 — sub-bullets + reassurance callout */}
															{i === 3 && (
																<div className='mt-3 space-y-3'>
																	<ul className='space-y-2'>
																		<li className='flex gap-2 text-xs text-gray-500'>
																			<span className='text-brand-400 font-bold flex-shrink-0 mt-px'>›</span>
																			<span>
																				<span className='font-semibold text-gray-700'>
																					{t('wizard.guide.step4.sub1_label')}:
																				</span>{' '}
																				{t('wizard.guide.step4.sub1_desc')}
																			</span>
																		</li>
																		<li className='flex gap-2 text-xs text-gray-500'>
																			<span className='text-brand-400 font-bold flex-shrink-0 mt-px'>›</span>
																			<span>
																				<span className='font-semibold text-gray-700'>
																					{t('wizard.guide.step4.sub2_label')}:
																				</span>{' '}
																				{t('wizard.guide.step4.sub2_desc')}
																			</span>
																		</li>
																	</ul>

																	{/* Reassurance callout — eliminates anxiety about "My First Project" */}
																	<div className='flex gap-2.5 items-start rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2.5'>
																		<IconCheckCircle className='h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5' />
																		<p className='text-xs text-emerald-700 leading-relaxed font-medium'>
																			{t('wizard.guide.step4.reassurance')}
																		</p>
																	</div>
																</div>
															)}
														</div>
													</div>
												))}
											</div>
										</div>
									</div>
								</div>
							</div>

							{/* Saved confirmation */}
							{isSettingsValid && feedback === 'idle' && (
								<div className='flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2'>
									<svg
										className='h-4 w-4 flex-shrink-0'
										fill='none'
										viewBox='0 0 24 24'
										stroke='currentColor'
										strokeWidth={2}>
										<path strokeLinecap='round' strokeLinejoin='round' d='M5 13l4 4L19 7' />
									</svg>
									<span>{t('settings.saved')}</span>
								</div>
							)}

							{/* Provider selector */}
							<div>
								<label htmlFor='provider-select' className='block text-sm font-medium text-gray-700 mb-1'>
									{t('settings.provider_label')}
								</label>
								<select
									id='provider-select'
									value={draftProvider}
									onChange={(e) => {
										setDraftProvider(e.target.value as AiProvider);
										setFeedback('idle');
									}}
									className='w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition'>
									{AI_PROVIDERS.map((p) => (
										<option key={p} value={p}>
											{t(`settings.providers.${p}`)}
										</option>
									))}
								</select>
							</div>

							{/* API key input */}
							<div>
								<label htmlFor='api-key-input' className='block text-sm font-medium text-gray-700 mb-1'>
									{t('settings.key_label')}
								</label>
								<input
									ref={inputRef}
									id='api-key-input'
									type='password'
									autoComplete='off'
									value={draftKey}
									onChange={(e) => {
										setDraftKey(e.target.value);
										setFeedback('idle');
									}}
									placeholder={t(PROVIDER_PLACEHOLDER_KEY[draftProvider])}
									className={`w-full border rounded-lg px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 transition ${
										feedback === 'error'
											? 'border-red-400 focus:ring-red-200 bg-red-50'
											: 'border-gray-300 focus:ring-brand-200 focus:border-brand-400'
									}`}
								/>
								<p className='mt-1.5 text-xs text-gray-400'>{t(PROVIDER_HINT_KEY[draftProvider])}</p>
								{feedback === 'error' && (
									<p role='alert' className='mt-1 text-xs text-red-600'>
										{t(PROVIDER_HINT_KEY[draftProvider])}
									</p>
								)}
							</div>

							{/* Actions */}
							<div className='flex gap-3 pt-1'>
								<button
									onClick={handleSave}
									className='flex-1 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white font-semibold text-sm rounded-lg py-2.5 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-300'>
									{feedback === 'saved' ? (
										<span className='flex items-center justify-center gap-1.5'>
											<svg
												className='h-4 w-4'
												fill='none'
												viewBox='0 0 24 24'
												stroke='currentColor'
												strokeWidth={2}>
												<path strokeLinecap='round' strokeLinejoin='round' d='M5 13l4 4L19 7' />
											</svg>
											{t('settings.saved')}
										</span>
									) : (
										t('settings.save')
									)}
								</button>
								{isSettingsValid && (
									<button
										onClick={handleRemove}
										className='px-4 text-sm text-gray-500 hover:text-red-600 border border-gray-200 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-200'>
										{t('settings.remove')}
									</button>
								)}
							</div>
						</div>
					) : (
						/* ── Path B: Managed Credits ──────────────────────────────────── */
						<div className='space-y-5'>
							<p className='text-sm text-gray-500 leading-relaxed text-center italic'>
								{t('wizard.credits_tagline')}
							</p>

							{/* Credit display */}
							<div className='rounded-2xl bg-brand-50 border border-brand-100 p-6 flex flex-col items-center gap-4'>
								{credits === null ? (
									<div className='text-sm text-brand-400 py-4'>{t('wizard.credits_loading')}</div>
								) : (
									<>
										<div className='text-center'>
											<div className='font-display text-6xl font-bold text-brand-600 leading-none tabular-nums'>
												{creditCount}
											</div>
											<div className='text-sm text-brand-500 font-medium mt-2'>
												{creditCount === 1
													? t('wizard.credits_display_one')
													: t('wizard.credits_display', { count: creditCount })}
											</div>
										</div>

										<div className='w-full bg-white rounded-full h-2 border border-brand-100'>
											<div
												className='bg-brand-400 h-2 rounded-full transition-all duration-500'
												style={{ width: `${creditPct}%` }}
												role='progressbar'
												aria-valuenow={creditCount}
												aria-valuemin={0}
												aria-valuemax={MAX_CREDITS}
											/>
										</div>

										{creditCount === 0 && (
											<p role='alert' className='text-xs text-red-600 text-center'>
												{t('wizard.credits_zero')}
											</p>
										)}
									</>
								)}
							</div>

							<button
								onClick={handleRecharge}
								className='w-full bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white font-semibold text-sm rounded-lg py-3 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-300'>
								{t('wizard.credits_recharge')}
							</button>

							{showRechargeSoon && (
								<p className='text-xs text-center text-gray-400 leading-relaxed'>
									{t('wizard.credits_recharge_soon')}
								</p>
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
