# 🛍️ Inventory & Billing System — Enterprise Suite

A modern, high-performance, full-stack **Inventory & Point of Sale (POS) Management System** built with **Django REST Framework** on the backend and **React, TypeScript, Vite, and TailwindCSS** on the frontend. Featuring a signature **Dark-to-Light Violet Spectrum** UI theme, real-time POS billing, GST tax breakdowns, printable PDF receipts, and strict **3-Tier Role-Based Access Control (RBAC)**.

---

## ✨ Key Features

### 🛒 Point of Sale (POS) & Billing Terminal
- **Instant Product Search & Barcode Lookup**: Real-time filtering by product name, SKU, or barcode.
- **Quick Catalog Picker Grid**: Click-to-add product tiles for rapid cashier checkout.
- **Dynamic GST & Discount Computation**: Automatic subtotal, GST tax rate breakdown, itemized discounts, and grand total calculations.
- **Split Payment Modes**: Support for **Cash**, **UPI / Online**, **Credit/Debit Card**, and **Credit / Customer Account Due**.
- **Hold & Draft Bills**: Hold active carts as draft bills for pending transactions.
- **Printable PDF Invoices**: One-click instant generation of official GST invoice PDF receipts.

### 📦 Product & Category Catalog Management
- **Catalog Directory**: Manage selling prices, purchase prices, stock quantities, and low stock alert thresholds.
- **Category Manager**: Modal dialog for managing category and sub-category classifications.
- **Low Stock Badges**: Real-time visual alerts for items falling below safety threshold levels.

### 🏢 Multi-Branch Inventory & Stock Movements
- **Stock Audit Ledger**: Complete log of all stock movements (`sale`, `purchase`, `adjustment`, `transfer`, `return`).
- **Branch Stock Distribution**: Track per-branch inventory levels across multiple shop locations.

### 🤝 Supplier Procurement & Purchase Orders
- **Vendor Directory**: Manage suppliers, corporate GSTIN numbers, contact persons, and addresses.
- **Purchase Orders**: Record inventory replenishment orders, itemized purchase prices, GST tax rates, and payables.

### 👥 Customer Ledger & Loyalty Program
- **Client Directory**: Track customer contact info, billing addresses, and corporate GST numbers.
- **Outstanding Balance Ledger**: Automatic tracking of unpaid credit balances on customer accounts.
- **Loyalty Reward Points**: Earn points automatically on completed purchases.

### 🔐 3-Tier Role-Based Access Control (RBAC)
- 👑 **Admin (`admin`)**: Complete system authority — full access to Store Settings, Shop Profile, Branch Creation, User Management, catalog edits, stock overrides, and reports.
- 👔 **Store Manager (`manager`)**: Operations authority — POS billing, sales history, catalog updates, stock adjustments, purchase orders, suppliers, and staff directory (read-only).
- 💳 **Staff / Cashier (`staff`)**: Checkout authority — POS terminal, customer registration, product lookup, sales history, and PDF invoice downloads.

---

## 🛠️ Technology Stack

### Backend
- **Framework**: Python 3.12+, Django 5+
- **API**: Django REST Framework (DRF)
- **Authentication**: SimpleJWT (JSON Web Tokens) & Google OAuth
- **PDF Generation**: ReportLab
- **Database**: SQLite (Development) / PostgreSQL (Production)

### Frontend
- **Framework**: React 18 / 19, TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS (Violet Spectrum Palette)
- **Icons**: Lucide & Heroicons SVG
- **Routing**: React Router v6

---

## 🚀 Getting Started

### Prerequisites
- **Python 3.12+**
- **Node.js 18+** & **npm**

---

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create a virtual environment (optional but recommended)
python -m venv venv

# Activate virtual environment
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# macOS/Linux:
source venv/bin/activate

# Install required Python packages
pip install django djangorestframework djangorestframework-simplejwt django-cors-headers reportlab google-auth

# Apply database migrations
python manage.py migrate

# Create a superuser / admin account
python manage.py createsuperuser

# Start the Django backend server
python manage.py runserver 8000
```
> The API will be available at: `http://localhost:8000/api/`

---

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install Node dependencies
npm install

# Start Vite development server
npm run dev
```
> The application UI will be accessible at: `http://localhost:5173/`

---

## 👥 Role Permissions Matrix

| Module / Page | Admin (`admin`) | Manager (`manager`) | Staff (`staff`) |
|---|---|---|---|
| **POS Billing** (`/billing`) | ✅ Full Access | ✅ Full Access | ✅ Full Access |
| **Sales History** (`/sales`) | ✅ Full Access | ✅ Full Access | 👁️ View & PDF Download |
| **Products Catalog** (`/products`) | ✅ Full Access | ✅ Full Access | 👁️ Read-Only Lookup |
| **Stock Movements** (`/stock`) | ✅ Full Access | ✅ Full Access | 👁️ Read-Only |
| **Purchases** (`/purchases`) | ✅ Full Access | ✅ Full Access | 👁️ Read-Only |
| **Suppliers** (`/suppliers`) | ✅ Full Access | ✅ Full Access | 👁️ Read-Only |
| **Customers** (`/customers`) | ✅ Full Access | ✅ Full Access | ✅ Add & View |
| **User Management** (`/user-management`) | ✅ Full Access | 👁️ Read-Only Staff List | 🚫 Blocked |
| **Store Settings** (`/settings`) | ✅ Full Access | 🚫 Blocked | 🚫 Blocked |

---

## 📄 License
This project is proprietary software developed for enterprise inventory and point of sale operations.
