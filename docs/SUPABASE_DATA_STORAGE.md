# How User Data is Stored in Supabase

## Two Storage Locations

When a user signs up, their data is stored in **two places**:

### 1. User Metadata (Always Available)
- **Location**: `auth.users` table → `raw_user_meta_data` column
- **Access**: Available immediately after signup
- **View in Dashboard**: Authentication → Users → Click on user → See "Raw User Meta Data"
- **Access in Code**: `user.user_metadata` or `user.raw_user_meta_data`

### 2. Profiles Table (Optional but Recommended)
- **Location**: `public.profiles` table
- **Access**: Requires creating the table first (see `lib/supabase/setup.sql`)
- **Benefits**: 
  - Easier to query
  - Better for complex queries
  - Can add indexes
  - Can add relationships to other tables

## Setting Up the Profiles Table

### Step 1: Create the Table

1. Go to your Supabase Dashboard
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy and paste the SQL from `lib/supabase/setup.sql`
5. Click "Run" (or press Ctrl+Enter)

### Step 2: Verify the Table

1. Go to "Table Editor" in the left sidebar
2. You should see a `profiles` table
3. It should have columns: id, full_name, phone, date_of_birth, address, city, state, zip_code, country, security_pin, created_at, updated_at

### Step 3: Test Signup

1. Create a new account through the signup form
2. Go to "Table Editor" → `profiles` table
3. You should see a new row with the user's data

## Viewing User Data

### Method 1: In Supabase Dashboard

**User Metadata:**
1. Go to Authentication → Users
2. Click on a user
3. Scroll down to see "Raw User Meta Data"
4. You'll see all the form data there

**Profiles Table:**
1. Go to Table Editor → profiles
2. You'll see all user profiles in a table format

### Method 2: In Your App Code

```javascript
import { useAuth } from "@/contexts/AuthContext";

function MyComponent() {
  const { user } = useAuth();
  
  // Access user metadata
  console.log(user?.user_metadata);
  console.log(user?.user_metadata?.full_name);
  console.log(user?.user_metadata?.phone);
  
  // Or query profiles table
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
}
```

## Troubleshooting

### Data Not Showing Up?

1. **Check if signup completed successfully**
   - Look for success toast message
   - Check browser console for errors

2. **Check user_metadata**
   - Go to Authentication → Users
   - Find your user
   - Check "Raw User Meta Data" section

3. **Check profiles table**
   - Make sure you ran the SQL setup script
   - Check Table Editor → profiles
   - If table doesn't exist, data is still in user_metadata

4. **Check browser console**
   - Open DevTools (F12)
   - Look for any errors during signup
   - Check Network tab for failed requests

### Common Issues

**Issue**: "relation 'profiles' does not exist"
- **Solution**: Run the SQL setup script from `lib/supabase/setup.sql`

**Issue**: "permission denied for table profiles"
- **Solution**: Make sure you ran the GRANT statements in the SQL script

**Issue**: Data in user_metadata but not in profiles table
- **Solution**: Check if the trigger function was created correctly
- Or manually insert: The signup function will try to insert, but if it fails, data is still in user_metadata

## Security Note

⚠️ **Important**: The `security_pin` is currently stored in plain text. For production:

1. Hash the PIN before storing
2. Use bcrypt or similar hashing library
3. Never log or display the PIN
4. Consider using Supabase Vault for sensitive data

Example hashing (add this to your signup function):
```javascript
import bcrypt from 'bcryptjs';

const hashedPin = await bcrypt.hash(securityPin, 10);
// Store hashedPin instead of securityPin
```

