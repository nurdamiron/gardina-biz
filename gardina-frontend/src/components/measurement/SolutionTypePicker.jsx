import React from 'react';
import { SOLUTION_TYPES } from '../../utils/calculations';
import Icon from '../common/Icon';

/**
 * Компонент выбора типа оконного решения
 */
const SolutionTypePicker = ({ value, onChange }) => {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-gray-700">Не орнатамыз?</h3>
      
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
                  : 'border-gray-100 bg-white text-gray-500 hover:bg-gray-50'}
              `}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 size-5 bg-primary rounded-full flex items-center justify-center">
                  <Icon name="check" size={12} className="text-white" />
                </div>
              )}
              
              <Icon name={type.icon} size={28} className={isSelected ? 'text-primary' : 'text-gray-400'} />
              <span className="text-xs font-bold text-center leading-tight">
                {type.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SolutionTypePicker;

