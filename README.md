# 🚛 TransitOps AI – Smart Transport Operations Platform

A modern transport and fleet management platform that helps organizations manage vehicles, drivers, trips, maintenance, fuel, expenses, and operational analytics from a single dashboard.

Built with **Next.js**, **Express.js**, **PostgreSQL**, **Prisma**, and AI-powered automation.

---

## Overview

TransitOps AI is an enterprise-grade transport operations platform designed to replace manual fleet management with a centralized digital solution.

The platform enables organizations to:

* Manage fleet and vehicles
* Maintain driver records
* Plan and dispatch trips
* Track maintenance schedules
* Monitor fuel and operational expenses
* Generate reports and analytics
* Ensure compliance and auditability
* Automate workflows using AI

---

## Key Features

### Authentication

* JWT Authentication
* Role-Based Access Control (RBAC)
* Secure Login
* Protected Routes

### Fleet Management

* Vehicle Registration
* Vehicle CRUD Operations
* Availability Tracking
* Search & Filters

### Driver Management

* Driver Profiles
* License Tracking
* Driver Availability
* Safety Information

### Trip & Dispatch

* Trip Planning
* Vehicle Assignment
* Driver Assignment
* Dispatch Validation
* Trip Status Workflow

### Maintenance

* Maintenance Records
* Preventive Maintenance
* Service History
* Vehicle Health Tracking

### Fuel & Expenses

* Fuel Logs
* Expense Management
* Receipt Upload
* Cost Tracking

### Reports & Analytics

* Fleet Utilization
* Fuel Efficiency
* Maintenance Reports
* Operational Cost Analysis
* Dashboard KPIs

### AI Features

* OCR Receipt Processing
* Spreadsheet Import
* AI Data Mapping
* Smart Dispatch Assistant
* AI Insights & Recommendations

---

## Business Rules

The system automatically enforces important operational rules such as:

* Unique vehicle registration numbers
* No dispatch for vehicles under maintenance
* No dispatch for retired vehicles
* Driver license validation
* Driver and vehicle availability checks
* Cargo capacity validation
* Automatic status updates during dispatch and trip completion

---

## Technology Stack

### Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS
* Shadcn UI

### Backend

* Node.js
* Express.js
* PostgreSQL
* Prisma ORM

### Authentication

* JWT
* bcrypt
* RBAC

### AI & Services

* Groq API
* Gemini API
* OCR Integration

### DevOps

* Docker
* GitHub Actions
* Vercel
* Railway / Render

---

## Project Structure

```text
TransitOps-AI/

├── client/
├── server/
├── shared/
├── docs/
├── docker/
└── README.md
```

---

## Installation

```bash
git clone <repository-url>

cd TransitOps-AI

npm install
```

---

## Environment Variables

Create a `.env` file and configure:

```env
DATABASE_URL=

JWT_SECRET=

GROQ_API_KEY=

GEMINI_API_KEY=

CLOUDINARY_URL=
```

---

## Running the Project

### Start Development Server

```bash
npm run dev
```

### Run Backend

```bash
npm run server
```

### Prisma

```bash
npx prisma migrate dev

npx prisma db seed
```

---

## API Modules

* Authentication
* Vehicles
* Drivers
* Trips
* Dispatch
* Maintenance
* Fuel
* Expenses
* Analytics
* AI Services
* Compliance

---

## Future Enhancements

* GPS Tracking
* Live Vehicle Monitoring
* Route Optimization
* Predictive Maintenance
* Mobile Application
* Multi-Tenant Support
* IoT Integration

---

## License

This project was developed as part of the **TransitOps AI – Smart Transport Operations Platform** and is intended for educational and demonstration purposes.
