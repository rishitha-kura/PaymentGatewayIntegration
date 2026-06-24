import React, { useState, useEffect } from "react";
import { 
  ShoppingBag, 
  History, 
  CreditCard, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Settings, 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Check,
  AlertCircle,
  RefreshCw,
  FileText
} from "lucide-react";
import { motion } from "motion/react";
import { Product, Transaction, ConfigInfo } from "./types";
import { PRODUCTS } from "./products";

export default function App() {
  // Navigation & UI States
  const [activeTab, setActiveTab] = useState<"products" | "history">("products");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(PRODUCTS[0]); // Default to first product for a ready-to-checkout feel
  const [checkoutStep, setCheckoutStep] = useState<"form" | "success" | "failure">("form");
  
  // Checkout Form States
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // App States
  const [payments, setPayments] = useState<Transaction[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  
  // Simulated Modal State
  const [simulatedOrder, setSimulatedOrder] = useState<{
    orderId: string;
    amount: number;
    currency: string;
    keyId: string;
    productName: string;
  } | null>(null);

  // Active Completed Transaction State for Success/Failure screens
  const [lastTxn, setLastTxn] = useState<Transaction | null>(null);

  // Filters for History
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "success" | "failed" | "created">("all");

  // Fetch Payment History on Mount
  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoadingPayments(true);
    try {
      const res = await fetch("/api/payments");
      const data = await res.json();
      if (data.success) {
        setPayments(data.payments);
      }
    } catch (err) {
      console.error("Failed to load payments history", err);
    } finally {
      setLoadingPayments(false);
    }
  };

  // Form Validation
  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};
    if (!customerName.trim()) errors.name = "Full Name is required";
    if (!customerEmail.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(customerEmail)) {
      errors.email = "Please enter a valid email address";
    }
    if (customerPhone && !/^[0-9+ ]{10,14}$/.test(customerPhone)) {
      errors.phone = "Please enter a valid phone number";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle Order Creation and Checkout initiation (Pure Simulator Mode)
  const handleProceedToPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !selectedProduct) return;

    setIsSubmitting(true);

    try {
      // Create simulated order on the backend demo API
      const res = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: selectedProduct.price,
          productName: selectedProduct.name,
          customerName,
          customerEmail,
          customerPhone: customerPhone || undefined
        }),
      });

      const orderData = await res.json();
      
      if (!res.ok || !orderData.success) {
        throw new Error(orderData.message || "Failed to create simulated order");
      }

      // Trigger the Sandbox Simulator Modal
      setSimulatedOrder({
        orderId: orderData.orderId,
        amount: orderData.amount,
        currency: orderData.currency,
        keyId: orderData.keyId,
        productName: selectedProduct.name
      });
      setIsSubmitting(false);

    } catch (err: any) {
      console.error("Simulated order process failed:", err);
      alert(err.message || "An error occurred while initiating the checkout process.");
      setIsSubmitting(false);
    }
  };

  // Complete Simulated Checkout successfully
  const handleSimulatedSuccess = async () => {
    if (!simulatedOrder || !selectedProduct) return;
    
    const mockPaymentId = "pay_sim_" + Math.random().toString(36).substring(2, 11);
    const mockSignature = "sig_sim_" + Math.random().toString(36).substring(2, 20);

    try {
      const verifyRes = await fetch("/api/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: simulatedOrder.orderId,
          paymentId: mockPaymentId,
          signature: mockSignature,
          isSimulated: true
        }),
      });

      const verifyResult = await verifyRes.json();
      if (verifyResult.success) {
        await fetchPayments();
        
        setLastTxn({
          id: "sim_txn_" + Date.now(),
          orderId: simulatedOrder.orderId,
          paymentId: mockPaymentId,
          signature: mockSignature,
          amount: selectedProduct.price,
          currency: "INR",
          status: "success",
          productName: selectedProduct.name,
          customerName,
          customerEmail,
          customerPhone,
          createdAt: new Date().toISOString(),
          isSimulated: true,
          notes: "Processed successfully in Simulated Sandbox Mode"
        });
        
        setSimulatedOrder(null);
        setCheckoutStep("success");
      } else {
        setSimulatedOrder(null);
        setCheckoutStep("failure");
      }
    } catch (err) {
      console.error(err);
      setSimulatedOrder(null);
      setCheckoutStep("failure");
    }
  };

  // Fail Simulated Checkout
  const handleSimulatedFailure = async () => {
    if (!simulatedOrder || !selectedProduct) return;

    try {
      const verifyRes = await fetch("/api/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: simulatedOrder.orderId,
          status: "failed",
          isSimulated: true
        }),
      });

      await fetchPayments();
      
      setLastTxn({
        id: "sim_txn_" + Date.now(),
        orderId: simulatedOrder.orderId,
        amount: selectedProduct.price,
        currency: "INR",
        status: "failed",
        productName: selectedProduct.name,
        customerName,
        customerEmail,
        customerPhone,
        createdAt: new Date().toISOString(),
        isSimulated: true,
        notes: "Payment was cancelled/failed by the simulator user"
      });

      setSimulatedOrder(null);
      setCheckoutStep("failure");
    } catch (err) {
      console.error(err);
      setSimulatedOrder(null);
      setCheckoutStep("failure");
    }
  };

  // Filter Payments
  const filteredPayments = payments.filter((payment) => {
    const matchesSearch = 
      payment.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (payment.paymentId && payment.paymentId.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = 
      statusFilter === "all" || payment.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Get corresponding emoji icon for products
  const getProductIcon = (id: string) => {
    switch (id) {
      case "prod_frontend": return "📦";
      case "prod_saas": return "⚡";
      case "prod_ai": return "🤖";
      case "prod_cloud": return "☁️";
      default: return "💼";
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F8FAFC] text-[#1E293B] flex font-sans overflow-hidden">
      
      {/* LEFT SIDEBAR - Styled with slate-900 palette from the mock */}
      <aside className="w-[280px] bg-[#0F172A] text-[#F8FAFC] flex flex-col justify-between p-8 shrink-0 border-r border-slate-800/20 z-20">
        <div className="flex flex-col">
          {/* Brand Logo */}
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
              <CreditCard className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-lg tracking-tight text-white">PayGate.io</span>
          </div>

          {/* Sandbox Badge */}
          <div className="mb-10">
            <span className="inline-flex items-center gap-1.5 bg-indigo-500/10 text-indigo-300 text-[10px] font-bold uppercase px-3 py-1 rounded-full tracking-wide border border-indigo-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
              Simulated Sandbox Active
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">MAIN MENU</div>
            
            <button
              onClick={() => { setActiveTab("products"); setCheckoutStep("form"); }}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-semibold tracking-tight text-left transition-all duration-150 ${
                activeTab === "products"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/40"
              }`}
            >
              <ShoppingBag className="w-4 h-4 shrink-0" />
              Products Storefront
            </button>

            <button
              onClick={() => { setActiveTab("history"); }}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-semibold tracking-tight text-left transition-all duration-150 ${
                activeTab === "history"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/40"
              }`}
            >
              <History className="w-4 h-4 shrink-0" />
              Transactions Ledger
              {payments.length > 0 && (
                <span className="ml-auto bg-slate-800 text-slate-300 font-bold px-2 py-0.5 rounded-md text-[9px]">
                  {payments.length}
                </span>
              )}
            </button>

            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-6 mb-2 px-1">SYSTEM CONTROLS</div>

            <div className="flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-semibold text-slate-500 cursor-not-allowed">
              <Settings className="w-4 h-4 text-slate-600" />
              Portal Settings
            </div>

            <div className="flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-semibold text-slate-500 cursor-not-allowed">
              <FileText className="w-4 h-4 text-slate-600" />
              Developer Docs
            </div>
          </nav>
        </div>

        {/* Sidebar Footer Credits */}
        <div className="pt-6 border-t border-slate-800/80">
          <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
            Demo Environment v1.0.5
          </p>
          <p className="text-[9px] text-slate-500 mt-0.5 font-semibold uppercase tracking-wider">Full-Stack Gateway Simulation</p>
        </div>
      </aside>

      {/* RIGHT MAIN CONTAINER */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* HEADER AREA - Height 80px (h-20) */}
        <header className="h-20 bg-white border-b border-[#E2E8F0] px-10 flex items-center justify-between shrink-0 z-10">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              {activeTab === "products" ? "Product Selection" : "Transactions Ledger"}
            </h2>
            <p className="text-xs text-slate-400">
              {activeTab === "products" ? "Select standard developer blueprint packages below" : "Review real-time in-memory server database payment logs"}
            </p>
          </div>

          {/* Admin User Profile */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="font-bold text-xs text-slate-900">Admin User</div>
              <div className="text-[10px] text-[#64748B] font-medium">admin@paygate.io</div>
            </div>
            <div className="w-10 h-10 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-xs tracking-wide shadow-xs">
              AD
            </div>
          </div>
        </header>

        {/* VIEWPORT CONTENT GRID */}
        <div className="flex-1 overflow-y-auto p-8 md:p-10">
          
          {/* TAB 1: STOREFRONT & PRODUCTS */}
          {activeTab === "products" && (
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-8 items-start max-w-7xl mx-auto">
              
              {/* Left Column: Products Grid */}
              <div className="flex flex-col gap-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Available Packages</h3>
                  <span className="text-xs text-slate-500 font-medium">Click to select and view summary</span>
                </div>

                <div className="flex flex-col gap-4">
                  {PRODUCTS.map((product) => {
                    const isSelected = selectedProduct?.id === product.id;
                    return (
                      <div
                        key={product.id}
                        onClick={() => {
                          setSelectedProduct(product);
                          setCheckoutStep("form");
                        }}
                        className={`bg-white border rounded-xl p-5 flex items-center gap-5 transition-all duration-200 cursor-pointer ${
                          isSelected 
                            ? "border-indigo-500 ring-1 ring-indigo-500/20 shadow-md shadow-indigo-500/5 bg-indigo-50/10" 
                            : "border-[#E2E8F0] hover:border-slate-300 shadow-xs"
                        }`}
                      >
                        {/* Emojified Product Icon */}
                        <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-lg shrink-0 flex items-center justify-center text-2xl shadow-2xs">
                          {getProductIcon(product.id)}
                        </div>

                        {/* Product Title & Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-sm text-slate-900 tracking-tight truncate">{product.name}</h4>
                            <span className="bg-slate-100 text-slate-600 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-sm">
                              {product.category}
                            </span>
                          </div>
                          <p className="text-xs text-[#64748B] leading-relaxed line-clamp-2">{product.description}</p>
                          
                          {/* Horizontal feature pills for aesthetic layout */}
                          <div className="flex items-center gap-4 mt-2 text-[10px] text-slate-400 font-medium overflow-hidden">
                            {product.features.slice(0, 2).map((feat, idx) => (
                              <span key={idx} className="flex items-center gap-1">
                                <Check className="w-3 h-3 text-emerald-500" /> {feat}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Pricing & select state */}
                        <div className="text-right shrink-0">
                          <div className="font-extrabold text-base text-slate-900 tracking-tight">
                            ₹{product.price.toLocaleString("en-IN")}
                          </div>
                          <span className={`inline-block mt-2 text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                            isSelected 
                              ? "bg-indigo-100 text-indigo-700" 
                              : "bg-slate-100 text-slate-500 border border-slate-200/40"
                          }`}>
                            {isSelected ? "Selected" : "Select"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Aesthetic static bottom info bar */}
                <div className="bg-slate-100/50 border border-slate-200/60 rounded-xl p-4 flex gap-3 items-start">
                  <AlertCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-[#64748B] leading-relaxed">
                    Select any developer asset package to populate the checkout summary. You can trigger fully functioning simulated success and failure screen sequences inside the sandbox workflow. No API keys are required!
                  </p>
                </div>
              </div>

              {/* Right Column: Checkout Summary & Connection status */}
              <div className="flex flex-col gap-6 sticky top-0">
                
                {/* Dynamic Checkout summary card */}
                {selectedProduct && (
                  <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-md shadow-slate-100/60 relative overflow-hidden">
                    
                    {/* Visual border accent */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500"></div>

                    {checkoutStep === "form" && (
                      <div>
                        <div className="font-bold text-base text-slate-900 mb-4 pb-3 border-b border-slate-100">
                          Order Summary
                        </div>

                        {/* Item breakdown */}
                        <div className="flex flex-col gap-2.5 pb-4 border-b border-slate-100 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="text-[#64748B]">Product</span>
                            <span className="font-bold text-slate-800 text-right max-w-[180px] truncate">{selectedProduct.name}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[#64748B]">Gateway Price</span>
                            <span className="font-semibold text-slate-800">₹{selectedProduct.price.toLocaleString("en-IN")}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[#64748B]">Platform Tax (0%)</span>
                            <span className="text-slate-400">₹0.00</span>
                          </div>
                        </div>

                        {/* Total pricing */}
                        <div className="flex justify-between items-center py-4 border-b border-slate-100 mb-4">
                          <span className="font-bold text-sm text-slate-900">Total Price</span>
                          <span className="font-black text-lg text-indigo-600">₹{selectedProduct.price.toLocaleString("en-IN")}</span>
                        </div>

                        {/* User Input form integrated inline */}
                        <form onSubmit={handleProceedToPayment} className="flex flex-col gap-3">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Billing Details</span>

                          {/* Full Name input */}
                          <div className="flex flex-col gap-1">
                            <div className="relative">
                              <span className="absolute left-3 top-2.5 text-slate-400">
                                <User className="w-3.5 h-3.5" />
                              </span>
                              <input
                                type="text"
                                placeholder="Your Full Name *"
                                value={customerName}
                                onChange={(e) => {
                                  setCustomerName(e.target.value);
                                  if (formErrors.name) setFormErrors({ ...formErrors, name: "" });
                                }}
                                className={`w-full pl-9 pr-3 py-2 border text-xs rounded-md focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 ${
                                  formErrors.name ? "border-red-400 bg-red-50/10" : "border-slate-200"
                                }`}
                              />
                            </div>
                            {formErrors.name && (
                              <span className="text-[10px] text-red-500 font-semibold">{formErrors.name}</span>
                            )}
                          </div>

                          {/* Email Input */}
                          <div className="flex flex-col gap-1">
                            <div className="relative">
                              <span className="absolute left-3 top-2.5 text-slate-400">
                                <Mail className="w-3.5 h-3.5" />
                              </span>
                              <input
                                type="email"
                                placeholder="Email Address *"
                                value={customerEmail}
                                onChange={(e) => {
                                  setCustomerEmail(e.target.value);
                                  if (formErrors.email) setFormErrors({ ...formErrors, email: "" });
                                }}
                                className={`w-full pl-9 pr-3 py-2 border text-xs rounded-md focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 ${
                                  formErrors.email ? "border-red-400 bg-red-50/10" : "border-slate-200"
                                }`}
                              />
                            </div>
                            {formErrors.email && (
                              <span className="text-[10px] text-red-500 font-semibold">{formErrors.email}</span>
                            )}
                          </div>

                          {/* Phone input */}
                          <div className="flex flex-col gap-1">
                            <div className="relative">
                              <span className="absolute left-3 top-2.5 text-slate-400">
                                <Phone className="w-3.5 h-3.5" />
                              </span>
                              <input
                                type="tel"
                                placeholder="Phone (Optional)"
                                value={customerPhone}
                                onChange={(e) => {
                                  setCustomerPhone(e.target.value);
                                  if (formErrors.phone) setFormErrors({ ...formErrors, phone: "" });
                                }}
                                className={`w-full pl-9 pr-3 py-2 border text-xs rounded-md focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 ${
                                  formErrors.phone ? "border-red-400 bg-red-50/10" : "border-slate-200"
                                }`}
                              />
                            </div>
                            {formErrors.phone && (
                              <span className="text-[10px] text-red-500 font-semibold">{formErrors.phone}</span>
                            )}
                          </div>

                          {/* Submission Button */}
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-[#6366F1] hover:bg-[#4F46E5] disabled:bg-slate-300 text-white font-bold h-11 rounded-md text-xs mt-3 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                          >
                            {isSubmitting ? (
                              <>
                                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Preparing Secure Demo Session...
                              </>
                            ) : (
                              <>
                                <Lock className="w-3.5 h-3.5" />
                                Proceed to Simulated Payment
                              </>
                            )}
                          </button>
                        </form>

                        <div className="mt-4 text-center text-[10px] text-[#94A3B8] leading-relaxed">
                          This is a demo gateway. No real credentials or bank accounts are required.
                        </div>
                      </div>
                    )}

                    {/* Success Outcome template embedded in Summary panel */}
                    {checkoutStep === "success" && lastTxn && (
                      <div className="flex flex-col items-center text-center py-2">
                        <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500 mb-3 shadow-2xs">
                          <CheckCircle2 className="w-7 h-7" />
                        </div>
                        <h4 className="font-extrabold text-base text-slate-900">Payment Successful</h4>
                        <p className="text-xs text-[#64748B] mt-1">Simulated order processed and logged successfully.</p>

                        <div className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3.5 my-4 flex flex-col gap-2.5 text-left text-xs">
                          <div className="flex justify-between border-b border-slate-200/50 pb-1.5 font-bold">
                            <span className="text-[#64748B]">Product</span>
                            <span className="text-slate-800 text-right truncate max-w-[150px]">{lastTxn.productName}</span>
                          </div>
                          <div className="flex justify-between text-[11px]">
                            <span className="text-[#64748B]">Amount Billed</span>
                            <span className="font-bold text-indigo-600">₹{lastTxn.amount.toLocaleString("en-IN")}</span>
                          </div>
                          <div className="flex justify-between text-[11px]">
                            <span className="text-[#64748B]">Order Reference</span>
                            <span className="font-mono text-[10px] text-slate-600">{lastTxn.orderId}</span>
                          </div>
                          <div className="flex justify-between text-[11px]">
                            <span className="text-[#64748B]">Gateway Status</span>
                            <span className="badge badge-success px-1.5 py-0.2 rounded font-bold text-[9px] bg-emerald-100 text-emerald-800">SUCCESS</span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 w-full">
                          <button
                            onClick={() => {
                              setCheckoutStep("form");
                            }}
                            className="w-full border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-2 rounded-lg text-xs transition-all cursor-pointer"
                          >
                            Buy Another Package
                          </button>
                          <button
                            onClick={() => {
                              setActiveTab("history");
                            }}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg text-xs shadow-xs transition-all cursor-pointer"
                          >
                            View Transactions Ledger
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Failure Outcome template embedded in Summary panel */}
                    {checkoutStep === "failure" && (
                      <div className="flex flex-col items-center text-center py-2">
                        <div className="w-12 h-12 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-red-500 mb-3 shadow-2xs">
                          <XCircle className="w-7 h-7" />
                        </div>
                        <h4 className="font-extrabold text-base text-slate-900">Payment Failed</h4>
                        <p className="text-xs text-[#64748B] mt-1">The checkout session was closed or declined.</p>

                        <div className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3.5 my-4 flex flex-col gap-2.5 text-left text-xs">
                          <div className="flex justify-between border-b border-slate-200/50 pb-1.5 font-bold">
                            <span className="text-[#64748B]">Attempted Package</span>
                            <span className="text-slate-800 text-right truncate max-w-[150px]">{selectedProduct.name}</span>
                          </div>
                          <div className="flex justify-between text-[11px]">
                            <span className="text-[#64748B]">Order Reference</span>
                            <span className="font-mono text-[10px] text-slate-600">Failed / Cancelled</span>
                          </div>
                          <div className="flex justify-between text-[11px]">
                            <span className="text-[#64748B]">Gateway Status</span>
                            <span className="badge badge-fail px-1.5 py-0.2 rounded font-bold text-[9px] bg-red-100 text-red-800">DECLINED</span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 w-full">
                          <button
                            onClick={() => {
                              setCheckoutStep("form");
                            }}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-lg text-xs shadow-xs transition-all cursor-pointer"
                          >
                            Try Again
                          </button>
                          <button
                            onClick={() => {
                              setSelectedProduct(PRODUCTS[0]);
                              setCheckoutStep("form");
                            }}
                            className="w-full border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-2 rounded-lg text-xs transition-all cursor-pointer"
                          >
                            Cancel Checkout
                          </button>
                        </div>
                      </div>
                    )}

                  </div>
                )}

                {/* Card 2: Backend Connection Status */}
                <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs bg-[#F8FAFC]/50 border-dashed">
                  <div className="font-bold text-xs text-[#64748B] uppercase tracking-wider mb-2.5">
                    Backend Connection Status
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-[#1E293B]">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                    <span className="font-semibold text-slate-700">Express API Service Connected</span>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: TRANSACTION HISTORY LEDGER */}
          {activeTab === "history" && (
            <div className="max-w-7xl mx-auto flex flex-col gap-6">
              
              {/* Header with quick refresh option */}
              <div className="flex justify-between items-center gap-4">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Payment Database Logs</h3>
                  <p className="text-xs text-[#64748B] mt-0.5">Filter, search, and audit transactional signatures processed in memory</p>
                </div>
                <button
                  onClick={fetchPayments}
                  disabled={loadingPayments}
                  className="flex items-center gap-2 px-4 py-2 border border-[#E2E8F0] hover:border-slate-300 bg-white text-xs font-semibold text-[#64748B] hover:text-[#1E293B] rounded-lg transition-all shadow-2xs cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingPayments ? "animate-spin" : ""}`} />
                  Refresh Ledger
                </button>
              </div>

              {/* Filters Panel - Minimal styling card */}
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 flex flex-col md:flex-row gap-4 items-center shadow-2xs">
                {/* Search Bar */}
                <div className="relative flex-1 w-full">
                  <span className="absolute left-3.5 top-2.5 text-slate-400">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search ledger by order ID, name, email reference, payment hash, or package..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 text-xs rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                {/* Status Toggle buttons */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg self-stretch md:self-auto justify-between md:justify-start shrink-0">
                  <button
                    onClick={() => setStatusFilter("all")}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                      statusFilter === "all" ? "bg-white text-[#1E293B] shadow-2xs" : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    All Logs
                  </button>
                  <button
                    onClick={() => setStatusFilter("success")}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                      statusFilter === "success" ? "bg-white text-emerald-800 shadow-2xs" : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    Success
                  </button>
                  <button
                    onClick={() => setStatusFilter("failed")}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                      statusFilter === "failed" ? "bg-white text-red-800 shadow-2xs" : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    Failed
                  </button>
                  <button
                    onClick={() => setStatusFilter("created")}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                      statusFilter === "created" ? "bg-white text-amber-800 shadow-2xs" : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    Pending
                  </button>
                </div>
              </div>

              {/* Ledger Table Section */}
              {loadingPayments ? (
                <div className="bg-white border border-[#E2E8F0] rounded-xl p-16 flex flex-col items-center justify-center text-slate-400 shadow-2xs">
                  <svg className="animate-spin h-8 w-8 text-indigo-500 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-xs font-semibold">Loading ledger records from memory...</span>
                </div>
              ) : filteredPayments.length === 0 ? (
                <div className="bg-white border border-[#E2E8F0] rounded-xl p-16 text-center flex flex-col items-center justify-center shadow-2xs">
                  <div className="p-3 bg-slate-50 border border-slate-100 text-slate-400 rounded-full mb-3.5">
                    <Search className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">No records found matching search criteria</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm leading-relaxed">Try adjusting or clearing your search input, or purchase another product to populate the ledger database.</p>
                </div>
              ) : (
                <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-2xs">
                  
                  {/* Table View */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#0F172A] text-[10px] uppercase font-bold tracking-wider text-slate-300">
                          <th className="py-4 px-5">Product Details</th>
                          <th className="py-4 px-5">Payer Details</th>
                          <th className="py-4 px-5">Log Date & Time</th>
                          <th className="py-4 px-5">Order Reference / Keys</th>
                          <th className="py-4 px-5 text-right">Amount (INR)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E2E8F0] text-xs">
                        {filteredPayments.map((payment) => (
                          <tr key={payment.id} className="hover:bg-slate-50/50 transition-colors">
                            
                            {/* Product Info & badges */}
                            <td className="py-4 px-5 max-w-[220px]">
                              <div className="flex flex-col gap-1">
                                <span className="font-bold text-slate-900 truncate" title={payment.productName}>
                                  {payment.productName}
                                </span>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className={`badge px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase ${
                                    payment.status === "success" 
                                      ? "badge-success" 
                                      : payment.status === "failed" 
                                      ? "badge-fail bg-red-100 text-red-800" 
                                      : "badge-test"
                                  }`}>
                                    {payment.status}
                                  </span>
                                  <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200/50">
                                    Simulated Demo
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Contact Details */}
                            <td className="py-4 px-5">
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-900">{payment.customerName}</span>
                                <span className="text-[10px] text-slate-400 font-medium truncate max-w-[160px]">{payment.customerEmail}</span>
                              </div>
                            </td>

                            {/* Timestamp */}
                            <td className="py-4 px-5 text-slate-500 font-medium text-[11px]">
                              {new Date(payment.createdAt).toLocaleString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit"
                              })}
                            </td>

                            {/* Signatures & Reference keys */}
                            <td className="py-4 px-5 font-mono text-[10px] text-slate-600">
                              <div className="flex flex-col gap-0.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-slate-400 text-[9px] font-bold uppercase shrink-0">ORDER_ID:</span>
                                  <span className="truncate max-w-[140px]" title={payment.orderId}>{payment.orderId}</span>
                                </div>
                                {payment.paymentId && (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-slate-400 text-[9px] font-bold uppercase shrink-0">PAY_ID:</span>
                                    <span className="truncate max-w-[140px]" title={payment.paymentId}>{payment.paymentId}</span>
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* Price log */}
                            <td className="py-4 px-5 text-right font-black text-[#1E293B]">
                              ₹{payment.amount.toLocaleString("en-IN")}
                            </td>

                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                </div>
              )}

            </div>
          )}

        </div>

      </div>

      {/* RAZORPAY TEST SIMULATION MODAL */}
      {simulatedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#1d1f39] text-white rounded-2xl overflow-hidden shadow-2xl border border-slate-700/50">
            {/* Header */}
            <div className="p-4 bg-[#141529] border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-[#6366F1] flex items-center justify-center text-white text-xs font-black">
                  R
                </div>
                <div>
                  <h4 className="text-xs font-bold leading-tight">Razorpay Sandbox</h4>
                  <p className="text-[9px] text-slate-400">Demo Checkout Simulator</p>
                </div>
              </div>
              <span className="bg-indigo-500/10 text-indigo-400 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm border border-indigo-500/20">
                Mock Sandbox
              </span>
            </div>

            {/* Modal Body */}
            <div className="p-5 flex flex-col gap-4">
              {/* Product and cost */}
              <div className="flex justify-between items-center bg-[#252849] rounded-lg p-3">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Store Checkout</span>
                  <span className="text-xs font-bold text-white line-clamp-1">{simulatedOrder.productName}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Payable</span>
                  <span className="text-sm font-black text-indigo-300">₹{(simulatedOrder.amount / 100).toLocaleString("en-IN")}</span>
                </div>
              </div>

              {/* Instructions */}
              <div className="flex gap-2 bg-[#2d315c]/50 rounded-lg p-3 text-[11px] text-indigo-100 border border-indigo-500/20 leading-relaxed">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p>
                  **Simulation Mode Active**: This is a pure demo backend. No API keys are required. Choose to mock a successful payment or a failed/cancelled checkout below.
                </p>
              </div>

              <div className="flex flex-col gap-2.5 mt-2">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Simulated Pay Options</span>
                
                <button
                  onClick={handleSimulatedSuccess}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-lg text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-emerald-950/20"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Simulate Successful Payment (Green Path)
                </button>

                <button
                  onClick={handleSimulatedFailure}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-lg text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-red-950/20"
                >
                  <XCircle className="w-4 h-4" />
                  Simulate Cancelled / Failed Payment
                </button>
              </div>
            </div>

            {/* Cancel Footer */}
            <div className="bg-[#141529] p-3 border-t border-slate-800 text-center">
              <button
                onClick={() => setSimulatedOrder(null)}
                className="text-[11px] font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Close Simulator & Dismiss Checkout
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
