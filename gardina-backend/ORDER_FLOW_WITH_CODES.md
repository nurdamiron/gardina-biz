# 🛒 КАК РАБОТАЕТ ЗАКАЗ С КОДАМИ РАСЦВЕТОК

## 💡 КЛЮЧЕВОЕ ПОНИМАНИЕ

**КОД = АРТИКУЛ РАСЦВЕТКИ/ДИЗАЙНА ТКАНИ**

Когда дизайнер добавляет товар в заказ, он выбирает:
1. **Название товара** - "Бархат"
2. **Код расцветки** - "19" (это конкретный цвет/дизайн)
3. **Количество** - 5 метров

## 📋 ИНТЕРФЕЙС ВЫБОРА ТОВАРА ДЛЯ ЗАКАЗА

### Вариант 1: ПРОСТОЙ (через поиск по коду)

```
┌─────────────────────────────────────────────────┐
│ Добавить ткань в заказ                          │
├─────────────────────────────────────────────────┤
│                                                 │
│ Введите код товара:                             │
│ [19________________]  [🔍 Поиск]                │
│                                                 │
│ ✓ Найдено 3 товара с кодом "19":                │
│                                                 │
│ ┌───────────────────────────────────────────┐   │
│ │ ○ 📦 Бархат (Турция)                      │   │
│ │   Расцветка: Бежевый                      │   │
│ │   📊 На складе: 70.3 м                    │   │
│ │   💰 5,500 тг/м                           │   │
│ └───────────────────────────────────────────┘   │
│                                                 │
│ ┌───────────────────────────────────────────┐   │
│ │ ○ 📦 Опера (Италия)                       │   │
│ │   Расцветка: Синий                        │   │
│ │   📊 На складе: 45.2 м                    │   │
│ │   💰 7,500 тг/м                           │   │
│ └───────────────────────────────────────────┘   │
│                                                 │
│ ┌───────────────────────────────────────────┐   │
│ │ ○ 📦 Питек турция (Турция)                │   │
│ │   Расцветка: Зеленый                      │   │
│ │   📊 На складе: 88.0 м                    │   │
│ │   💰 7,500 тг/м                           │   │
│ └───────────────────────────────────────────┘   │
│                                                 │
│ Количество метров: [____]                       │
│                                                 │
│ [Добавить в заказ]                              │
└─────────────────────────────────────────────────┘
```

**Как это работает:**
1. Дизайнер вводит код "19"
2. Система ищет **ВСЕ** товары в `product_variants` где `variant_code = '19'`
3. Показывает список ВСЕХ найденных товаров
4. **Дизайнер выбирает нужный по названию ткани** (радиокнопка)
5. Вводит количество и добавляет в заказ

### Вариант 2: КОМБИНИРОВАННЫЙ (название + выбор кода)

```
┌─────────────────────────────────────────────────┐
│ Добавить ткань в заказ                          │
├─────────────────────────────────────────────────┤
│                                                 │
│ Способ 1: Поиск по коду                         │
│ [19________________]  [🔍]                      │
│                                                 │
│          ─── или ───                            │
│                                                 │
│ Способ 2: Выбор из каталога                     │
│ Товар: [Бархат ▼]                               │
│                                                 │
│ Выберите код расцветки:                         │
│ ┌───────────────────────────────────────────┐   │
│ │ ● Код 19 - Бежевый (70.3 м)              │   │
│ │ ○ Код 46 - Серый (120.1 м)               │   │
│ │ ○ Код 45 - Кремовый (71.2 м)             │   │
│ └───────────────────────────────────────────┘   │
│                                                 │
│ Количество метров: [____]                       │
│                                                 │
│ [Добавить в заказ]                              │
└─────────────────────────────────────────────────┘
```

## 📊 КАК ЭТО СОХРАНЯЕТСЯ В ЗАКАЗЕ

### Таблица: `deal_items` (позиции заказа)

```sql
{
  id: "uuid-789",
  deal_id: "uuid-deal-123",

  // Информация о товаре
  product_id: "uuid-123",           // ID товара "Бархат"
  product_name: "Бархат",           // Название (для истории)

  // САМОЕ ВАЖНОЕ - КОД РАСЦВЕТКИ
  variant_id: "uuid-456",           // ID конкретного цвета
  variant_code: "19",               // КОД РАСЦВЕТКИ! ← ЭТО ГЛАВНОЕ
  variant_name: "Бежевый",          // Название цвета (опционально)

  // Количество и цены
  quantity: 5,                      // 5 метров
  unit: "m",                        // метры
  price_per_unit: 5500,             // цена за метр
  total_price: 27500,               // итого

  // Для складского учета
  stock_reserved: true,             // зарезервировано со склада
  stock_reserved_from_variant: "uuid-456"  // откуда взяли
}
```

## 🖨️ КАК ЭТО ОТОБРАЖАЕТСЯ

### В заказе (для дизайнера):

```
┌─────────────────────────────────────────────────┐
│ Заказ #1234                                     │
├─────────────────────────────────────────────────┤
│ Позиции:                                        │
│                                                 │
│ 1. Бархат (код: 19)              27,500 тг     │
│    Расцветка: Бежевый                          │
│    5 м × 5,500 тг                              │
│                                                 │
│ 2. Опера (код: 89)               37,500 тг     │
│    Расцветка: Royal Blue                       │
│    5 м × 7,500 тг                              │
│                                                 │
│ ─────────────────────────────────────────────  │
│ ИТОГО:                           65,000 тг     │
└─────────────────────────────────────────────────┘
```

### Для склада (накладная):

```
┌─────────────────────────────────────────────────┐
│ НАКЛАДНАЯ НА ВЫДАЧУ                             │
│ Заказ: #1234                                    │
│ Дата: 08.01.2026                                │
├─────────────────────────────────────────────────┤
│                                                 │
│ ВЫДАТЬ СО СКЛАДА:                               │
│                                                 │
│ ☐ Бархат, код 19 (Бежевый)     - 5.0 м        │
│ ☐ Опера, код 89 (Royal Blue)   - 5.0 м        │
│                                                 │
│ ─────────────────────────────────────────────  │
│                                                 │
│ Кладовщик: ____________   Получил: __________  │
└─────────────────────────────────────────────────┘
```

## 🔍 ПОИСК ПО КОДУ - КАК РАБОТАЕТ

### ⚠️ ВАЖНО: ОДИН КОД МОЖЕТ БЫТЬ У РАЗНЫХ ТКАНЕЙ!

**Пример:**
- Бархат, код 19 - Бежевый
- Опера, код 19 - Синий
- Питек, код 19 - Зеленый

Поэтому поиск должен показать **ВСЕ товары с этим кодом**!

### SQL запрос:

```sql
-- Поиск ВСЕХ товаров по коду расцветки
SELECT
  p.id as product_id,
  p.name as product_name,
  p.type,
  p.price_per_meter,
  p.width_cm,
  p.brand,

  pv.id as variant_id,
  pv.variant_code,
  pv.variant_name,
  pv.stock_quantity,
  pv.hex_color,
  pv.is_available

FROM products p
JOIN product_variants pv ON pv.product_id = p.id
WHERE pv.variant_code = '19'
  AND pv.is_available = true
  AND p.is_available = true
ORDER BY p.name;  -- сортируем по названию
```

**Результат (может быть несколько):**
```json
[
  {
    "product_id": "uuid-123",
    "product_name": "Бархат",
    "brand": "Турция",
    "price_per_meter": 5500,
    "variant_id": "uuid-456",
    "variant_code": "19",
    "variant_name": "Бежевый",
    "stock_quantity": 70.3,
    "hex_color": "#F5F5DC"
  },
  {
    "product_id": "uuid-789",
    "product_name": "Опера",
    "brand": "Италия",
    "price_per_meter": 7500,
    "variant_id": "uuid-101",
    "variant_code": "19",
    "variant_name": "Синий",
    "stock_quantity": 45.2,
    "hex_color": "#0033A0"
  },
  {
    "product_id": "uuid-111",
    "product_name": "Питек турция",
    "brand": "Турция",
    "price_per_meter": 7500,
    "variant_id": "uuid-222",
    "variant_code": "19",
    "variant_name": "Зеленый",
    "stock_quantity": 88.0,
    "hex_color": "#228B22"
  }
]
```

## 📱 КОМПОНЕНТ ПОИСКА ПО КОДУ (ОБНОВЛЕННЫЙ)

```jsx
const ProductCodeSearch = ({ onSelect }) => {
  const [code, setCode] = useState('');
  const [results, setResults] = useState([]); // МАССИВ результатов
  const [selectedId, setSelectedId] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(false);

  const searchByCode = async () => {
    if (!code.trim()) return;

    setLoading(true);
    setResults([]);
    setSelectedId(null);

    try {
      // API: GET /api/products/search-by-code?code=19
      // Возвращает МАССИВ всех товаров с этим кодом
      const res = await catalogAPI.searchByVariantCode(code);

      if (res.data.success && res.data.data.length > 0) {
        setResults(res.data.data);
      } else {
        alert(`Код "${code}" не найден`);
      }
    } catch (error) {
      alert('Ошибка поиска');
    } finally {
      setLoading(false);
    }
  };

  const selectedProduct = results.find(r => r.variant_id === selectedId);

  return (
    <div className="space-y-4">
      {/* Поле поиска */}
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Введите код (например: 19)"
          className="flex-1 px-4 py-3 border rounded-xl text-gray-900"
          onKeyPress={(e) => e.key === 'Enter' && searchByCode()}
        />
        <button
          onClick={searchByCode}
          disabled={loading}
          className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:brightness-110"
        >
          {loading ? '🔄' : '🔍'} Поиск
        </button>
      </div>

      {/* Результаты поиска */}
      {results.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-600">
            ✓ Найдено {results.length} {results.length === 1 ? 'товар' : 'товара'} с кодом "{code}":
          </p>

          {/* Список товаров с этим кодом */}
          {results.map((item) => (
            <div
              key={item.variant_id}
              onClick={() => setSelectedId(item.variant_id)}
              className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                selectedId === item.variant_id
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Radio button */}
                <div className={`size-5 rounded-full border-2 flex items-center justify-center ${
                  selectedId === item.variant_id
                    ? 'border-primary'
                    : 'border-gray-300'
                }`}>
                  {selectedId === item.variant_id && (
                    <div className="size-3 rounded-full bg-primary"></div>
                  )}
                </div>

                {/* Color preview */}
                {item.hex_color && (
                  <div
                    className="size-12 rounded-lg border-2 border-white shadow shrink-0"
                    style={{ backgroundColor: item.hex_color }}
                  />
                )}

                {/* Product info */}
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-900">
                    {item.product_name}
                    {item.brand && <span className="text-sm text-gray-500"> ({item.brand})</span>}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Расцветка: {item.variant_name || 'Код ' + item.variant_code}
                  </p>
                  <div className="flex gap-4 mt-1">
                    <p className="text-sm">
                      📊 Склад: <b>{item.stock_quantity} м</b>
                    </p>
                    <p className="text-sm">
                      💰 <b>{item.price_per_meter.toLocaleString()} тг/м</b>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Форма количества - показывается только когда выбран товар */}
      {selectedProduct && (
        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-green-600">check_circle</span>
            <p className="font-bold text-green-800">
              Выбрано: {selectedProduct.product_name} (код {selectedProduct.variant_code})
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Количество метров:
            </label>
            <input
              type="number"
              min="0"
              max={selectedProduct.stock_quantity}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-gray-900"
              placeholder="0"
            />
            {quantity > selectedProduct.stock_quantity && (
              <p className="text-xs text-red-600 mt-1">
                ⚠️ Недостаточно на складе (доступно: {selectedProduct.stock_quantity} м)
              </p>
            )}
          </div>

          {quantity > 0 && (
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Цена за метр:</span>
                <span className="font-bold">{selectedProduct.price_per_meter.toLocaleString()} тг</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-600">Количество:</span>
                <span className="font-bold">{quantity} м</span>
              </div>
              <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between">
                <span className="font-bold text-gray-900">ИТОГО:</span>
                <span className="font-bold text-xl text-primary">
                  {(selectedProduct.price_per_meter * parseFloat(quantity)).toLocaleString()} тг
                </span>
              </div>
            </div>
          )}

          <button
            onClick={() => onSelect({
              ...selectedProduct,
              quantity: parseFloat(quantity)
            })}
            disabled={!quantity || quantity <= 0 || quantity > selectedProduct.stock_quantity}
            className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Добавить в заказ
          </button>
        </div>
      )}
    </div>
  );
};
```

## 🔄 ОБНОВЛЕНИЕ СКЛАДА ПОСЛЕ ЗАКАЗА

### Когда заказ создается:

```javascript
// 1. Добавить позицию в заказ
await dealAPI.addItem({
  product_id: "uuid-123",
  variant_id: "uuid-456",
  variant_code: "19",
  quantity: 5
});

// 2. Backend вычитает со склада:
UPDATE product_variants
SET stock_quantity = stock_quantity - 5
WHERE id = 'uuid-456'  -- конкретный цвет с кодом 19
```

### Когда заказ отменяется:

```javascript
// Вернуть на склад
UPDATE product_variants
SET stock_quantity = stock_quantity + 5
WHERE id = 'uuid-456'
```

## 📊 ПРЕИМУЩЕСТВА ТАКОГО ПОДХОДА

### ✅ ДЛЯ ДИЗАЙНЕРА:
- Быстрый поиск по коду (вводит "19" и находит товар)
- Сразу видит остаток на складе
- Не нужно выбирать из длинного списка

### ✅ ДЛЯ СКЛАДА:
- Четкое указание какой код выдать
- Код = уникальный идентификатор расцветки
- Легко найти нужную ткань на складе

### ✅ ДЛЯ УЧЕТА:
- Точный учет по каждой расцветке
- История: какие коды популярнее
- Автоматическое списание с правильного варианта

## 🎯 ИТОГО

**В заказе всегда указывается:**
1. **Название товара** - "Бархат" (для понятности)
2. **Код расцветки** - "19" (для склада и учета)
3. **Название расцветки** - "Бежевый" (дополнительно, если есть)
4. **Количество** - 5 м

**Это позволяет:**
- Быстро найти товар по коду
- Точно знать какую расцветку выдавать
- Правильно списывать со склада
- Вести учет по каждой расцветке отдельно

---

## 🚀 ЧТО НУЖНО РЕАЛИЗОВАТЬ

1. **Backend API endpoint:**
   ```
   GET /api/products/search-by-code?code=19
   ```

2. **Frontend компонент:**
   - Поле для ввода кода
   - Кнопка поиска
   - Отображение результата
   - Добавление в заказ

3. **Обновить таблицу заказов:**
   - Добавить поле `variant_code` в `deal_items`
   - Хранить информацию о расцветке

4. **Накладная для склада:**
   - Показывать код расцветки крупно
   - Название товара + код
