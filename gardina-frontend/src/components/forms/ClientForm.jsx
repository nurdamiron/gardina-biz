import React from 'react';
import { useForm } from 'react-hook-form';
import Icon from '../common/Icon';

const ClientForm = ({ onSubmit, onCancel }) => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      phone: '+7',
      address: '',
      budgetMin: 50000,
      budgetMax: 70000,
    },
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Жаңа клиент</h2>
          <button onClick={onCancel} className="size-10 rounded-full hover:bg-gray-100 flex items-center justify-center">
            <Icon name="close" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-bold mb-2">Аты-жөні *</label>
            <input
              type="text"
              {...register('name', { required: 'Міндетті өріс' })}
              className={`w-full px-4 py-3 border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 ${
                errors.name ? 'border-red-500' : 'border-gray-200'
              }`}
              placeholder="Иванов Иван Петрович"
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-bold mb-2">Телефон *</label>
            <input
              type="tel"
              {...register('phone', {
                required: 'Міндетті өріс',
                pattern: { value: /^\+7\d{10}$/, message: 'Формат: +7XXXXXXXXXX' },
              })}
              className={`w-full px-4 py-3 border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 ${
                errors.phone ? 'border-red-500' : 'border-gray-200'
              }`}
              placeholder="+77771234567"
            />
            {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-bold mb-2">Мекенжайы *</label>
            <textarea
              {...register('address', { required: 'Міндетті өріс' })}
              className={`w-full px-4 py-3 border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none ${
                errors.address ? 'border-red-500' : 'border-gray-200'
              }`}
              placeholder="Алматы қ., Абай к-сі, 10 үй, 5 пәтер"
              rows="2"
            />
            {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address.message}</p>}
          </div>

          {/* Budget */}
          <div>
            <label className="block text-sm font-bold mb-2">Бюджет (₸)</label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                {...register('budgetMin')}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="Бастап"
              />
              <input
                type="number"
                {...register('budgetMax')}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="Дейін"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-6 py-3 bg-gray-100 font-bold rounded-xl hover:bg-gray-200"
            >
              Болдырмау
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-primary text-white font-bold rounded-xl hover:brightness-110 shadow-lg"
            >
              Жасау
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClientForm;
