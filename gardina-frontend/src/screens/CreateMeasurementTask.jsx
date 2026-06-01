import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import { useI18n } from '../contexts/I18nContext';
import { clientsAPI, measurementsAPI, usersAPI } from '../services/api';
import KazakhDatePicker from '../components/common/KazakhDatePicker';
import Icon from '../components/common/Icon';



/**
 * Экран для МЕНЕДЖЕРА
 * Создание задачи на замер (Create Order Flow)
 */
const CreateMeasurementTask = () => {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { confirm, showToast } = useUI();
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      selectedRooms: [],
      technicalFeatures: []
    }
  });
  const [saving, setSaving] = useState(false);

  // Data State
  const [designers, setDesigners] = useState([]);
  const [designerWorkload, setDesignerWorkload] = useState({});
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [allActiveMeasurements, setAllActiveMeasurements] = useState([]); // Store all tasks for filtering
  const [loadingData, setLoadingData] = useState(true);

  // UI State
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [isNewClient, setIsNewClient] = useState(false);
  const searchTimeoutRef = useRef(null);

  // Form Values
  const selectedDesignerId = watch('designerId');
  const selectedRooms = watch('selectedRooms') || [];
  const selectedFeatures = watch('technicalFeatures') || [];
  const clientNameValue = watch('clientName');

  // Role Detection
  const isDesigner = user?.role === 'designer';
  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager';

  useEffect(() => {
    loadData();
    if (isDesigner) {
      setValue('designerId', user.id);
    }
  }, [user]);

  // Derive occupied slots for the selected designer
  const designerOccupiedSlots = React.useMemo(() => {
    if (!selectedDesignerId || !allActiveMeasurements.length) return [];

    return allActiveMeasurements
      .filter(m => m.designerId === selectedDesignerId && m.scheduledAt)
      .map(m => m.scheduledAt); // Returns ISO strings
  }, [selectedDesignerId, allActiveMeasurements]);

  // Client Autocomplete Logic
  useEffect(() => {
    if (!clientNameValue) {
      setFilteredClients([]);
      return;
    }

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    searchTimeoutRef.current = setTimeout(() => {
      const query = clientNameValue.toLowerCase();
      const filtered = clients.filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.phone?.includes(query)
      ).slice(0, 5);

      setFilteredClients(filtered);
      if (filtered.length > 0) setShowClientDropdown(true);
    }, 300);
  }, [clientNameValue, clients]);

  const loadData = async () => {
    try {
      const [designersRes, clientsRes, activeTasksRes] = await Promise.all([
        usersAPI.getDesigners(),
        clientsAPI.getAll(),
        measurementsAPI.getAll({ status: 'scheduled', limit: 100 }) // Fetch active tasks for workload
      ]);

      const designersList = designersRes.data.data || [];
      setDesigners(designersList);
      setClients(clientsRes.data.data || []);

      // Calculate Workload
      const workload = {};
      designersList.forEach(d => workload[d.id] = 0);

      let measurements = [];
      if (activeTasksRes.data.success && activeTasksRes.data.data) {
        measurements = Array.isArray(activeTasksRes.data.data)
          ? activeTasksRes.data.data
          : activeTasksRes.data.data.measurements || [];

        measurements.forEach(task => {
          if (task.designerId && workload[task.designerId] !== undefined) {
            workload[task.designerId]++;
          }
        });
      }
      setDesignerWorkload(workload);
      setAllActiveMeasurements(measurements); // Save for occupied slots calculation

    } catch (error) {
    } finally {
      setLoadingData(false);
    }
  };

  const handleClientSelect = (client) => {
    setValue('clientName', client.name);
    setValue('clientPhone', client.phone);
    setValue('address', client.address);
    setValue('existingClientId', client.id);
    setIsNewClient(false);
    setShowClientDropdown(false);
  };

  const switchToNewClient = () => {
    setIsNewClient(true);
    setValue('existingClientId', null);
    setShowClientDropdown(false);
  };

  const toggleRoom = (roomId) => {
    const current = selectedRooms;
    if (current.includes(roomId)) {
      setValue('selectedRooms', current.filter(id => id !== roomId));
    } else {
      setValue('selectedRooms', [...current, roomId]);
    }
  };

  const toggleFeature = (featureId) => {
    const current = selectedFeatures;
    if (current.includes(featureId)) {
      setValue('technicalFeatures', current.filter(id => id !== featureId));
    } else {
      setValue('technicalFeatures', [...current, featureId]);
    }
  };

  const onSubmit = async (data) => {
    try {
      setSaving(true);
      let clientId = data.existingClientId;

      // 1. Create Client if New
      if (!clientId || isNewClient) {
        try {
          const clientResponse = await clientsAPI.create({
            name: data.clientName,
            phone: data.clientPhone,
            whatsapp: data.clientPhone,
            address: data.address,
            notes: data.notes || '',
            source: 'Басқарушы',
            createdBy: user.id,
          });
          clientId = clientResponse.data.data.id;
        } catch (err) {
          // Check if client already exists
          if (err.response?.data?.existingClient) {
            const existing = err.response.data.existingClient;
            const confirmed = await confirm({
              title: t('tasks.create.clientFoundTitle', 'Клиент табылды'),
              message: `${t('tasks.create.clientFoundMessagePrefix', 'Клиент')} "${existing.name}" (${existing.phone}) ${t('tasks.create.clientFoundMessageSuffix', 'базада бар.')}\n\n${t('tasks.create.clientFoundQuestion', 'Осы клиент үшін тапсырыс құру керек пе?')}`,
              confirmText: t('tasks.create.clientFoundConfirm', 'Иә, жалғастыру'),
              cancelText: t('tasks.create.clientFoundCancel', 'Жоқ'),
              type: 'info'
            });

            if (confirmed) {
              clientId = existing.id;
            } else {
              setSaving(false);
              return;
            }
          } else {
            showToast(err.response?.data?.error || t('tasks.create.errorClientCreate', 'Клиент құру кезінде қате шықты'), 'error');
            setSaving(false);
            return;
          }
        }
      }

      // Format data
      const roomString = data.selectedRooms
        .map(r => ROOM_TYPES.find(t => t.id === r)?.label)
        .filter(Boolean)
        .join(', ');

      // 2. Create Measurement Task
      const measurementResponse = await measurementsAPI.create({
        clientId,
        designerId: data.designerId,
        address: data.address,
        scheduledAt: data.scheduledAt,
        roomType: roomString, // Save comma-separated rooms
        budgetMin: 0,
        budgetMax: 0,
        notes: data.notes || '',
        mapLink: data.mapLink || null,
        priority: data.priority || 'standard',
        styles: data.styles || null,
        curtainTypes: data.curtainTypes || null,
        technicalFeatures: data.technicalFeatures || []
      });

      // 3. The linked lead deal is now created server-side, atomically inside the
      //    measurement's transaction (MeasurementController.create → createLeadDeal),
      //    idempotently. No separate, racy client-side deal call anymore.

      setSaving(false);
      showToast(t('tasks.create.successCreated', 'Тапсырыс сәтті құрылды!'), 'success');

      // Redirect based on role
      if (isAdmin) {
        navigate('/admin/orders');
      } else if (isManager) {
        navigate('/manager/orders');
      } else if (user?.role === 'sales') {
        navigate('/sales/clients');
      } else {
        navigate('/designer/measurements');
      }
    } catch (error) {
      showToast(t('tasks.create.errorGeneric', 'Қате шықты'), 'error');
      setSaving(false);
    }
  };

  // CONSTANTS
  const ROOM_TYPES = [
    { id: 'living', icon: 'weekend' },
    { id: 'bedroom', icon: 'bed' },
    { id: 'kitchen', icon: 'kitchen' },
    { id: 'kids', icon: 'child_care' },
    { id: 'office', icon: 'desk' },
    { id: 'hall', icon: 'meeting_room' },
    { id: 'dining', icon: 'restaurant' },
    { id: 'all', icon: 'home' },
    { id: 'other', icon: 'other_houses' },
  ].map(r => ({ ...r, label: r.id === 'all' ? (lang === 'kz' ? 'Барлығы' : 'Все') : t(`rooms.${r.id}`) }));

  const TECHNICAL_FEATURES = [
    { id: 'high_ceiling', label: t('tasks.create.feature.highCeiling', 'Биік төбе (3м+)'), icon: 'height' },
    { id: 'ladder', label: t('tasks.create.feature.ladder', 'Саты қажет'), icon: 'stairs' },
    { id: 'dismantling', label: t('tasks.create.feature.dismantling', 'Демонтаж'), icon: 'handyman' },
    { id: 'cornice', label: t('tasks.create.feature.cornice', 'Карниз орнату'), icon: 'curtains' },
    { id: 'niche', label: t('tasks.create.feature.niche', 'Төбедегі қуыс (Ниша)'), icon: 'grid_view' },
    { id: 'complex', label: t('tasks.create.feature.complex', 'Күрделі терезе'), icon: 'warning' },
  ];

  const getWorkloadColor = (count) => {
    if (count === 0) return 'bg-green-100 text-green-700';
    if (count < 3) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  const getAssigneeRoleLabel = (role) => {
    if (role === 'admin') return t('tasks.create.role.admin', 'Админ');
    if (role === 'manager') return t('tasks.create.role.manager', 'Менеджер');
    if (role === 'sales') return t('tasks.create.role.sales', 'Сатушы');
    return t('tasks.create.role.designer', 'Дизайнер');
  };

  return (
    <div className="bg-background-light min-h-screen pb-32">

      {/* 1. HEADER */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="size-10 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors">
            <Icon name="arrow_back" className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold leading-tight">{t('tasks.create.headerTitle', 'Жаңа Тапсырыс')}</h1>
            <p className="text-xs text-text-secondary">{t('tasks.create.headerSubtitle', 'Өлшем алуға тапсырыс')}</p>
          </div>
        </div>
      </header>

      <main className="p-4 max-w-2xl mx-auto space-y-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

          {/* 2. CLIENT SECTION */}
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 relative">
            <div className="flex items-center gap-3 mb-6">
              <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <Icon name="person_search" />
              </div>
              <h2 className="text-lg font-bold">{t('tasks.create.clientSection', 'Клиент')}</h2>
            </div>

            <div className="space-y-5">
              <div className="relative">
                <label className="block text-sm font-bold mb-2 text-gray-700">{t('tasks.create.clientName', 'Клиент аты')}</label>
                <input
                  {...register('clientName', {
                    required: true,
                    onChange: () => {
                      setValue('existingClientId', null);
                      setIsNewClient(false);
                    }
                  })}
                  autoComplete="off"
                  className="w-full h-14 px-4 bg-gray-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-bold text-lg"
                  placeholder={t('tasks.create.clientNamePlaceholder', 'Іздеу немесе жаңа атау...')}
                  onFocus={() => {
                    if (clientNameValue && filteredClients.length > 0) setShowClientDropdown(true);
                  }}
                />
                {showClientDropdown && (
                  <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-xl shadow-xl border border-gray-100 z-20 overflow-hidden animate-in fade-in slide-in-from-top-2">
                    {filteredClients.map(client => (
                      <button
                        key={client.id}
                        type="button"
                        onClick={() => handleClientSelect(client)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center justify-between group border-b last:border-0 border-gray-50"
                      >
                        <div>
                          <p className="font-bold text-gray-900">{client.name}</p>
                          <p className="text-xs text-gray-500">{client.phone}</p>
                        </div>
                        <Icon name="arrow_forward" className="text-gray-300" />
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={switchToNewClient}
                      className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 text-primary font-bold text-sm"
                    >
                      {t('tasks.create.addNewClientOption', '+ Жаңа клиент ретінде қосу')}
                    </button>
                  </div>
                )}
                {errors.clientName && <p className="text-xs text-red-500 mt-2 font-medium">{t('tasks.create.errorClientName', 'Клиент атын жазыңыз')}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold mb-2 text-gray-700">{t('tasks.create.phone', 'Телефон')}</label>
                  <input
                    {...register('clientPhone', { required: true })}
                    className="w-full h-12 px-4 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:border-primary transition-all font-medium"
                    placeholder="+7 777 000 00 00"
                  />
                  {errors.clientPhone && <p className="text-xs text-red-500 mt-2">{t('tasks.create.errorPhone', 'Телефон нөмірі қажет')}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 text-gray-700">{t('tasks.create.address', 'Мекенжай')}</label>
                <textarea
                  {...register('address', { required: true })}
                  rows="2"
                  className="w-full p-4 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:border-primary transition-all font-medium resize-none shadow-sm"
                  placeholder={t('tasks.create.addressPlaceholder', 'Көше, үй, пәтер...')}
                />
                {errors.address && <p className="text-xs text-red-500 mt-2">{t('tasks.create.errorAddress', 'Мекенжай қажет')}</p>}
              </div>

              {/* 2GIS LINK (NEW) */}
              <div>
                <label className="block text-sm font-bold mb-2 text-gray-700">{t('tasks.create.mapLink', '2GIS сілтемесі')}</label>
                <div className="relative">
                  <input
                    {...register('mapLink')}
                    className="w-full h-12 pl-12 pr-4 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:border-primary transition-all font-medium text-sm text-primary"
                    placeholder="https://go.2gis.com/..."
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <Icon name="map" size={20} />
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 mt-1 ml-1">{t('tasks.create.mapLinkHint', 'Дизайнерге картадан ашу үшін')}</p>
              </div>
            </div>
          </section>

          {/* 3. TASK DETAILS (Visual Grid - Multi Select) */}
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="size-10 rounded-full bg-primary/5 text-primary flex items-center justify-center">
                <Icon name="home" />
              </div>
              <h2 className="text-lg font-bold">{t('tasks.create.objectSection', 'Объект')}</h2>
            </div>

            <label className="block text-sm font-bold mb-3 text-gray-700">{t('tasks.create.roomType', 'Бөлме түрі (Бірнеше таңдауға болады)')}</label>
            <div className="grid grid-cols-3 gap-3">
              {ROOM_TYPES.map(type => {
                const isSelected = selectedRooms.includes(type.id);
                return (
                  <div
                    key={type.id}
                    onClick={() => toggleRoom(type.id)}
                    className={`
                                relative flex flex-col items-center justify-center p-3 rounded-2xl border-2 cursor-pointer transition-all duration-200 select-none
                                ${isSelected
                        ? 'border-primary bg-primary/5 text-primary shadow-sm scale-[1.02]'
                        : 'border-transparent bg-gray-50 text-gray-500 hover:bg-gray-100 hover:scale-[1.02]'}
                            `}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2 size-4 bg-primary rounded-full flex items-center justify-center">
                        <Icon name="check" size={10} className="text-white" />
                      </div>
                    )}
                    <Icon name={type.icon} size={28} className="mb-1" />
                    <span className="text-[10px] font-bold text-center leading-tight">{type.label}</span>
                  </div>
                );
              })}
            </div>
            {selectedRooms.length === 0 && <p className="text-xs text-gray-400 mt-2 text-center">{t('tasks.create.roomTypeHint', 'Ең болмағанда біреуін таңдаңыз')}</p>}

            {/* Technical Chips (Multi Select) */}
            <div className="mt-6">
              <label className="block text-sm font-bold mb-3 text-gray-700">{t('tasks.create.technicalFeatures', 'Техникалық ерекшеліктер')}</label>
              <div className="flex flex-wrap gap-2">
                {TECHNICAL_FEATURES.map(feat => {
                  const isSelected = selectedFeatures.includes(feat.id);
                  return (
                    <div
                      key={feat.id}
                      onClick={() => toggleFeature(feat.id)}
                      className={`
                                    px-4 py-2 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-2 select-none
                                    ${isSelected
                          ? 'bg-orange-50 border-orange-200 text-orange-700'
                          : 'bg-gray-50 border-transparent text-gray-500 hover:bg-gray-100'}
                                `}
                    >
                      <Icon name={feat.icon} size={20} />
                      <span className="text-xs font-bold">{feat.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>

          {/* 4. DESIGNER & SCHEDULE (With Workload) */}
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="size-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
                <Icon name="calendar_month" />
              </div>
              <h2 className="text-lg font-bold">{t('tasks.create.assignSection', 'Тағайындау')}</h2>
            </div>

            <div className="space-y-6">
              {/* Designer Grid */}
              <div>
                <label className="block text-sm font-bold mb-3 text-gray-700">{t('tasks.create.designer', 'Дизайнер')}</label>
                {loadingData ? (
                  <div className="h-20 bg-gray-50 rounded-xl animate-pulse"></div>
                ) : isDesigner ? (
                  // Designer View: Auto-selected "Me"
                  <div className="bg-primary/5 border-2 border-primary rounded-xl p-4 flex items-center gap-4">
                    <div className="size-12 rounded-full bg-primary flex items-center justify-center text-white font-bold text-lg shadow-sm">
                      {user.name[0]}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-lg">{t('tasks.create.meDoIt', 'Мен орындаймын')}</p>
                      <p className="text-sm text-gray-500">{t('tasks.create.meDoItHint', 'Тапсырма сізге автоматты түрде бекітіледі')}</p>
                    </div>
                    <input type="hidden" {...register('designerId')} value={user.id} />
                  </div>
                ) : (
                  // Manager View: Full Selection
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <label
                      className={`
                                    flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all
                                    ${selectedDesignerId == user.id
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-transparent bg-gray-50 hover:bg-gray-100'}
                                `}
                    >
                      <input
                        type="radio"
                        {...register('designerId', { required: true })}
                        value={user.id}
                        className="sr-only"
                      />
                      <div className={`size-10 rounded-full flex items-center justify-center text-white font-bold ${selectedDesignerId == user.id ? 'bg-primary' : 'bg-gray-300'}`}>
                        {user.name[0]}
                      </div>
                      <div className="leading-tight flex-1">
                        <p className={`font-bold text-sm ${selectedDesignerId == user.id ? 'text-gray-900' : 'text-gray-500'}`}>{user.name} ({t('tasks.create.meSuffix', 'Мен')})</p>
                        <p className="text-[10px] text-gray-400">{getAssigneeRoleLabel(user.role)}</p>
                      </div>
                    </label>

                    {designers.filter(d => d.id !== user.id).map(designer => {
                      const activeTasks = designerWorkload[designer.id] || 0;
                      return (
                        <label
                          key={designer.id}
                          className={`
                                            flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all relative overflow-hidden
                                            ${selectedDesignerId == designer.id
                              ? 'border-primary bg-primary/5 shadow-sm'
                              : 'border-transparent bg-gray-50 hover:bg-gray-100'}
                                        `}
                        >
                          <input
                            type="radio"
                            {...register('designerId', { required: true })}
                            value={designer.id}
                            className="sr-only"
                          />
                          <div className={`size-10 rounded-full flex items-center justify-center text-white font-bold ${selectedDesignerId == designer.id ? 'bg-primary' : 'bg-gray-300'}`}>
                            {designer.name[0]}
                          </div>
                          <div className="leading-tight flex-1">
                            <p className={`font-bold text-sm ${selectedDesignerId == designer.id ? 'text-gray-900' : 'text-gray-500'}`}>{designer.name}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">{getAssigneeRoleLabel(designer.role)}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${getWorkloadColor(activeTasks)}`}>
                                {activeTasks} {t('tasks.create.activeTasks', 'активті тапсырыс')}
                              </span>
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
                {errors.designerId && <p className="text-xs text-red-500 mt-2">{t('tasks.create.errorDesigner', 'Дизайнерді таңдаңыз')}</p>}
              </div>

              {/* Priority Selector */}
              <div>
                <label className="block text-sm font-bold mb-3 text-gray-700">{t('tasks.create.priorityLabel', 'Тапсырыс статусы')}</label>
                <div className="flex bg-gray-50 p-1 rounded-xl">
                  <label className="flex-1 cursor-pointer">
                    <input
                      type="radio"
                      {...register('priority')}
                      value="standard"
                      className="sr-only peer"
                      defaultChecked
                    />
                    <div className="py-2 text-center rounded-lg text-sm font-bold text-gray-500 peer-checked:bg-green-500 peer-checked:text-white peer-checked:shadow-sm transition-all flex items-center justify-center gap-2">
                      <Icon name="check_circle" size={20} />
                      {t('tasks.create.priorityStandard', 'Стандартты')}
                    </div>
                  </label>
                  <label className="flex-1 cursor-pointer">
                    <input
                      type="radio"
                      {...register('priority')}
                      value="high"
                      className="sr-only peer"
                    />
                    <div className="py-2 text-center rounded-lg text-sm font-bold text-gray-500 peer-checked:bg-red-500 peer-checked:text-white peer-checked:shadow-sm transition-all flex items-center justify-center gap-2">
                      <Icon name="local_fire_department" size={20} />
                      {t('tasks.create.priorityUrgent', 'Шұғыл (Срочно)')}
                    </div>
                  </label>
                </div>
              </div>

              {/* Date Picker (Custom Kazakh) */}
              {/* Date Picker (Custom Kazakh) - Only show if designer selected */}
              {selectedDesignerId && (
                <div className="animate-in fade-in slide-in-from-top-2">
                  <KazakhDatePicker
                    value={watch('scheduledAt')}
                    onChange={(val) => setValue('scheduledAt', val, { shouldValidate: true })}
                    error={errors.scheduledAt}
                    occupiedSlots={designerOccupiedSlots}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-bold mb-2 text-gray-700">{t('tasks.create.note', 'Қосымша ескертпе')}</label>
                <textarea
                  {...register('notes')}
                  className="w-full p-4 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:border-primary transition-all font-medium resize-none"
                  rows="2"
                  placeholder={t('tasks.create.notePlaceholder', 'Мысалы: Домафон істемейді, қабырғасы бетон...')}
                />
              </div>
            </div>
          </section>

          <div className="h-8"></div> {/* Spacer */}

        </form>
      </main>

      {/* 5. FLOATING SUBMIT BUTTON */}
      <div className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur border-t border-gray-200 p-4 z-40">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={handleSubmit(onSubmit)}
            disabled={saving}
            className="w-full bg-primary hover:bg-primary-dark text-white font-bold text-lg py-4 rounded-2xl shadow-lg shadow-primary/25 transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {saving ? (
              <>
                <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>{t('tasks.create.submitting', 'Жөнелтуде...')}</span>
              </>
            ) : (
              <>
                <span>{isDesigner ? t('tasks.create.submitStart', 'Бастау (Өлшем алу)') : t('tasks.create.submit', 'Тапсырысты құру')}</span>
                <Icon name={isDesigner ? 'play_arrow' : 'send'} />
              </>
            )}
          </button>
        </div>
      </div>

    </div>
  );
};

export default CreateMeasurementTask;
