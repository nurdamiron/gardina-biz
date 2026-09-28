import { useI18n } from '../../contexts/I18nContext';
import React from 'react';
import { SOLUTION_TYPES } from '../../utils/calculations';
import Icon from '../common/Icon';

/**
 * Компонент выбора типа оконного решения
 */
const SolutionTypePicker = ({ value, onChange }) => {
  const { t } = useI18n();
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-foreground">{t('measurements.form.whatToInstall', 'Не орнатамыз?')}</h3>
      
      <div className="grid grid-cols-3 gap-3">
        {SOLUTION_TYPES.map(type => {
          const isSelected = value === type.id;
          
          return (
            <button
              key={type.id}
              type="button"
              onClick={() => onChange(type.id)}
              className={`
                relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 
                transition-all duration-200 active:scale-95
                ${isSelected 
                  ? 'border-primary bg-primary/5 text-primary shadow-sm' 
                  : 'border-border bg-card text-muted-foreground hover:bg-muted'}
              `}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 size-5 bg-primary rounded-full flex items-center justify-center">
                  <Icon name="check" size={12} className="text-white" />
                </div>
              )}
              
              <Icon name={type.icon} size={28} className={isSelected ? 'text-primary' : 'text-muted-foreground'} />
              <span className="text-xs font-bold text-center leading-tight">
                {t(`measurements.form.solution.${type.id}`, type.name)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SolutionTypePicker;

