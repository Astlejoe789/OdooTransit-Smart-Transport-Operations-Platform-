# OdooTransit-Smart-Transport-Operations-Platform-
An Odoo-based transport management platform for managing vehicles, drivers, trips, maintenance, fuel, and operational analytics

# 🚛 TransitOps AI
### Smart Transport Operations Platform

> An enterprise-grade AI-powered Transport Operations Platform built with **Next.js**, **Express.js**, **PostgreSQL**, **Prisma**, and **AI integrations** to digitize fleet operations from vehicle registration to dispatch, maintenance, expenses, analytics, and compliance.

---


# 🚀 Overview

TransitOps AI is a centralized fleet and transport management platform designed to eliminate spreadsheet-based fleet operations.

The platform enables organizations to manage:

- Fleet
- Drivers
- Trips
- Dispatch
- Maintenance
- Fuel
- Expenses
- Reports
- Compliance
- AI Automation

The system enforces business rules automatically while providing operational insights through dashboards and analytics.

---

# 📌 Business Problem

Many logistics companies still rely on spreadsheets and manual processes.

This causes:

- Scheduling conflicts
- Double vehicle assignments
- Driver allocation errors
- Missed maintenance
- Expired licenses
- Poor expense tracking
- Low fleet utilization
- Lack of operational visibility

TransitOps solves these problems through automation and AI.

---

# 🎯 Objectives

Build an end-to-end transport operations platform that:

- Digitizes transport operations
- Automates business workflows
- Prevents invalid dispatches
- Tracks operational costs
- Improves fleet utilization
- Provides AI-powered automation
- Generates analytics for management

---

# 👥 Target Users

## Fleet Manager

Responsible for:

- Fleet lifecycle
- Vehicle management
- Maintenance
- Fleet utilization

---

## Dispatcher

Responsible for:

- Trip creation
- Vehicle assignment
- Driver assignment
- Dispatch operations

---

## Driver

Responsible for:

- Viewing assigned trips
- Uploading expenses
- Odometer updates
- Receipt uploads

---

## Safety Officer

Responsible for:

- Driver compliance
- License validity
- Safety score
- Incident tracking

---

## Financial Analyst

Responsible for:

- Fuel costs
- Maintenance costs
- Operational expenses
- ROI analysis

---

# ✨ Core Features

## Authentication

- JWT Authentication
- Secure Login
- Role Based Access Control (RBAC)
- Protected Routes
- Session Management

---

## Dashboard

KPIs

- Active Vehicles
- Available Vehicles
- Vehicles in Maintenance
- Active Trips
- Pending Trips
- Drivers On Duty
- Fleet Utilization
- Revenue
- Operational Cost

Filters

- Region
- Vehicle Type
- Status

Charts

- Fuel Consumption
- Fleet Utilization
- Monthly Expenses
- Vehicle ROI

---

## Fleet Management

Vehicle CRUD

Vehicle Details

- Registration Number
- Model
- Vehicle Type
- Maximum Load Capacity
- Odometer
- Acquisition Cost
- Status

Features

- Search
- Filters
- Pagination
- Validation
- Responsive Tables

---

## Driver Management

Driver CRUD

Fields

- Name
- License Number
- License Category
- License Expiry
- Contact Number
- Safety Score
- Status

Features

- License Reminder
- Search
- Filters
- Driver Availability

---

## Trip Management

Trip Workflow

Draft

↓

Assigned

↓

Dispatched

↓

Completed

↓

Archived

Trip Information

- Source
- Destination
- Vehicle
- Driver
- Cargo Weight
- Planned Distance
- Final Odometer
- Fuel Consumed

---

## Dispatch Engine

Automatic Validation

- Vehicle availability
- Driver availability
- Cargo validation
- Maintenance validation
- License validation

Dispatch Checklist

- Driver Verified
- Vehicle Ready
- Documents Verified
- Fuel Checked

---

## Maintenance

Features

- Maintenance Records
- Preventive Maintenance
- Service History
- Service Reminder
- Vehicle Health

Automatic Status Changes

Available

↓

In Shop

↓

Available

---

## Fuel & Expense

Fuel Logs

- Fuel Quantity
- Fuel Cost
- Mileage
- Fuel Efficiency

Expense Logs

- Toll
- Repairs
- Miscellaneous
- Receipt Upload
- OCR Extraction

---

## Reports & Analytics

Reports

- Fleet Utilization
- Fuel Efficiency
- Vehicle ROI
- Operational Cost
- Maintenance Cost
- Driver Performance

Exports

- CSV
- PDF

---

## Driver Portal

Driver Dashboard

- Assigned Trips
- Odometer Update
- Fuel Submission
- Expense Submission
- Receipt Upload

---

## Audit & Compliance

Features

- Audit Logs
- Compliance History
- Hash Chain
- OpenTimestamp Integration
- Change Tracking

---

# 🤖 AI Features

- Spreadsheet Import
- AI Column Mapping
- OCR Receipt Processing
- Natural Language Fleet Search
- Smart Dispatch Assistant
- Groq Integration
- Gemini Fallback
- AI Recommendations
- AI Analytics Summary

---

# 📏 Mandatory Business Rules

The system automatically enforces:

- Vehicle Registration Number must be unique.
- Retired vehicles cannot be dispatched.
- Vehicles under maintenance cannot be dispatched.
- Drivers with expired licenses cannot drive.
- Suspended drivers cannot be assigned.
- Driver already on a trip cannot be reassigned.
- Vehicle already on a trip cannot be reassigned.
- Cargo weight cannot exceed vehicle capacity.
- Dispatch automatically changes Driver and Vehicle status to **On Trip**.
- Trip completion restores Driver and Vehicle to **Available**.
- Trip cancellation restores Driver and Vehicle.
- Active maintenance changes vehicle status to **In Shop**.
- Closing maintenance restores vehicle availability.

---

# 🗄 Database Entities

- Users
- Roles
- Vehicles
- Drivers
- Trips
- Dispatch
- Maintenance Logs
- Fuel Logs
- Expenses
- Audit Logs
- Compliance Records
- Notifications

---

# 🏗 Technology Stack

## Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- Shadcn UI
- React Hook Form
- TanStack Query
- Zod

## Backend

- Express.js
- Node.js
- PostgreSQL
- Prisma ORM

## Authentication

- JWT
- RBAC
- bcrypt

## AI

- Groq API
- Gemini API
- OCR Engine

## Charts

- Recharts

## DevOps

- Docker
- Docker Compose
- GitHub Actions
- Vercel
- Railway / Render

---

# 📂 Project Structure

```
TransitOps-AI/

client/
│
├── app/
├── components/
├── hooks/
├── services/
├── lib/
└── styles/

server/
│
├── controllers/
├── middleware/
├── prisma/
├── routes/
├── services/
├── uploads/
└── utils/

shared/

docs/

docker/

README.md
```

---

# 🛠 Development Roadmap

## ✅ Build 1

- Project Setup
- Landing Page
- Authentication
- JWT
- RBAC
- Dashboard
- Sidebar
- Navigation
- Protected Routes

---

## ✅ Build 2

Fleet Management

- Vehicle CRUD
- Driver CRUD
- Search
- Filters
- Pagination
- APIs
- Validation

---

## ✅ Build 3

Trip & Dispatch

- Trip Creation
- Vehicle Assignment
- Driver Assignment
- Dispatch Engine
- Rules Engine
- Status Workflow

---

## ✅ Build 4

Maintenance

- Maintenance Records
- Service Reminder
- Vehicle Status
- Dashboard Widgets

---

## ✅ Build 5

Fuel & Expense

- Fuel Logs
- Expense Logs
- OCR
- Receipt Upload
- Analytics

---

## ✅ Build 6

Reports

- Fleet Utilization
- ROI
- Fuel Efficiency
- Dashboard
- CSV Export

---

## ✅ Build 7

AI

- Spreadsheet Import
- AI Mapping
- OCR
- Groq
- Gemini
- Natural Language Search

---

## ✅ Build 8

Driver Portal

- Driver Login
- Assigned Trips
- Expense Submission
- Receipt Upload
- Odometer

---

## ✅ Build 9

Compliance

- Audit Logs
- Hash Chain
- OpenTimestamp
- Compliance History

---

## ✅ Build 10

Production

- Animations
- Loading States
- Error Handling
- Docker
- Deployment
- Demo Data
- Seed Scripts
- Performance Optimization

---

# 🔒 Security

- JWT Authentication
- Password Hashing
- RBAC Authorization
- Protected APIs
- Secure File Upload
- Input Validation
- SQL Injection Protection
- XSS Protection
- CORS
- Rate Limiting

---

# ⚙ Installation

```bash
git clone <repository>

cd TransitOps-AI

npm install
```

---

# 🔑 Environment Variables

```env
DATABASE_URL=

JWT_SECRET=

GROQ_API_KEY=

GEMINI_API_KEY=

CLOUDINARY_URL=

EMAIL_USERNAME=

EMAIL_PASSWORD=
```

---

# ▶ Running the Project

### Backend

```bash
npm run server
```

### Frontend

```bash
npm run dev
```

### Prisma

```bash
npx prisma migrate dev

npx prisma db seed
```

---

# 📡 API Modules

- Authentication API
- Vehicle API
- Driver API
- Trip API
- Dispatch API
- Maintenance API
- Fuel API
- Expense API
- Analytics API
- AI API
- Compliance API

---

# 🌟 Bonus Features

- Dark Mode
- PDF Export
- CSV Export
- Email License Reminders
- Vehicle Document Management
- Smart Notifications
- AI Insights
- Mobile Responsive UI
- Docker Deployment
- Demo Seed Data

---

# 📈 Future Enhancements

- GPS Tracking
- Live Vehicle Location
- Route Optimization
- Predictive Maintenance
- AI Demand Forecasting
- Voice Assistant
- Mobile App
- IoT Integration
- Multi-Tenant Support

---

# 📄 License

This project was developed as part of the **TransitOps Smart Transport Operations Platform Hackathon**.

Built using modern full-stack technologies with AI-powered automation and enterprise-grade architecture.
