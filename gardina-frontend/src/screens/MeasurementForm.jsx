import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import { useI18n } from '../contexts/I18nContext';
import { measurementsAPI, ordersAPI, clientsAPI, uploadAPI, catalogAPI } from '../services/api';
import ClientForm from '../components/forms/ClientForm';
import MeasurementItemForm from '../components/forms/MeasurementItemForm';
import Icon from '../components/common/Icon';

const MeasurementForm = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useUI();
  const location = useLocation();

  // Client data state
  const [showClientForm, setShowClientForm] = useState(false);
  const [clientData, setClientData] = useState(null);
  const [existingMeasurement, setExistingMeasurement] = useState(null);

  // Current room being edited
  const [selectedRoom, setSelectedRoom] = useState('');
  const [showRoomDropdown, setShowRoomDropdown] = useState(false);
  const [customRoomName, setCustomRoomName] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Current room form data
  const [lengthMeters, setLengthMeters] = useState(''); // Cornice Width
  // Room Height is handled via DOM for now but ideally state

  // ITEMS LIST
  const [roomItems, setRoomItems] = useState([]);
  const [globalItems, setGlobalItems] = useState([]); // Tape, Hooks, etc.

  const [designPhotos, setDesignPhotos] = useState([]);
  const designPhotoRef = useRef(null);

  // Saved rooms list
  const [savedRooms, setSavedRooms] = useState([]);

  // UI states
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState(null);

  const ROOM_TYPES = [
    { id: 'living', icon: 'weekend' },
    { id: 'bedroom', icon: 'bed' },
    { id: 'kitchen', icon: 'kitchen' },
    { id: 'kids', icon: 'child_care' },
    { id: 'office', icon: 'desk' },
    { id: 'hall', icon: 'meeting_room' },
    { id: 'dining', icon: 'restaurant' },
    { id: 'balcony', icon: 'balcony' },
  ].map(r => ({ ...r, label: t(`rooms.${r.id}`) }));

  /* 
    DESIGNER FLOW:
    - Designer only adds rooms to EXISTING measurements
    - Measurements are created by Manager
    - Route: /designer/measurements/:id/room
  */

  const { id: urlId } = useParams(); // Get ID from URL (/designer/measurements/:id/room)

  // Load existing measurement - designer cannot create new measurements
  useEffect(() => {
    const stateData = location.state;
    const stateId = stateData?.measurementId;
    const stateMeasurement = stateData?.measurement;
    const targetId = urlId || stateId;

    if (targetId) {
      loadExistingMeasurement(targetId);
    } else if (stateMeasurement) {
      setExistingMeasurement(stateMeasurement);
      setClientData({
        id: stateMeasurement.clientId,
        name: stateMeasurement.clientName,
        phone: stateMeasurement.clientPhone,
        address: stateMeasurement.address,
      });
      setShowClientForm(false);
    } else {
      // No measurement ID - redirect back (designer cannot create new measurements)
      navigate('/designer/measurements');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlId]);

  const loadExistingMeasurement = async (id) => {
    try {
      const response = await measurementsAPI.getById(id);
      const measurement = response.data.data;

      setExistingMeasurement(measurement);
      setClientData({
        id: measurement.clientId,
        name: measurement.clientName,
        phone: measurement.clientPhone,
        address: measurement.address,
      });
      setShowClientForm(false);

      // 1. Hydrate Saved Rooms List and Global Items
      if (measurement.windows && measurement.windows.length > 0) {
        const hydratedRooms = [];
        const hydratedGlobalItems = [];

        measurement.windows.forEach(w => {
          // Check if this is the Special Global Room
          if (w.roomName === 'Қосымша (Таспа/Аксессуар)' || w.fabricCode === 'GLOBAL') {
            if (w.items && w.items.length > 0) {
              hydratedGlobalItems.push(...w.items);
            }
            return; // Skip adding to savedRooms
          }

          // Attempt to parse metadata from notes
          const lengthMatch = w.notes?.match(/Ұзындығы: ([\d.]+)м/);
          const codeMatch = w.notes?.match(/Код: ([^,]+)/);
          const brandMatch = w.notes?.match(/Бренд: ([^-]+)/); // Simple check

          hydratedRooms.push({
            id: w.id,
            roomName: w.roomName,
            lengthMeters: lengthMatch ? lengthMatch[1] : '?',
            fabricCode: codeMatch ? codeMatch[1].trim() : w.fabricCode || '---',
            fabricBrand: brandMatch ? brandMatch[1].trim() : w.fabricBrand || '',
            items: w.items || [],
            priceBreakdown: w.priceBreakdown,
            // photos not hydrated here yet, handled separately if needed
            designPhotos: w.designPhotos || []
          });
        });

        setSavedRooms(hydratedRooms);
        setGlobalItems(hydratedGlobalItems);
      }

      // 2. Handle "Edit Specific Room" mode
      const targetRoomName = location.state?.roomName;
      if (targetRoomName) {
        setSelectedRoom(targetRoomName);

        // Find existing data for this room to pre-fill form
        const existingWindow = measurement.windows?.find(w => w.roomName === targetRoomName);
        if (existingWindow) {
          const lengthMatch = existingWindow.notes?.match(/Ұзындығы: ([\d.]+)м/);
          const codeMatch = existingWindow.notes?.match(/Код: ([^,]+)/);
          const brandMatch = existingWindow.notes?.match(/Бренд: ([^,]+)/);

          if (lengthMatch) setLengthMeters(lengthMatch[1]);
          if (codeMatch) {
            setFabricCode(codeMatch[1].trim());
            // Optionally trigger search or just set text
          }
          if (brandMatch) setFabricBrand(brandMatch[1].trim());
        }
      }


    } catch (error) {
      showToast('Failed to load measurement: ' + error.message, 'error');
      setShowClientForm(true);
    }
  };

  const handleClientSubmit = async (data) => {
    try {
      const response = await clientsAPI.create({
        name: data.name,
        phone: data.phone,
        whatsapp: data.phone,
        address: data.address,
        createdBy: user.id,
      });

      setClientData({
        ...response.data.data,
      });
      setShowClientForm(false);
    } catch (error) {
    }
  };

  const handleRoomSelect = (room) => {
    setSelectedRoom(room.label);
    setShowRoomDropdown(false);
    setShowCustomInput(false);
    setCustomRoomName('');
  };

  const handleCustomRoomSelect = () => {
    setShowCustomInput(true);
    setShowRoomDropdown(false);
  };

  const handleCustomRoomConfirm = () => {
    if (customRoomName.trim()) {
      setSelectedRoom(customRoomName.trim());
      setShowCustomInput(false);
    }
  };

  const handleDesignPhotoSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const newPhotos = files.map(file => ({
        id: Date.now() + Math.random(),
        file,
        preview: URL.createObjectURL(file)
      }));
      setDesignPhotos(prev => [...prev, ...newPhotos]);
    }
  };

  const removeDesignPhoto = (id) => {
    setDesignPhotos(prev => {
      const photoToRemove = prev.find(p => p.id === id);
      if (photoToRemove && photoToRemove.preview) {
        URL.revokeObjectURL(photoToRemove.preview);
      }
      return prev.filter(p => p.id !== id);
    });
  };

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      designPhotos.forEach(photo => {
        if (photo.preview) {
          URL.revokeObjectURL(photo.preview);
        }
      });
    };
  }, [designPhotos]);

  // Item Handlers
  const handleAddItem = (item) => {
    setRoomItems(prev => [...prev, item]);
  };

  const handleRemoveItem = (index) => {
    setRoomItems(prev => prev.filter((_, i) => i !== index));
  };

  const resetCurrentRoomForm = () => {
    setSelectedRoom('');
    setLengthMeters('');
    setRoomItems([]);
    setDesignPhotos([]);
    setShowCustomInput(false);
    setCustomRoomName('');
  };

  const handleAddRoom = async () => {
    if (!selectedRoom || !lengthMeters || roomItems.length === 0) {
      showToast('Штора қосуды естен шығардыңыз! Кемінде бір элемент қосыңыз.', 'warning');
      return;
    }

    setSaving(true);

    try {
      const heightInput = document.getElementById('roomHeightInput');
      const height = heightInput ? parseFloat(heightInput.value) : 2.8;

      // Calculate total price for check
      const total = roomItems.reduce((sum, item) => sum + (item.calculation.total || 0), 0);

      // Create new room object
      const newRoom = {
        tempId: Date.now().toString(),
        roomName: selectedRoom,
        // Legacy fields for backward compatibility (pick first fabric)
        fabricCode: roomItems[0]?.product?.code || 'MULTI',
        fabricBrand: roomItems[0]?.product?.brand || '',
        lengthMeters: parseFloat(lengthMeters),

        // New structure
        items: roomItems, // Store full items list

        designPhotos,
        // Mock price breakdown for list display
        priceBreakdown: {
          clientCheck: { total: total },
          inputs: { roomHeight: height }
        }
      };

      // Add to saved rooms
      setSavedRooms(prev => [...prev, newRoom]);

      // Reset form for next room
      resetCurrentRoomForm();
    } catch (error) {
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveRoom = (room) => {
    setRoomToDelete(room);
    setShowDeleteModal(true);
  };

  const confirmRemoveRoom = async () => {
    if (!roomToDelete) return;

    try {
      // Clean up photo previews
      if (roomToDelete.designPhotos) {
        roomToDelete.designPhotos.forEach(photo => {
          if (photo.preview) {
            URL.revokeObjectURL(photo.preview);
          }
        });
      }

      // If room has backend ID (already saved), delete from server
      if (roomToDelete.id && existingMeasurement?.id) {
        await measurementsAPI.removeWindow(existingMeasurement.id, roomToDelete.id);
      }

      // Remove from local list - filter out the room to delete
      setSavedRooms(prev => prev.filter(r => {
        // Keep room if NEITHER id nor tempId matches
        if (roomToDelete.id && r.id === roomToDelete.id) return false;
        if (roomToDelete.tempId && r.tempId === roomToDelete.tempId) return false;
        return true;
      }));

      setShowDeleteModal(false);
      setRoomToDelete(null);
    } catch (error) {
      showToast('Бөлмені жою кезінде қате шықты: ' + (error.response?.data?.error || error.message), 'error');
      setShowDeleteModal(false);
      setRoomToDelete(null);
    }
  };

  const handleSubmitAll = async () => {
    if (savedRooms.length === 0 && !selectedRoom) {
      showToast('Кемінде бір бөлме қосыңыз', 'warning');
      return;
    }

    // If there's data in current form, add it first
    let allRooms = [...savedRooms];
    if (selectedRoom && roomItems.length > 0) {
      const heightInput = document.getElementById('roomHeightInput');
      const height = heightInput ? parseFloat(heightInput.value) : 2.8;
      const total = roomItems.reduce((sum, item) => sum + (item.calculation.total || 0), 0);

      allRooms.push({
        tempId: Date.now().toString(),
        roomName: selectedRoom,
        fabricCode: roomItems[0]?.product?.code || 'MULTI',
        fabricBrand: roomItems[0]?.product?.brand || '',
        lengthMeters: parseFloat(lengthMeters),
        items: roomItems,
        designPhotos,
        priceBreakdown: {
          clientCheck: { total: total },
          inputs: { roomHeight: height }
        }
      });
    }

    // Add Global Items as a separate 'room' if they exist
    if (globalItems.length > 0) {
      const totalGlobal = globalItems.reduce((sum, item) => sum + (item.calculation.total || 0), 0);
      allRooms.push({
        tempId: 'global-' + Date.now(),
        roomName: 'Қосымша (Таспа/Аксессуар)',
        fabricCode: 'GLOBAL', // Marker
        lengthMeters: 0,
        items: globalItems,
        designPhotos: [],
        priceBreakdown: {
          clientCheck: { total: totalGlobal },
          inputs: {}
        }
      });
    }

    // Only proceed if we have at least one room (real or global)
    if (allRooms.length === 0) {
      showToast("Ешқандай бөлме немесе материал қосылмады!", 'warning');
      return;
    }

    setSubmitting(true);

    try {
      let measurementId;

      // Calculate global delivery cost (take max if multiple, assuming single delivery fee for order)
      const deliveryCost = allRooms.reduce((max, room) => {
        const deliveryItem = room.priceBreakdown?.clientCheck?.items.find(i => i.name.includes('Жеткізу'));
        return deliveryItem ? Math.max(max, deliveryItem.total || 0) : max;
      }, 0);

      if (existingMeasurement) {
        measurementId = existingMeasurement.id;
      } else {
        // Create deal and measurement
        await ordersAPI.create({
          clientId: clientData.id,
          designerId: user.id,
        });

        const measurementResponse = await measurementsAPI.create({
          clientId: clientData.id,
          designerId: user.id,
          address: clientData.address,
          scheduledAt: new Date().toISOString(),
          roomType: allRooms[0].roomName,
          deliveryCost: deliveryCost, // Pass global delivery cost
        });

        measurementId = measurementResponse.data.data.id;
      }

      // Get dealId for photos
      let dealId = null;
      try {
        const dealsRes = await ordersAPI.getAll({ clientId: clientData.id, designerId: user.id, limit: 1 });
        if (dealsRes.data.success && dealsRes.data.data.length > 0) {
          dealId = dealsRes.data.data[0].id;
        }
      } catch (err) {
      }

      // Save only NEW rooms as windows (skip rooms that already have backend ID)
      const newRoomsToSave = allRooms.filter(r => !r.id); // Only rooms with tempId, not id

      for (const room of newRoomsToSave) {
        // Upload design photos first to get URLs
        const uploadedPhotos = [];
        if (room.designPhotos && room.designPhotos.length > 0) {
          try {
            for (const photo of room.designPhotos) {
              // If it's a File object (new upload)
              if (photo.file) {
                const uploadRes = await uploadAPI.uploadPhoto(photo.file, {
                  dealId: dealId,
                  measurementId: measurementId,
                  photoType: 'design',
                  folder: 'orders'
                });
                if (!uploadRes.data?.success) {
                  throw new Error(uploadRes.data?.error || 'Фото жүктелмеді');
                }
                {
                  uploadedPhotos.push({
                    id: photo.id,
                    url: uploadRes.data.data.url,
                    thumbnailUrl: uploadRes.data.data.url,
                    description: 'Design Photo'
                  });

                  // Also add to global photos table for backward compatibility if needed,
                  // or just rely on window.designPhotos JSON
                  // Don't send 'id' - backend will generate UUID automatically
                  await measurementsAPI.addPhoto(measurementId, {
                    type: 'design_photo',
                    url: uploadRes.data.data.url,
                    thumbnailUrl: uploadRes.data.data.url,
                    roomName: room.roomName,
                    description: `Design photo for ${room.roomName}`,
                  });
                }
              } else {
                // Existing photo (if we support editing existing rooms later)
                uploadedPhotos.push(photo);
              }
            }
          } catch (err) {
            // Surface upload failures instead of silently saving a photoless room.
            throw err;
          }
        }

        // Save window with full details
        // Convert lengthMeters to millimeters for dimensions
        const widthMm = Math.round(room.lengthMeters * 1000);
        const heightMm = room.priceBreakdown?.inputs?.roomHeight
          ? Math.round(room.priceBreakdown.inputs.roomHeight * 1000)
          : 2800; // Default 2.8m in mm

        await measurementsAPI.addWindow(measurementId, {
          // Don't send 'id' - backend generates UUID automatically
          roomName: room.roomName,
          fabricCode: room.fabricCode,
          fabricBrand: room.fabricBrand || '',
          lengthMeters: room.lengthMeters,
          dimensions: { widthCenter: widthMm, heightCenter: heightMm },
          mountingType: 'wall',
          notes: `Ұзындығы: ${room.lengthMeters}м, Элементтер: ${room.items?.length || 0}`,
          // New fields
          priceBreakdown: room.priceBreakdown || {},
          items: room.items, // Pass the array!
          designPhotos: uploadedPhotos,
          deliveryCost: deliveryCost,
        });
      }

      navigate(`/designer/measurements/${measurementId}`);
    } catch (error) {
      const code = error?.response?.data?.code;
      const apiMsg = error?.response?.data?.error || error?.message;
      if (code === 'SUBSCRIPTION_READ_ONLY') {
        showToast('Жазылым белсенді емес — тарифті жаңартыңыз', 'error');
      } else {
        showToast(apiMsg || 'Сақтау кезінде қате шықты. Қайталап көріңіз.', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (showClientForm) {
    return <ClientForm onSubmit={handleClientSubmit} onCancel={() => navigate(-1)} />;
  }

  return (
    <div className="bg-background-light min-h-screen pb-32">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="size-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted transition-colors">
            <Icon name="arrow_back" className="text-muted-foreground" />
          </button>
          <div>
            <h1 className="text-xl font-bold leading-tight">Өлшем алу</h1>
            <p className="text-xs text-muted-foreground">{savedRooms.length} бөлме қосылды</p>
          </div>
        </div>
      </header>

      <main className="w-full max-w-lg mx-auto px-4 pt-4">
        {/* Client Info Card - Fixed at top */}
        <div className="bg-card rounded-2xl p-4 shadow-sm mb-4 border border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Icon name="person" className="text-primary" />
              </div>
              <div>
                <p className="font-bold text-foreground">{clientData?.name}</p>
                <p className="text-sm text-muted-foreground">{clientData?.phone}</p>
              </div>
            </div>
            <button onClick={() => setShowClientForm(true)} className="text-primary p-2 hover:bg-primary/10 rounded-lg transition-colors">
              <Icon name="edit" />
            </button>
          </div>
          {clientData?.address && (
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Icon name="location_on" size={16} />
                {clientData.address}
              </p>
            </div>
          )}
        </div>

        {/* Saved Rooms List */}
        {savedRooms.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
              <Icon name="check_circle" size={18} className="text-primary" />
              Қосылған бөлмелер
            </h3>
            <div className="space-y-2">
              {savedRooms.map((room, index) => (
                <div key={room.tempId || room.id} className="bg-card rounded-xl p-3 shadow-sm border border-border flex items-center gap-3">
                  {room.designPhotos && room.designPhotos.length > 0 ? (
                    <div className="flex -space-x-2">
                      {room.designPhotos.slice(0, 3).map((p, i) => (
                        <img key={i} src={p.preview} alt="Design" className="size-14 rounded-lg object-cover border-2 border-white" />
                      ))}
                      {room.designPhotos.length > 3 && (
                        <div className="size-14 rounded-lg bg-muted flex items-center justify-center border-2 border-white text-xs font-bold text-muted-foreground">
                          +{room.designPhotos.length - 3}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="size-14 rounded-lg bg-muted flex items-center justify-center">
                      <Icon name="image" className="text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground truncate">{room.roomName}</p>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-xs text-muted-foreground">Код: {room.fabricCode}</p>
                      {room.priceBreakdown?.clientCheck?.total > 0 && (
                        <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-lg">
                          {room.priceBreakdown.clientCheck.total.toLocaleString()} ₸
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-primary font-bold">{room.lengthMeters} м</p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveRoom(room);
                    }}
                    className="size-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors active:scale-95"
                  >
                    <Icon name="close" size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* New Room Form */}
        <div className="bg-card rounded-2xl shadow-sm border border-border">
          <div className="bg-gradient-to-r from-primary/10 to-primary/10 px-4 py-3 border-b border-border">
            <h3 className="font-bold text-foreground flex items-center gap-2">
              <Icon name="add_home" className="text-primary" />
              {savedRooms.length > 0 ? 'Жаңа бөлме қосу' : 'Бөлме қосу'}
            </h3>
          </div>

          <div className="p-4 space-y-4">
            {/* Room Selection */}
            <div>
              <label className="block text-xs font-bold text-foreground mb-2">Бөлме *</label>

              <div className="relative">
                {/* Room display/selection button */}
                {showCustomInput ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customRoomName}
                      onChange={(e) => setCustomRoomName(e.target.value)}
                      className="flex-1 p-3 bg-muted border-2 border-border rounded-xl focus:border-primary focus:bg-card transition-all font-medium"
                      placeholder="Бөлме атауын жазыңыз..."
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleCustomRoomConfirm}
                      className="px-4 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors"
                    >
                      OK
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowCustomInput(false); setCustomRoomName(''); }}
                      className="px-3 bg-muted text-muted-foreground rounded-xl font-bold hover:bg-muted transition-colors"
                    >
                      <Icon name="close" />
                    </button>
                  </div>
                ) : selectedRoom ? (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 p-3 bg-primary/10 border-2 border-primary/30 rounded-xl">
                      <span className="font-bold text-foreground">{selectedRoom}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowRoomDropdown(!showRoomDropdown)}
                      className="p-3 bg-muted text-muted-foreground rounded-xl hover:bg-muted transition-colors"
                    >
                      <Icon name="edit" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowRoomDropdown(!showRoomDropdown)}
                    className="w-full flex items-center justify-between p-3 bg-muted border-2 border-border rounded-xl hover:border-primary transition-colors"
                  >
                    <span className="text-muted-foreground">Бөлмені таңдаңыз...</span>
                    <Icon name="expand_more" className="text-muted-foreground" />
                  </button>
                )}

                {/* Dropdown menu - always positioned relative to parent */}
                {showRoomDropdown && (
                  <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-xl max-h-64 overflow-y-auto">
                    {ROOM_TYPES.map(room => (
                      <button
                        key={room.id}
                        type="button"
                        onClick={() => handleRoomSelect(room)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-primary/5 transition-colors border-b border-gray-50 last:border-0"
                      >
                        <Icon name={room.icon} className="text-primary" />
                        <span className="font-medium text-foreground">{room.label}</span>
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={handleCustomRoomSelect}
                      className="w-full flex items-center gap-3 p-3 hover:bg-primary/5 transition-colors text-primary"
                    >
                      <Icon name="add_circle" />
                      <span className="font-medium">Өз нұсқам...</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Show form fields only when room is selected */}
            {selectedRoom && (
              <>
                {/* 1. Dimensions (Global for this window) */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-2">Карниз ені (м) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={lengthMeters} // reusing lengthMeters as cornice width
                      onChange={e => setLengthMeters(e.target.value)}
                      className="w-full p-3 bg-muted border-2 border-border rounded-xl focus:border-primary focus:bg-card transition-all font-bold text-lg"
                      placeholder="3.5"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-2">Бөлме биіктігі (м) *</label>
                    <input
                      type="number"
                      step="0.01"
                      id="roomHeightInput"
                      defaultValue="2.8"
                      // We might want to state-manage this too
                      onChange={(e) => {
                        // If we want to recalculate all items when height changes, we'd need to update roomItems.
                        // For now, just let new items use this.
                      }}
                      className="w-full p-3 bg-muted border-2 border-border rounded-xl focus:border-primary focus:bg-card transition-all font-bold text-lg"
                      placeholder="2.8"
                    />
                  </div>
                </div>

                {/* 2. Added Items List */}
                {roomItems.length > 0 && (
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-foreground">Элементтер:</label>
                    {roomItems.map((item, idx) => (
                      <div key={idx} className="bg-card p-3 rounded-xl border border-border shadow-sm flex justify-between items-center relative group">
                        <div>
                          <div className="font-bold text-sm text-foreground flex items-center gap-2">
                            <div>
                              {item.type === 'tulle' && 'Тюль'}
                              {item.type === 'curtain' && 'Перде'}
                              {item.type === 'cornice' && 'Карниз'}
                              {item.type === 'accessory' && 'Аксессуар'}
                              : <span className="text-primary">{item.product.code}</span>
                            </div>
                            {item.variant && (
                              <span className="px-2 py-0.5 bg-primary/15 text-primary-dark text-xs rounded-full font-medium">
                                {item.variant.variantCode || item.variant.variant_code}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {item.calculation.total.toLocaleString()} ₸
                            {item.params.coeff && ` (k=${item.params.coeff})`}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                        >
                          <Icon name="delete" size={18} />
                        </button>
                      </div>
                    ))}

                    {/* Total Room Price */}
                    <div className="bg-gray-900 text-white p-3 rounded-xl flex justify-between items-center">
                      <span className="font-bold">Жалпы сома:</span>
                      <span className="font-bold text-lg text-green-400">
                        {roomItems.reduce((sum, item) => sum + (item.calculation.total || 0), 0).toLocaleString()} ₸
                      </span>
                    </div>
                  </div>
                )}

                {/* 3. Add Item Component */}
                <div className="border-t border-border pt-4">
                  <label className="block text-xs font-bold text-foreground mb-2">Элемент қосу</label>
                  <MeasurementItemForm
                    onAdd={handleAddItem}
                    roomHeight={document.getElementById('roomHeightInput')?.value || 2.8}
                    corniceWidth={lengthMeters}
                  />
                </div>
              </>
            )}
          </div>

          {/* Dimensions */}
          {!selectedRoom && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-2">Карниз ені *</label>
                  <div className="flex items-stretch">
                    <input
                      type="number"
                      step="0.01"
                      value={lengthMeters}
                      onChange={(e) => {
                        setLengthMeters(e.target.value);
                      }}
                      className="w-full p-3 bg-muted border-2 border-border rounded-xl focus:border-primary focus:bg-card transition-all font-medium text-lg"
                      placeholder="3.0"
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground">Карниз ені (метрмен)</span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-2">Төбе биіктігі</label>
                  <input
                    type="number"
                    step="0.01"
                    defaultValue="2.8"
                    id="roomHeightInput" // Using ID to read value for now without extra state if possible, or add state
                    onChange={() => {
                      // Optional: Update heights for all items inside roomItems?
                      // For now, new items added will read this value.
                    }}
                    className="w-full p-3 bg-muted border-2 border-border rounded-xl focus:border-primary focus:bg-card transition-all font-medium text-lg"
                    placeholder="2.8"
                  />
                </div>
              </div>

              {/* Design Photos */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-2">Дизайн фото</label>

                <div className="grid grid-cols-2 gap-2 mb-2">
                  {designPhotos.map(photo => (
                    <div key={photo.id} className="relative aspect-video rounded-xl overflow-hidden border border-border">
                      <img src={photo.preview} alt="Design" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeDesignPhoto(photo.id)}
                        className="absolute top-1 right-1 size-6 bg-red-500/80 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                      >
                        <Icon name="close" size={14} />
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => designPhotoRef.current?.click()}
                    className="aspect-video rounded-xl border-2 border-dashed border-input bg-muted hover:border-primary hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-1"
                  >
                    <Icon name="add_photo_alternate" size={28} className="text-primary" />
                    <span className="text-xs font-bold text-muted-foreground">Фото қосу</span>
                  </button>
                </div>

                <input
                  type="file"
                  ref={designPhotoRef}
                  onChange={handleDesignPhotoSelect}
                  accept="image/*"
                  multiple
                  className="hidden"
                />
              </div>

              {/* Price Calculation (Legacy block removed, using roomItems list above) */}

              {/* Add Room Button */}
              <button
                type="button"
                onClick={handleAddRoom}
                disabled={saving || !selectedRoom || !lengthMeters || roomItems.length === 0}
                className="w-full py-3 bg-primary/10 text-primary font-bold rounded-xl hover:bg-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="size-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    Қосылуда...
                  </>
                ) : (
                  <>
                    <Icon name="add" />
                    Бөлмені қосу
                  </>
                )}
              </button>
            </>
          )}
        </div>

        {/* Add Another Room Button */}
        {
          !selectedRoom && savedRooms.length > 0 && (
            <button
              type="button"
              onClick={() => setShowRoomDropdown(true)}
              className="w-full mt-4 py-4 border-2 border-dashed border-input rounded-xl text-muted-foreground font-bold hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2"
            >
              <Icon name="add_circle" />
              Тағы бір бөлме қосу
            </button>
          )
        }

        {/* Global Accessories Section */}
        <div className="mt-8 mb-8">
          <div className="bg-card rounded-2xl shadow-sm border border-orange-100 overflow-hidden">
            <div className="bg-orange-50 px-4 py-3 border-b border-orange-100 flex justify-between items-center">
              <h3 className="font-bold text-orange-900 flex items-center gap-2">
                <Icon name="inventory_2" />
                Қосымша материалдар
              </h3>
              <div className="text-xs bg-card px-2 py-1 rounded-lg text-orange-600 font-bold border border-orange-200">
                Жалпы тапсырыс үшін
              </div>
            </div>

            <div className="p-4 space-y-4">
              {/* Recommendation Helper */}
              <div className="bg-primary/10 p-3 rounded-xl border border-primary/15 flex flex-col gap-2">
                {/* TAPE Recommendation */}
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <Icon name="info" className="text-primary" />
                    <div className="text-sm">
                      <p className="font-bold text-primary-dark">Ұсыныс (Таспа):</p>
                      <p className="text-primary-dark">
                        Барлық бөлмелер бойынша:
                        <span className="font-bold ml-1">
                          {(() => {
                            const val = ([...savedRooms, { items: roomItems }].reduce((acc, room) => {
                              return acc + (room.items?.reduce((sum, item) => {
                                const tech = item.calculation?.techDetails;
                                if (tech?.sewingLength) return sum + parseFloat(tech.sewingLength);

                                if (item.type === 'tulle' || item.type === 'curtain') {
                                  const w = parseFloat(item.params?.width || 0);
                                  const k = parseFloat(item.params?.coeff || 1);
                                  return sum + (w * k);
                                }
                                return sum;
                              }, 0) || 0);
                            }, 0));
                            return val.toFixed(1);
                          })()} м
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* HOOKS Recommendation */}
                <div className="flex items-center justify-between border-t border-primary/25/50 pt-2 mt-1">
                  <div className="flex items-start gap-3">
                    <Icon name="webhook" className="text-primary" />
                    <div className="text-sm">
                      <p className="font-bold text-primary-dark">Ұсыныс (Ілгектер):</p>
                      <p className="text-primary-dark">
                        Таспа ұзындығына сәйкес (әр 10см + 10):
                        <span className="font-bold ml-1">
                          {(() => {
                            const tapeMeters = ([...savedRooms, { items: roomItems }].reduce((acc, room) => {
                              return acc + (room.items?.reduce((sum, item) => {
                                const tech = item.calculation?.techDetails;
                                if (tech?.sewingLength) return sum + parseFloat(tech.sewingLength);
                                if (item.type === 'tulle' || item.type === 'curtain') {
                                  const w = parseFloat(item.params?.width || 0);
                                  const k = parseFloat(item.params?.coeff || 1);
                                  return sum + (w * k);
                                }
                                return sum;
                              }, 0) || 0);
                            }, 0));
                            return Math.ceil((tapeMeters * 10) + 10);
                          })()} дана
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Added Global Items List */}
              {globalItems.length > 0 && (
                <div className="space-y-2">
                  {globalItems.map((item, idx) => (
                    <div key={idx} className="bg-card p-3 rounded-xl border border-border shadow-sm flex justify-between items-center relative group">
                      <div>
                        <div className="font-bold text-sm text-foreground flex items-center gap-2">
                          <div>
                            {item.type === 'tape' && 'Таспа'}
                            {item.type === 'accessory' && 'Аксессуар'}
                            : <span className="text-primary">{item.product.code}</span>
                          </div>
                          {item.variant && (
                            <span className="px-2 py-0.5 bg-primary/15 text-primary-dark text-xs rounded-full font-medium">
                              {item.variant.variantCode || item.variant.variant_code}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {item.calculation.quantity} {item.calculation.unit} x {item.calculation.price} = {item.calculation.total.toLocaleString()} ₸
                        </div>
                      </div>
                      <button
                        onClick={() => setGlobalItems(prev => prev.filter((_, i) => i !== idx))}
                        className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                      >
                        <Icon name="delete" size={18} />
                      </button>
                    </div>
                  ))}

                  <div className="bg-gray-900 text-white p-3 rounded-xl flex justify-between items-center">
                    <span className="font-bold">Қосымша сома:</span>
                    <span className="font-bold text-lg text-green-400">
                      {globalItems.reduce((sum, item) => sum + (item.calculation.total || 0), 0).toLocaleString()} ₸
                    </span>
                  </div>
                </div>
              )}

              {/* Add Global Item Form (Reuse MeasurementItemForm) */}
              <div className="border-t border-border pt-4">
                <label className="block text-xs font-bold text-foreground mb-2">Қосымша элемент қосу</label>
                <MeasurementItemForm
                  onAdd={(item) => setGlobalItems(prev => [...prev, item])}
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 w-full bg-card/95 backdrop-blur-md border-t p-4 z-40 pb-safe">
        <button
          type="button"
          onClick={handleSubmitAll}
          disabled={submitting || (savedRooms.length === 0 && !selectedRoom)}
          className="w-full bg-primary hover:bg-green-500 text-white font-bold text-lg py-4 rounded-xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <>
              <div className="size-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Сақталуда...
            </>
          ) : (
            <>
              Сақтау және жалғастыру
              <Icon name="arrow_forward" size={24} />
            </>
          )}
        </button>
      </div>


      {/* Delete Confirmation Modal */}
      {
        showDeleteModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDeleteModal(false)}>
            <div className="bg-card rounded-2xl p-6 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="text-center">
                <div className="size-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                  <Icon name="delete" size={32} className="text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Бөлмені жою?</h3>
                <p className="text-muted-foreground mb-6">
                  <span className="font-bold">{roomToDelete?.roomName}</span> бөлмесін жойғыңыз келетініне сенімдісіз бе? Бұл әрекетті қайтару мүмкін емес.
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteModal(false);
                      setRoomToDelete(null);
                    }}
                    className="flex-1 py-3 bg-muted text-foreground font-bold rounded-xl hover:bg-muted transition-colors"
                  >
                    Болдырмау
                  </button>
                  <button
                    type="button"
                    onClick={confirmRemoveRoom}
                    className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors active:scale-95"
                  >
                    Жою
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default MeasurementForm;
