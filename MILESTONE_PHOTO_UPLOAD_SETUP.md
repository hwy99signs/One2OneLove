# 📸 Milestone Photo Upload Setup Guide

This guide will help you set up photo uploads for the Relationship Milestones feature using Supabase Storage.

## 🗄️ What This Creates

- **Storage Bucket**: `milestone-photos` (public, 5MB limit per file)
- **Allowed Formats**: JPEG, JPG, PNG, GIF, WebP
- **Organization**: Photos stored by user ID and milestone ID
- **Security**: Users can only upload/delete their own photos

## 🚀 Setup Instructions

### Step 1: Create Storage Bucket in Supabase

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project
   - Click **SQL Editor** in the left sidebar

2. **Run the Storage Setup SQL**
   - Click **New query**
   - Copy the contents of `supabase-milestones-storage-setup.sql`
   - Paste into SQL Editor
   - Click **Run**

3. **Verify Bucket Created**
   - Go to **Storage** in the left sidebar
   - You should see `milestone-photos` bucket
   - Click on it to view settings

### Step 2: Verify Storage Policies

1. In **Storage** → **Policies** (or in SQL Editor, run):
   ```sql
   SELECT * FROM storage.policies WHERE bucket_id = 'milestone-photos';
   ```

2. You should see 4 policies:
   - ✅ Users can upload milestone photos
   - ✅ Users can view milestone photos
   - ✅ Users can update own milestone photos
   - ✅ Users can delete own milestone photos

### Step 3: Test Photo Upload

1. **Start your app**: `npm run dev`
2. **Navigate to**: Relationship Milestones page
3. **Click**: Add Milestone
4. **Upload a photo** using the upload area
5. **Save the milestone**

### Step 4: Verify Upload in Supabase

1. Go to **Storage** → `milestone-photos`
2. You should see a folder with your user ID
3. Inside, your uploaded photo(s) should appear

## 📂 File Organization

Photos are organized in this structure:
```
milestone-photos/
└── {user_id}/
    ├── {milestone_id}/
    │   ├── photo1.jpg
    │   └── photo2.jpg
    └── standalone-photo.jpg
```

## 💻 Usage in Code

The service functions are already integrated. Here's how they work:

### Upload Single Photo
```javascript
import { uploadMilestonePhoto } from '@/lib/milestonesService';

const file = event.target.files[0];
const photoUrl = await uploadMilestonePhoto(file, milestoneId);
// Returns: https://your-project.supabase.co/storage/v1/object/public/milestone-photos/user-id/photo.jpg
```

### Upload Multiple Photos
```javascript
import { uploadMilestonePhotos } from '@/lib/milestonesService';

const files = Array.from(event.target.files);
const photoUrls = await uploadMilestonePhotos(files, milestoneId);
// Returns: ['url1.jpg', 'url2.jpg', ...]
```

### Delete Photo
```javascript
import { deleteMilestonePhoto } from '@/lib/milestonesService';

await deleteMilestonePhoto(photoUrl);
```

### Delete Multiple Photos
```javascript
import { deleteMilestonePhotos } from '@/lib/milestonesService';

await deleteMilestonePhotos([url1, url2, url3]);
```

## 🎨 Integrated Components

The photo upload is already integrated in:
- ✅ `MilestoneForm.jsx` - Upload photos when creating/editing milestones
- ✅ `milestonesService.js` - Backend upload/delete functions
- ✅ Database - Photos stored in `media_urls` array field

## 🔐 Security Features

1. **Authentication Required**: Only logged-in users can upload
2. **User Isolation**: Users can only access their own photos
3. **File Type Validation**: Only image formats allowed
4. **Size Limit**: 5MB per file
5. **Public URLs**: Photos are publicly viewable (good for sharing)

## ⚙️ Configuration

To change storage settings, edit the SQL:

### Change File Size Limit
```sql
-- Change from 5MB to 10MB
UPDATE storage.buckets 
SET file_size_limit = 10485760 
WHERE id = 'milestone-photos';
```

### Add More File Types
```sql
UPDATE storage.buckets 
SET allowed_mime_types = ARRAY[
  'image/jpeg', 'image/jpg', 'image/png', 
  'image/gif', 'image/webp', 'image/heic'
]
WHERE id = 'milestone-photos';
```

### Make Bucket Private
```sql
UPDATE storage.buckets 
SET public = false 
WHERE id = 'milestone-photos';
```
Note: If you make it private, you'll need to generate signed URLs for access.

## 🐛 Troubleshooting

### Issue: "Failed to upload photos"
**Solutions**:
1. Check browser console for specific error
2. Verify user is logged in
3. Check file size (must be < 5MB)
4. Verify file type is image
5. Check Storage policies are active

### Issue: Photos not showing
**Solutions**:
1. Check the URL is correct
2. Verify bucket is public
3. Check browser network tab for 404 errors
4. Ensure RLS policies allow SELECT

### Issue: "Storage bucket not found"
**Solution**: 
1. Go to Supabase Dashboard → Storage
2. Manually create `milestone-photos` bucket if SQL didn't work
3. Set it to Public
4. Re-run the policies SQL

### Issue: Can't delete photos
**Solutions**:
1. Check user owns the photo (check user_id in path)
2. Verify delete policy is active
3. Check browser console for errors

## 📊 Storage Limits

**Supabase Free Tier**:
- 1GB total storage
- Unlimited bandwidth

**Pro Tier**:
- 100GB storage (+ $0.021/GB over)
- Unlimited bandwidth

Monitor usage in: **Settings** → **Usage**

## 🎯 Best Practices

1. **Compress images** before upload (frontend compression)
2. **Validate file types** client-side before uploading
3. **Show upload progress** to improve UX
4. **Clean up unused photos** when milestones are deleted
5. **Use thumbnails** for better performance

## 🔄 Advanced: Image Optimization

To add automatic image optimization:

```javascript
// Example: Resize image before upload
async function compressImage(file, maxWidth = 1920) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ratio = maxWidth / img.width;
        canvas.width = maxWidth;
        canvas.height = img.height * ratio;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob((blob) => {
          resolve(new File([blob], file.name, { type: 'image/jpeg' }));
        }, 'image/jpeg', 0.9);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// Use it:
const compressedFile = await compressImage(originalFile);
await uploadMilestonePhoto(compressedFile, milestoneId);
```

## ✅ Setup Checklist

- [ ] Run SQL script in Supabase SQL Editor
- [ ] Verify bucket created in Storage section
- [ ] Check 4 RLS policies are active
- [ ] Test upload in your app
- [ ] Verify photos appear in Storage
- [ ] Test deletion functionality
- [ ] Monitor storage usage

---

**Photo Upload Setup Complete! 📸**

Your milestones can now store beautiful memories with photos!

