# Ship Aggregator Dashboard Frontend

Modern, responsive shipment management dashboard built with Next.js 14, Tailwind CSS, and shadcn/ui.

## Features

- 📊 **KPI Dashboard** - Real-time shipment statistics
- 🗺️ **Dual-Panel Layout** - Shipment list and detailed view
- 🔍 **Advanced Search** - Search and filter shipments by tracking number
- 📱 **Fully Responsive** - Mobile-first design with collapsible sidebar
- 🎨 **Modern UI** - Professional SaaS-style interface
- ⚡ **Performance Optimized** - Minimal re-renders with React hooks
- 📍 **Real-time Tracking** - Timeline view with event tracking

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui
- **Icons**: Lucide React
- **Language**: TypeScript

## Project Structure

```
frontend/
├── app/
│   ├── (dashboard)/          # Protected dashboard routes
│   │   ├── page.tsx         # Main dashboard
│   │   ├── shipments/       # All shipments view
│   │   ├── create/          # Create new shipment
│   │   ├── track/           # Track shipment
│   │   └── layout.tsx       # Dashboard layout with sidebar/navbar
│   ├── auth/                # Authentication pages
│   │   ├── login/
│   │   └── register/
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Root page (redirect)
│   └── globals.css          # Global styles
├── components/
│   ├── ui/                  # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   ├── input.tsx
│   │   ├── tabs.tsx
│   │   ├── separator.tsx
│   │   ├── skeleton.tsx
│   │   └── scroll-area.tsx
│   ├── sidebar.tsx          # Navigation sidebar
│   ├── navbar.tsx           # Top navigation
│   ├── kpi-cards.tsx        # KPI statistics cards
│   ├── shipment-list.tsx    # Shipment list panel
│   └── shipment-details.tsx # Shipment details panel
├── lib/
│   ├── utils.ts             # Utility functions
│   └── mockData.ts          # Mock shipment data
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.js
```

## Getting Started

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### 3. Build for Production

```bash
npm run build
npm start
```

## Pages & Routes

| Route        | Description                                   |
| ------------ | --------------------------------------------- |
| `/`          | Dashboard (KPI cards + Shipment list/details) |
| `/shipments` | All shipments with statistics                 |
| `/create`    | Create new shipment form                      |
| `/track`     | Track shipment by tracking number             |
| `/login`     | Login page                                    |
| `/register`  | Registration page                             |

## Key Components

### Dashboard Layout

- **Sidebar**: Navigation with active route highlighting, mobile-responsive drawer
- **Navbar**: Search bar, notifications, user profile
- **KPI Cards**: Total shipments, in transit, delivered, pending

### Shipment Management

- **ShipmentList**: Scrollable list with status filter tabs
- **ShipmentDetails**: Full tracking information with timeline
- **StatusBadges**: Color-coded status indicators

## Theming

The dashboard uses a professional dark green theme:

- Primary: `#1a5d3a` (Dark Green)
- Primary Light: `#2d7d52`
- Primary Dark: `#0f3f24`
- Background: White / Light Gray

Colors and styles can be customized in `tailwind.config.ts`

## Mock Data

The dashboard comes with mock shipment data. To integrate with your backend API:

1. Update `lib/mockData.ts` to fetch from your API
2. Use the `Shipment` and `ShipmentEvent` interfaces for type safety
3. Replace mock data calls with actual API requests

## Performance Optimizations

- React Server Components ready architecture
- Minimal re-renders with React hooks
- Lazy loading of heavy components
- Optimized image handling
- CSS-in-JS only when needed

## Responsive Breakpoints

- Mobile: < 768px - Full-width layout with drawer sidebar
- Tablet: 768px - 1024px - Two-column layout
- Desktop: > 1024px - Full multi-panel layout

## Future Enhancements

- [ ] Real-time WebSocket updates
- [ ] Export shipment data to CSV/PDF
- [ ] Advanced filtering and search
- [ ] Shipment notifications
- [ ] Customer portal integration
- [ ] Analytics dashboard
- [ ] Dark mode support
- [ ] Multi-language support

## Contributing

Feel free to customize and extend this dashboard for your specific needs!
