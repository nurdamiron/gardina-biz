import express from 'express';
import { CatalogController } from '../controllers/CatalogController.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();
const catalogController = new CatalogController();

/**
 * Catalog Routes
 * All routes require authentication
 */

// Get all products with filters
// GET /api/catalog/products?type=curtain&search=бархат&limit=50
router.get('/products', authenticate, catalogController.getAllProducts);

// Search products by code (autocomplete)
// GET /api/catalog/products/search?code=TC
router.get('/products/search', authenticate, catalogController.searchFabrics);

// Search products by variant code (article code)
// GET /api/catalog/products/search-by-code?code=19
router.get('/products/search-by-code', authenticate, catalogController.searchByVariantCode);

// Get product by exact code
// GET /api/catalog/products/code/:code
router.get('/products/code/:code', authenticate, catalogController.getFabricByCode);

// Get product by ID
// GET /api/catalog/products/:id
router.get('/products/:id', authenticate, catalogController.getFabricById);


// Create new product — admin only
// POST /api/catalog/products
router.post('/products', authenticate, authorize('admin'), catalogController.createFabric);

// Update product — admin only
// PUT /api/catalog/products/:id
router.put('/products/:id', authenticate, authorize('admin'), catalogController.updateFabric);

// Delete product — admin only
// DELETE /api/catalog/products/:id
router.delete('/products/:id', authenticate, authorize('admin'), catalogController.deleteProduct);

// Get all service rates
// GET /api/catalog/services?type=sewing
router.get('/services', authenticate, catalogController.getServiceRates);

// Get service by ID
// GET /api/catalog/services/:id
router.get('/services/:id', authenticate, catalogController.getServiceById);

// Create new service — admin only
// POST /api/catalog/services
router.post('/services', authenticate, authorize('admin'), catalogController.createService);

// Update service — admin only
// PUT /api/catalog/services/:id
router.put('/services/:id', authenticate, authorize('admin'), catalogController.updateService);

// Delete service — admin only
// DELETE /api/catalog/services/:id
router.delete('/services/:id', authenticate, authorize('admin'), catalogController.deleteService);

// Calculate price for a room
// POST /api/catalog/calculate
router.post('/calculate', authenticate, catalogController.calculatePrice);

// ============ PRODUCT VARIANT ROUTES ============

// Get product variants
// GET /api/catalog/products/:id/variants
router.get('/products/:id/variants', authenticate, catalogController.getProductVariants);

// Create product variant — admin only
// POST /api/catalog/products/:id/variants
router.post('/products/:id/variants', authenticate, authorize('admin'), catalogController.createProductVariant);

// Update product variant — admin only
// PUT /api/catalog/variants/:id
router.put('/variants/:id', authenticate, authorize('admin'), catalogController.updateProductVariant);

// Delete product variant — admin only
// DELETE /api/catalog/variants/:id
router.delete('/variants/:id', authenticate, authorize('admin'), catalogController.deleteProductVariant);

// Set default variant — admin only
// PUT /api/catalog/products/:productId/variants/:variantId/default
router.put('/products/:productId/variants/:variantId/default', authenticate, authorize('admin'), catalogController.setDefaultVariant);

export default router;
