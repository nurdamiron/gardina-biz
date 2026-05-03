import React, { useState, useEffect, useRef } from 'react';
import { catalogAPI } from '../../services/api';
import Icon from '../common/Icon';

const MeasurementItemForm = ({ onAdd, roomHeight, corniceWidth }) => {
    const [type, setType] = useState(null); // Type is derived from selected product
    const [code, setCode] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);

    // Variants state
    const [variants, setVariants] = useState([]);
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [loadingVariants, setLoadingVariants] = useState(false);

    // Params
    const [coeff, setCoeff] = useState('2.0'); // Default for tulle
    const [quantity, setQuantity] = useState('1'); // For accessories
    const [complexity, setComplexity] = useState('simple'); // simple, medium, complex

    // Calculation Result
    const [calculation, setCalculation] = useState(null);
    const [calculating, setCalculating] = useState(false);

    const searchTimeoutRef = useRef(null);
    const inputRef = useRef(null);

    // Reset when product is selected to set defaults
    useEffect(() => {
        if (!selectedProduct) {
            setCalculation(null);
            return;
        }

        const newType = selectedProduct.type;
        setType(newType);

        // Set default defaults based on type
        if (newType === 'tulle') setCoeff('2.0');
        if (newType === 'curtain') setCoeff('1.5');
        if (newType === 'cornice') setCoeff('1.0');
        if (newType === 'accessory' || newType === 'tape') setQuantity('1');

    }, [selectedProduct]);

    // Search logic
    const handleCodeChange = (e) => {
        const val = e.target.value;
        setCode(val);
        setSelectedProduct(null);
        setType(null); // Reset type while searching
        setCalculation(null);

        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

        if (val.length >= 2) {
            setLoading(true);
            searchTimeoutRef.current = setTimeout(async () => {
                try {
                    // Search EVERYTHING (no type filter)
                    // The backend should handle "null" type by returning mixed results
                    const res = await catalogAPI.searchFabrics(val, null);

                    setSearchResults(res.data.data || []);
                    setShowDropdown(true);
                } catch (err) {
                    console.error(err);
                    setSearchResults([]);
                } finally {
                    setLoading(false);
                }
            }, 300);
        } else {
            setSearchResults([]);
            setShowDropdown(false);
        }
    };

    const handleSelectProduct = async (product) => {
        setSelectedProduct(product);
        setCode(product.code);
        setShowDropdown(false);
        setVariants([]);
        setSelectedVariant(null);

        // Load variants if this is a fabric type
        if (['curtain', 'tulle'].includes(product.type)) {
            setLoadingVariants(true);
            try {
                const variantsRes = await catalogAPI.getProductVariants(product.id);
                const variantsList = variantsRes.data?.data || [];
                setVariants(variantsList);

                // Auto-select first variant if available
                if (variantsList.length > 0) {
                    const defaultVariant = variantsList.find(v => v.isDefault) || variantsList[0];
                    setSelectedVariant(defaultVariant);
                }
            } catch (err) {
                console.error('Error loading variants:', err);
                setVariants([]);
            } finally {
                setLoadingVariants(false);
            }
        }
        // Type effect will trigger and set defaults, then we can calculate
    };

    // Trigger calc when params change or product is set
    useEffect(() => {
        if (selectedProduct && type) {
            doCalculate();
        }
    }, [selectedProduct, type, coeff, quantity, complexity]);


    const doCalculate = async () => {
        if (!selectedProduct) return;

        setCalculating(true);
        try {
            const res = await catalogAPI.calculatePrice({
                fabricCode: selectedProduct.code,
                corniceWidthMeters: corniceWidth || 3.0,
                roomHeightMeters: roomHeight || 2.8,
                coefficient: coeff,
                itemType: selectedProduct.type,
                quantity: quantity,
                sewingComplexity: complexity,
                installComplexity: complexity
            });

            if (res.data.success) {
                const data = res.data.data;
                const total = data.clientCheck.total;

                let qtyDisplay = data.techDetails.totalFabric;
                let unit = 'м';
                if (selectedProduct.type === 'accessory' || selectedProduct.type === 'tape') unit = 'шт';

                setCalculation({
                    total: total,
                    quantity: qtyDisplay,
                    price: selectedProduct.sellPrice,
                    unit: unit,
                    ...data
                });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setCalculating(false);
        }
    };

    const handleAdd = () => {
        if (!selectedProduct || !calculation) return;

        // For fabric types, require variant selection
        if (['curtain', 'tulle'].includes(selectedProduct.type) && variants.length > 0 && !selectedVariant) {
            alert('Вариант таңдаңыз!');
            return;
        }

        onAdd({
            type: selectedProduct.type,
            product: selectedProduct,
            variant: selectedVariant, // Include selected variant
            params: { coeff, quantity, width: corniceWidth, height: roomHeight },
            calculation
        });

        // Reset form
        setCode('');
        setSelectedProduct(null);
        setSelectedVariant(null);
        setVariants([]);
        setType(null);
        setCalculation(null);
        // Focus back on input
        inputRef.current?.focus();
    };

    return (
        <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 space-y-3">
            <div className="relative">
                <div className="flex bg-white rounded-lg border border-gray-300 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                    <div className="pl-3 flex items-center pointer-events-none">
                        <Icon name="search" className="text-gray-400" />
                    </div>
                    <input
                        ref={inputRef}
                        type="text"
                        value={code}
                        onChange={handleCodeChange}
                        placeholder="Код немесе атауын жазыңыз... (Мысалы: Velvet, Hooks...)"
                        className="w-full p-2.5 rounded-r-lg text-sm bg-transparent border-none focus:ring-0 outline-none placeholder-gray-400 font-medium"
                    />
                    {loading && (
                        <div className="pr-3 flex items-center">
                            <div className="size-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    )}
                </div>

                {/* Dropdown */}
                {showDropdown && searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 shadow-xl rounded-lg max-h-64 overflow-y-auto mt-1 no-scrollbar">
                        {searchResults.map(p => (
                            <div
                                key={p.id}
                                onClick={() => handleSelectProduct(p)}
                                className="p-3 hover:bg-primary/5 cursor-pointer border-b border-gray-50 last:border-0 transition-colors group"
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <div className="font-bold text-gray-900 group-hover:text-primary transition-colors">{p.code}</div>
                                    <div className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${p.type === 'tulle' || p.type === 'curtain' ? 'bg-primary/15 text-primary-dark' :
                                            p.type === 'cornice' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'
                                        }`}>
                                        {p.type === 'tulle' ? 'Тюль' :
                                            p.type === 'curtain' ? 'Перде' :
                                                p.type === 'cornice' ? 'Карниз' : 'Аксессуар'}
                                    </div>
                                </div>
                                <div className="text-xs text-gray-500 truncate">{p.name || 'Атауы жоқ'}</div>
                                <div className="text-xs font-bold mt-1 text-gray-900">{p.price_per_meter || p.sellPrice} ₸</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Params Row - Only show when product is selected */}
            {selectedProduct && type && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex flex-wrap items-end gap-2 bg-white/50 p-2 rounded-lg border border-gray-200/50">
                        {/* Type Indicator */}
                        <div className="w-full flex items-center gap-2 mb-2 pb-2 border-b border-gray-100">
                            <span className="text-xs font-bold text-gray-500">Таңдалды:</span>
                            <span className="text-sm font-bold text-gray-900">{selectedProduct.name}</span>
                            <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 rounded">{type}</span>
                        </div>

                        {/* Variants Selector - Only for Curtain/Tulle */}
                        {['curtain', 'tulle'].includes(type) && variants.length > 0 && (
                            <div className="w-full mb-2">
                                <label className="text-[10px] uppercase text-gray-500 font-bold block mb-1">Вариант таңдау</label>
                                <div className="flex flex-wrap gap-1">
                                    {loadingVariants ? (
                                        <div className="text-xs text-gray-400 italic p-2">Жүктелуде...</div>
                                    ) : (
                                        variants.map((variant) => (
                                            <button
                                                key={variant.id}
                                                type="button"
                                                onClick={() => setSelectedVariant(variant)}
                                                className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                                                    selectedVariant?.id === variant.id
                                                        ? 'bg-primary text-white border-primary'
                                                        : 'bg-white text-gray-700 border-gray-300 hover:border-primary hover:bg-primary/5'
                                                }`}
                                            >
                                                <span className="font-bold">{variant.variantCode || variant.variant_code}</span>
                                                {variant.variantName && (
                                                    <span className="ml-1 text-[10px] opacity-80">({variant.variantName})</span>
                                                )}
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {(type === 'tulle' || type === 'curtain') && (
                            <div className="flex-1 min-w-[100px]">
                                <label className="text-[10px] uppercase text-gray-500 font-bold block mb-1">Коэфф (Жыйыру)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={coeff}
                                    onChange={e => setCoeff(e.target.value)}
                                    className="w-full p-2 rounded-lg border border-gray-300 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white"
                                />
                            </div>
                        )}

                        {(type === 'accessory' || type === 'tape') && (
                            <div className="flex-1 min-w-[100px]">
                                <label className="text-[10px] uppercase text-gray-500 font-bold block mb-1">
                                    {type === 'tape' ? 'Ұзындық (м)' : 'Саны (шт)'}
                                </label>
                                <input
                                    type="number"
                                    value={quantity}
                                    onChange={e => setQuantity(e.target.value)}
                                    className="w-full p-2 rounded-lg border border-gray-300 text-sm focus:border-primary bg-white"
                                />
                            </div>
                        )}

                        {/* Complexity Selector for Sewn Items */}
                        {(type === 'tulle' || type === 'curtain') && (
                            <div className="w-32">
                                <label className="text-[10px] uppercase text-gray-500 font-bold block mb-1">Күрделілік</label>
                                <select
                                    value={complexity}
                                    onChange={e => setComplexity(e.target.value)}
                                    className="w-full p-2 rounded-lg border border-gray-300 text-sm bg-white"
                                >
                                    <option value="simple">Жай</option>
                                    <option value="medium">Орташа</option>
                                    <option value="complex">Күрделі</option>
                                </select>
                            </div>
                        )}

                        <div className="flex gap-2 ml-auto mt-2 w-full sm:w-auto">
                            <button
                                onClick={() => doCalculate()}
                                disabled={calculating}
                                className="p-2 bg-gray-200 rounded-lg text-gray-600 hover:bg-gray-300 transition-colors"
                                title="Қайта есептеу"
                            >
                                <Icon name={calculating ? 'refresh' : 'calculate'} size={20} className={calculating ? 'animate-spin' : ''} />
                            </button>

                            <button
                                onClick={handleAdd}
                                disabled={!calculation || calculating}
                                className="flex-1 bg-primary text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2 min-w-[100px]"
                            >
                                <Icon name="add_shopping_cart" size={18} />
                                Қосу
                            </button>
                        </div>
                    </div>

                    {/* Result Preview */}
                    {calculation && (
                        <div className="mt-2 bg-green-50/50 p-2.5 rounded-lg border border-green-100 flex justify-between items-center text-sm animate-in fade-in slide-in-from-top-1">
                            {calculation.total !== undefined && calculation.quantity !== undefined ? (
                                // Local Simple Calc (Cornice/Accessory)
                                <>
                                    <span>{calculation.quantity} {calculation.unit} x {calculation.price} ₸</span>
                                    <span className="font-bold text-green-700 text-base">{calculation.total.toLocaleString()} ₸</span>
                                </>
                            ) : (
                                // Backend Response (Fabric)
                                <>
                                    <div className="flex items-center gap-2">
                                        <div className="bg-green-100 p-1 rounded-md text-green-600">
                                            <Icon name="check_circle" size={16} />
                                        </div>
                                        <div>
                                            <span className="block font-bold text-gray-800 text-xs">
                                                {calculation.techDetails?.totalFabric}м мата
                                            </span>
                                            <span className="text-[10px] text-gray-500">
                                                + Тігу: {calculation.clientCheck?.items?.find(i => i.name.includes('Тігу'))?.total.toLocaleString()} ₸
                                            </span>
                                        </div>
                                    </div>
                                    <span className="font-bold text-green-700 text-base">
                                        {calculation.clientCheck?.total?.toLocaleString()} ₸
                                    </span>
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default MeasurementItemForm;
