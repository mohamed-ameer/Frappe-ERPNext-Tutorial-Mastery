## **Production Server Setup**
>*⚠️ Important: The procedures below are intended only for live, publicly accessible servers.
Do not run production setup commands on your local development machine—this can break your local environment or expose sensitive data.*

**This guide assumes you:**

- Have a working Frappe Bench installation.
- Are logged in as a user with sudo privileges.
- Have a domain name pointing to your server (for SSL setup).
- Are using Ubuntu/Debian (commands may differ slightly on other Linux distributions).

---

1. **Enable Production Mode:**
   
   >**It is not recommended to use this mode on a local development server. Instead, use it only on a live server.**
   >
   >Production mode configures your Frappe instance for security, performance, and stability using:
   >
   >- Nginx as a reverse proxy
   >- Supervisor to manage background processes
   >- Redis for caching and queuing

   1. **Setup Production Configuration:**
      
      Run the following as your system user (not root):
      ```
      sudo bench setup production [frappe-user]
      ```
      >Replace [frappe-user] with the actual system user that owns the bench (e.g., frappe). 
      
      This command configures system-level settings such as log rotation and file permissions.
      
   2. **Generate and Install Nginx Configuration:**
      
      ```
      bench setup nginx
      ```
      - This creates an Nginx site configuration under `/etc/nginx/conf.d/`.
      - If prompted to overwrite an existing config, type `Yes`.
      
      >💡 Note: This step assumes Nginx is already installed. If not, run:
      > ```
      > sudo apt install nginx
      > ``` 
      
   3. **Configure Supervisor and Restart Services**

      Supervisor manages background workers (Gunicorn, SocketIO, etc.). Run:
      ```
      bench setup supervisor
      bench setup socketio
      bench setup redis
      ```
      Then apply the changes:
      ```
      sudo supervisorctl reread
      sudo supervisorctl update
      sudo supervisorctl restart all
      ```
      
   5. **Change User Directory Permissions**
      
      This will Fix File Permissions (Optional but Recommended)
      ```
      sudo usermod -aG [frappe-user] www-data
      ```
      >This will Ensure the web server (www-data) can access static files.
      >
      > After this, restart Nginx to apply group changes:
      >```
      >sudo systemctl restart nginx
      >```
      You should now be able to access your site via your server’s public IP address (e.g., http://203.0.113.10).
      To access the site, visit **[Your Server IP Address]**
            
2. **Enable HTTPS with Setup SSL & Add Your Domain**
    1. Add Your Domain to the Site

        ```
        bench setup add-domain --site [site-name] [domain]
        ```
      > Example: `bench setup add-domain --site mysite.local example.com `
      >
      >This associates the domain with your Frappe site.
        
    2. Install Certbot (Let’s Encrypt Client)

      Use Snap to install the latest certbot:
      ```
      # Install Snap (if not present)
      sudo apt update
      sudo apt install -y snapd

      # Refresh core packages
      sudo snap install core
      sudo snap refresh core

      # Remove any legacy certbot installations
      sudo apt remove -y certbot

      # Install Certbot via Snap
      sudo snap install --classic certbot

      # Create symlink for easy access
      sudo ln -sf /snap/bin/certbot /usr/bin/certbot
      ```
      > Verify installation: `certbot --version`

    3. Enable DNS-Based Multitenancy (Required for Multiple Domains)
        
        ```
        bench config dns_multitenant on
        ```
        > This allows Frappe to route requests based on the Host header, which is essential for SSL with custom domains. 
        
    4. Regenerate Nginx Configuration
        
        ```
        bench setup nginx
        sudo service nginx restart
        ```
        >This ensures Nginx is aware of your new domain(s).
        
    5. Generate SSL Certificate via Certbot
        
        ```
        sudo certbot --nginx
        ```
        
        - Enter domain name when prompted
        - Enter your email address when prompted to get important updates and expiration notifications
        - Copy the certificate and certificate key paths as they will be used in next step
        
    6. Test Certificate Auto Renewal
        
        ```
        sudo certbot renew --dry-run
        ```
        
        The auto renewal test should success. If it didn't, troubleshoot the errors.
        
    7. (Optional) Manually Setup Nginx Config and Specify SSL Paths in `site_config.json`

         While Certbot usually handles Nginx automatically, Frappe may require explicit SSL paths for certain features (e.g., email, backups).

        1. Edit site_config.json of the site
            
            Can be found under [bench-folder]/sites/[site-name]
            
            ```
            nano site_config.json
            ```
            
        2. Edit the domains key to be like this
            
            ```
            "domains": [
            	{
                    "domain": "[domain-name]",
                    "ssl_certificate": "[certificate-path]",
                    "ssl_certificate_key": "[certificate-key-path]"
            	}
             ]
            ```
            
    8. Regenerate Nginx config and reload:
        
        ```
        bench setup nginx
        sudo service nginx restart
        ```
        >  Note: This step is often not needed if you used certbot --nginx, but it ensures Frappe internals (like email sending) can access certificate info.

   9. Final Checks
      
      1. Visit https://your-domain.com — you should see your site with a valid lock icon.
      2. Ensure all assets load without mixed-content warnings.
      3. Confirm background jobs are running:
      ```
      sudo supervisorctl status
      ```
      4. Test a backup or email to verify SSL paths are correctly recognized.