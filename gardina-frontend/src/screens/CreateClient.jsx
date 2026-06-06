import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { clientsAPI } from '../services/api';
import Icon from '../components/common/Icon';

const CreateClient = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { t } = useI18n();
    const { register, handleSubmit, formState: { errors } } = useForm();
    const [saving, setSaving] = useState(false);

    const onSubmit = async (data) => {
        try {
            setSaving(true);
            await clientsAPI.create({
                name: data.name,
                phone: data.phone,
                whatsapp: data.phone,
                email: data.email || null,
                address: data.address,
                notes: data.notes || '',
                source: data.source || 'Менеджер',
                createdBy: user.id,
            });
            setSaving(false);
            navigate(user?.role === 'sales' ? '/sales/clients' : user?.role === 'admin' ? '/admin/clients' : '/manager/clients');
        } catch (error) {
            setSaving(false);
        }
    };

    return (
        <div className="bg-background-light min-h-screen pb-32">
            <header className="sticky top-0 z-30 bg-card border-b border-border px-4 py-3">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="size-10 rounded-full hover:bg-muted flex items-center justify-center -ml-2" aria-label={t('common.back')}>
                        <Icon name="arrow_back" className="text-muted-foreground" />
                    </button>
                    <h1 className="text-xl font-bold text-foreground">{t('clients.create.title')}</h1>
                </div>
            </header>

            <main className="p-4 max-w-lg mx-auto">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold mb-1.5 text-foreground">{t('clients.create.fieldName')} *</label>
                                <input
                                    {...register('name', { required: true })}
                                    className="w-full px-4 py-3 bg-muted border-transparent rounded-xl focus:bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                    placeholder={t('clients.create.fieldNamePlaceholder')}
                                />
                                {errors.name && <p className="text-xs text-red-500 mt-1">{t('clients.create.errorNameRequired')}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-bold mb-1.5 text-foreground">{t('clients.create.fieldPhone')} *</label>
                                <input
                                    {...register('phone', { required: true })}
                                    className="w-full px-4 py-3 bg-muted border-transparent rounded-xl focus:bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                    placeholder={t('clients.create.fieldPhonePlaceholder')}
                                    inputMode="tel"
                                />
                                {errors.phone && <p className="text-xs text-red-500 mt-1">{t('clients.create.errorPhoneRequired')}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-bold mb-1.5 text-foreground">{t('clients.create.fieldAddress')}</label>
                                <textarea
                                    {...register('address')}
                                    className="w-full px-4 py-3 bg-muted border-transparent rounded-xl focus:bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none font-medium"
                                    placeholder={t('clients.create.fieldAddressPlaceholder')}
                                    rows="2"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold mb-1.5 text-foreground">{t('clients.create.fieldNote')}</label>
                                <textarea
                                    {...register('notes')}
                                    className="w-full px-4 py-3 bg-muted border-transparent rounded-xl focus:bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none font-medium"
                                    placeholder={t('clients.create.fieldNotePlaceholder')}
                                    rows="3"
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full bg-primary hover:brightness-110 text-white font-bold text-lg py-4 rounded-xl shadow-lg shadow-primary/20 transition-all disabled:opacity-50 active:scale-[0.98]"
                    >
                        {saving ? t('common.saving') : t('clients.create.submitNew')}
                    </button>
                </form>
            </main>
        </div>
    );
};

export default CreateClient;
