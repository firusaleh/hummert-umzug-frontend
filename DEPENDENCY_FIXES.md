# Frontend Dependency Fixes

## Date: 19.5.2025

### Summary

Fixed missing dependencies in the frontend package.json and corrected import issues in components.

### Missing Dependencies Added

1. **date-fns** (^3.6.0)
   - Used in: `src/services/utils.js`, `src/pages/umzuege/UmzuegeList.paginated.jsx`, `src/components/files/FileList.jsx`
   - Purpose: Date formatting and manipulation utilities

2. **dompurify** (^3.1.5)
   - Used in: `src/services/utils.js`
   - Purpose: Sanitize HTML to prevent XSS attacks

3. **socket.io-client** (^4.8.1)
   - Used in: `src/services/websocket.js`
   - Purpose: WebSocket client for real-time communication

### Component Fixes

#### RateLimitDashboard Component
**File**: `src/components/admin/RateLimitDashboard.jsx`

**Issue**: Component was using incorrect shadcn/ui style imports (`@/components/ui/*`) that don't exist in this project.

**Fix**: Replaced all shadcn/ui imports with Material-UI components:
- `@/components/ui/card` → `@mui/material/Card`
- `@/components/ui/alert` → `@mui/material/Alert`
- `@/components/ui/button` → `@mui/material/Button`
- `@/components/ui/badge` → `@mui/material/Chip`
- Fixed import path for api service: `@/services/api` → `../../services/api`

### Installation Required

After these changes, run:
```bash
npm install
```

This will install the newly added dependencies:
- date-fns
- dompurify
- socket.io-client

### Verification

To verify all dependencies are correctly installed:
```bash
npm ls date-fns dompurify socket.io-client
```

### Notes

- All imports now use relative paths instead of the `@/` alias which wasn't configured
- The RateLimitDashboard component now uses Material-UI components consistent with the rest of the application
- The application already has Material-UI, lucide-react, and recharts installed, so those imports remain unchanged