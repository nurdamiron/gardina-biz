import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import { useI18n } from '../contexts/I18nContext';
import { calculateRoomEstimate, roomFromWindow } from '../utils/roomEstimate';
import { measurementsAPI, uploadAPI } from '../services/api';
import {
  calculateTotalTapeMeters,
  SOLUTION_TYPES,
  formatPrice
} from '../utils/calculations';
import Icon from '../components/common/Icon';
import {
  SolutionTypePicker,
  ClassicCurtainForm,
  JalousieZebraForm,
  RomanShadeForm,
  MeasurementSummary,
} from '../components/measurement';

const ROOM_DEFS = [
  { id: 'living', icon: 'weekend' },
  { id: 'bedroom', icon: 'bed' },
  { id: 'kitchen', icon: 'kitchen' },
  { id: 'kids', icon: 'child_care' },
  { id: 'office', icon: 'desk' },
  { id: 'hall', icon: 'meeting_room' },
  { id: 'dining', icon: 'restaurant' },
  { id: 'other', icon: 'add', isCustom: true },
];

/**
 * Новая форма замера с авто-расчётами
 */
const MeasurementFormNew = () => {
  const navigate = useNavigate();
  const { id: measurementId } = useParams();
  const { user } = useAuth();
  const { showToast, confirm } = useUI();
  const { t } = useI18n();
  const ROOM_TYPES = ROOM_DEFS.map(r => ({ ...r, label: t(`rooms.${r.id}`) }));
  const photoInputRef = useRef(null);

  // Состояния
  const [measurement, setMeasurement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Текущий шаг: 'rooms' | 'room-edit' | 'summary'
  const [step, setStep] = useState('rooms');
  
  // Комнаты
  const [rooms, setRooms] = useState([]);
  const [currentRoomIndex, setCurrentRoomIndex] = useState(-1);
  const [currentRoom, setCurrentRoom] = useState(null);
  
  // Модалка для кастомного названия комнаты
  const [showCustomRoomModal, setShowCustomRoomModal] = useState(false);
  const [customRoomName, setCustomRoomName] = useState('');


  // Загрузка замера
  useEffect(() => {
    if (measurementId) {
      loadMeasurement();
    } else {
      navigate('/designer/measurements');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [measurementId]);

  const loadMeasurement = async () => {
    try {
      setLoading(true);
      const response = await measurementsAPI.getById(measurementId);
      const data = response.data.data;
      setMeasurement(data);
      
      // Гидрация комнат из windows
      if (data.windows && data.windows.length > 0) {
        const hydratedRooms = data.windows
          .filter(w => w.roomName !== 'Қосымша (Таспа/Аксессуар)')
          .map(roomFromWindow);
        setRooms(hydratedRooms);
      }
      
      setLoading(false);
    } catch (error) {
      showToast(t('measurements.form.errorPrefix', 'Қате: ') + error.message, 'error');
      setLoading(false);
      navigate('/designer/measurements');
    }
  };

  // Добавить новую комнату
  const addRoom = (roomType) => {
    const room = ROOM_TYPES.find(r => r.id === roomType);
    
    // Если выбран "Басқа" - показываем модалку для ввода названия
    if (room?.isCustom) {
      setShowCustomRoomModal(true);
      return;
    }
    
    createRoom(room?.label || t('measurements.form.newRoom', 'Жаңа бөлме'));
  };

  // Создание комнаты с названием
  const createRoom = (roomName) => {
    const newRoom = {
      id: crypto.randomUUID(),
      name: roomName,
      solutionType: 'classic',
      corniceLength: '',
      ceilingHeight: '',
      curtain: { sewingType: 'tape' },
      tulle: { sewingType: 'tape' },
      cornice: { needed: false },
      photos: [],
    };
    
    setCurrentRoom(newRoom);
    setCurrentRoomIndex(-1);
    setStep('room-edit');
  };

  // Добавление комнаты с кастомным названием
  const addCustomRoom = () => {
    if (!customRoomName.trim()) return;
    createRoom(customRoomName.trim());
    setShowCustomRoomModal(false);
    setCustomRoomName('');
  };

  // Редактировать комнату
  const editRoom = (index) => {
    setCurrentRoom({ ...rooms[index] });
    setCurrentRoomIndex(index);
    setStep('room-edit');
  };

  // Сохранить комнату
  const saveRoom = () => {
    if (!currentRoom.name || !currentRoom.solutionType) {
      showToast(t('measurements.form.errNameType', 'Бөлме атауын және түрін таңдаңыз'), 'error');
      return;
    }

    // Validation by solution type
    if (currentRoom.solutionType === 'classic') {
      if (!currentRoom.corniceLength || parseFloat(currentRoom.corniceLength) <= 0) {
        showToast(t('measurements.form.errCornice', 'Карниз ұзындығын енгізіңіз'), 'error');
        return;
      }
    } else if (['jalousie_h', 'jalousie_v', 'zebra', 'roman'].includes(currentRoom.solutionType)) {
      if (!currentRoom.width || parseFloat(currentRoom.width) <= 0) {
        showToast(t('measurements.form.errWidth', 'Терезе енін енгізіңіз'), 'error');
        return;
      }
      if (!currentRoom.height || parseFloat(currentRoom.height) <= 0) {
        showToast(t('measurements.form.errHeight', 'Терезе биіктігін енгізіңіз'), 'error');
        return;
      }
    }

    if (currentRoomIndex >= 0) {
      // Обновляем существующую
      const updated = [...rooms];
      updated[currentRoomIndex] = currentRoom;
      setRooms(updated);
    } else {
      // Добавляем новую
      setRooms([...rooms, currentRoom]);
    }

    setCurrentRoom(null);
    setCurrentRoomIndex(-1);
    setStep('rooms');
  };

  // Удалить комнату
  const deleteRoom = async (index) => {
    const confirmed = await confirm({
      title: t('measurements.form.deleteRoomTitle', 'Бөлмені жою'),
      message: t('measurements.form.deleteRoomConfirm', { name: rooms[index].name }, '"{name}" бөлмесін жоюға сенімдісіз бе?'),
      confirmText: t('measurements.form.delete', 'Жою'),
      cancelText: t('measurements.form.cancel', 'Болдырмау'),
      type: 'danger',
    });
    
    if (confirmed) {
      setRooms(rooms.filter((_, i) => i !== index));
    }
  };

  // Загрузка фото
  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    try {
      const uploadPromises = files.map(file => 
        uploadAPI.uploadPhoto(file, { folder: 'measurements' })
      );
      
      const results = await Promise.all(uploadPromises);
      const newPhotos = results
        .filter(r => r.data?.success)
        .map(r => ({ url: r.data.data.url }));

      setCurrentRoom({
        ...currentRoom,
        photos: [...(currentRoom.photos || []), ...newPhotos],
      });
      
      showToast(t('measurements.form.photoUploaded', 'Фото жүктелді'), 'success');
    } catch (error) {
      showToast(t('measurements.form.photoError', 'Фото жүктеу қатесі'), 'error');
    }
  };

  // Удаление фото
  const removePhoto = (photoIndex) => {
    setCurrentRoom({
      ...currentRoom,
      photos: currentRoom.photos.filter((_, i) => i !== photoIndex),
    });
  };

  // Подготовка окон для отправки на сервер
  const buildWindows = () => rooms.map(room => {
    const widthMeters = parseFloat(room.corniceLength || room.width) || 0;
    const heightMeters = parseFloat(room.ceilingHeight || room.height) || 0;

    return {
      id: room.id,
      roomName: room.name,
      solutionType: room.solutionType,
      dimensions: {
        width: Math.round(widthMeters * 1000),   // метры → миллиметры
        height: Math.round(heightMeters * 1000),  // метры → миллиметры
      },
      designPhotos: room.photos || [],
      fabricItems: room.fabricItems || [],
      sewingRate: room.sewingRate,
      cornice: room.cornice || {},
      tape: room.tape || {},
      hooks: room.hooks || {},
      extras: room.extras || [],
      installationRate: room.installationRate,
      installation: room.installation || {},
      notes: room.solutionType === 'classic'
        ? `Ұзындығы: ${room.corniceLength}м, Биіктігі: ${room.ceilingHeight}м`
        : '',
      material: room.material,
      slat: room.slat,
      system: room.system,
      color: room.color,
      mechanism: room.mechanism,
      fabric: room.fabric,
      sewing: room.sewing,
      quantity: room.quantity,
    };
  });

  // Сохранение замера на сервер
  const saveMeasurement = async () => {
    setSaving(true);
    try {
      await measurementsAPI.update(measurementId, { windows: buildWindows() });
      showToast(t('measurements.form.saved', 'Сақталды!'), 'success');
    } catch (error) {
      showToast(t('measurements.form.saveError', 'Сақтау қатесі: ') + error.message, 'error');
      throw error; // re-throw so callers know it failed
    } finally {
      setSaving(false);
    }
  };

  // Завершение замера
  const completeMeasurement = async () => {
    if (rooms.length === 0) {
      showToast(t('measurements.form.errNoRooms', 'Кем дегенде бір бөлме қосыңыз'), 'error');
      return;
    }

    const confirmed = await confirm({
      title: t('measurements.form.finishTitle', 'Өлшемді аяқтау'),
      message: t('measurements.form.finishConfirm', 'Өлшемді аяқтағыңыз келе ме? Бұл әрекетті қайтару мүмкін емес.'),
      confirmText: t('measurements.form.finish', 'Аяқтау'),
      cancelText: t('measurements.form.cancel', 'Болдырмау'),
    });

    if (!confirmed) return;

    setSaving(true);
    try {
      // Сохраняем и завершаем в одном блоке, спиннер активен всё время
      await measurementsAPI.update(measurementId, { windows: buildWindows() });
      await measurementsAPI.complete(measurementId, { notes: 'Өлшем аяқталды' });
      showToast(t('measurements.form.finished', 'Өлшем сәтті аяқталды!'), 'success');
      navigate('/designer/measurements');
    } catch (error) {
      showToast(t('measurements.form.errorPrefix', 'Қате: ') + error.message, 'error');
      setSaving(false);
    }
  };

  // Расчёт итогов для хедера
  const totalTapeMeters = calculateTotalTapeMeters(rooms);

  if (loading) {
    return (
      <div className="min-h-screen bg-background-light flex items-center justify-center">
        <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-background-light min-h-screen pb-32">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-md border-b border-border px-4 py-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              if (step === 'room-edit') {
                setStep('rooms');
                setCurrentRoom(null);
              } else if (step === 'summary') {
                setStep('rooms');
              } else {
                navigate(`/designer/measurements/${measurementId}`);
              }
            }}
            className="size-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted transition-colors"
          >
            <Icon name="arrow_back" className="text-muted-foreground" />
          </button>
          
          <div className="text-center">
            <h1 className="text-lg font-bold text-foreground">
              {step === 'rooms' && t('measurements.form.rooms', 'Бөлмелер')}
              {step === 'room-edit' && (currentRoom?.name || t('measurements.form.newRoom', 'Жаңа бөлме'))}
              {step === 'summary' && 'Смета'}
            </h1>
            <p className="text-xs text-muted-foreground">{measurement?.clientName}</p>
          </div>
          
          <button
            onClick={saveMeasurement}
            disabled={saving}
            className="size-10 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
          >
            {saving ? (
              <div className="size-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Icon name="save" className="text-primary" />
            )}
          </button>
        </div>
      </header>

      <main className="p-4 max-w-3xl mx-auto">
        {/* ШАГ 1: Список комнат */}
        {step === 'rooms' && (
          <div className="lg:grid lg:grid-cols-[1fr_260px] lg:gap-5 lg:items-start space-y-6 lg:space-y-0">

            {/* LEFT: rooms list + continue */}
            <div className="space-y-4">
            {/* Сохранённые комнаты */}
            {rooms.length > 0 && (
              <div className="space-y-3">
                {rooms.map((room, index) => {
                  const solutionType = SOLUTION_TYPES.find(s => s.id === room.solutionType);
                  const roomTotal = calculateRoomEstimate(room).total;
                  
                  return (
                    <div
                      key={room.id}
                      className="bg-card rounded-2xl p-4 shadow-sm border border-border"
                    >
                      <div className="flex items-center gap-4">
                        <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Icon name={solutionType?.icon || 'home'} className="text-primary" />
                        </div>
                        
                        <div className="flex-1">
                          <h3 className="font-bold text-foreground">{room.name}</h3>
                          <p className="text-xs text-muted-foreground">
                            {solutionType && t(`measurements.form.solution.${solutionType.id}`, solutionType.name)}
                            {room.corniceLength && ` • ${room.corniceLength}м`}
                          </p>
                        </div>
                        
                        {roomTotal > 0 && (
                          <span className="text-sm font-bold text-green-600">
                            {formatPrice(roomTotal)}
                          </span>
                        )}
                        
                        <div className="flex gap-1">
                          <button
                            onClick={() => editRoom(index)}
                            className="size-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted"
                          >
                            <Icon name="edit" size={20} className="text-muted-foreground" />
                          </button>
                          <button
                            onClick={() => deleteRoom(index)}
                            className="size-10 rounded-full bg-muted flex items-center justify-center hover:bg-red-50"
                          >
                            <Icon name="delete" size={20} className="text-muted-foreground" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Mobile: add room panel */}
            <div className="lg:hidden bg-card rounded-2xl p-5 shadow-sm border border-border">
              <h3 className="font-bold text-foreground mb-4">{t('measurements.form.addRoom', 'Бөлме қосу')}</h3>
              <div className="grid grid-cols-4 gap-3">
                {ROOM_TYPES.map(room => (
                  <button
                    key={room.id}
                    onClick={() => addRoom(room.id)}
                    className="flex flex-col items-center justify-center p-3 rounded-xl bg-muted hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    <Icon name={room.icon} size={24} className="mb-1" />
                    <span className="text-[10px] font-medium text-center leading-tight">{room.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Кнопка продолжить */}
            {rooms.length > 0 && (
              <button
                onClick={() => setStep('summary')}
                className="w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/30 flex items-center justify-center gap-2"
              >
                {t('measurements.form.viewEstimate', 'Сметаны көру')}
                <Icon name="arrow_forward" />
              </button>
            )}

            </div>{/* end left column */}

            {/* RIGHT (desktop only): add-room panel + total */}
            <div className="hidden lg:flex flex-col gap-4 sticky top-20">
              <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
                <h3 className="font-bold text-foreground mb-4">{t('measurements.form.addRoom', 'Бөлме қосу')}</h3>
                <div className="grid grid-cols-3 gap-3">
                  {ROOM_TYPES.map(room => (
                    <button
                      key={room.id}
                      onClick={() => addRoom(room.id)}
                      className="flex flex-col items-center justify-center p-3 rounded-xl bg-muted hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      <Icon name={room.icon} size={22} className="mb-1" />
                      <span className="text-[10px] font-medium text-center leading-tight">{room.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {rooms.length > 0 && (
                <div className="bg-gray-900 text-white rounded-2xl p-4">
                  <p className="text-xs text-muted-foreground mb-1">{rooms.length} {t('measurements.rooms.unit', 'бөлме')}</p>
                  <p className="text-2xl font-black">
                    {new Intl.NumberFormat('ru-RU').format(
                      rooms.reduce((sum, room) => sum + calculateRoomEstimate(room).total, 0)
                    )} ₸
                  </p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ШАГ 2: Редактирование комнаты */}
        {step === 'room-edit' && currentRoom && (
          <>
            {/* Название комнаты */}
            <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
              <label className="block text-sm font-bold text-foreground mb-2">{t('measurements.form.roomName', 'Бөлме атауы')}</label>
              <input
                type="text"
                value={currentRoom.name}
                onChange={(e) => setCurrentRoom({ ...currentRoom, name: e.target.value })}
                className="w-full h-12 px-4 bg-muted border-2 border-transparent rounded-xl 
                  focus:bg-card focus:border-primary transition-all font-bold"
                placeholder={t('measurements.form.roomNamePlaceholder', 'Бөлме атауы...')}
              />
            </div>

            {/* Тип решения */}
            <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
              <SolutionTypePicker
                value={currentRoom.solutionType}
                onChange={(type) => setCurrentRoom({ ...currentRoom, solutionType: type })}
              />
            </div>

            {/* Форма в зависимости от типа */}
            {currentRoom.solutionType === 'classic' && (
              <ClassicCurtainForm
                data={currentRoom}
                onChange={setCurrentRoom}
              />
            )}

            {(currentRoom.solutionType === 'jalousie_h' || 
              currentRoom.solutionType === 'jalousie_v' ||
              currentRoom.solutionType === 'zebra') && (
              <JalousieZebraForm
                type={currentRoom.solutionType}
                data={currentRoom}
                onChange={setCurrentRoom}
              />
            )}

            {currentRoom.solutionType === 'roman' && (
              <RomanShadeForm
                data={currentRoom}
                onChange={setCurrentRoom}
              />
            )}

            {/* Фото */}
            <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                className="hidden"
              />

              {currentRoom.photos?.length > 0 ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Icon name="photo_camera" className="text-muted-foreground" />
                      <h3 className="font-bold text-foreground">Фото ({currentRoom.photos.length})</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      className="text-primary font-bold text-sm flex items-center gap-1"
                    >
                      <Icon name="add" size={20} />
                      {t('measurements.form.add', 'Қосу')}
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {currentRoom.photos.map((photo, idx) => (
                      <div key={idx} className="relative aspect-square rounded-xl overflow-hidden">
                        <img src={photo.url} alt="" className="w-full h-full object-cover" />
                        <button
                          onClick={() => removePhoto(idx)}
                          className="absolute top-1 right-1 size-6 bg-red-500 text-white rounded-full flex items-center justify-center"
                        >
                          <Icon name="close" size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="w-full py-10 border-2 border-dashed border-border rounded-xl 
                    flex flex-col items-center justify-center gap-3 
                    hover:border-primary hover:bg-primary/5 transition-all group"
                >
                  <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Icon name="add_a_photo" size={28} className="text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-foreground">{t('measurements.form.addPhoto', 'Фото қосу')}</p>
                    <p className="text-xs text-muted-foreground mt-1">{t('measurements.form.addPhotoHint', 'Терезе, бөлме немесе өлшем')}</p>
                  </div>
                </button>
              )}
            </div>
          </>
        )}

        {/* ШАГ 3: Смета */}
        {step === 'summary' && (
          <MeasurementSummary
            rooms={rooms}
            onComplete={completeMeasurement}
            clientName={measurement?.clientName}
            clientPhone={measurement?.clientPhone}
          />
        )}
      </main>

      {/* Фиксированная кнопка сохранения для редактирования комнаты */}
      {step === 'room-edit' && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-card border-t border-border">
          <button
            onClick={saveRoom}
            className="w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/30 flex items-center justify-center gap-2"
          >
            <Icon name="check" />
            {t('measurements.form.save', 'Сақтау')}
          </button>
        </div>
      )}

      {/* Модалка для ввода кастомного названия комнаты */}
      {showCustomRoomModal && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowCustomRoomModal(false)}
        >
          <div 
            className="bg-card rounded-2xl w-full max-w-sm shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-5 border-b border-border">
              <h3 className="text-lg font-bold text-center">{t('measurements.form.roomName', 'Бөлме атауы')}</h3>
            </div>
            
            <div className="p-5">
              <input
                type="text"
                value={customRoomName}
                onChange={(e) => setCustomRoomName(e.target.value)}
                placeholder={t('measurements.form.customRoomPlaceholder', 'Мысалы: Балкон, Ванна...')}
                className="w-full h-14 px-4 bg-muted border-2 border-transparent rounded-xl 
                  focus:bg-card focus:border-primary transition-all text-lg font-bold text-center"
                autoFocus
              />
            </div>
            
            <div className="p-5 pt-0 flex gap-3">
              <button
                onClick={() => {
                  setShowCustomRoomModal(false);
                  setCustomRoomName('');
                }}
                className="flex-1 py-3 bg-muted text-foreground font-bold rounded-xl"
              >
                {t('measurements.form.cancel', 'Болдырмау')}
              </button>
              <button
                onClick={addCustomRoom}
                disabled={!customRoomName.trim()}
                className="flex-1 py-3 bg-primary text-white font-bold rounded-xl 
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('measurements.form.add', 'Қосу')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeasurementFormNew;

