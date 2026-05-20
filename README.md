# Debtify – Debt Management System

**Debtify** is a cross‑platform desktop application for managing loans, collections, and borrower relationships. Built with Electron, React, TypeScript, and TypeORM (SQLite), it provides a modern UI for tracking debts, payments, penalties, and notifications. The system includes audit logging, customizable payment plans, and multi‑user support.

![Electron](https://img.shields.io/badge/Electron-40.x-blue)
![React](https://img.shields.io/badge/React-19.x-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6)
![TypeORM](https://img.shields.io/badge/TypeORM-0.3.28-orange)
![License](https://img.shields.io/badge/License-Proprietary-red)

---

## 🚀 Features

### Debtors
- **Debtor Directory** – searchable, paginated list of all borrowers with contact details and outstanding debt.
- **Credit Checks** – internal scoring based on payment history and overdue flags; full audit log of every check.
- **Debtor Groups / Segments** – create groups (VIP, High‑Risk, etc.) and assign debtors for targeted collections.

### Loans & Debts
- **Active Loans** – view all active debts with days left, filter by due date range or remaining amount.
- **Overdue Accounts** – dedicated page with penalty application, bulk reminders, and partial payments.
- **Closed Loans** – archive of fully paid debts with summary stats and ability to reopen.
- **Loan Applications** – manage new loan requests; approval automatically creates an active debt.

### Collections
- **Payment Schedule** – calendar or list view of upcoming expected payments; mark payments as paid directly.
- **Transaction Log** – complete history of all payments, exportable to CSV/JSON, with admin edit/delete.
- **Payment Methods** – CRUD for payment types (Cash, Bank Transfer, etc.), set default, view usage stats.

### Reports
- **Aging Analysis** – AR aging buckets (0‑30, 31‑60, 61‑90, 90+ days) with bar chart and drill‑down to debts.
- **Collection Report** – actual vs. expected collection over time, KPIs, and payments per debtor.
- **Debtor Statement** – printable PDF/HTML statement showing all loans, payments, and penalties for a selected debtor.
- **Expected Payments** – forecast incoming payments based on due dates; filter by debtor group.

### System
- **Audit Trail** – complete history of all CREATE, UPDATE, DELETE actions across the system.
- **Notification Logs** – track email/SMS notifications sent to borrowers.
- **Device (Printer) Manager** – configure receipt printers (USB, network, Bluetooth), test print, set default.
- **System Settings** – centralised configuration for general, collections, loans, notifications, reports, integrations, and audit/security.

### Additional
- **Dark / Light Theme** – theme toggling via CSS variables.
- **Export & Import** – reports, transactions, and settings can be exported to CSV, Excel, or PDF.
- **Windows‑like UI** – compact tables, cards, and familiar button styles for a professional feel.

---

## 🛠️ Technology Stack

| Layer            | Technologies |
|------------------|--------------|
| **Desktop Framework** | Electron 40.x |
| **Frontend**     | React 19 (TypeScript), Tailwind CSS, React Router, React Hook Form, Chart.js / Recharts |
| **Backend (IPC)** | Node.js, TypeORM, SQLite |
| **Database**     | SQLite (with TypeORM migrations) |
| **Printing**     | `escpos`, raw TCP, system printing commands (Windows / Linux) |
| **Notifications** | Nodemailer (SMTP), Twilio (SMS) |
| **Build & Packaging** | Vite, electron-builder (NSIS for Windows, DMG for macOS, AppImage/Deb for Linux) |

---

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm
- Git

### Clone & Install
```bash
git clone https://github.com/CyberArcenal/debtify.git
cd debtify
npm install
```

### Development
```bash
npm run dev
```
This will start the Vite dev server and launch the Electron app in development mode.

### Database Migrations
```bash
npm run migration:generate   # generate a new migration from entity changes
npm run migration:run        # run pending migrations
```

### Build for Production
```bash
# Windows
npm run dist:win

# macOS
npm run dist:mac

# Linux
npm run dist:linux
```
The installers will be placed in the `release/` directory.

---

## 🗂️ Project Structure

```
debt-management/
├── src/
│   ├── main/                # Electron main process
│   │   ├── db/              # Data source & migrations
│   │   ├── entities/        # TypeORM entities
│   │   ├── ipc/             # IPC handlers (debt, borrower, group, loanApp, etc.)
│   │   ├── services/        # Business logic (DebtService, GroupService, ...)
│   │   └── index.js         # Main entry point
│   ├── renderer/            # React frontend
│   │   ├── api/             # API clients (IPC wrappers)
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components (debtors, loans, reports, settings)
│   │   ├── contexts/        # React contexts (settings, theme)
│   │   ├── utils/           # Helpers, formatters, dialogs
│   │   └── main.tsx         # React entry
│   ├── entities/            # Shared entity definitions (used by both main & renderer types)
│   └── utils/               # Shared utilities (logger, auditLogger, etc.)
├── migrations/              # TypeORM migration files
├── build/                   # Icons and build resources
├── release/                 # Generated installers
├── package.json
└── README.md
```

---

## 🔧 Configuration

All system settings are stored in the database table `system_settings`. You can modify them via the **Settings** page in the app. Key categories:

- **General** – company name, timezone, currency, auto‑logout, date format.
- **Collections** – default interest/penalty rates, auto‑penalty, reminder days.
- **Loans** – partial payments, early payment discounts, amortization type.
- **Notifications** – email/SMTP, SMS/Twilio, reminder schedules.
- **Reports** – export formats, backup schedule, retention days.
- **Integrations** – accounting API, credit bureau API, webhooks.
- **Audit & Security** – audit log retention, log events, MFA for admin.

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/your-feature`.
3. Commit your changes: `git commit -m 'Add some feature'`.
4. Push to the branch: `git push origin feature/your-feature`.
5. Open a Pull Request.

Please ensure your code adheres to the existing ESLint configuration and includes appropriate tests (where applicable).

---

## 📄 License

This project is proprietary software. For commercial licensing inquiries, please contact:

**CyberArcenal** – [cyberarcenal1@gmail.com](mailto:cyberarcenal1@gmail.com)

---

## 📧 Contact

- Author: CyberArcenal
- Email: cyberarcenal1@gmail.com
- GitHub: [CyberArcenal](https://github.com/CyberArcenal)

---

## 🙏 Acknowledgements

- [Electron](https://www.electronjs.org/)
- [React](https://reactjs.org/)
- [TypeORM](https://typeorm.io/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)
- [Chart.js](https://www.chartjs.org/) / [Recharts](https://recharts.org/)

---

*Debtify – Helping you stay on top of collections, one payment at a time.*