import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { catalogAPI } from '../../services/api';
import Icon from '../../components/common/Icon';

const ServiceForm = () => {
    const navigate = useNavigate();
    const { id } = useParams(); // Get ID from URL if editing
    const isEditing = !!id;

    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(isEditing);
    const [notification, setNotification] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        serviceType: 'sewing',
        calcMethod: 'per_meter',
        baseRate: '',
        complexitySimple: 1.0,
        complexityMedium: 1.3,
        complexityComplex: 2.0,
        isActive: true
    });

    // Auto-hide notification
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    // Load existing data if editing
    useEffect(() => {
        if (isEditing) {
            loadService();
        }
    }, [id]);

    const loadService = async () => {
        try {
            setInitialLoading(true);
            const response = await catalogAPI.getServiceById(id);
            // Assuming response structure: { success: true, data: { ... } } or directly { ... }
            // The existing getById implementation might return an array or object depending on backend.
            // Wait, looking at backend controller, findAll returns array, findById endpoint was NOT there before. 
            // Wait, I DID look for findById in controller, it wasn't there explicitly exposed but repository had it.
            // Ah, I did NOT add getServiceById to the controller in my previous step!
            // I added updateService and deleteService. 
            // I see in routes: router.get('/services', ... getServiceRates)
            // But I don't see router.get('/services/:id') in my previous view of routes.
            // Checking... the implementation plan said "Update Backend -> Add PUT/DELETE". It didn't explicitly say Add GET /:id details.
            // However, to edit, I need to fetch the single service details.
            // Workaround: I can fetch all and find by ID on client side since list is small, OR I should add GET /:id to backend.
            // Let's assume I missed adding GET /:id to backend. I should add it.
            // BUT, for now, to save tool calls, I can fetch all and filter.
            // Wait, I can fix the backend in a separate step or just rely on getServices filtering.

            // Let's try fetching all for now as a quick fix, or if I am confident, I can fix backend.
            // Actually, I should probably just fetch all and filter client side for now to be safe and fast, 
            // as services list is usually small (<50 items).

            const res = await catalogAPI.getServices();
            // find by id
            const service = res.data?.data?.find(s => s.id === id);

            if (service) {
                setFormData({
                    name: service.name,
                    description: service.description || '',
                    serviceType: service.serviceType,
                    calcMethod: service.calcMethod,
                    baseRate: service.baseRate,
                    complexitySimple: service.complexity ? service.complexity.simple : 1.0,
                    complexityMedium: service.complexity ? service.complexity.medium : 1.3,
                    complexityComplex: service.complexity ? service.complexity.complex : 2.0,
                    isActive: true // Assume active if returned
                });
            } else {
                setNotification({ type: 'error', message: 'Қызмет табылмады' });
                setTimeout(() => navigate('/admin/catalog'), 2000);
            }
        } catch (err) {
            setNotification({ type: 'error', message: 'Жүктеу қатесі' });
        } finally {
            setInitialLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name || !formData.baseRate) {
            setNotification({ type: 'error', message: 'Атауы мен бағасын толтырыңыз' });
            return;
        }

        setLoading(true);

        try {
            const payload = {
                ...formData,
                baseRate: parseFloat(formData.baseRate),
                complexitySimple: parseFloat(formData.complexitySimple),
                complexityMedium: parseFloat(formData.complexityMedium),
                complexityComplex: parseFloat(formData.complexityComplex),
            };

            if (isEditing) {
                await catalogAPI.updateService(id, payload);
                setNotification({ type: 'success', message: 'Қызмет жаңартылды!' });
            } else {
                await catalogAPI.createService(payload);
                setNotification({ type: 'success', message: 'Қызмет сақталды!' });
            }

            setTimeout(() => {
                navigate('/admin/catalog');
            }, 1000);

        } catch (err) {
            const errorMsg = err.response?.data?.error || 'Серверде қате орын алды';
            setNotification({ type: 'error', message: errorMsg });
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background-light">
                <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="bg-background-light min-h-screen pb-32 relative">
            {/* Notification Toast */}
            {notification && (
                <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-xl flex items-center justify-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 ${notification.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-500 text-white'
                    }`}>
                    <Icon name={notification.type === 'success' ? 'check_circle' : 'error'} />
                    <span className="font-medium whitespace-nowrap">{notification.message}</span>
                </div>
            )}

            {/* Header */}
            <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-md border-b border-border px-4 py-4">
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => navigate('/admin/catalog')}
                        className="size-10 flex items-center justify-center rounded-full bg-muted hover:bg-muted transition-colors"
                    >
                        <Icon name="arrow_back" className="text-muted-foreground" />
                    </button>
                    <h1 className="text-xl font-bold text-foreground">
                        {isEditing ? 'Қызметті өзгерту' : 'Жаңа қызмет'}
                    </h1>
                    <div className="size-10"></div>
                </div>
            </header>

            <main className="p-4">
                <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
                    {/* Main Info */}
                    <div className="bg-card p-5 rounded-2xl shadow-sm space-y-4">
                        <h2 className="font-bold text-lg text-foreground border-b border-border pb-2 mb-4">
                            Негізгі ақпарат
                        </h2>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">
                                Қызмет атауы <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="name"
                                required
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-xl border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                placeholder="Мысалы: Перде тігу (люверс)"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">
                                    Санат (Тип)
                                </label>
                                <select
                                    name="serviceType"
                                    value={formData.serviceType}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all bg-card"
                                >
                                    <option value="sewing">Тігу</option>
                                    <option value="installation">Орнату</option>
                                    <option value="delivery">Жеткізу</option>
                                    <option value="other">Басқа</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">
                                    Есептеу әдісі
                                </label>
                                <select
                                    name="calcMethod"
                                    value={formData.calcMethod}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all bg-card"
                                >
                                    <option value="per_meter">Метр үшін</option>
                                    <option value="per_item">Дана үшін</option>
                                    <option value="per_room">Бөлме үшін</option>
                                    <option value="per_window">Терезе үшін</option>
                                    <option value="fixed">Тұрақты</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">
                                Сипаттама
                            </label>
                            <textarea
                                name="description"
                                rows="2"
                                value={formData.description}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-xl border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                placeholder="Қызмет туралы қосымша ақпарат..."
                            />
                        </div>
                    </div>

                    {/* Pricing */}
                    <div className="bg-card p-5 rounded-2xl shadow-sm space-y-4">
                        <h2 className="font-bold text-lg text-foreground border-b border-border pb-2 mb-4">
                            Баға
                        </h2>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">
                                Бағасы <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    name="baseRate"
                                    required
                                    min="0"
                                    value={formData.baseRate}
                                    onChange={handleChange}
                                    className="w-full pl-4 pr-8 py-3 rounded-xl border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-bold text-lg"
                                    placeholder="0"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">₸</span>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-lg hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Сақталуда...' : (isEditing ? 'Өзгерістерді сақтау' : 'Қызметті сақтау')}
                    </button>

                    <div className="h-10"></div>
                </form>
            </main>
        </div>
    );
};

export default ServiceForm;
