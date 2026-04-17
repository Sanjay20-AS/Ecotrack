# EcoTrack Deployment Guide

This guide explains how to deploy EcoTrack on **Vercel (Frontend) + Railway (Backend)**.

## Prerequisites

- Vercel account (free at https://vercel.com)
- Railway account (free at https://railway.app)
- Git repository (GitHub, GitLab, or Bitbucket)
- GitHub account connected to Vercel

---

## Part 1: Deploy Backend on Railway

### Step 1: Prepare Backend for Railway

1. **Create a GitHub repository** and push your code:
```bash
git add .
git commit -m "Setup deployment configuration"
git push origin main
```

2. **Update `application-prod.properties`** in `backend/src/main/resources/`:

If the file doesn't exist, create it:

```properties
# Production Configuration for Railway

# Server
server.port=${PORT:8080}
server.servlet.context-path=/

# Database - uses Railway's DATABASE_URL
spring.datasource.url=${DATABASE_URL}
spring.datasource.username=${DB_USER}
spring.datasource.password=${DB_PASSWORD}
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

# JPA/Hibernate
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQL8Dialect

# Logging
logging.level.root=INFO
logging.level.com.ecotrack=INFO

# Mail Configuration
spring.mail.host=${SPRING_MAIL_HOST}
spring.mail.port=${SPRING_MAIL_PORT}
spring.mail.username=${SPRING_MAIL_USERNAME}
spring.mail.password=${SPRING_MAIL_PASSWORD}
spring.mail.properties.mail.smtp.auth=${SPRING_MAIL_PROPERTIES_MAIL_SMTP_AUTH}
spring.mail.properties.mail.smtp.starttls.enable=${SPRING_MAIL_PROPERTIES_MAIL_SMTP_STARTTLS_ENABLE}
spring.mail.properties.mail.smtp.starttls.required=${SPRING_MAIL_PROPERTIES_MAIL_SMTP_STARTTLS_REQUIRED}
spring.mail.from=${SPRING_MAIL_FROM}

# Geoapify
geoapify.key=${GEOAPIFY_KEY}

# CORS - Allow Vercel frontend
spring.web.cors.allowed-origins=${CORS_ORIGINS:*}
spring.web.cors.allowed-methods=GET,POST,PUT,DELETE,OPTIONS,PATCH
spring.web.cors.allowed-headers=*
spring.web.cors.allow-credentials=true
spring.web.cors.max-age=3600
```

3. **Update `application.properties`** to use prod profile on Railway:

```properties
# Default: local development
spring.profiles.active=dev

# Database
spring.datasource.url=jdbc:mysql://localhost:3306/ecotrack?useSSL=false&serverTimezone=UTC
spring.datasource.username=root
spring.datasource.password=

# ... rest of dev config
```

### Step 2: Deploy to Railway

1. **Go to [railway.app](https://railway.app)** and sign up/login
2. **Click "New Project"** → **Deploy from GitHub**
3. **Select your repository** and authorize Railway to access it
4. **Select the correct branch** (usually `main`)
5. **Railway detects Dockerfile** automatically

### Step 3: Configure Railway Environment Variables

After deployment starts, Railway will auto-detect the Dockerfile and build the image.

### Step 3: Configure Database

1. **In your Railway project dashboard**: Click **+ Add**
2. Select **Database** → **MySQL**
3. Railway will auto-create a MySQL instance and set the `DATABASE_URL` variable automatically ✅

### Step 4: Add Environment Variables

In Railway project settings, go to **Variables** and add these (DATABASE_URL is auto-set):

```
SPRING_MAIL_HOST=smtp.gmail.com
SPRING_MAIL_PORT=587
SPRING_MAIL_USERNAME=your-email@gmail.com
SPRING_MAIL_PASSWORD=your-app-specific-password
SPRING_MAIL_PROPERTIES_MAIL_SMTP_AUTH=true
SPRING_MAIL_PROPERTIES_MAIL_SMTP_STARTTLS_ENABLE=true
SPRING_MAIL_PROPERTIES_MAIL_SMTP_STARTTLS_REQUIRED=true
SPRING_MAIL_FROM=noreply@ecotrack.app
GEOAPIFY_KEY=your-geoapify-api-key
CORS_ORIGINS=https://your-vercel-domain.vercel.app
DATABASE_USERNAME=root
DATABASE_PASSWORD=your-mysql-password
```

**Important:** Railway's MySQL addon automatically provides `DATABASE_URL` in JDBC format. The backend uses it directly via `spring.datasource.url=${DATABASE_URL}`.

### Step 5: Get Backend URL

Once the build completes (5-10 minutes), Railway provides a public URL:
```
https://ecotrack-production-xyz.railway.app
```

Go to your Railway project → **Deployments** tab to see build progress and logs.

**Save this URL** - you'll need it for Vercel frontend configuration.

---

## Part 2: Deploy Frontend on Vercel

### Step 1: Create Vercel Project

1. **Go to [vercel.com](https://vercel.com)** and sign in with GitHub
2. **Click "Add New Project"**
3. **Import Git Repository** - select your EcoTrack repo
4. **Configure Project:**
   - **Framework Preset**: Vite
   - **Root Directory**: Leave blank (or `./`)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### Step 2: Add Environment Variables

In Vercel Project Settings → **Environment Variables**, add:

```
VITE_API_URL=https://your-railway-backend-url.railway.app
```

**Replace** `https://your-railway-backend-url.railway.app` with the actual Railway backend URL from Step 5 above.

### Step 3: Add Domain (Optional)

1. **Settings** → **Domains**
2. **Add your custom domain** or use the default `*.vercel.app`
3. **Update Railway's `CORS_ORIGINS`** if using custom domain:
   ```
   CORS_ORIGINS=https://your-domain.com,https://your-domain.vercel.app
   ```

### Step 4: Deploy

Vercel auto-deploys on every push to `main` branch. Or manually trigger:
1. **Deployments** tab
2. **Deploy** → Select branch → **Deploy Now**

---

## Testing Deployment

### Frontend (Vercel)
```bash
# Visit your Vercel URL
https://your-project.vercel.app
```

### Backend (Railway)
```bash
# Test API endpoint
curl https://your-railway-backend.railway.app/api/waste

# Check if API is accessible
curl -I https://your-railway-backend.railway.app/api/health
```

### Test API Communication
1. Open browser DevTools → **Network** tab
2. Login on your Vercel app
3. Verify API calls go to your Railway backend (not localhost)

---

## Troubleshooting

### Vercel says "Cannot GET /"
- Ensure `dist` folder is generated
- Check build logs in Vercel Dashboard
- Verify `vite.config.ts` build configuration

### "API connection failed" / CORS errors
- Check Railway backend URL is correct in Vercel env variables
- Verify Railway `CORS_ORIGINS` includes your Vercel domain
- Test API directly: `curl https://backend-url.railway.app/api/waste`

### Railway deployment fails
- Check Railway build logs for errors
- Verify Dockerfile is in root directory
- Ensure `backend/pom.xml` exists
- Check Java version compatibility (JDK 21 required)
- Ensure MySQL driver dependency is in pom.xml: `mysql-connector-j`

### "Cannot load driver class: com.mysql.cj.jdbc.Driver"
- The MySQL JDBC driver is missing from the Maven build
- **Solution**: Ensure `backend/pom.xml` includes:
  ```xml
  <dependency>
      <groupId>com.mysql</groupId>
      <artifactId>mysql-connector-j</artifactId>
      <scope>runtime</scope>
  </dependency>
  ```
- Rebuild and redeploy:
  ```bash
  git add backend/pom.xml
  git commit -m "fix: Add MySQL connector dependency"
  git push  # Railway will auto-redeploy
  ```

### Database connection errors
- Verify `DATABASE_URL` environment variable is set
- Railway's MySQL addon auto-provides `DATABASE_URL` in JDBC format
- Check `application-prod.properties` uses: `spring.datasource.url=${DATABASE_URL}`
- Ensure MySQL container is running: Check Railway **Deployments** tab for status
- Test connection: 
  ```bash
  # In Railway Terminal (if available)
  mysql -u root -p$DB_PASSWORD -h $DB_HOST -P $DB_PORT $DB_NAME
  ```

### Email notifications not sending
- Verify `SPRING_MAIL_*` variables in Railway
- For Gmail: Use [App Password](https://support.google.com/accounts/answer/185833), not regular password
- Check Railway logs for mail errors

---

## Continuous Deployment

Both Vercel and Railway support auto-deployment:

1. **Push code to `main` branch**
2. **Vercel** automatically builds and deploys frontend
3. **Railway** automatically builds and deploys backend

To skip deployment, add `[skip ci]` in commit message.

---

## Performance Tips

### Frontend (Vercel)
- Enable Edge Functions for API rate limiting
- Use image optimization via `next/image` (if migrating to Next.js)
- Implement service worker caching

### Backend (Railway)
- Use Railway's PostgreSQL (faster than external DB)
- Enable Redis caching layer (Railway add-on)
- Monitor CPU/Memory in Railway Dashboard
- Consider upgrading plan if hitting resource limits

---

## Monitoring & Logging

### Vercel Dashboard
- **Analytics**: Performance metrics
- **Logs**: Build and runtime logs
- **Deployments**: History and status

### Railway Dashboard
- **Deployments**: Build logs and status
- **Monitoring**: CPU, Memory, Network usage
- **Logs**: Application logs in real-time
- **Metrics**: Request count, error rate

---

## Next Steps

1. ✅ Deploy backend on Railway
2. ✅ Deploy frontend on Vercel
3. 📊 Set up monitoring and alerts
4. 🔐 Configure custom domains and SSL
5. 🚀 Enable CI/CD for automated deployments
6. 📈 Scale resources as traffic grows

For support:
- **Vercel**: https://vercel.com/help
- **Railway**: https://railway.app/support

