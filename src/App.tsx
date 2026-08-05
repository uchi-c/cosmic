/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { dbService, supabase, isSupabaseConfigured } from './lib/supabase';
import { Product, Order, OrderItem, CategoryType, StoreSettings } from './types';

// Admin console shell + screens — lazily loaded so storefront visitors never
// download the merchant back-office bundle.
import type { AdminViewType } from './components/admin/Sidebar';
const Sidebar = React.lazy(() => import('./components/admin/Sidebar').then((m) => ({ default: m.Sidebar })));
const Header = React.lazy(() => import('./components/admin/Header').then((m) => ({ default: m.Header })));
const LoginView = React.lazy(() => import('./views/LoginView').then((m) => ({ default: m.LoginView })));
const DashboardView = React.lazy(() => import('./views/DashboardView').then((m) => ({ default: m.DashboardView })));
const ProductsListView = React.lazy(() => import('./views/ProductsListView').then((m) => ({ default: m.ProductsListView })));
const ProductFormView = React.lazy(() => import('./views/ProductFormView').then((m) => ({ default: m.ProductFormView })));
const ProductImportView = React.lazy(() => import('./views/ProductImportView').then((m) => ({ default: m.ProductImportView })));
const OrdersListView = React.lazy(() => import('./views/OrdersListView').then((m) => ({ default: m.OrdersListView })));
const OrderDetailView = React.lazy(() => import('./views/OrderDetailView').then((m) => ({ default: m.OrderDetailView })));
const SettingsView = React.lazy(() => import('./views/SettingsView').then((m) => ({ default: m.SettingsView })));

// Customer Storefront elements
import { Navbar } from './components/storefront/Navbar';
import { Footer } from './components/storefront/Footer';
import { HomeView } from './views/storefront/HomeView';
import { ShopView } from './views/storefront/ShopView';
import { ProductDetailView } from './views/storefront/ProductDetailView';
import { CartDrawer } from './components/storefront/CartDrawer';
import { CheckoutView } from './views/storefront/CheckoutView';
import { OrderReturnView } from './views/storefront/OrderReturnView';

export default function App() {
  const [operatorEmail, setOperatorEmail] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<AdminViewType>('dashboard');

  // Customer Storefront State
  const [viewMode, setViewMode] = useState<'storefront' | 'merchant'>('storefront');
  const [storefrontPage, setStorefrontPage] = useState<'home' | 'shop' | 'checkout'>('home');
  const [selectedStorefrontProduct, setSelectedStorefrontProduct] = useState<Product | null>(null);
  const [storefrontCategoryFilter, setStorefrontCategoryFilter] = useState<CategoryType | 'all'>('all');
  const [storefrontSearchQuery, setStorefrontSearchQuery] = useState<string>('');
  const [cartItems, setCartItems] = useState<OrderItem[]>([]);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [settings, setSettings] = useState<StoreSettings>(dbService.getSettings());

  // Database core state lists
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // System Loading state
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);

  // Stripe Checkout return state (?order_success / ?order_cancelled)
  const [checkoutReturn, setCheckoutReturn] = useState<
    { status: 'success' | 'cancelled'; orderId: string } | null
  >(null);

  // ==========================================
  // AUTH & INACTIVITY INTRUSION DETECTORS
  // ==========================================
  
  const handleLogin = (email: string) => {
    setOperatorEmail(email);
    localStorage.setItem('operator_session', email);
    localStorage.setItem('last_active_time', Date.now().toString());
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setOperatorEmail(null);
    localStorage.removeItem('operator_session');
    localStorage.removeItem('last_active_time');
    setCurrentView('dashboard');
  };

  // Inactivity tracking mechanism (Auto logout after 2 hours)
  useEffect(() => {
    if (!operatorEmail) return;

    // Monitor click or key presses to reset inactivity clock
    const registerUserActivity = () => {
      localStorage.setItem('last_active_time', Date.now().toString());
    };

    window.addEventListener('mousemove', registerUserActivity);
    window.addEventListener('keydown', registerUserActivity);
    window.addEventListener('click', registerUserActivity);

    // Inactivity heartbeat monitor check every 10 seconds
    const interval = setInterval(() => {
      const lastActive = parseInt(localStorage.getItem('last_active_time') || '0', 10);
      const TWO_HOURS_MS = 2 * 60 * 60 * 1000; // 7,200,000 milliseconds

      if (Date.now() - lastActive > TWO_HOURS_MS) {
        console.warn('SECURITY SHIELD ENFORCED: 2 Hours of inactivity exceeded. Automatic logout initialized.');
        handleLogout();
      }
    }, 10000);

    return () => {
      window.removeEventListener('mousemove', registerUserActivity);
      window.removeEventListener('keydown', registerUserActivity);
      window.removeEventListener('click', registerUserActivity);
      clearInterval(interval);
    };
  }, [operatorEmail]);

  // Detect return from hosted Stripe Checkout (?order_success / ?order_cancelled)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get('order_success');
    const cancelled = params.get('order_cancelled');
    if (!success && !cancelled) return;

    // Land the shopper on the storefront return screen.
    setViewMode('storefront');
    setSelectedStorefrontProduct(null);

    if (success) {
      setCheckoutReturn({ status: 'success', orderId: success });
      // Payment captured server-side → the cart is done.
      setCartItems([]);
      localStorage.removeItem('cosmic_cart');
    } else if (cancelled) {
      setCheckoutReturn({ status: 'cancelled', orderId: cancelled });
    }

    // Strip the query params so a refresh doesn't re-trigger the screen.
    window.history.replaceState({}, '', window.location.pathname);
  }, []);

  // Load operator state & database records on initial load
  useEffect(() => {
    const checkSessionAndFetch = async () => {
      setLoading(true);

      // Failsafe: never leave the shopper stranded on the boot loader if the
      // database is slow or unreachable (supabase-js fetches have no timeout).
      const failsafe = setTimeout(() => {
        setDbError(
          (prev) =>
            prev ||
            'DATABASE TIMEOUT: The registry did not respond in time. Operating in degraded mode — some records may be unavailable.'
        );
        setLoading(false);
      }, 9000);

      const isProduction = !!((import.meta as any).env)?.PROD;
      
      // If Supabase is not configured, log it and set dbError notification banner
      if (!isSupabaseConfigured()) {
        console.warn('DATABASE CONFIGURATION: Supabase credentials are missing or invalid. Falling back to local offline mode.');
        setDbError('DATABASE CONFIGURATION: Supabase credentials are missing or invalid. Running in offline/testing mode.');
      }

      let activeEmail: string | null = null;

      // Load operator session via Supabase Auth or standard localStorage backup
      if (isSupabaseConfigured() && supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user?.email) {
            activeEmail = session.user.email;
            setOperatorEmail(activeEmail);
          }
        } catch (authErr) {
          console.error('Failed to restore Supabase session:', authErr);
        }
      } else {
        const savedSession = localStorage.getItem('operator_session');
        if (savedSession) {
          activeEmail = savedSession;
          setOperatorEmail(activeEmail);
        }
      }

      // Load cart items
      const savedCart = localStorage.getItem('cosmic_cart');
      if (savedCart) {
        try {
          setCartItems(JSON.parse(savedCart));
        } catch (e) {
          console.error('Failed to parse cart items:', e);
        }
      }

      try {
        // Load collections from Unified Data Provider
        const pList = await dbService.getProducts();
        setProducts(pList);
        setSettings(dbService.getSettings());

        // Only fetch orders if there is an active admin operator session (data protection)
        if (activeEmail) {
          const oList = await dbService.getOrders();
          setOrders(oList);
        }
      } catch (err) {
        console.error('Core databases synchronization fault:', err);
        setDbError('DATABASE INTEGRATION ERROR: Connection failed or database is unreachable. Operating on fallback local storage.');
      } finally {
        clearTimeout(failsafe);
        setLoading(false);
      }
    };

    checkSessionAndFetch();
  }, []);

  // Subscribe to real-time auth changes if Supabase is active
  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user?.email) {
        setOperatorEmail(session.user.email);
      } else {
        setOperatorEmail(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fetch helper to refresh state
  const refreshDatabaseCollections = async () => {
    try {
      const pList = await dbService.getProducts();
      setProducts(pList);
      setSettings(dbService.getSettings()); // Keep settings synchronized too

      // Sync orders only if logged in
      if (operatorEmail) {
        const oList = await dbService.getOrders();
        setOrders(oList);
      }
    } catch (err) {
      console.error('Refreshing databases fault:', err);
      setDbError('DATABASE REFRESH ERROR: Failed to synchronize with database registry.');
    }
  };

  // ==========================================
  // CUSTOMER STOREFRONT ACTION CONTROLLERS
  // ==========================================

  const handleAddToCart = (product: Product, qty: number, size?: string, color?: string) => {
    const activeSize = size || (product.sizes[0] || 'OS');
    const activeColor = color || (product.colors[0] || '');

    setCartItems((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.id === product.id && item.size === activeSize && item.color === activeColor
      );

      let updated: OrderItem[];
      if (existingIndex > -1) {
        updated = [...prev];
        const newQty = Math.min(product.stock, updated[existingIndex].quantity + qty);
        updated[existingIndex].quantity = newQty;
      } else {
        const newItem: OrderItem = {
          id: product.id,
          name: product.name,
          price: product.sale_price !== null && product.sale_price !== undefined ? product.sale_price : product.price,
          quantity: qty,
          image: product.images[0] || '',
          size: activeSize,
          color: activeColor,
        };
        updated = [...prev, newItem];
      }
      localStorage.setItem('cosmic_cart', JSON.stringify(updated));
      return updated;
    });

    setCartDrawerOpen(true); // Open drawer automatically on add for premium feedback
  };

  const handleUpdateCartQuantity = (id: string, qty: number, size?: string, color?: string) => {
    const prod = products.find((p) => p.id === id);
    const maxStock = prod ? prod.stock : 99;
    const safeQty = Math.min(maxStock, Math.max(1, qty));

    setCartItems((prev) => {
      const index = prev.findIndex((item) => item.id === id && item.size === size && item.color === color);
      if (index === -1) return prev;
      const updated = [...prev];
      updated[index].quantity = safeQty;
      localStorage.setItem('cosmic_cart', JSON.stringify(updated));
      return updated;
    });
  };

  const handleRemoveFromCart = (id: string, size?: string, color?: string) => {
    setCartItems((prev) => {
      const filtered = prev.filter((item) => !(item.id === id && item.size === size && item.color === color));
      localStorage.setItem('cosmic_cart', JSON.stringify(filtered));
      return filtered;
    });
  };

  const handleBuyNow = (product: Product, size?: string, color?: string) => {
    const activeSize = size || (product.sizes[0] || 'OS');
    const activeColor = color || (product.colors[0] || '');

    // Add item (or update its quantity)
    setCartItems((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.id === product.id && item.size === activeSize && item.color === activeColor
      );

      let updated: OrderItem[];
      if (existingIndex > -1) {
        updated = [...prev];
        const newQty = Math.min(product.stock, updated[existingIndex].quantity + 1);
        updated[existingIndex].quantity = newQty;
      } else {
        const newItem: OrderItem = {
          id: product.id,
          name: product.name,
          price: product.sale_price !== null && product.sale_price !== undefined ? product.sale_price : product.price,
          quantity: 1,
          image: product.images[0] || '',
          size: activeSize,
          color: activeColor,
        };
        updated = [...prev, newItem];
      }
      localStorage.setItem('cosmic_cart', JSON.stringify(updated));
      return updated;
    });

    // Navigate to checkout immediately
    setSelectedStorefrontProduct(null);
    setStorefrontPage('checkout');
    setCartDrawerOpen(false);
  };

  const handleClearCart = () => {
    setCartItems([]);
    localStorage.removeItem('cosmic_cart');
  };

  const handleStorefrontNavigate = (page: 'home' | 'shop' | 'checkout', category?: CategoryType | 'all') => {
    setSelectedStorefrontProduct(null);
    setStorefrontPage(page);
    if (category) {
      setStorefrontCategoryFilter(category);
    }
    setCartDrawerOpen(false);
  };

  const handleBack = () => {
    if (selectedStorefrontProduct) {
      setSelectedStorefrontProduct(null);
    } else if (storefrontPage === 'checkout') {
      setStorefrontPage('shop');
    } else if (storefrontPage === 'shop') {
      setStorefrontPage('home');
    }
  };

  const handleToggleAdmin = () => {
    if (viewMode === 'storefront') {
      setViewMode('merchant');
      // If they are already authenticated, send them to administrative dashboard
      if (operatorEmail) {
        setCurrentView('dashboard');
      }
    } else {
      setViewMode('storefront');
    }
  };

  // ==========================================
  // PRODUCT TRANSACTION CONTROLLERS
  // ==========================================

  const handleSaveProduct = async (
    productData: Omit<Product, 'id' | 'created_at' | 'updated_at'> & { id?: string }
  ) => {
    try {
      await dbService.saveProduct(productData);
      await refreshDatabaseCollections();
      setCurrentView('products');
      setSelectedProduct(null);
    } catch (err) {
      console.error('Product write failure:', err);
      throw err;
    }
  };

  const handleBulkImport = async (
    imports: Omit<Product, 'id' | 'created_at' | 'updated_at'>[]
  ): Promise<{ ok: number; failed: number; errors: string[] }> => {
    let ok = 0;
    let failed = 0;
    const errors: string[] = [];

    // Serial writes so slug/stock collisions surface per-row instead of racing.
    for (const product of imports) {
      try {
        await dbService.saveProduct(product);
        ok++;
      } catch (err) {
        failed++;
        errors.push(`${product.name}: ${(err as Error).message}`);
      }
    }

    await refreshDatabaseCollections();
    return { ok, failed, errors };
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await dbService.deleteProduct(id);
      await refreshDatabaseCollections();
    } catch (err) {
      console.error('Product deletion failure:', err);
    }
  };

  const handleBulkStatusChange = async (ids: string[], isActive: boolean) => {
    try {
      // Execute serial edits
      await Promise.all(
        ids.map(async (id) => {
          const prod = products.find((p) => p.id === id);
          if (prod) {
            await dbService.saveProduct({ ...prod, is_active: isActive });
          }
        })
      );
      await refreshDatabaseCollections();
    } catch (err) {
      console.error('Bulk activation failure:', err);
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    try {
      await Promise.all(ids.map((id) => dbService.deleteProduct(id)));
      await refreshDatabaseCollections();
    } catch (err) {
      console.error('Bulk deletion failure:', err);
    }
  };

  // ==========================================
  // ORDER TRANSACTION CONTROLLERS
  // ==========================================

  const handleUpdateOrder = async (updatedOrder: Order) => {
    try {
      await dbService.saveOrder(updatedOrder);
      await refreshDatabaseCollections();
      // Keep inspection sync
      setSelectedOrder(updatedOrder);
    } catch (err) {
      console.error('Order update failure:', err);
    }
  };

  // ==========================================
  // VIEW DIRECTORY ROUTING RENDER
  // ==========================================

  const renderViewContent = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <DashboardView
            products={products}
            orders={orders}
            onNavigate={(v) => setCurrentView(v)}
            onViewOrder={(o) => {
              setSelectedOrder(o);
              setCurrentView('orders-detail');
            }}
          />
        );
      case 'products':
        return (
          <ProductsListView
            products={products}
            onAddProduct={() => {
              setSelectedProduct(null);
              setCurrentView('products-new');
            }}
            onImportProducts={() => setCurrentView('products-import')}
            onEditProduct={(p) => {
              setSelectedProduct(p);
              setCurrentView('products-edit');
            }}
            onDeleteProduct={handleDeleteProduct}
            onBulkStatusChange={handleBulkStatusChange}
            onBulkDelete={handleBulkDelete}
          />
        );
      case 'products-new':
        return (
          <ProductFormView
            productToEdit={null}
            onBack={() => setCurrentView('products')}
            onSave={handleSaveProduct}
          />
        );
      case 'products-edit':
        return (
          <ProductFormView
            productToEdit={selectedProduct}
            onBack={() => {
              setSelectedProduct(null);
              setCurrentView('products');
            }}
            onSave={handleSaveProduct}
          />
        );
      case 'products-import':
        return (
          <ProductImportView
            onBack={() => setCurrentView('products')}
            onImport={handleBulkImport}
          />
        );
      case 'orders':
        return (
          <OrdersListView
            orders={orders}
            onViewOrder={(o) => {
              setSelectedOrder(o);
              setCurrentView('orders-detail');
            }}
          />
        );
      case 'orders-detail':
        return selectedOrder ? (
          <OrderDetailView
            order={selectedOrder}
            onBack={() => {
              setSelectedOrder(null);
              setCurrentView('orders');
            }}
            onUpdateOrder={handleUpdateOrder}
          />
        ) : (
          <div className="p-8 text-center uppercase font-bold text-cream-muted">
            NO ORDER RECORD SELECTED.
          </div>
        );
      case 'settings':
        return <SettingsView />;
      default:
        return (
          <div className="p-8 text-center uppercase font-bold text-cream-muted">
            VIEW RECORD EXCEPTION DETECTED.
          </div>
        );
    }
  };

  // Translate view names for header
  const getViewTitle = () => {
    switch (currentView) {
      case 'dashboard': return 'TELEMETRY DASHBOARD OVERVIEW';
      case 'products': return 'INVENTORY DATABASE REGISTRY';
      case 'products-new': return 'CATALOG DISPATCH COMMAND';
      case 'products-edit': return `EDIT ENTRY: ${selectedProduct?.name || ''}`;
      case 'products-import': return 'BULK CATALOG UPLINK';
      case 'orders': return 'TRANSACTIONS CENTRAL AUDIT';
      case 'orders-detail': return `ORDER INVOICE ANALYSIS: #${selectedOrder?.id.slice(-6).toUpperCase()}`;
      case 'settings': return 'SYSTEM GLOBAL METRICS';
      default: return 'OPERATIONAL TERMINAL';
    }
  };

  // If system loading, show elegant retro boot screen loader
  if (loading) {
    return (
      <div className="min-h-screen bg-space-black flex flex-col justify-center items-center font-body-mono text-accent-purple select-none p-6">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <span className="w-10 h-10 border-4 border-accent-purple border-t-transparent animate-spin rounded-none" />
          <p className="font-retro-heading text-[10px] tracking-widest text-cream uppercase animate-pulse">
            SHADOW ROOT SYSTEMS INITIALIZING
          </p>
          <div className="w-full bg-retro-surface h-1.5 border border-retro-border">
            <div className="bg-accent-purple h-full shadow-[0_0_8px_#9B6DFF] animate-loaderBar" style={{ width: '40%' }} />
          </div>
          <p className="text-[9px] text-cream-muted uppercase leading-none">
            LOADING MEMORY RECS & DB BUFFERS...
          </p>
        </div>
      </div>
    );
  }

  const getStorefrontActiveCategory = (): CategoryType | 'all' => {
    if (selectedStorefrontProduct) {
      return selectedStorefrontProduct.category;
    }
    if (storefrontPage === 'shop' || storefrontPage === 'checkout') {
      return storefrontCategoryFilter;
    }
    return 'all';
  };

  // ==========================================
  // CUSTOMER STOREFRONT PORTAL RENDERING
  // ==========================================
  if (viewMode === 'storefront') {
    const activeCategory = getStorefrontActiveCategory();
    return (
      <div className={`min-h-screen bg-[#0A0812] flex flex-col text-[#F8F3E9] selection:bg-[#9B6DFF] selection:text-[#0A0812] storefront-portal theme-${activeCategory}`}>
        <Navbar
          activePage={selectedStorefrontProduct ? 'product-detail' : storefrontPage}
          onNavigate={handleStorefrontNavigate}
          onBack={handleBack}
          cartCount={cartItems.reduce((acc, item) => acc + item.quantity, 0)}
          onOpenCart={() => setCartDrawerOpen(true)}
          onSearch={(q) => {
            setStorefrontSearchQuery(q);
            setStorefrontPage('shop');
            setSelectedStorefrontProduct(null);
          }}
          onToggleAdmin={handleToggleAdmin}
          isLoggedIn={!!operatorEmail}
        />

        {dbError && (
          <div className="bg-[#1A1510] border-b border-[#D4AF37]/20 text-[#D4AF37] px-4 py-2.5 text-xs flex justify-between items-center gap-4 select-none">
            <div className="flex items-center gap-2 max-w-3xl">
              <span className="animate-pulse flex-shrink-0 text-amber-500">⚠</span>
              <span className="font-body-mono tracking-tight text-[11px] uppercase leading-snug">{dbError}</span>
            </div>
            <button 
              onClick={() => setDbError(null)} 
              className="text-[#D4AF37] hover:text-[#F8F3E9] font-bold px-2 py-1 border border-[#D4AF37]/20 hover:border-[#D4AF37]/50 bg-black/30 transition-colors uppercase text-[10px] whitespace-nowrap"
            >
              Acknowledge
            </button>
          </div>
        )}

        <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={checkoutReturn ? `return-${checkoutReturn.status}` : selectedStorefrontProduct ? `detail-${selectedStorefrontProduct.id}` : storefrontPage}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="w-full h-full"
            >
              {checkoutReturn ? (
                <OrderReturnView
                  status={checkoutReturn.status}
                  orderId={checkoutReturn.orderId}
                  onContinue={() => {
                    setCheckoutReturn(null);
                    handleStorefrontNavigate('home');
                  }}
                  onResumeCheckout={() => {
                    setCheckoutReturn(null);
                    setStorefrontPage('checkout');
                  }}
                />
              ) : selectedStorefrontProduct ? (
                <ProductDetailView
                  product={selectedStorefrontProduct}
                  allProducts={products}
                  settings={settings}
                  onAddToCart={handleAddToCart}
                  onBuyNow={handleBuyNow}
                  onNavigate={handleStorefrontNavigate}
                  onViewProduct={(p) => setSelectedStorefrontProduct(p)}
                />
              ) : storefrontPage === 'home' ? (
                <HomeView
                  products={products}
                  onNavigate={handleStorefrontNavigate}
                  onQuickAdd={handleAddToCart}
                  onViewProduct={(p) => setSelectedStorefrontProduct(p)}
                />
              ) : storefrontPage === 'shop' ? (
                <ShopView
                  products={products}
                  initialCategory={storefrontCategoryFilter}
                  onCategoryChange={setStorefrontCategoryFilter}
                  searchQuery={storefrontSearchQuery}
                  onClearSearch={() => setStorefrontSearchQuery('')}
                  onQuickAdd={handleAddToCart}
                  onViewProduct={(p) => setSelectedStorefrontProduct(p)}
                />
              ) : storefrontPage === 'checkout' ? (
                <CheckoutView
                  cartItems={cartItems}
                  onClearCart={handleClearCart}
                  onNavigate={handleStorefrontNavigate}
                />
              ) : (
                <div className="text-center py-20 text-[#F8F3E9]/50 font-body-mono text-xs uppercase">
                  UNHANDLED EXCEPTION VIEW PATH.
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        <Footer
          settings={settings}
          onNavigate={handleStorefrontNavigate}
          onToggleAdmin={handleToggleAdmin}
          isLoggedIn={!!operatorEmail}
        />

        {/* Persistent overlays / slide drawers */}
        <CartDrawer
          isOpen={cartDrawerOpen}
          onClose={() => setCartDrawerOpen(false)}
          cartItems={cartItems}
          onUpdateQuantity={handleUpdateCartQuantity}
          onRemoveItem={handleRemoveFromCart}
          onProceedToCheckout={() => {
            setCartDrawerOpen(false);
            setStorefrontPage('checkout');
            setSelectedStorefrontProduct(null);
          }}
        />
      </div>
    );
  }

  // ==========================================
  // MERCHANT BACK-OFFICE OPERATIONS ROUTING
  // ==========================================

  // Fallback while a lazily-loaded admin chunk is fetched.
  const adminBootFallback = (
    <div className="min-h-screen bg-space-black flex flex-col justify-center items-center gap-4 font-body-mono text-accent-purple select-none">
      <span className="w-8 h-8 border-4 border-accent-purple border-t-transparent animate-spin" />
      <p className="font-retro-heading text-[10px] tracking-widest text-cream uppercase animate-pulse">
        LOADING ADMIN CONSOLE
      </p>
    </div>
  );

  // If no active session, restrict access and load Login Portal view
  if (!operatorEmail) {
    return (
      <React.Suspense fallback={adminBootFallback}>
        <LoginView
          onLoginSuccess={handleLogin}
          onBackToStorefront={() => setViewMode('storefront')}
        />
      </React.Suspense>
    );
  }

  return (
    <React.Suspense fallback={adminBootFallback}>
    <div className="min-h-screen bg-space-black flex font-body-mono text-cream selection:bg-accent-purple selection:text-space-black">
      {/* 1. Left Navigation Sidebar */}
      <Sidebar
        currentView={currentView}
        onNavigate={(v) => {
          setSelectedProduct(null);
          setSelectedOrder(null);
          setCurrentView(v);
        }}
        onLogout={handleLogout}
        adminEmail={operatorEmail}
      />

      {/* 2. Main Terminal Content Canvas area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Dynamic header row */}
        <Header title={getViewTitle()} />

        {dbError && (
          <div className="bg-[#1C1215] border-b border-retro-red/30 text-retro-red px-6 py-2.5 text-xs flex justify-between items-center gap-4 select-none flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="animate-pulse flex-shrink-0 text-retro-red font-bold">⚠ WARNING:</span>
              <span className="font-body-mono uppercase text-[10px] tracking-wide leading-snug">{dbError}</span>
            </div>
            <button 
              onClick={() => setDbError(null)} 
              className="text-retro-red hover:text-cream font-bold px-2 py-0.5 border border-retro-red/20 hover:border-retro-red/50 bg-black/40 transition-colors uppercase text-[9px] tracking-wider whitespace-nowrap"
            >
              Dismiss Warning
            </button>
          </div>
        )}

        {/* Scrollable central viewport with animation */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-space-black relative">
          
          {/* Subtle grid scanlines overlay to enforce the deep ambient retro terminal theme */}
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(42,31,69,0.06)_0%,transparent_80%)]" />

          {/* Render Active View inside Spring transition block */}
          <div className="relative z-10 max-w-7xl mx-auto h-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentView}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                {renderViewContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
    </React.Suspense>
  );
}
