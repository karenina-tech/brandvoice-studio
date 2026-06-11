'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { brandVoiceInputSchema, OUTPUT_LANGUAGES } from '@/lib/validation';
import type { BrandVoiceInput } from '@/lib/validation';

interface Props {
  onSubmit: (data: BrandVoiceInput) => Promise<void>;
  isLoading: boolean;
}

type FormState = Omit<BrandVoiceInput, 'outputLanguage'> & { outputLanguage: string };
type FieldErrors = Partial<Record<keyof BrandVoiceInput, string>>;

const INITIAL: FormState = {
  productName: '',
  fabricDetails: '',
  instagramVibe: '',
  outputLanguage: 'es',
};

export function BrandVoiceForm({ onSubmit, isLoading }: Props) {
  const { t } = useTranslation();
  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<FieldErrors>({});

  function handleChange(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof BrandVoiceInput]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = brandVoiceInputSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of result.error.errors) {
        const key = issue.path[0] as keyof BrandVoiceInput | undefined;
        if (key) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    await onSubmit(result.data);
  }

  const fieldClass = (field: keyof BrandVoiceInput) =>
    `w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition resize-none ${
      errors[field]
        ? 'border-red-400 focus:ring-red-200 bg-red-50'
        : 'border-gray-200 focus:ring-brand-200 focus:border-brand-400 bg-white'
    }`;

  return (
    <form onSubmit={(e) => void handleSubmit(e)} noValidate className="space-y-5">
      <div>
        <label htmlFor="productName" className="block text-sm font-medium text-gray-700 mb-1">
          {t('form.productName.label')}
        </label>
        <input
          id="productName"
          type="text"
          value={form.productName}
          onChange={(e) => handleChange('productName', e.target.value)}
          placeholder={t('form.productName.placeholder')}
          maxLength={100}
          className={fieldClass('productName')}
          aria-describedby={errors.productName ? 'productName-error' : 'productName-hint'}
        />
        {errors.productName ? (
          <p id="productName-error" role="alert" className="mt-1 text-xs text-red-600">{errors.productName}</p>
        ) : (
          <p id="productName-hint" className="mt-1 text-xs text-gray-400">{t('form.productName.hint')}</p>
        )}
      </div>

      <div>
        <label htmlFor="fabricDetails" className="block text-sm font-medium text-gray-700 mb-1">
          {t('form.fabricDetails.label')}
        </label>
        <textarea
          id="fabricDetails"
          rows={4}
          value={form.fabricDetails}
          onChange={(e) => handleChange('fabricDetails', e.target.value)}
          placeholder={t('form.fabricDetails.placeholder')}
          maxLength={500}
          className={fieldClass('fabricDetails')}
          aria-describedby={errors.fabricDetails ? 'fabricDetails-error' : 'fabricDetails-hint'}
        />
        <div className="mt-1 flex justify-between">
          {errors.fabricDetails ? (
            <p id="fabricDetails-error" role="alert" className="text-xs text-red-600">{errors.fabricDetails}</p>
          ) : (
            <p id="fabricDetails-hint" className="text-xs text-gray-400">{t('form.fabricDetails.hint')}</p>
          )}
          <span className="text-xs text-gray-300 ml-2 shrink-0">{form.fabricDetails.length}/500</span>
        </div>
      </div>

      <div>
        <label htmlFor="instagramVibe" className="block text-sm font-medium text-gray-700 mb-1">
          {t('form.instagramVibe.label')}
        </label>
        <input
          id="instagramVibe"
          type="text"
          value={form.instagramVibe}
          onChange={(e) => handleChange('instagramVibe', e.target.value)}
          placeholder={t('form.instagramVibe.placeholder')}
          maxLength={200}
          className={fieldClass('instagramVibe')}
          aria-describedby={errors.instagramVibe ? 'instagramVibe-error' : 'instagramVibe-hint'}
        />
        {errors.instagramVibe ? (
          <p id="instagramVibe-error" role="alert" className="text-xs text-red-600">{errors.instagramVibe}</p>
        ) : (
          <p id="instagramVibe-hint" className="mt-1 text-xs text-gray-400">{t('form.instagramVibe.hint')}</p>
        )}
      </div>

      <div>
        <label htmlFor="outputLanguage" className="block text-sm font-medium text-gray-700 mb-1">
          {t('form.outputLanguage.label')}
        </label>
        <select
          id="outputLanguage"
          value={form.outputLanguage}
          onChange={(e) => handleChange('outputLanguage', e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition"
        >
          {OUTPUT_LANGUAGES.map((lang) => (
            <option key={lang} value={lang}>
              {t(`form.outputLanguage.${lang}`)}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-brand-500 hover:bg-brand-600 active:bg-brand-700 disabled:bg-brand-200 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand-300 focus:ring-offset-2"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {t('form.submitting')}
          </span>
        ) : (
          t('form.submit')
        )}
      </button>
    </form>
  );
}
