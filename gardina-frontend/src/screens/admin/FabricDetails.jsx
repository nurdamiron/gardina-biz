import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { catalogAPI } from '../../services/api';
import Icon from '../../components/common/Icon';
import { useUI } from '../../contexts/UIContext';

const FabricDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showNotification } = useUI();
    const [fabric, setFabric] = useState(null);
    const [variants, setVariants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        loadFabric();
    }, [id]);

    const loadFabric = async () => {
        setLoading(true);
        try {
            const res = await catalogAPI.getFabricById(id);
            setFabric(res.data.data);

            // Load variants if this is a fabric type
            if (['curtain', 'tulle'].includes(res.data.data.type)) {
                try {
                    const variantsRes = await catalogAPI.getProductVariants(id);
                    setVariants(variantsRes.data?.data || []);
                } catch (err) {
                    console.error('Error loading variants:', err);
                    setVariants([]);
                }
            }
        } catch (err) {
            setError('Тауар табылмады');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await catalogAPI.deleteFabric(id);
            showNotification?.('Тауар сәтті өшірілді', 'success');
            navigate('/admin/catalog');
        } catch (err) {
            showNotification?.('Өшіру мүмкін болмады', 'error');
        } finally {
            setDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    const getUnitLabel = (unit) => {
        switch (unit) {
            case 'pcs': return 'дн';
            case 'set': return 'жнқ';
            case 'roll': return 'орам';
            case 'pack': return 'қап';
            case 'box': return 'қорап';
            case 'pair': return 'жұп';
            default: return 'метр';
        }
    };

    const getTypeLabel = (type) => {
        switch (type) {
            case 'curtain': return 'Перде';
            case 'tulle': return 'Тюль';
            case 'cornice': return 'Карниз';
            case 'jalousie': return 'Жалюзи';
            case 'accessory': return 'Аксессуар (Таспа)';
            case 'ready_made': return 'Дайын өнім';
            default: return type;
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-background-light flex items-center justify-center">
            <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    if (error || !fabric) return (
        <div className="min-h-screen bg-background-light p-4 flex flex-col items-center justify-center text-center">
            <Icon name="error" size={32} className="text-gray-400" />
            <p className="text-gray-600 mb-4">{error || 'Тауар табылмады'}</p>
            <button
                onClick={() => navigate('/admin/catalog')}
                className="text-primary font-bold hover:underline"
            >
                Каталогқа оралу
            </button>
        </div>
    );

    // Calculate margin if not provided by backend
    const margin = fabric.pricePerMeter && fabric.costPrice
        ? fabric.pricePerMeter - fabric.costPrice
        : 0;
    const marginPercent = fabric.costPrice
        ? Math.round((margin / fabric.costPrice) * 100)
        : 0;

    return (
        <div className="min-h-screen bg-background-light pb-24 relative">
            {/* Header */}
            <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-4">
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => navigate('/admin/catalog')}
                        className="size-10 flex items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                        <Icon name="arrow_back" className="text-gray-600" />
                    </button>
                    <h1 className="text-xl font-bold text-gray-900 truncate max-w-[200px]">{fabric.name}</h1>
                    <button
                        onClick={() => navigate(`/admin/catalog/products/${id}/edit`)}
                        className="size-10 flex items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100 transition-colors text-primary"
                    >
                        <Icon name="edit" />
                    </button>
                </div>
            </header>

            <main className="p-4 space-y-6 max-w-2xl mx-auto">
                {/* Image */}
                <div className="bg-white rounded-2xl p-2 shadow-sm">
                    {fabric.imageUrl ? (
                        <div className="aspect-video rounded-xl overflow-hidden bg-gray-100 relative group cursor-pointer" onClick={() => window.open(fabric.imageUrl, '_blank')}>
                            <img
                                src={fabric.imageUrl}
                                alt={fabric.name}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <Icon name="zoom_in" size={32} className="text-white/80" />
                            </div>
                        </div>
                    ) : (
                        <div className="aspect-video rounded-xl bg-gray-50 flex flex-col items-center justify-center text-gray-400">
                            <Icon name="image_not_supported" size={32} />
                            <span className="text-sm">Сурет жоқ</span>
                        </div>
                    )}
                </div>

                {/* Product Code if available */}
                {fabric.code && (
                    <div className="bg-primary/10 border border-primary/25 rounded-xl p-3 flex items-center justify-center">
                        <span className="text-xs text-primary font-medium mr-2">АРТИКУЛ:</span>
                        <span className="text-lg font-bold text-primary-dark">{fabric.code}</span>
                    </div>
                )}

                {/* Main Stats */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Сату бағасы</p>
                        <p className="text-2xl font-black text-gray-900">{fabric.pricePerMeter?.toLocaleString()} ₸</p>
                        <p className="text-xs text-gray-400 mt-1">{getUnitLabel(fabric.unit)} үшін</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Маржа</p>
                        <p className={`text-2xl font-black ${margin > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                            {marginPercent}%
                        </p>
                        <p className="text-xs text-green-600/70 mt-1 font-medium">+{margin?.toLocaleString()} ₸</p>
                    </div>
                </div>

                {/* Variants indicator for non-fabric types */}
                {!['curtain', 'tulle'].includes(fabric.type) && variants.length > 0 && (
                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Icon name="inventory_2" className="text-primary" />
                            <span className="text-sm font-medium text-primary-dark">Варианттар бар</span>
                        </div>
                        <span className="px-3 py-1 bg-primary/10 text-primary-dark rounded-full text-sm font-bold">
                            {variants.length} түрі
                        </span>
                    </div>
                )}

                {/* Details */}
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-gray-100">
                        <h3 className="font-bold text-gray-900">Толық ақпарат</h3>
                    </div>
                    <div className="divide-y divide-gray-50">
                        <div className="p-4 flex justify-between">
                            <span className="text-gray-500">Категория</span>
                            <span className="font-medium text-gray-900">{getTypeLabel(fabric.type)}</span>
                        </div>
                        <div className="p-4 flex justify-between">
                            <span className="text-gray-500">Өлшем бірлігі</span>
                            <span className="font-medium text-gray-900">{getUnitLabel(fabric.unit)}</span>
                        </div>

                        {/* Show Dimension only if relevant */}
                        {['curtain', 'tulle'].includes(fabric.type) && (
                            <div className="p-4 flex justify-between">
                                <span className="text-gray-500">Рулон Биіктігі</span>
                                <span className="font-medium text-gray-900">{fabric.widthCm} см</span>
                            </div>
                        )}
                        {!['curtain', 'tulle', 'accessory'].includes(fabric.type) && fabric.widthCm > 0 && (
                            <div className="p-4 flex justify-between">
                                <span className="text-gray-500">Өлшемі</span>
                                <span className="font-medium text-gray-900">{fabric.widthCm} см</span>
                            </div>
                        )}

                        <div className="p-4 flex justify-between">
                            <span className="text-gray-500">Бренд</span>
                            <span className="font-medium text-gray-900">{fabric.brand || '—'}</span>
                        </div>
                        <div className="p-4 flex justify-between">
                            <span className="text-gray-500">Закуп бағасы</span>
                            <span className="font-medium text-gray-900">{fabric.costPrice?.toLocaleString()} ₸</span>
                        </div>
                        {/* Stock quantity if variants exist */}
                        {['curtain', 'tulle'].includes(fabric.type) && variants.length > 0 && (
                            <div className="p-4 flex justify-between">
                                <span className="text-gray-500">Жалпы қойма</span>
                                <span className="font-medium text-gray-900">
                                    {variants.reduce((sum, v) => sum + (v.stockQuantity || v.stock_quantity || 0), 0)} {getUnitLabel(fabric.unit)}
                                </span>
                            </div>
                        )}
                        <div className="p-4 flex justify-between">
                            <span className="text-gray-500">Статус</span>
                            <span className={`px-2 py-1 rounded text-xs font-bold ${fabric.isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {fabric.isAvailable ? '✅ Белсенді' : '❌ Архив'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Variants Section - Only for Curtain/Tulle */}
                {['curtain', 'tulle'].includes(fabric.type) && variants.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-gray-100">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                <Icon name="palette" className="text-primary" />
                                Варианттар ({variants.length})
                            </h3>
                        </div>
                        <div className="p-4 space-y-3">
                            {variants.map((variant, index) => (
                                <div
                                    key={variant.id || index}
                                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                                        variant.isDefault || variant.is_default
                                            ? 'bg-green-50 border-green-200'
                                            : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        {/* Color/Image preview */}
                                        {(variant.hexColor || variant.hex_color) ? (
                                            <div
                                                className="size-10 rounded-lg border-2 border-gray-300 shadow-sm"
                                                style={{ backgroundColor: variant.hexColor || variant.hex_color }}
                                            />
                                        ) : variant.imageUrl || variant.image_url ? (
                                            <img
                                                src={variant.imageUrl || variant.image_url}
                                                alt={variant.variantName || variant.variant_name}
                                                className="size-10 rounded-lg object-cover border border-gray-200"
                                            />
                                        ) : (
                                            <div className="size-10 rounded-lg bg-gray-200 flex items-center justify-center">
                                                <Icon name="image" size={16} className="text-gray-400" />
                                            </div>
                                        )}

                                        {/* Variant info */}
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-sm text-gray-900">
                                                    {variant.variantCode || variant.variant_code}
                                                </span>
                                                {(variant.isDefault || variant.is_default) && (
                                                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] rounded-full font-bold">
                                                        НЕГІЗГІ
                                                    </span>
                                                )}
                                            </div>
                                            {(variant.variantName || variant.variant_name) && (
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    {variant.variantName || variant.variant_name}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Stock info */}
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500">Қолда</p>
                                        <p className={`font-bold text-lg ${
                                            (variant.stockQuantity || variant.stock_quantity || 0) > 0
                                                ? 'text-gray-900'
                                                : 'text-red-500'
                                        }`}>
                                            {variant.stockQuantity || variant.stock_quantity || 0} {fabric.unit === 'm' ? 'м' : 'дн'}
                                        </p>
                                        {(variant.stockQuantity || variant.stock_quantity || 0) === 0 && (
                                            <span className="text-[10px] text-red-500 font-medium">ЖОҚ</span>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {/* Total stock summary */}
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-gray-600">Жалпы қолда:</span>
                                    <span className="text-lg font-bold text-primary">
                                        {variants.reduce((sum, v) => sum + (v.stockQuantity || v.stock_quantity || 0), 0)} {fabric.unit === 'm' ? 'метр' : 'дана'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-3">
                    {/* Edit Stock Button (only if variants exist) */}
                    {variants.length > 0 && (
                        <button
                            onClick={() => navigate(`/admin/catalog/products/${id}/edit`)}
                            className="w-full py-4 rounded-xl bg-primary/10 text-primary font-bold hover:bg-primary/20 transition-colors flex items-center justify-center gap-2"
                        >
                            <Icon name="inventory" />
                            Қоймадағы санды өзгерту
                        </button>
                    )}

                    {/* Delete Button */}
                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="w-full py-4 rounded-xl text-red-500 font-bold hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                    >
                        <Icon name="delete" />
                        Тауарды өшіру
                    </button>
                </div>
            </main>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowDeleteConfirm(false)}>
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="text-center">
                            <div className="size-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                                <Icon name="delete" size={24} className="text-red-500" />
                            </div>
                            <h3 className="text-lg font-bold mb-2">Тауарды өшіру</h3>
                            <p className="text-gray-500 text-sm mb-6">
                                <span className="font-semibold">{fabric?.name}</span> тауарын өшіргіңіз келе ме? Бұл әрекетті болдырмау мүмкін емес.
                            </p>
                            <div className="flex gap-3">
                                <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors">
                                    Болдырмау
                                </button>
                                <button onClick={handleDelete} disabled={deleting} className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50">
                                    {deleting ? 'Өшірілуде...' : 'Өшіру'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FabricDetails;
