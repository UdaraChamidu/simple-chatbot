# Deploying to Cloudways

Your frontend application is now ready for deployment.

## Prerequisite: Environment Setup
I have updated your `.env` file to include the `VITE_N8N_WEBHOOK_URL`. 
**Important**: When deploying to production, ensure your `.env` variables are correctly set. For a static build, these variables are **baked into the build** at build time. 
Since I just ran the build, the `VITE_N8N_WEBHOOK_URL` and `VITE_SUPABASE` keys from your local `.env` are now in the `dist` files.

## Deployment Steps

1.  **Log in to Cloudways**.
2.  **Create a New Application**:
    *   Select your Server.
    *   Application Type: **Custom PHP** (or **Laravel** works too, but Custom PHP is cleaner for static sites).
    *   Name your app (e.g., `LuminaChat`).
3.  **Access File Manager (SFTP)**:
    *   Use Master Credentials or App Credentials to log in via SFTP (FileZilla, Cyberduck, etc.).
    *   Navigate to the `public_html` folder of your new application.
4.  **Upload Files**:
    *   Delete the default `index.php` (if any).
    *   Upload **ALL** files and folders from your local `frontend/dist` folder to `public_html` on the server.
    *   **Ensure `.htaccess` is uploaded**. This file is critical for handling page refreshes (SPA routing). I have already created it in your `dist` folder.

## Links & Configuration
You mentioned "add links in to .env folder".
I have already extracted the `WEBHOOK_URL` to `.env`.
If you have other links (e.g., a custom Domain, backend URL, etc.) that need to be configured, please let me know or add them to `.env` and run `npm run build` again before uploading.

## Verification
Visit your Cloudways Application URL. The app should load, and the chat should function correctly.
