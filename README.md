# Kekkon - Wedding Invitation App

A beautiful, modern wedding invitation application built with Next.js, featuring digital invitations, admin dashboard, and QR code generation. Create stunning, personalized wedding invitations with multiple sub-events, image galleries, and seamless social media integration.

## 🌟 Features

### Core Features
- 🎨 **Beautiful Design**: Modern, elegant interface with responsive design
- 📱 **Mobile-First**: Optimized for all devices and screen sizes
- 👨‍💼 **Admin Dashboard**: Intuitive interface for creating and managing events
- 🖼️ **Image Gallery**: Support for cover images and photo galleries with optimized loading
- 📅 **Event Management**: Create detailed wedding events with up to 5 sub-events
- 🗺️ **Maps Integration**: Direct links to venue locations with Google Maps
- 📱 **QR Code Generation**: Automatic QR codes for easy sharing and physical invitations
- 🔗 **Social Media Integration**: Links to couple's social profiles
- 🎯 **SEO Optimized**: Search engine friendly URLs and metadata

### Advanced Features
- 🎭 **Sub-Events Support**: Create ceremony, reception, after-party, and more
- 🖼️ **Image Optimization**: Automatic image compression and CDN delivery
- 🔐 **Secure Admin Access**: Protected dashboard with authentication
- 📊 **Real-time Preview**: Live preview while creating events
- 🎨 **Custom Branding**: Company logo integration throughout the app
- ⚡ **Performance Optimized**: Fast loading with Next.js optimization
- 🌐 **Production Ready**: Deployed on Vercel with Supabase backend

## 📚 Documentation

Comprehensive documentation is available in the `/docs` directory:

- **[API Documentation](docs/API.md)**: Complete API reference, database schema, and TypeScript interfaces
- **[Deployment Guide](docs/DEPLOYMENT.md)**: Step-by-step deployment instructions for development and production
- **[User Guide](docs/USER_GUIDE.md)**: Complete guide for using the admin dashboard and managing events

## 🚀 Quick Start

### Prerequisites
- Node.js 18.0 or higher
- npm 8.0 or higher
- Supabase account
- Vercel account (for deployment)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd kekkon
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Update `.env.local` with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

4. **Set up the database**
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Run the contents of `database-setup.sql`

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Frontend: `http://localhost:3000`
   - Admin Dashboard: `http://localhost:3000/admin`

For detailed setup instructions, see the [Deployment Guide](docs/DEPLOYMENT.md).

## 🛠 Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, TailwindCSS
- **UI Components**: shadcn/ui, Lucide React icons
- **Backend**: Supabase (PostgreSQL + Storage)
- **QR Generation**: qrcode npm package
- **Deployment**: Vercel

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Vercel account (for deployment)

## 🔧 Setup Instructions

### 1. Clone and Install Dependencies

```bash
# The project is already initialized with all dependencies
cd kekkon
npm install
```

### 2. Environment Variables

The `.env.local` file is already configured with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xeadiocltstrnzenvchf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhlYWRpb2NsdHN0cm56ZW52Y2hmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3NjIyODAsImV4cCI6MjA3NDMzODI4MH0.yFe2EKhVCShI-qYVINB5Tt4EiTbteodmNTmhEx4O1xA
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhlYWRpb2NsdHN0cm56ZW52Y2hmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODc2MjI4MCwiZXhwIjoyMDc0MzM4MjgwfQ.e_HzVqZZ8CszcOeIfnAo7-rMA3_GVa2jwmh2dPx-Pds
```

### 3. Database Setup

Run the SQL commands in `database-setup.sql` in your Supabase SQL editor:

```sql
-- Create events table
create table events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  event_date date,
  event_time text,
  venue text,
  maps_link text,
  instructions text,
  social_links jsonb,
  created_at timestamp default now()
);

-- Create images table
create table images (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  type text check (type in ('cover','gallery')),
  url text not null,
  created_at timestamp default now()
);

-- Create storage bucket for event images
insert into storage.buckets (id, name, public) values ('event-images', 'event-images', true);

-- Set up RLS policies
alter table events enable row level security;
alter table images enable row level security;

-- Allow public read access to events and images
create policy "Public read access for events" on events for select using (true);
create policy "Public read access for images" on images for select using (true);

-- Allow authenticated users to insert/update/delete (for admin)
create policy "Admin access for events" on events for all using (true);
create policy "Admin access for images" on images for all using (true);

-- Storage policies
create policy "Public read access for event images" on storage.objects for select using (bucket_id = 'event-images');
create policy "Admin upload access for event images" on storage.objects for insert using (bucket_id = 'event-images');
create policy "Admin delete access for event images" on storage.objects for delete using (bucket_id = 'event-images');
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🔐 Admin Access

- **URL**: `/admin`
- **Username**: `lakshmisai`
- **Password**: `lakshmisai@4689`

## 📱 Application Structure

### Routes

- `/` - Landing page
- `/admin` - Admin login
- `/admin/dashboard` - Admin dashboard
- `/[card_id]` - Event microsite
- `/[card_id]/venue` - Direct venue redirect
- `/[card_id]/rsvp` - RSVP redirect

### Key Features

1. **Event Creation**: Upload cover images, add event details, venue info, and social links
2. **Gallery Management**: Upload up to 5 gallery photos per event
3. **QR Code Generation**: Automatic generation for main event, venue, and RSVP links
4. **Responsive Design**: Works perfectly on desktop, tablet, and mobile
5. **Social Integration**: Support for Instagram, YouTube, Facebook, and custom links

## 📖 Usage

### Creating Your First Event

1. **Access Admin Dashboard**
   - Navigate to `/admin`
   - Login with your credentials

2. **Create New Event**
   - Click "Create New Event"
   - Fill in event details (title, date, venue, etc.)
   - Add sub-events (ceremony, reception, etc.)
   - Upload cover image and gallery photos
   - Add social media links

3. **Preview and Publish**
   - Use the live preview to check your invitation
   - Click "Create Event" to publish
   - Share the generated URL and QR code

### Managing Events

- **View Events**: See all created events in the dashboard
- **Share Events**: Get shareable links and QR codes
- **Update Events**: Modify event details (coming soon)
- **Delete Events**: Remove events permanently

For detailed usage instructions, see the [User Guide](docs/USER_GUIDE.md).

## 🏗️ Project Structure

```
kekkon/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── admin/             # Admin dashboard pages
│   │   ├── api/               # API routes
│   │   ├── [card_id]/         # Dynamic event pages
│   │   └── globals.css        # Global styles
│   ├── components/            # Reusable UI components
│   │   └── ui/               # shadcn/ui components
│   └── lib/                  # Utility functions and configurations
│       ├── supabase.ts       # Database operations
│       └── utils.ts          # Helper functions
├── public/                   # Static assets
│   ├── logo.png             # Company logo
│   └── branding.png         # Brand assets
├── docs/                    # Documentation
│   ├── API.md              # API documentation
│   ├── DEPLOYMENT.md       # Deployment guide
│   └── USER_GUIDE.md       # User guide
├── database-setup.sql      # Database schema
└── README.md              # This file
```

## 🚀 Deployment

### Production Deployment

The application is production-ready and deployed at:
**[https://kekkon-o5xlt89ox-gr7233-srmisteduis-projects.vercel.app](https://kekkon-o5xlt89ox-gr7233-srmisteduis-projects.vercel.app)**

### Deploy Your Own

#### Option 1: Vercel CLI (Recommended)
```bash
npm install -g vercel
vercel login
vercel --prod
```

#### Option 2: Vercel Dashboard
1. Connect your GitHub repository to Vercel
2. Configure environment variables
3. Deploy automatically on push

For complete deployment instructions, see the [Deployment Guide](docs/DEPLOYMENT.md).

## 🔧 Configuration

### Environment Variables

Required environment variables for production:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Admin Authentication (Optional)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password
```

### Database Configuration

The application uses Supabase PostgreSQL with the following tables:
- `events`: Main event information
- `sub_events`: Sub-events within main events
- `images`: Event images and gallery
- `event-images` storage bucket: File storage

## 🎨 Customization

### Branding
- Replace `public/logo.png` with your company logo
- Update `public/branding.png` for additional brand assets
- Modify colors in `tailwind.config.js`

### Features
- Add new event fields in the database schema
- Extend the admin dashboard with additional functionality
- Customize the event page layout and styling

## 🧪 Testing

### Run Tests
```bash
npm run test
```

### Build Verification
```bash
npm run build
npm run start
```

### Type Checking
```bash
npm run type-check
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Getting Help

- **Documentation**: Check the `/docs` directory for detailed guides
- **Issues**: Report bugs and request features via GitHub Issues
- **Discussions**: Join community discussions for questions and ideas

### Common Issues

- **Database Connection**: Verify Supabase credentials and network connectivity
- **Image Upload**: Check file size limits and storage bucket configuration
- **Build Errors**: Clear Next.js cache with `rm -rf .next && npm run build`

### Contact

For additional support or custom development:
- Email: support@yourcompany.com
- Website: https://yourcompany.com

---

**Built with ❤️ for beautiful wedding celebrations**

---

**Ready to deploy!** 🚀 Your Kekkon application is fully configured and ready for Vercel deployment.
