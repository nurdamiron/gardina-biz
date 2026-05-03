import React from 'react';
import Icon from '../common/Icon';

const MeetingCard = ({ meeting, isActive = false }) => {
  const { time, type, client, address, notes, timeUntil } = meeting;

  return (
    <div className={`group relative overflow-hidden rounded-2xl bg-white p-4 shadow-sm border ${
      isActive ? 'border-primary/20 ring-1 ring-primary/10' : 'border-gray-100 opacity-90'
    }`}>
      <div className={`absolute top-0 left-0 w-1 h-full ${isActive ? 'bg-primary' : 'bg-gray-300'}`}></div>

      <div className="flex gap-4">
        <div className="flex-1 flex flex-col justify-between gap-3">
          <div>
            {isActive && timeUntil && (
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 uppercase tracking-wider">
                  {timeUntil}
                </span>
              </div>
            )}
            <h3 className="text-lg font-bold leading-tight">{time} - {type}</h3>
            <p className="text-text-secondary text-sm mt-1">{address}</p>
            {client && <p className="text-xs text-gray-400 mt-1">Клиент: {client}</p>}
            {notes && <p className="text-xs text-gray-400 mt-1">{notes}</p>}
          </div>

          <div className="flex gap-2 mt-2">
            {isActive ? (
              <>
                <button className="flex-1 h-9 rounded-lg bg-primary text-white text-sm font-bold flex items-center justify-center gap-2 hover:brightness-110 transition-all">
                  <Icon name="near_me" size={18} />
                  Навигация
                </button>
                <button className="size-9 rounded-lg bg-gray-100 text-text-main flex items-center justify-center hover:bg-gray-200 transition-all">
                  <Icon name="call" size={20} />
                </button>
              </>
            ) : (
              <button className="h-8 px-3 rounded-lg bg-gray-100 text-text-main text-xs font-bold flex items-center gap-1.5">
                <Icon name="call" size={16} />
                Позвонить
              </button>
            )}
          </div>
        </div>

        <div className={`${isActive ? 'w-1/3 min-w-[100px]' : 'w-24'} rounded-xl bg-gray-100 bg-cover bg-center overflow-hidden relative`}>
          {isActive && <div className="absolute inset-0 bg-black/10"></div>}
        </div>
      </div>
    </div>
  );
};

export default MeetingCard;
