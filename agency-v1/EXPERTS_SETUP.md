# Experts Dashboard - Setup Guide

## Cloudinary Configuration

### 1. Create a Cloudinary Account
1. Go to [cloudinary.com](https://cloudinary.com) and sign up for a free account
2. After signing in, go to your Dashboard
3. Copy your "Cloud Name" (e.g., `dxyz123abc`)

### 2. Configure Environment Variables
Add this to your `.env` file:
```bash
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloud-name-here"
```

### 3. Set Up Upload Preset (Optional)
The app uses Cloudinary's default `ml_default` preset, but you can create a custom one:
1. Go to Settings → Upload → Upload presets
2. Create a new "Unsigned" preset
3. Update `components/ui/image-upload.tsx` to use your preset name

## Database Seeding

To populate your database with sample experts for testing:

```bash
npx tsx prisma/seed.ts
```

This will create 3 sample experts with:
- Professional bios
- Social media links  
- Placeholder images (using UI Avatars API)

## Running the Application

### Development
```bash
npm run dev
```

Visit:
- **Admin Dashboard**: `http://localhost:3000/dashboard/experts`
- **Public Page**: `http://localhost:3000/nosotros`

### Production Build
```bash
npm run build
npm start
```

## Features Implemented

✅ **Admin Dashboard**
- Drag-and-drop expert reordering
- Professional form with validation
- Image upload via Cloudinary
- Social links management (LinkedIn, Twitter, GitHub, Website)
- Character limits with counters (Bio: 500, Name/Role: 100)
- Toggle visibility

✅ **Public Page**
- Dynamic expert display from database
- Social media icons with links
- Responsive grid layout
- Fallback for empty database

✅ **Enhanced UX**
- Toast notifications for actions
- Loading states during uploads
- File validation (5MB max, images only)
- Configuration warnings
- Error handling

## Troubleshooting

### "Cloudinary not configured" warning
- Make sure `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` is set in `.env`
- Restart the dev server after adding env variables

### Images not uploading
- Check your Cloudinary dashboard for errors
- Ensure upload preset exists and is "Unsigned" or "Signed" with proper credentials
- Check browser console for errors

### Database errors
- Run `npx prisma generate` to regenerate Prisma Client
- Run `npx prisma migrate dev` to sync schema
