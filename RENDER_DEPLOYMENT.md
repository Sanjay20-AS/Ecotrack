# EcoTrack Deployment on Render

This guide covers deploying the EcoTrack application on **Render** (frontend on Vercel, backend on Render's free tier).

## Why Render?

✅ Free tier (500 hours/month = always-on)  
✅ Built-in PostgreSQL database  
✅ Docker deployment support  
✅ Auto-deploys on GitHub push  
✅ No credit card required initially  

---

## Part 1: Deploy Backend on Render

### Step 1: Create Render Account

1. Go to https://render.com
2. Sign up with GitHub (recommended for easier deployment)
3. Authorize Render to access your repositories

### Step 2: Create Web Service

1. **Dashboard** → **New +** → **Web Service**
2. **Connect repository** - Select your EcoTrack repo
3. **Build settings:**
   - **Name**: `ecotrack-backend`
   - **Environment**: `Docker`
   - **Region**: `Oregon` (or closest to you)
   - **Plan**: `Free`

### Step 3: Add Environment Variables

In Render dashboard, go to your service → **Environment**:

```
PORT=8080
SPRING_PROFILES_ACTIVE=prod
DATABASE_URL=(auto-set by Render)
DATABASE_USERNAME=ecotrack
DATABASE_PASSWORD=your-secure-password-here
GEOAPIFY_KEY=your-geoapify-api-key
SPRING_MAIL_HOST=smtp.gmail.com
SPRING_MAIL_PORT=587
SPRING_MAIL_USERNAME=your-email@gmail.com
SPRING_MAIL_PASSWORD=your-16-char-app-password
SPRING_MAIL_PROPERTIES_MAIL_SMTP_AUTH=true
SPRING_MAIL_PROPERTIES_MAIL_SMTP_STARTTLS_ENABLE=true
SPRING_MAIL_PROPERTIES_MAIL_SMTP_STARTTLS_REQUIRED=true
SPRING_MAIL_FROM=noreply@ecotrack.app
CORS_ORIGINS=https://your-vercel-domain.vercel.app
```

### Step 4: Create PostgreSQL Database

1. **Dashboard** → **New +** → **PostgreSQL**
2. **Name**: `ecotrack-db`
3. **Region**: Same as web service (Oregon)
4. **Plan**: `Free`

Render will automatically provide `DATABASE_URL` to your web service.

### Step 5: Deploy

1. Click **Create Web Service**
2. Render begins building (5-10 minutes)
3. Check **Deployments** tab for build logs
4. Once deployed, note your URL: `https://ecotrack-backend-xxxx.onrender.com`

### Step 6: Verify Deployment

```bash
# Test API endpoint
curl https://ecotrack-backend-xxxx.onrender.com/api/waste

# Check if running
curl -I https://ecotrack-backend-xxxx.onrender.com
```

---

## Part 2: Deploy Frontend on Vercel

(Same as before, but use Render backend URL)

### Step 1: Add Backend URL to Vercel

In your Vercel project settings → **Environment Variables**:

```
VITE_API_URL=https://ecotrack-backend-xxxx.onrender.com
```

### Step 2: Redeploy

Vercel will auto-redeploy or you can manually trigger:
1. **Deployments** tab
2. **Redeploy** on latest commit

---

## Configuration Details

### Why PostgreSQL?

- Render free tier includes PostgreSQL
- Better for production than MySQL
- All drivers already in `pom.xml`

### Database Connection

Render auto-provides `DATABASE_URL` in format:
```
postgresql://user:password@host:port/database
```

Spring Boot automatically converts this to JDBC format via `application-prod.properties`:
```properties
spring.datasource.url=${DATABASE_URL}
spring.datasource.driver-class-name=org.postgresql.Driver
```

### Hibernation Mode

⚠️ **Important for Free Tier:**
- Free tier services spin down after 15 minutes of inactivity
- They wake up on first request (takes 30 seconds)
- Add a monitor (Render provides free uptime monitoring) to keep it alive

To enable monitoring:
1. **Dashboard** → Your service → **Settings**
2. Scroll to **Monitoring**
3. Enable **Health Check** with endpoint: `/api/waste`

---

## Testing Deployment

### 1. Test Backend API

```bash
# Check if backend is running
curl https://your-backend.onrender.com/api/waste

# Should return: [] (empty array or error)
# This confirms backend is accessible
```

### 2. Test Frontend

```
https://your-project.vercel.app
```

### 3. Check Network Requests

1. Open browser DevTools (F12)
2. Go to **Network** tab
3. Login on your app
4. Verify API calls go to Render backend URL (not localhost)

### 4. Test Email Notifications

1. Go to Settings → Enable email notifications
2. Create/update waste entry
3. Check email inbox (may take a few seconds)

---

## Troubleshooting

### Backend won't deploy

**Check build logs:**
1. Go to **Deployments** tab
2. Click on failed deployment
3. View **Deploy Log**

**Common issues:**
- Missing environment variables → Add all vars from Step 3
- Java version mismatch → Should be 21 (check Dockerfile)
- Missing dependencies → Ensure `pom.xml` has all drivers

### "Cannot load driver class: org.postgresql.Driver"

PostgreSQL driver is already in `pom.xml`. If error occurs:
1. Verify `application-prod.properties` uses PostgreSQL dialect
2. Rebuild and push to GitHub
3. Render will auto-redeploy

### API calls return 502 Bad Gateway

- Backend might still be starting (takes 30 seconds on first wake-up)
- Check Render service is running (green status)
- Check environment variables are set correctly
- Verify DATABASE_URL is properly configured

### Database connection timeout

- Check PostgreSQL service status on Render dashboard
- Ensure DATABASE_USERNAME and DATABASE_PASSWORD are set
- PostgreSQL might need a moment to initialize (first deploy)

### Emails not sending

- Verify `SPRING_MAIL_USERNAME` and `SPRING_MAIL_PASSWORD` are set
- Use Gmail [App Password](https://support.google.com/accounts/answer/185833), not regular password
- Check Render logs for mail errors

---

## Free Tier Limits

| Resource | Free Tier Limit |
|----------|-----------------|
| **Web Service** | 500 compute hours/month (infinite for always-on) |
| **PostgreSQL** | 1 instance, 256MB storage |
| **Bandwidth** | Shared, fair use |
| **Build time** | 500 hours/month |

For production scaling:
- Upgrade Web Service to paid plan
- Upgrade PostgreSQL to dedicated tier

---

## Next Steps

1. ✅ Deploy backend on Render
2. ✅ Deploy frontend on Vercel
3. ✅ Enable health check monitoring (prevents hibernation)
4. 🔐 Set up custom domain
5. 📊 Monitor performance on Render dashboard
6. 🚀 Scale as needed

---

## Useful Links

- **Render Dashboard**: https://dashboard.render.com
- **Render Docs**: https://render.com/docs
- **PostgreSQL Connection**: Check Render database settings
- **Monitor Status**: https://www.renderstatus.com

---

## Comparison: Railway vs Render

| Feature | Railway | Render |
|---------|---------|--------|
| Free Trial | 5 credit/month | Forever free |
| Build Limits | Limited to trial | 500 hrs/month |
| Always On | After trial ends | Yes, on free |
| Hibernation | No | Yes (15 min inactive) |
| Database | MySQL addon | PostgreSQL included |
| Price | ~$5/month | $7/month (Pro) |

Render is better for **long-term free hosting** and **learning projects**. Railway is better for **paid production** deployments.

