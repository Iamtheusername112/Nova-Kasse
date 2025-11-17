# Session Management Documentation

## Overview

The Nova Kasse banking app implements comprehensive session management with automatic token refresh, session expiration, and secure logout functionality.

## Features

### ✅ Implemented Features

1. **Session Persistence**
   - Sessions are stored in localStorage
   - Automatic token refresh
   - Session state synchronized across tabs

2. **Session Expiration**
   - Default: 7 days (configurable)
   - Automatic expiration check every 5 minutes
   - Auto-logout on expiration

3. **Secure Logout**
   - Clears Supabase session
   - Removes all localStorage data
   - Clears cookies
   - Forces page reload to clear cache
   - Redirects to login page

4. **Session Validation**
   - Checks session validity on app load
   - Validates session periodically
   - Handles expired sessions gracefully

## Configuration

### Session Expiration

Default session expiration is 7 days. To change it:

```javascript
import { setSessionExpiration } from "@/lib/utils/session";

// Set to 14 days
setSessionExpiration(14);
```

### Supabase Client Configuration

The Supabase client is configured with:
- `persistSession: true` - Sessions persist across page reloads
- `autoRefreshToken: true` - Tokens refresh automatically
- `detectSessionInUrl: true` - Detects sessions in URL (for OAuth)
- Custom storage key: `nova-kasse-auth`

## Usage

### Basic Logout

```javascript
import { useAuth } from "@/contexts/AuthContext";

function MyComponent() {
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
  };

  return <button onClick={handleLogout}>Sign Out</button>;
}
```

### Logout from All Devices

```javascript
const { signOut } = useAuth();

// Sign out from all devices (requires backend implementation)
await signOut({ signOutFromAllDevices: true });
```

### Check Session Status

```javascript
const { user, session, loading } = useAuth();

if (loading) {
  return <div>Loading...</div>;
}

if (!user) {
  return <div>Not logged in</div>;
}

// User is logged in
console.log("Session expires at:", new Date(session.expires_at * 1000));
```

### Get Active Sessions

```javascript
const { getActiveSessions } = useAuth();

const sessions = await getActiveSessions();
console.log("Active sessions:", sessions);
```

## Session Storage

### What Gets Stored

1. **Supabase Session** (`nova-kasse-auth`)
   - Access token
   - Refresh token
   - User data
   - Expiration time

2. **Custom Session Data** (`nova-kasse-session`)
   - Session timestamp
   - Used for expiration checking

3. **Session Configuration** (`nova-kasse-session-timeout`)
   - Expiration duration in milliseconds

### What Gets Cleared on Logout

- All Supabase session data
- All `nova-kasse-*` localStorage keys
- All cookies
- Application state

## Security Features

1. **Automatic Token Refresh**
   - Tokens refresh before expiration
   - Seamless user experience

2. **Session Expiration**
   - Sessions expire after configured time
   - Automatic logout on expiration

3. **Secure Storage**
   - Uses localStorage (consider httpOnly cookies for production)
   - Custom storage key to avoid conflicts

4. **Complete Cleanup**
   - All data cleared on logout
   - Hard page reload to clear cache
   - Prevents data leakage

## Session Lifecycle

1. **Sign In**
   - User authenticates
   - Session created and stored
   - Timestamp recorded
   - Auto-refresh starts

2. **Active Session**
   - Token refreshes automatically
   - Session validated every 5 minutes
   - User data available

3. **Session Expiration**
   - Checked every 5 minutes
   - If expired, user is logged out
   - Redirected to login

4. **Sign Out**
   - Session revoked
   - All data cleared
   - Page reloaded
   - Redirected to login

## API Reference

### `signOut(options?)`

Signs out the current user and clears all session data.

**Parameters:**
- `options.signOutFromAllDevices` (boolean, optional) - Sign out from all devices (requires backend)

**Returns:**
- `{ success: boolean, error?: string }`

### `getActiveSessions()`

Gets list of active sessions (currently returns current session only).

**Returns:**
- `Promise<Array<SessionInfo>>`

### `revokeSession(sessionId)`

Revokes a specific session (requires backend implementation).

**Parameters:**
- `sessionId` (string) - ID of session to revoke

**Returns:**
- `Promise<{ success: boolean, error?: string }>`

## Troubleshooting

### Session Not Persisting

1. Check browser localStorage is enabled
2. Verify Supabase credentials in `.env.local`
3. Check browser console for errors

### Session Expiring Too Quickly

1. Check session expiration setting:
   ```javascript
   import { getSessionExpiration } from "@/lib/utils/session";
   console.log("Expiration:", getSessionExpiration());
   ```

2. Adjust expiration:
   ```javascript
   setSessionExpiration(14); // 14 days
   ```

### Logout Not Working

1. Check browser console for errors
2. Verify Supabase connection
3. Check network tab for failed requests

## Future Enhancements

- [ ] Backend API for multi-device session management
- [ ] Session activity logging
- [ ] Suspicious activity detection
- [ ] Remember me functionality
- [ ] Session timeout warnings
- [ ] Device fingerprinting for security

