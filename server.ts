import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import crypto from "crypto";

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// In-memory transaction storage
interface Transaction {
  id: string;
  orderId: string;
  paymentId?: string;
  signature?: string;
  amount: number; // in INR
  currency: string;
  status: 'created' | 'success' | 'failed';
  productName: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  createdAt: string;
  isSimulated: boolean;
  notes?: string;
}

// Seed transaction history for a rich initial dashboard view
const transactions: Transaction[] = [
  {
    id: "txn_1",
    orderId: "order_demo_Kz3Lp9Xy",
    paymentId: "pay_demo_Kz3Mv8Ts",
    signature: "sig_demo_7a8b9c0d1e2f3a4b5c",
    amount: 499,
    currency: "INR",
    status: "success",
    productName: "Frontend Mastery Blueprint",
    customerName: "Aarav Sharma",
    customerEmail: "aarav.sharma@example.com",
    customerPhone: "9876543210",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    isSimulated: true,
    notes: "Completed in Demo Mode"
  },
  {
    id: "txn_2",
    orderId: "order_demo_My5Nr2Qp",
    paymentId: "pay_demo_My5Or4Wp",
    signature: "sig_demo_1a2b3c4d5e6f7a8b9c",
    amount: 1299,
    currency: "INR",
    status: "success",
    productName: "Full-Stack SaaS Boilerplate",
    customerName: "Priya Patel",
    customerEmail: "priya.patel@example.com",
    customerPhone: "9123456789",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    isSimulated: true,
    notes: "Completed in Demo Mode"
  },
  {
    id: "txn_3",
    orderId: "order_demo_Tx8Yp4Mn",
    amount: 799,
    currency: "INR",
    status: "failed",
    productName: "AI Integration Masterclass",
    customerName: "Rohan Das",
    customerEmail: "rohan.das@example.com",
    customerPhone: "9988776655",
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
    isSimulated: true,
    notes: "Simulated cancelled payment"
  }
];

// 1. GET /api/config - Pure Demo Simulated config
app.get("/api/config", (req, res) => {
  res.json({
    success: true,
    hasKeys: false,
    keyId: null,
    isDemo: true
  });
});

// 2. GET /api/payments - Fetch all payments/transactions
app.get("/api/payments", (req, res) => {
  const sorted = [...transactions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json({
    success: true,
    payments: sorted
  });
});

// 3. POST /api/create-order - Create a simulated demo order
app.post("/api/create-order", (req, res) => {
  try {
    const { amount, productName, customerName, customerEmail, customerPhone } = req.body;

    if (!amount || !productName || !customerName || !customerEmail) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: amount, productName, customerName, customerEmail are required."
      });
    }

    const txnId = "txn_" + Math.random().toString(36).substring(2, 11);
    const orderTimestamp = new Date().toISOString();
    const simulatedOrderId = "order_sim_" + Math.random().toString(36).substring(2, 15);
    
    const newTxn: Transaction = {
      id: txnId,
      orderId: simulatedOrderId,
      amount: Number(amount),
      currency: "INR",
      status: "created",
      productName,
      customerName,
      customerEmail,
      customerPhone,
      createdAt: orderTimestamp,
      isSimulated: true,
      notes: "Created in Simulated Demo Mode"
    };

    transactions.push(newTxn);

    return res.json({
      success: true,
      isSimulated: true,
      orderId: simulatedOrderId,
      amount: Number(amount) * 100, // in paise
      currency: "INR",
      keyId: "rzp_test_simulated_key"
    });

  } catch (error: any) {
    console.error("Error creating simulated order:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create order"
    });
  }
});

// 4. POST /api/verify-payment - Verify simulated verification
app.post("/api/verify-payment", (req, res) => {
  try {
    const { orderId, paymentId, signature, status } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Missing orderId"
      });
    }

    const txnIndex = transactions.findIndex(t => t.orderId === orderId);
    if (txnIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Transaction order not found"
      });
    }

    // If explicit payment failure is reported
    if (status === 'failed') {
      transactions[txnIndex].status = 'failed';
      transactions[txnIndex].paymentId = paymentId || `pay_failed_${Math.random().toString(36).substring(2, 11)}`;
      return res.json({
        success: false,
        message: "Payment marked as failed"
      });
    }

    // Simulated Verification
    transactions[txnIndex].status = "success";
    transactions[txnIndex].paymentId = paymentId || "pay_sim_" + Math.random().toString(36).substring(2, 11);
    transactions[txnIndex].signature = signature || "sig_sim_" + Math.random().toString(36).substring(2, 20);
    
    return res.json({
      success: true,
      message: "Payment verified successfully (Simulated Demo)"
    });

  } catch (error: any) {
    console.error("Error verifying payment:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to verify payment"
    });
  }
});

// Vite middleware & production static routing setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
