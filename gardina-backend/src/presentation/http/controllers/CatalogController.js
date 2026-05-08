import { PostgresFabricRepository } from '../../../infrastructure/repositories/PostgresFabricRepository.js';
import { PostgresServiceRateRepository } from '../../../infrastructure/repositories/PostgresServiceRateRepository.js';
import { PostgresProductVariantRepository } from '../../../infrastructure/repositories/PostgresProductVariantRepository.js';

/**
 * Catalog Controller
 * Handles fabric search, service rates, and product variants
 */
export class CatalogController {
  constructor() {
    this.fabricRepository = new PostgresFabricRepository();
    this.serviceRateRepository = new PostgresServiceRateRepository();
    this.variantRepository = new PostgresProductVariantRepository();
  }

  /**
   * Get all products with filters and pagination
   * GET /api/catalog/products?type=curtain&search=бархат&limit=50&offset=0
   */
  getAllProducts = async (req, res) => {
    try {
      const { type, search, isAvailable, limit = 50, offset = 0 } = req.query;

      const filters = {
        type,
        search,
        isAvailable: isAvailable !== undefined ? isAvailable === 'true' : undefined,
        limit: parseInt(limit),
        offset: parseInt(offset),
      };

      const result = await this.fabricRepository.findAll(filters);

      // Format products for response
      const formattedProducts = result.fabrics.map(f => ({
        id: f.id,
        name: f.name,
        type: f.type,
        brand: f.brand,
        supplier: f.supplier,
        widthCm: parseFloat(f.width_cm) || 0,
        costPrice: parseFloat(f.cost_price),
        pricePerMeter: parseFloat(f.price_per_meter),
        unit: f.unit,
        margin: parseFloat(f.price_per_meter) - parseFloat(f.cost_price),
        marginPercent: f.cost_price > 0
          ? Math.round(((parseFloat(f.price_per_meter) - parseFloat(f.cost_price)) / parseFloat(f.cost_price)) * 100)
          : 0,
        imageUrl: f.image_url,
        stockQuantity: parseFloat(f.stock_quantity) || 0,
        isAvailable: f.is_available,
        createdAt: f.created_at,
        updatedAt: f.updated_at,
      }));

      res.json({
        success: true,
        data: formattedProducts,
        total: result.total,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: parseInt(offset) + formattedProducts.length < result.total,
        },
      });
    } catch (error) {
      console.error(`[CatalogController.getAllProducts] Failed: ${error.message}`);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  /**
   * Search fabrics/products by code (for autocomplete)
   * GET /api/catalog/fabrics/search?code=TC&type=cornice
   */
  searchFabrics = async (req, res) => {
    try {
      const { code, type } = req.query;

      // Use searchByCode with type filtering (code param acts as general search term)
      const rows = await this.fabricRepository.searchByCode(code || '', type || null, 50);

      // Calculate margins for display
      const formattedFabrics = rows.map(f => ({
        ...f,
        id: f.id,
        name: f.name,
        type: f.type,
        brand: f.brand,
        supplier: f.supplier,
        widthCm: f.width_cm,
        costPrice: parseFloat(f.cost_price),
        pricePerMeter: parseFloat(f.price_per_meter), // Standardized
        unit: f.unit, // Added
        // Calculate margin
        margin: parseFloat(f.price_per_meter) - parseFloat(f.cost_price),
        marginPercent: f.cost_price > 0
          ? Math.round(((parseFloat(f.price_per_meter) - parseFloat(f.cost_price)) / parseFloat(f.cost_price)) * 100)
          : 0,
        imageUrl: f.image_url,
        stockQuantity: f.stock_quantity,
        isAvailable: f.is_available
      }));

      res.json({
        success: true,
        data: formattedFabrics,
        total: rows.length
      });
    } catch (error) {
      console.error(`[CatalogController.searchFabrics] Search failed: ${error.message}`);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  /**
   * Search products by variant code (article code)
   * GET /api/catalog/products/search-by-code?code=19
   */
  searchByVariantCode = async (req, res) => {
    try {
      const { code } = req.query;

      if (!code || code.trim() === '') {
        return res.status(400).json({
          success: false,
          error: 'Code parameter is required',
        });
      }

      const results = await this.variantRepository.searchProductsByVariantCode(code);

      // Group by product
      const products = {};
      results.forEach(row => {
        if (!products[row.id]) {
          products[row.id] = {
            id: row.id,
            name: row.name,
            type: row.type,
            brand: row.brand,
            pricePerMeter: parseFloat(row.price_per_meter),
            costPrice: parseFloat(row.cost_price),
            widthCm: parseFloat(row.width_cm),
            unit: row.unit,
            imageUrl: row.image_url,
            matchedVariant: {
              id: row.variant_id,
              variantCode: row.variant_code,
              variantName: row.variant_name,
              stockQuantity: parseFloat(row.stock_quantity) || 0,
              hexColor: row.hex_color,
              imageUrl: row.variant_image_url,
              isDefault: row.is_default
            }
          };
        }
      });

      res.json({
        success: true,
        data: Object.values(products),
        total: Object.keys(products).length
      });
    } catch (error) {
      console.error(`[CatalogController.searchByVariantCode] Search failed: ${error.message}`);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  /**
   * Get fabric by ID
   * GET /api/catalog/fabrics/:id
   */
  getFabricById = async (req, res) => {
    try {
      const { id } = req.params;
      const fabric = await this.fabricRepository.findById(id);

      if (!fabric) {
        return res.status(404).json({
          success: false,
          error: 'Fabric not found',
        });
      }

      // Get variants for this product
      const variants = await this.variantRepository.getProductVariants(id);

      // Format variants for response
      const formattedVariants = variants.map(v => ({
        id: v.id,
        variantCode: v.variant_code,
        variantName: v.variant_name,
        hexColor: v.hex_color,
        stockQuantity: parseFloat(v.stock_quantity) || 0,
        imageUrl: v.image_url,
        isAvailable: v.is_available,
        isDefault: v.is_default,
      }));

      const formattedFabric = {
        id: fabric.id,
        name: fabric.name,
        type: fabric.type,
        brand: fabric.brand,
        supplier: fabric.supplier,
        widthCm: parseFloat(fabric.width_cm) || 0,
        costPrice: parseFloat(fabric.cost_price),
        pricePerMeter: parseFloat(fabric.price_per_meter),
        unit: fabric.unit, // Added
        margin: parseFloat(fabric.price_per_meter) - parseFloat(fabric.cost_price),
        marginPercent: fabric.cost_price > 0
          ? Math.round(((parseFloat(fabric.price_per_meter) - parseFloat(fabric.cost_price)) / parseFloat(fabric.cost_price)) * 100)
          : 0,
        imageUrl: fabric.image_url,
        stockQuantity: fabric.stock_quantity,
        isAvailable: fabric.is_available,
        createdAt: fabric.created_at,
        updatedAt: fabric.updated_at,
        variants: formattedVariants, // Include variants
      };

      res.json({
        success: true,
        data: formattedFabric,
      });
    } catch (error) {
      console.error(`[CatalogController.getFabricById] Failed to get fabric ${req.params.id}: ${error.message}`);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };


  /**
   * Get fabric by Code
   * GET /api/catalog/products/code/:code
   */
  getFabricByCode = async (req, res) => {
    try {
      const { code } = req.params;
      const fabric = await this.fabricRepository.findByCode(code);

      if (!fabric) {
        return res.status(404).json({
          success: false,
          error: 'Тауар табылмады', // Product not found in Kazakh
        });
      }

      // Get variants for this product
      const variants = await this.variantRepository.getProductVariants(fabric.id);

      // Format variants for response
      const formattedVariants = variants.map(v => ({
        id: v.id,
        variantCode: v.variant_code,
        variantName: v.variant_name,
        hexColor: v.hex_color,
        stockQuantity: parseFloat(v.stock_quantity) || 0,
        imageUrl: v.image_url,
        isAvailable: v.is_available,
        isDefault: v.is_default,
      }));

      const formattedFabric = {
        id: fabric.id,
        code: fabric.code,
        category: fabric.category,
        name: fabric.name,
        type: fabric.type,
        brand: fabric.brand,
        supplier: fabric.supplier,
        widthCm: parseFloat(fabric.width_cm) || 0,
        costPrice: parseFloat(fabric.cost_price),
        pricePerMeter: parseFloat(fabric.price_per_meter),
        unit: fabric.unit,
        margin: parseFloat(fabric.price_per_meter) - parseFloat(fabric.cost_price),
        marginPercent: fabric.cost_price > 0
          ? Math.round(((parseFloat(fabric.price_per_meter) - parseFloat(fabric.cost_price)) / parseFloat(fabric.cost_price)) * 100)
          : 0,
        imageUrl: fabric.image_url,
        stockQuantity: fabric.stock_quantity,
        isAvailable: fabric.is_available,
        createdAt: fabric.created_at,
        updatedAt: fabric.updated_at,
        variants: formattedVariants,
      };

      res.json({
        success: true,
        data: formattedFabric,
      });
    } catch (error) {
      console.error(`[CatalogController.getFabricByCode] Failed to get fabric by code ${req.params.code}: ${error.message}`);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  getServiceById = async (req, res) => {
    try {
      const { id } = req.params;
      const service = await this.serviceRateRepository.findById(id);

      if (!service) {
        return res.status(404).json({
          success: false,
          error: 'Қызмет табылмады'
        });
      }

      res.json({
        success: true,
        data: {
          id: service.id,
          name: service.name,
          description: service.description,
          serviceType: service.service_type,
          calcMethod: service.calc_method,
          baseRate: parseFloat(service.base_rate),
          complexity: {
            simple: parseFloat(service.complexity_simple),
            medium: parseFloat(service.complexity_medium),
            complex: parseFloat(service.complexity_complex),
          },
        },
      });
    } catch (error) {
      console.error(`[CatalogController.getServiceById] Failed to get service ${req.params.id}: ${error.message}`);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  /**
   * Get all service rates
   * GET /api/catalog/services
   */
  getServiceRates = async (req, res) => {
    try {
      const { type } = req.query;
      
      const rates = type 
        ? await this.serviceRateRepository.findByType(type)
        : await this.serviceRateRepository.findAll({ isActive: true });

      const formattedRates = rates.map(r => ({
        id: r.id,
        name: r.name,
        description: r.description,
        serviceType: r.service_type,
        calcMethod: r.calc_method,
        baseRate: parseFloat(r.base_rate),
        complexity: {
          simple: parseFloat(r.complexity_simple),
          medium: parseFloat(r.complexity_medium),
          complex: parseFloat(r.complexity_complex),
        },
      }));

      res.json({
        success: true,
        data: formattedRates,
      });
    } catch (error) {
      console.error(`[CatalogController.getServiceRates] Failed to get service rates: ${error.message}`);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  /**
   * Create new service rate
   * POST /api/catalog/services
   */
  createService = async (req, res) => {
    try {
      const serviceData = req.body;
      
      // Basic validation
      if (!serviceData.name || !serviceData.baseRate || !serviceData.serviceType) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: name, baseRate, serviceType',
        });
      }

      const service = await this.serviceRateRepository.create(serviceData);

      res.status(201).json({
        success: true,
        data: service,
      });
    } catch (error) {
      console.error(`[CatalogController.createService] Failed to create service "${req.body.name}": ${error.message}`);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  /**
   * Update service rate
   * PUT /api/catalog/services/:id
   */
  updateService = async (req, res) => {
    try {
      const { id } = req.params;
      const serviceData = req.body;

      // Basic validation
      if (!serviceData.name || !serviceData.baseRate) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: name, baseRate',
        });
      }

      const updatedService = await this.serviceRateRepository.update(id, serviceData);

      if (!updatedService) {
        return res.status(404).json({
          success: false,
          error: 'Service not found',
        });
      }

      res.json({
        success: true,
        data: updatedService,
      });
    } catch (error) {
      console.error(`[CatalogController.updateService] Failed to update service ${req.params.id}: ${error.message}`);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  /**
   * Delete product (fabric)
   * DELETE /api/catalog/products/:id
   */
  deleteProduct = async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await this.fabricRepository.delete(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'Тауар табылмады',
        });
      }

      res.json({
        success: true,
        data: { message: 'Тауар өшірілді' },
      });
    } catch (error) {
      console.error(`[CatalogController.deleteProduct] Failed to delete product ${req.params.id}: ${error.message}`);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  /**
   * Delete service rate
   * DELETE /api/catalog/services/:id
   */
  deleteService = async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await this.serviceRateRepository.delete(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'Service not found',
        });
      }

      res.json({
        success: true,
        data: { message: 'Service deleted successfully' },
      });
    } catch (error) {
      console.error(`[CatalogController.deleteService] Failed to delete service ${req.params.id}: ${error.message}`);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  createFabric = async (req, res) => {
    try {
      console.log('📦 ========================================');
      console.log('📦 [CREATE FABRIC] Получен запрос');
      console.log('📦 Body:', JSON.stringify(req.body, null, 2));
      console.log('📦 ========================================');

      const { variants, colors, ...fabricData } = req.body;

      console.log('🔍 Parsed data:');
      console.log('   - fabricData:', fabricData);
      console.log('   - colors:', colors);
      console.log('   - variants:', variants);

      // Basic validation
      if (!fabricData.name || !fabricData.pricePerMeter) {
        console.log('❌ Validation failed: missing required fields');
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: name, pricePerMeter',
        });
      }

      console.log('✅ Validation passed, creating fabric...');

      // Create the fabric
      const fabric = await this.fabricRepository.create(fabricData);
      console.log('✅ Fabric created:', fabric.id, fabric.code);

      // Create product variants (colors) if provided
      if (colors && Array.isArray(colors) && colors.length > 0) {
        console.log(`🎨 Creating ${colors.length} color variants...`);
        const productVariants = await this.variantRepository.createVariants(fabric.id, colors);
        fabric.variants = productVariants;
        console.log(`✅ Created ${productVariants.length} color variants`);
      }

      console.log('✅ [CREATE FABRIC] Success!');
      console.log('📦 ========================================\n');

      res.status(201).json({
        success: true,
        data: fabric,
      });
    } catch (error) {
      console.error('❌ ========================================');
      console.error(`❌ [CREATE FABRIC] Error: ${error.message}`);
      console.error('❌ Stack:', error.stack);
      console.error('❌ ========================================\n');
      res.status(500).json({
        success: false,
        error: 'Серверде қате орын алды: ' + error.message,
      });
    }
  };

  /**
   * Update existing fabric/product
   * PUT /api/catalog/products/:id
   */
  updateFabric = async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      // 1. Check if fabric exists
      const existingFabric = await this.fabricRepository.findById(id);
      if (!existingFabric) {
        return res.status(404).json({
          success: false,
          error: 'Тауар табылмады',
        });
      }

      // 2. Update
      const updatedFabric = await this.fabricRepository.update(id, {
        ...updates,
        // Ensure numeric fields are parsed if present
        pricePerMeter: updates.pricePerMeter ? parseFloat(updates.pricePerMeter) : undefined,
        costPrice: updates.costPrice ? parseFloat(updates.costPrice) : undefined,
        widthCm: updates.widthCm ? parseInt(updates.widthCm) : undefined,
      });

      res.json({
        success: true,
        data: updatedFabric,
      });
    } catch (error) {
      console.error(`[CatalogController.updateFabric] Failed to update fabric ${req.params.id}: ${error.message}`);
      res.status(500).json({
        success: false,
        error: 'Жаңарту кезінде қате шықты: ' + error.message,
      });
    }
  };

  /**
   * Calculate price for a room or specific item
   * POST /api/catalog/calculate
   */
  /**
   * Get product variants
   * GET /api/catalog/products/:id/variants
   */
  getProductVariants = async (req, res) => {
    try {
      const { id } = req.params;
      const variants = await this.variantRepository.getProductVariants(id);

      res.json({
        success: true,
        data: variants,
      });
    } catch (error) {
      console.error(`[CatalogController.getProductVariants] Failed to get variants for product ${req.params.id}: ${error.message}`);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  /**
   * Create product variant
   * POST /api/catalog/products/:id/variants
   */
  createProductVariant = async (req, res) => {
    try {
      const { id } = req.params;
      const variantData = { ...req.body, productId: id };

      // Check if variant code already exists for this product
      const exists = await this.variantRepository.variantCodeExists(id, variantData.variantCode);
      if (exists) {
        return res.status(400).json({
          success: false,
          error: 'Бұл өнімде осы код бар!',
        });
      }

      const variant = await this.variantRepository.createVariant(variantData);

      res.status(201).json({
        success: true,
        data: variant,
      });
    } catch (error) {
      console.error(`[CatalogController.createProductVariant] Failed to create variant for product ${req.params.id}: ${error.message}`);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  /**
   * Update product variant
   * PUT /api/catalog/variants/:id
   */
  updateProductVariant = async (req, res) => {
    try {
      const { id } = req.params;
      const variantData = req.body;

      // If changing variant code, check uniqueness
      if (variantData.variantCode) {
        const currentVariant = await this.variantRepository.findVariantById(id);
        if (currentVariant) {
          const exists = await this.variantRepository.variantCodeExists(
            currentVariant.product_id,
            variantData.variantCode,
            id
          );
          if (exists) {
            return res.status(400).json({
              success: false,
              error: 'Бұл код басқа вариантқа тиесілі!',
            });
          }
        }
      }

      const updatedVariant = await this.variantRepository.updateVariant(id, variantData);

      if (!updatedVariant) {
        return res.status(404).json({
          success: false,
          error: 'Вариант табылмады',
        });
      }

      res.json({
        success: true,
        data: updatedVariant,
      });
    } catch (error) {
      console.error(`[CatalogController.updateProductVariant] Failed to update variant ${req.params.id}: ${error.message}`);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  /**
   * Delete product variant
   * DELETE /api/catalog/variants/:id
   */
  deleteProductVariant = async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await this.variantRepository.deleteVariant(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'Вариант табылмады',
        });
      }

      res.json({
        success: true,
        data: { message: 'Вариант өшірілді' },
      });
    } catch (error) {
      console.error(`[CatalogController.deleteProductVariant] Failed to delete variant ${req.params.id}: ${error.message}`);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  /**
   * Set default variant for a product
   * PUT /api/catalog/products/:productId/variants/:variantId/default
   */
  setDefaultVariant = async (req, res) => {
    try {
      const { productId, variantId } = req.params;
      const variant = await this.variantRepository.setDefaultVariant(productId, variantId);

      if (!variant) {
        return res.status(404).json({
          success: false,
          error: 'Вариант табылмады',
        });
      }

      res.json({
        success: true,
        data: variant,
      });
    } catch (error) {
      console.error(`[CatalogController.setDefaultVariant] Failed to set default variant: ${error.message}`);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  calculatePrice = async (req, res) => {
    try {
      const {
        fabricId, 
        corniceWidthMeters, // Ширина карниза (ex: 3.0m)
        roomHeightMeters,   // Высота потолка (ex: 2.7m)
        coefficient = 1.0,  // Коэффициент сборки
        itemType = 'tulle', // 'tulle' (by width) or 'curtain' (by height/panels)
        includeInstallation = false,
        includeDelivery = false
      } = req.body;

      // 1. Fetch Data
      const fabric = await this.fabricRepository.findById(fabricId);
      if (!fabric) return res.status(404).json({ success: false, error: 'Fabric not found' });

      const sewingRates = await this.serviceRateRepository.findByType('sewing');
      const installRates = includeInstallation ? await this.serviceRateRepository.findByType('installation') : [];
      const deliveryRate = includeDelivery ? (await this.serviceRateRepository.findByType('delivery'))[0] : null;

      // Select specific rates driven by logic
      // Sewing: Prefer 'Standard' / 'Тігу'
      const sewingRate = sewingRates.find(r => r.calc_method === 'per_meter') || sewingRates[0];
      
      // Installation: Context dependent
      let installRate = null;
      if (includeInstallation) {
          if (itemType === 'cornice') {
              // Try to find cornice specific installation
              installRate = installRates.find(r => r.name.toLowerCase().includes('карниз')) || installRates[0];
          } else {
              // Standard mounting (per room/window)
              installRate = installRates.find(r => r.calc_method === 'per_room' || r.calc_method === 'per_window') || installRates[0];
          }
      }

      // 2. Realistic Fabric Calculation (Updated Logic)
      
      const fabricRollWidthMeters = (fabric.width_cm || 280) / 100;
      const height = parseFloat(roomHeightMeters);
      const width = parseFloat(corniceWidthMeters);
      const factor = parseFloat(coefficient);
      
      let totalFabricMeters = 0;
      let calculationMethod = '';
      let numPanels = 0;

      // Buffer approach
      const TULLE_BUFFER = 0.5; 
      const CURTAIN_BUFFER = 0.5;

      if (itemType === 'cornice') {
          // Cornice Logic: Simple Width * Price
          totalFabricMeters = width;
          calculationMethod = 'by_width_cornice';
      } else if (itemType === 'tape' || itemType === 'accessory') {
          // Tape/Accessory Logic: Use provided Quantity if available, else derive from params
          // If 'tape', usually refers to sewing length. If 'accessory', unit count.
          const qtyParam = req.body.quantity ? parseFloat(req.body.quantity) : 0;
          totalFabricMeters = qtyParam > 0 ? qtyParam : width; // Fallback to width if quantity missing for tape
          calculationMethod = itemType === 'tape' ? 'by_length_tape' : 'by_unit_accessory';
      } else if (itemType === 'tulle') {
        // Tulle Logic:
        // Width * Factor -> Add Buffer -> Round Up
        const rawWidth = width * factor;
        totalFabricMeters = Math.ceil(rawWidth + TULLE_BUFFER);
        calculationMethod = 'by_width_tulle';
      } else {
        // Curtain/Blackout Logic:
        // Measure from height.
        // ex: 2.9m -> 2.9 * 2 (what is *2? Panels?) -> + 0.5 -> Round Up.
        
        // Dynamic panel calc:
        const totalWidthNeeded = width * factor;
        const panelCountCalc = Math.ceil(totalWidthNeeded / fabricRollWidthMeters);
        
        numPanels = panelCountCalc > 0 ? panelCountCalc : 2; // Default to 2 if something zero
        
        const singleCutLength = height; 
        const totalRaw = (singleCutLength * numPanels) + CURTAIN_BUFFER; // Buffer is total for the whole piece
        
        totalFabricMeters = Math.ceil(totalRaw);
        calculationMethod = 'by_height_curtain';
      }

      // 3. Financials
      // A. Material Cost (Fabric/Cornice/Accessory)
      const fabricCost = totalFabricMeters * parseFloat(fabric.cost_price);
      const fabricPrice = totalFabricMeters * parseFloat(fabric.price_per_meter || fabric.sellPrice); // handle both fields if needed

      // B. Sewing 
      // Only apply sewing calculation for Fabrics (Tulle/Curtain).
      const { 
        sewingComplexity = 'simple', 
        installComplexity = 'simple' 
      } = req.body;

      let sewingPrice = 0;
      let sewingCost = 0; // Assume sewing cost is 40% of sewing price (as per original logic)
      
      if (itemType === 'tulle' || itemType === 'curtain') {
          if (sewingRate) {
              // Use repository helper or manual calc with multipliers
              const mult = {
                  simple: parseFloat(sewingRate.complexity_simple) || 1.0,
                  medium: parseFloat(sewingRate.complexity_medium) || 1.3,
                  complex: parseFloat(sewingRate.complexity_complex) || 2.0
              }[sewingComplexity] || 1.0;

              const base = parseFloat(sewingRate.base_rate);
              sewingPrice = Math.round(base * totalFabricMeters * mult);
          } else {
              // Fallback
              sewingPrice = Math.round(totalFabricMeters * 2000); // 2000 default
          }
          sewingCost = Math.round(sewingPrice * 0.4); 
      }

      // C. Installation
      let installPrice = 0;
      let installCost = 0;
      
      if (includeInstallation) {
          // Installation applies to Cornice or Fabric Width
          if (itemType !== 'accessory') {
              if (installRate) {
                  const mult = {
                      simple: parseFloat(installRate.complexity_simple) || 1.0,
                      medium: parseFloat(installRate.complexity_medium) || 1.3,
                      complex: parseFloat(installRate.complexity_complex) || 2.0
                  }[installComplexity] || 1.0;
  
                  const base = parseFloat(installRate.base_rate);
                  const method = installRate.calc_method || 'per_meter'; // Check calculation method

                  if (method === 'per_room' || method === 'per_window') {
                       // Fixed price per room/window (not dependent on width)
                       installPrice = Math.round(base * mult); 
                  } else {
                       // Price per meter (dependent on width)
                       installPrice = Math.round(base * width * mult);
                  }
              } else {
                  installPrice = Math.round(width * 2000);
              }
              installCost = Math.round(installPrice * 0.5); 
          }
      }

      // D. Delivery (Fixed one-time)
      let deliveryPrice = 0;
      let deliveryCost = 0;
      if (deliveryRate) {
        deliveryPrice = parseFloat(deliveryRate.base_rate);
        deliveryCost = Math.round(deliveryPrice * 0.4); 
      }

      // 4. Totals
      const totalClientPrice = fabricPrice + sewingPrice + installPrice + deliveryPrice;
      const totalBusinessCost = fabricCost + sewingCost + installCost + deliveryCost;
      const grossMargin = totalClientPrice - totalBusinessCost;
      const designerCommission = Math.round(totalClientPrice * 0.07); 

      res.json({
        success: true,
        data: {
          inputs: {
            fabric: fabric.name,
            roomHeight: height,
            corniceWidth: width,
            coeff: factor,
            type: itemType
          },
          techDetails: {
            method: calculationMethod,
            fabricWidth: fabricRollWidthMeters,
            panels: numPanels,
            totalFabric: totalFabricMeters,
            sewingLength: totalFabricMeters
          },
          clientCheck: {
            items: [
              {
                name: `Мата (${itemType === 'tulle' ? 'Тюль' : 'Перде'}): ${fabric.name}`,
                qty: totalFabricMeters,
                unit: 'м',
                price: parseFloat(fabric.price_per_meter),
                total: fabricPrice
              },
              {
                name: 'Тігу қызметі',
                qty: totalFabricMeters,
                unit: 'м',
                price: totalFabricMeters > 0 ? Math.round(sewingPrice / totalFabricMeters) : 0,
                total: sewingPrice
              },
              ...(includeInstallation ? [{
                name: 'Монтаж (Орнату)',
                qty: width,
                unit: 'м',
                price: width > 0 ? Math.round(installPrice / width) : 0,
                total: installPrice
              }] : []),
              ...(includeDelivery ? [{
                name: 'Жеткізу (Доставка)',
                qty: 1,
                unit: 'рет',
                price: deliveryPrice,
                total: deliveryPrice
              }] : [])
            ],
            total: totalClientPrice
          },
          managerReport: {
            costs: {
              material: fabricCost,
              sewingLabor: sewingCost,
              installationLabor: installCost
            },
            totalCost: totalBusinessCost,
            margin: grossMargin,
            marginPercent: totalClientPrice > 0 ? Math.round((grossMargin / totalClientPrice) * 100) : 0,
            potentialCommission: designerCommission,
            netProfit: grossMargin - designerCommission
          }
        }
      });

    } catch (error) {
      console.error(`[CatalogController.calculatePrice] Price calculation failed for fabric ID "${req.body.fabricId}": ${error.message}`);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };
}
