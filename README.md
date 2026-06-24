# Payment Gateway Integration (Simulated Sandbox)

A complete, production-ready full-stack payment gateway integration demo built using **React**, **TypeScript**, **Node.js (Express)**, and **Vite**. This project operates as a beautifully styled storefront and ledger auditing system with a built-in interactive simulator sandbox.

---

## 🌟 Key Features

1.  **Modern Storefront:** Clean and responsive UI featuring card-based product selection, category tags, clear itemized list of features, and smooth animations.
2.  **Interactive Billing Form:** Secure checkout panel that collects buyer billing information (Name, Email, Phone).
3.  **Beautiful Sandbox Simulator:** The app features a custom-built, fully responsive checkout simulator that models the complete full-stack flow of creating orders and verifying signatures with successful/failed outcomes out-of-the-box.
4.  **Verified Success & Failure Screens:** Specialized confirmation templates providing full receipt details, transaction references, and simulation debugging helpers.
5.  **Interactive Transaction Ledger:** A robust payment log section equipped with status filtering (All, Success, Failed, Pending), searchable index (by Name, Email, Product, Order ID), and accurate timestamps.

---

## ⚙️ Backend API Architecture

The backend operates on a custom Express server configured to serve both API routes and compiled React assets on standard ingress port `3000`.

### 1. `GET /api/config`
Check current demo/simulator status.
*   **Response:**
    ```json
    {
      "success": true,
      "hasKeys": false,
      "keyId": null,
      "isDemo": true
    }
    ```

### 2. `POST /api/create-order`
Creates a verified checkout order, registering a simulated transaction in the database ledger.
*   **Payload:**
    ```json
    {
      "amount": 499,
      "productName": "Frontend Mastery Blueprint",
      "customerName": "John Doe",
      "customerEmail": "john@example.com",
      "customerPhone": "9876543210"
    }
    ```
*   **Response:**
    ```json
    {
      "success": true,
      "isSimulated": true,
      "orderId": "order_sim_...",
      "amount": 49900,
      "currency": "INR",
      "keyId": "rzp_test_simulated_key"
    }
    ```

### 3. `POST /api/verify-payment`
Verifies signature authenticity and registers simulated success or failure outcomes in the in-memory log.
*   **Payload:**
    ```json
    {
      "orderId": "order_sim_...",
      "paymentId": "pay_sim_...",
      "signature": "sig_sim_...",
      "isSimulated": true
    }
    ```
*   **Response:**
    ```json
    {
      "success": true,
      "message": "Payment verified successfully (Simulated Demo)"
    }
    ```

### 4. `GET /api/payments`
Fetches all recorded payments stored in the backend in-memory ledger. Sorted chronologically (newest first).

---

## 🛠️ Setup & Local Deployment

### 1. Prerequisites
Ensure you have **Node.js (v18+)** installed.

### 2. Build & Run
Run the standard build commands to compile both the React frontend and bundle the custom Express server:

```bash
# Install dependencies
npm install

# Build the frontend and backend bundle
npm run build

# Start the full-stack server
npm start
```
Your application will be live at `http://localhost:3000`.

---

## 📂 Directory Structure

*   `server.ts` - Main Express server configuration, API handlers, and Vite integration.
*   `src/App.tsx` - Primary storefront controller, Checkout state machines, and Ledger logs views.
*   `src/types.ts` - Shared TS types, Product specifications, and Transaction schemes.
*   `src/products.ts` - Product static catalog items.
*   `package.json` - Build configurations, dependencies, and deployment start commands.
