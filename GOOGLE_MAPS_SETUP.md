# Google Maps API Configuration

## Current Status
The Google Maps API key is configured in `.env.local` and is ready for production use.

## Production Deployment Setup

To enable Google Maps on your production domain, you need to configure API restrictions in Google Cloud Console:

### Steps:

1. **Go to Google Cloud Console**
   - Navigate to: https://console.cloud.google.com/apis/credentials

2. **Select your API Key**
   - Find the API key: `AIzaSyBaRUEYfZ-zp0XnPEZpQvPA48IzavkSMdY`
   - Click to edit

3. **Configure Application Restrictions**
   - Under "Application restrictions", select **HTTP referrers (websites)**
   - Add your allowed domains:
     - `http://localhost:3000/*` (for local development)
     - `https://yourdomain.com/*` (replace with your production domain)
     - `https://www.yourdomain.com/*` (if using www subdomain)
     - `https://*.vercel.app/*` (if deploying to Vercel)
     - `https://*.netlify.app/*` (if deploying to Netlify)

4. **Configure API Restrictions**
   - Under "API restrictions", select **Restrict key**
   - Enable the following APIs:
     - Maps JavaScript API
     - Places API
     - Geocoding API
     - Distance Matrix API

5. **Save Changes**

## Environment Variables

Make sure these are set in your production environment:

```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyBaRUEYfZ-zp0XnPEZpQvPA48IzavkSMdY
```

## Map Dimensions

Maps are sized at 1.5x the original dimensions:
- **Homepage**: 675px height
- **Session & Vote pages**: 900px height
- **Width**: 100% (responsive)

All maps maintain proper responsive behavior and fit within the page layout.
