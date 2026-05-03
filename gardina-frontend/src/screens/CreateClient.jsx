import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { clientsAPI } from '../services/api';
import Icon from '../components/common/Icon';

const CreateClient = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
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
        <div className="bg-background-light min-h-screen pb-24">
            <header className="sticky top-0 z-30 bg-white border-b border-gray-100 px-4 py-3">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="size-10 rounded-full hover:bg-gray-100 flex items-center justify-center -ml-2">
                        <Icon name="arrow_back" className="text-gray-600" />
                    </button>
                    <h1 className="text-xl font-bold text-gray-900">Жаңа клиент</h1>
                </div>
            </header>

            <main className="p-4 max-w-lg mx-auto">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold mb-1.5 text-gray-700">Аты-жөні *</label>
                                <input
                                    {...register('name', { required: true })}
                                    className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                    placeholder="Мысалы: Айгүл"
                                />
                                {errors.name && <p className="text-xs text-red-500 mt-1">Міндетті өріс</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-bold mb-1.5 text-gray-700">Телефон *</label>
                                <input
                                    {...register('phone', { required: true })}
                                    className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                    placeholder="+7 (707) 777-77-77"
                                />
                                {errors.phone && <p className="text-xs text-red-500 mt-1">Міндетті өріс</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-bold mb-1.5 text-gray-700">Мекенжай</label>
                                <textarea
                                    {...register('address')}
                                    className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none font-medium"
                                    placeholder="Алматы қ...."
                                    rows="2"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold mb-1.5 text-gray-700">Қосымша ақпарат</label>
                                <textarea
                                    {...register('notes')}
                                    className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none font-medium"
                                    placeholder="Клиент туралы ескертпе..."
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
                        {saving ? 'Сақталуда...' : 'Клиентті сақтау'}
                    </button>
                </form>
            </main>
        </div>
    );
};

export default CreateClient;
