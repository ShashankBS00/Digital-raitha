# Digital Raitha Deployment Checklist

This checklist covers deployment steps independent of any hosting provider.

## Pre-deployment Checklist

### 1. Code Preparation
- [ ] All code is committed and pushed to the repository
- [ ] `package.json` has correct build scripts
- [ ] Environment variables are documented
- [ ] API endpoints are properly configured
- [ ] All dependencies are listed in `package.json`

### 2. Configuration Files
- [ ] `vite.config.js` is configured for production
- [ ] `404.html` exists for custom error pages
- [ ] `robots.txt` exists for SEO

### 3. Environment Variables
- [ ] `VITE_API_BASE_URL` - Base URL for backend API (optional for relative `/api`)
- [ ] `VITE_WEATHER_API_KEY` - OpenWeatherMap API key
- [ ] `REACT_APP_FIREBASE_API_KEY` - Firebase API key
- [ ] `REACT_APP_FIREBASE_AUTH_DOMAIN` - Firebase auth domain
- [ ] `REACT_APP_FIREBASE_PROJECT_ID` - Firebase project ID
- [ ] `REACT_APP_FIREBASE_STORAGE_BUCKET` - Firebase storage bucket
- [ ] `REACT_APP_FIREBASE_MESSAGING_SENDER_ID` - Firebase messaging sender ID
- [ ] `REACT_APP_FIREBASE_APP_ID` - Firebase app ID
- [ ] `REACT_APP_FIREBASE_MEASUREMENT_ID` - Firebase measurement ID
- [ ] `REACT_APP_GOOGLE_MAPS_API_KEY` - Google Maps API key

## Deployment Steps

### 1. Hosting Setup
- [ ] Connect Git repository to your hosting provider
- [ ] Configure build settings:
  - Build command: `npm run build`
  - Publish directory: `dist`
- [ ] Set environment variables in your hosting platform

### 2. Backend Configuration
- [ ] Set `VITE_API_BASE_URL` to the backend origin if frontend and backend are on different domains
- [ ] Ensure backend has proper CORS configuration
- [ ] Verify API endpoints are reachable from the deployed frontend

### 3. Domain and SSL
- [ ] Configure custom domain (if needed)
- [ ] Verify SSL certificate is active
- [ ] Update DNS records as needed

### 4. Testing
- [ ] Test build locally: `npm run build`
- [ ] Verify all pages load correctly
- [ ] Test API functionality
- [ ] Check mobile responsiveness
- [ ] Verify Firebase integration
- [ ] Test Google Maps integration

## Post-deployment Checklist

### 1. Monitoring
- [ ] Configure error tracking
- [ ] Set up performance monitoring
- [ ] Configure uptime monitoring

### 2. SEO and Performance
- [ ] Submit sitemap to search engines
- [ ] Verify robots.txt is working
- [ ] Test page load speeds
- [ ] Optimize images if needed
- [ ] Check accessibility compliance

### 3. Security
- [ ] Verify HTTPS is working
- [ ] Review Firebase security rules
- [ ] Verify API keys are properly secured

## Support Resources

- Vite Documentation: https://vitejs.dev/
- Firebase Documentation: https://firebase.google.com/docs/
- React Documentation: https://reactjs.org/
