import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { catalogAPI, uploadAPI } from '../../services/api';
import Icon from '../../components/common/Icon';
import { useI18n } from '../../contexts/I18nContext';

const CreateFabric = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = Boolean(id);
    const { t, lang } = useI18n();

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(isEditMode);
    const [uploading, setUploading] = useState(false);

    const [formData, setFormData] = useState({
        code: '',
        name: '',
        type: 'curtain',
        unit: 'm',
        pricePerMeter: '',
        costPrice: '',
        widthCm: '280',
        imageUrl: '',
        isAvailable: true,
    });

    const [colors, setColors] = useState([]);
    const [newColorName, setNewColorName] = useState('');

    const [notification, setNotification] = useState(null);
    const [errors, setErrors] = useState({});
    const fileInputRef = useRef(null);

    // Auto-hide notification
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    // Load fabric data if in edit mode
    useEffect(() => {
        if (isEditMode) {
            loadFabricData();
        }
    }, [id]);

    const loadFabricData = async () => {
        setFetching(true);
        try {
            const res = await catalogAPI.getFabricById(id);
            const data = res.data.data;

            // Load basic fabric data
            setFormData({
                code: data.code,
                name: data.name,
                type: data.type,
                unit: data.unit || 'm',
                pricePerMeter: data.pricePerMeter,
                costPrice: data.costPrice,
                widthCm: data.widthCm || '0',
                imageUrl: data.imageUrl || '',
                isAvailable: data.isAvailable
            });

            // Load color variants (best-effort — a variant error must not abort
            // the whole edit screen, otherwise the form bounces with "loadError").
            try {
                const colorsRes = await catalogAPI.getProductVariants(id);
                const variants = colorsRes.data?.data || [];
                if (variants.length > 0) {
                    setColors(variants.map(v => v.variant_name || v.variant_code).filter(Boolean));
                }
            } catch (variantErr) {
                console.error('Failed to load product variants:', variantErr);
            }
        } catch (error) {
            setNotification({ type: 'error', message: t('fabrics.form.loadError', 'Тауар мәліметін жүктеу мүмкін болмады') });
            setTimeout(() => navigate('/admin/catalog'), 2000);
        } finally {
            setFetching(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const addColor = () => {
        if (!newColorName.trim()) {
            setNotification({ type: 'error', message: t('fabrics.form.colorNameRequired', 'Түс атауын немесе кодын жазыңыз') });
            return;
        }
        setColors([...colors, newColorName.trim()]);
        setNewColorName('');
    };

    const removeColor = (index) => {
        setColors(colors.filter((_, i) => i !== index));
    };

    const handleColorKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addColor();
        }
    };

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setNotification({ type: 'error', message: t('fabrics.form.onlyImages', 'Тек сурет файлдарын жүктеуге болады') });
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            setNotification({ type: 'error', message: t('fabrics.form.fileTooLarge', 'Файл өлшемі 10МБ-тан аспауы керек') });
            return;
        }

        setUploading(true);
        try {
            const res = await uploadAPI.uploadPhoto(file, { folder: 'products' });
            if (res.data?.success) {
                setFormData(prev => ({ ...prev, imageUrl: res.data.data.url }));
                setNotification({ type: 'success', message: t('fabrics.form.imageUploaded', 'Сурет сәтті жүктелді') });
            }
        } catch (error) {
            setNotification({ type: 'error', message: t('fabrics.form.imageUploadFailed', 'Суретті жүктеу сәтсіз аяқталды') });
        } finally {
            setUploading(false);
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = t('fabrics.form.errorNameRequired', 'Атауын жазу керек');
        if (!formData.costPrice || parseFloat(formData.costPrice) <= 0) newErrors.costPrice = t('fabrics.form.errorCostInvalid', 'Закуп бағасы дұрыс емес');
        if (!formData.pricePerMeter || parseFloat(formData.pricePerMeter) <= 0) newErrors.pricePerMeter = t('fabrics.form.errorSellInvalid', 'Сату бағасы дұрыс емес');

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const calculateMargin = () => {
        const cost = parseFloat(formData.costPrice) || 0;
        const sell = parseFloat(formData.pricePerMeter) || 0;
        if (cost === 0) return 0;
        return Math.round(((sell - cost) / cost) * 100);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) {
            setNotification({ type: 'error', message: t('fabrics.form.fixErrors', 'Қызылмен белгіленген қателерді түзетіңіз') });
            return;
        }

        setLoading(true);
        setErrors({});

        // Prepare colors as simple array of strings
        const validColors = colors.filter(c => c.trim());

        const payload = {
            ...formData,
            code: formData.code.trim() || undefined, // Don't send empty code
            pricePerMeter: parseFloat(formData.pricePerMeter),
            costPrice: parseFloat(formData.costPrice),
            widthCm: parseInt(formData.widthCm) || 0,
            unit: formData.unit,
            colors: validColors.length > 0 ? validColors.map(c => ({
                colorName: c,
                colorCode: c
            })) : undefined
        };

        try {
            if (isEditMode) {
                await catalogAPI.updateFabric(id, payload);
                setNotification({ type: 'success', message: t('fabrics.form.updateSuccess', 'Тауар өзгертілді!') });
            } else {
                await catalogAPI.createFabric(payload);
                setNotification({ type: 'success', message: t('fabrics.form.createSuccess', 'Тауар каталогқа сәтті қосылды!') });
            }

            setTimeout(() => {
                navigate('/admin/catalog');
            }, 1000);

        } catch (err) {
            const errorMsg = err.response?.data?.error || t('fabrics.form.serverError', 'Серверде қате орын алды');
            if (errorMsg.includes('already exists')) {
                setErrors({ code: t('fabrics.form.codeExists', 'Бұл артикул (код) базада бар!') });
                setNotification({ type: 'error', message: t('fabrics.form.codeDuplicate', 'Артикул қайталанып тұр') });
            } else {
                setNotification({ type: 'error', message: t('fabrics.form.saveError', 'Сақтау кезінде қате шықты: ') + errorMsg });
            }
        } finally {
            setLoading(false);
        }
    };

    const margin = calculateMargin();
    const getUnitLabel = () => {
        switch (formData.unit) {
            case 'pcs': return t('fabrics.form.unitPricePcs', 'тг/дн');
            case 'set': return t('fabrics.form.unitPriceSet', 'тг/жнқ');
            case 'roll': return t('fabrics.form.unitPriceRoll', 'тг/орам');
            case 'pack': return t('fabrics.form.unitPricePack', 'тг/қап');
            case 'box': return t('fabrics.form.unitPriceBox', 'тг/қорап');
            case 'pair': return t('fabrics.form.unitPricePair', 'тг/жұп');
            default: return t('fabrics.form.unitPriceMeter', 'тг/м');
        }
    };

    if (fetching) {
        return (
            <div className="min-h-screen bg-background-light flex items-center justify-center">
                <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="bg-background-light min-h-screen pb-32 relative">
            {notification && (
                <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 ${notification.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-500 text-white'}`}>
                    <Icon name={notification.type === 'success' ? 'check_circle' : 'error'} />
                    <span className="font-medium">{notification.message}</span>
                </div>
            )}

            <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-md border-b border-border px-4 py-4">
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => navigate('/admin/catalog')}
                        className="size-10 flex items-center justify-center rounded-full bg-muted hover:bg-muted transition-colors"
                    >
                        <Icon name="arrow_back" className="text-muted-foreground" />
                    </button>
                    <h1 className="text-xl font-bold text-foreground">
                        {isEditMode ? t('fabrics.form.titleEdit', 'Тауарды өзгерту') : t('fabrics.form.title', 'Жаңа тауар')}
                    </h1>
                    <div className="size-10"></div>
                </div>
            </header>

            <main className="p-4">
                <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
                    {/* Main Info */}
                    <div className="bg-card p-5 rounded-2xl shadow-sm space-y-4">
                        <h2 className="font-bold text-lg text-foreground border-b border-border pb-2 mb-4">
                            {t('fabrics.form.mainInfo', 'Негізгі ақпарат')}
                        </h2>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">
                                {t('fabrics.form.fieldName', 'Тауар атауы')} <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="name"
                                required
                                value={formData.name}
                                onChange={handleChange}
                                className={`w-full px-4 py-3 rounded-xl border ${errors.name ? 'border-red-500 bg-red-50 text-foreground' : 'border-border text-foreground'} focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all`}
                                placeholder={t('fabrics.form.fieldNamePlaceholder', 'Мысалы: Blackout Royal Blue')}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">
                                    {t('fabrics.form.fieldCode', 'Артикул')}
                                </label>
                                <input
                                    type="text"
                                    name="code"
                                    value={formData.code}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 rounded-xl border ${errors.code ? 'border-red-500 bg-red-50 text-foreground' : 'border-border text-foreground'} focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-mono uppercase`}
                                    placeholder="ITEM-001"
                                />
                                {errors.code && <p className="text-red-500 text-xs mt-1 font-medium">{errors.code}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">
                                    {t('fabrics.form.fieldUnit', 'Өлшем бірлігі')}
                                </label>
                                <select
                                    name="unit"
                                    value={formData.unit}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all bg-card text-foreground font-bold"
                                >
                                    <option value="m">{t('fabrics.form.unitOptions.m', 'Метр')}</option>
                                    <option value="pcs">{t('fabrics.form.unitOptions.pcs', 'Дана')}</option>
                                    <option value="set">{t('fabrics.form.unitOptions.set', 'Жинақ')}</option>
                                    <option value="roll">{t('fabrics.form.unitOptions.roll', 'Орам')}</option>
                                    <option value="pack">{t('fabrics.form.unitOptions.pack', 'Қаптама')}</option>
                                    <option value="box">{t('fabrics.form.unitOptions.box', 'Қорап')}</option>
                                    <option value="pair">{t('fabrics.form.unitOptions.pair', 'Жұп')}</option>
                                </select>
                            </div>
                        </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">
                                    {t('fabrics.form.fieldCategory', 'Категория')}
                                </label>
                                <select
                                    name="type"
                                    value={formData.type}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all bg-card text-foreground font-bold"
                                >
                                    <option value="curtain">{t('fabrics.typeLabels.curtain', 'Перде')}</option>
                                    <option value="tulle">{t('fabrics.typeLabels.tulle', 'Тюль')}</option>
                                    <option value="cornice">{t('fabrics.typeLabels.cornice', 'Карниз')}</option>
                                    <option value="jalousie">{t('fabrics.typeLabels.jalousie', 'Жалюзи')}</option>
                                    <option value="accessory">{t('fabrics.typeLabels.accessory', 'Аксессуар (Таспа)')}</option>
                                    <option value="ready_made">{t('fabrics.typeLabels.ready_made', 'Дайын өнім')}</option>
                                </select>
                        </div>

                        {/* Dimension Field - Only for Curtain/Tulle */}
                        {['curtain', 'tulle'].includes(formData.type) && (
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">
                                    {t('fabrics.form.fieldRollHeight', 'Рулон Биіктігі (см)')}
                                </label>
                                <input
                                    type="number"
                                    name="widthCm"
                                    value={formData.widthCm}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-foreground"
                                    placeholder="280"
                                />
                                <p className="text-[10px] text-muted-foreground mt-1">
                                    {t('fabrics.form.rollHeightHint', '* Стандарт: 280-320 см')}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Color Variants - Simple */}
                    <div className="bg-card p-5 rounded-2xl shadow-sm space-y-4">
                        <h2 className="font-bold text-lg text-foreground border-b border-border pb-2 mb-4">
                            {t('fabrics.form.colorsTitle', 'Түстер (қосымша)')}
                            </h2>

                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newColorName}
                                onChange={(e) => setNewColorName(e.target.value)}
                                onKeyPress={handleColorKeyPress}
                                className="flex-1 min-w-0 px-4 py-3 rounded-xl border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-foreground"
                                placeholder={t('fabrics.form.colorPlaceholder', 'Мысалы: Қызыл немесе RED-001')}
                            />
                            <button
                                type="button"
                                onClick={addColor}
                                className="shrink-0 px-4 py-3 rounded-xl bg-primary text-white hover:brightness-110 transition-all flex items-center gap-2 font-semibold"
                            >
                                <Icon name="add" />
                                {t('fabrics.form.addColor', 'Қосу')}
                            </button>
                        </div>

                        {colors.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-4">
                        {colors.map((color, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg group hover:bg-muted transition-colors"
                                    >
                                        <span className="text-sm text-foreground font-medium">{color}</span>
                                        <button
                                            type="button"
                                            onClick={() => removeColor(index)}
                                            className="text-red-500 hover:text-red-700 transition-colors"
                                        >
                                            <Icon name="close" size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {colors.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                {t('fabrics.form.noColors', 'Түстер қосылмаған')}
                            </p>
                        )}
                    </div>

                    {/* Pricing */}
                    <div className="bg-card p-5 rounded-2xl shadow-sm space-y-4">
                        <h2 className="font-bold text-lg text-foreground border-b border-border pb-2 mb-4 flex items-center gap-2">
                            {t('fabrics.form.pricingTitle', 'Құны және Бағасы')}
                        </h2>

                        <div className="bg-primary/10/50 rounded-xl p-3 mb-4 flex items-center gap-3 border border-primary/15">
                            <Icon name="info" className="text-primary" />
                            <p className="text-xs text-primary">
                                {t('fabrics.form.priceHintPrefix', 'Бағаны')} <b>{formData.unit === 'm' ? t('fabrics.form.oneMeter', '1 метр') : t('fabrics.form.onePiece', '1 дана')}</b> {t('fabrics.form.priceHintSuffix', 'үшін көрсетіңіз.')}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">
                                    {t('fabrics.form.fieldCostPrice', 'Сатып алу бағасы')} <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        name="costPrice"
                                        required
                                        min="0"
                                        value={formData.costPrice}
                                        onChange={handleChange}
                                        className={`w-full pl-4 pr-8 py-3 rounded-xl border ${errors.costPrice ? 'border-red-500 bg-red-50 text-foreground' : 'border-border text-foreground'} focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all`}
                                        placeholder="0"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">₸</span>
                                </div>
                                {errors.costPrice && <p className="text-red-500 text-xs mt-1 font-medium">{errors.costPrice}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">
                                    {t('fabrics.form.fieldSellPrice', 'Сату бағасы')} ({getUnitLabel()}) <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        name="pricePerMeter"
                                        required
                                        min="0"
                                        value={formData.pricePerMeter}
                                        onChange={handleChange}
                                        className={`w-full pl-4 pr-8 py-3 rounded-xl border ${errors.pricePerMeter ? 'border-red-500 bg-red-50 text-foreground' : 'border-border text-foreground'} focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all`}
                                        placeholder="0"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">₸</span>
                                </div>
                                {errors.pricePerMeter && <p className="text-red-500 text-xs mt-1 font-medium">{errors.pricePerMeter}</p>}
                            </div>
                        </div>

                        {/* Margin Preview */}
                        <div className="bg-primary/10 rounded-xl p-4 flex justify-between items-center">
                            <span className="text-sm font-bold text-primary">{t('fabrics.form.margin', 'Маржа')}</span>
                            <div className="text-right">
                                <span className={`text-xl font-black ${margin > 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
                                    {margin}%
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Main Product Image */}
                    <div className="bg-card p-5 rounded-2xl shadow-sm space-y-4">
                        <h2 className="font-bold text-lg text-foreground border-b border-border pb-2 mb-4">
                            {t('fabrics.form.imageTitle', 'Негізгі сурет')}
                        </h2>

                        <input
                            type="file"
                            ref={fileInputRef}
                            hidden
                            accept="image/*"
                            onChange={handleFileSelect}
                        />

                        {formData.imageUrl ? (
                            <div className="relative rounded-2xl overflow-hidden aspect-video border border-border group">
                                <img
                                    src={formData.imageUrl}
                                    alt="Preview"
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => window.open(formData.imageUrl, '_blank')}
                                        className="p-2 bg-card/20 hover:bg-card/40 rounded-full text-white backdrop-blur-sm transition-colors"
                                    >
                                        <Icon name="visibility" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="p-2 bg-card/20 hover:bg-card/40 rounded-full text-white backdrop-blur-sm transition-colors"
                                    >
                                        <Icon name="edit" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, imageUrl: '' }))}
                                        className="p-2 bg-red-500/80 hover:bg-red-600/80 rounded-full text-white backdrop-blur-sm transition-colors"
                                    >
                                        <Icon name="delete" />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className="w-full aspect-video rounded-2xl border-2 border-dashed border-input hover:border-primary hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-2 group"
                            >
                                {uploading ? (
                                    <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <div className="size-12 rounded-full bg-muted group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                                            <Icon name="add_photo_alternate" size={24} className="text-muted-foreground" />
                                        </div>
                                        <p className="text-muted-foreground font-medium group-hover:text-primary transition-colors">{t('fabrics.form.uploadImage', 'Сурет жүктеу')}</p>
                                        <p className="text-xs text-muted-foreground">PNG, JPG (max 10MB)</p>
                                    </>
                                )}
                            </button>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading || uploading}
                        className="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-lg hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? t('fabrics.form.saving', 'Сақталуда...') : isEditMode ? t('fabrics.form.saveChanges', 'Өзгерістерді сақтау') : t('fabrics.form.saveProduct', 'Тауарды сақтау')}
                    </button>

                    <div className="h-10"></div>
                </form>
            </main>
        </div>
    );
};

export default CreateFabric;