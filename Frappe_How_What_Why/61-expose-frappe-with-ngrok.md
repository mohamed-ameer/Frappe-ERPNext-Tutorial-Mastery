# Exposing Your Frappe App to the Internet Using ngrok

This guide explains how to use **ngrok** to securely expose your locally running Frappe application to the public internet. This is especially useful for testing webhooks, sharing your development site with others, or integrating with third-party services that require a public URL.

---

## What is ngrok?

[ngrok](https://ngrok.com) is a reverse proxy tool that creates a secure tunnel from a public endpoint to a locally running web service. It allows you to expose your localhost (e.g., `http://localhost:8000`) as a publicly accessible HTTPS URL like `https://abc123.ngrok.io`.

Without a tool like ngrok, your Frappe site running on your local machine is only accessible from your own computer (`localhost`) or within your local network. ngrok solves this by forwarding external traffic securely to your local development environment.

imagine you have a local server running on your machine at http://localhost:8000. With ngrok, you can expose this server to the internet and get a public URL like https://abc123.ngrok.io. Any requests made to this public URL will be securely tunneled to your local server.

**In Short:** ngrok converts your local development server into a public URL, allowing you to share it with others over the internet without deploying it.

---

## Why Use ngrok with Frappe?

- **Testing webhooks**: Many payment gateways and APIs require a publicly reachable URL to send callbacks.
- **Collaboration**: Share your development site with teammates or clients without deploying to a server.
- **Quick demos**: Easily demo new features without setting up DNS or complex hosting.
- **Secure tunneling**: ngrok provides HTTPS by default, so you don’t need to configure SSL locally.

---

## How to Use ngrok with Frappe?
### 1. Navigate to Your Frappe Bench Directory

```bash
cd frappe-bench/
```
> This ensures all following commands are run in the correct Frappe environment.

### 2. Install `pyngrok` in Your Bench Environment
```bash
bench pip install pyngrok
```
> `pyngrok` is a Python wrapper for ngrok that allows Frappe to programmatically manage ngrok tunnels. Installing it inside your bench’s virtual environment ensures compatibility with your Frappe setup.

### 3. Create a Free ngrok Account
Go to https://dashboard.ngrok.com/signup and sign up for a free account (you can use GitHub, Google, or email).
> A free account gives you a random subdomain each time you restart ngrok (e.g., `https://a1b2c3d4.ngrok.io`). Paid plans allow custom subdomains and longer sessions.

### 4. Get Your Authentication Token
After signing up, go to https://dashboard.ngrok.com/authtokens and copy your authtoken.
> This token authenticates your local ngrok client with your ngrok account, enabling features like reserved domains and request inspection.

### 5. Add the Authtoken to Your Frappe Site Config
Run the following command to store your authtoken in the site’s configuration:
```bash
bench --site [site_name] set-config ngrok_authtoken your_ngrok_authtoken
```
> Replace `[site_name]` with your Frappe site’s name and `your_ngrok_authtoken` with the token you copied in the previous step.

### 6. Set the HTTP Port for Your Site
```bash
bench --site [site_name] set-config http_port 8000
```
> This sets the port on which your Frappe site will be accessible. You can change `8000` to any other port if needed.
> ngrok will forward traffic from its public URL to this port on your local machine.

### 7. Start bench and ngrok
First start bench to make sure your site is running:
```bash
bench start
```
Now launch the tunnel using Frappe’s built-in command:
```bash
bench --site [site_name] ngrok --bind-tls
```
> This starts the ngrok tunnel for your site. You should see a message like `Public URL: https://a1b2c3d4.ngrok.io`.
> The `--bind-tls` flag ensures ngrok serves your site over HTTPS, which is required by many modern web services (e.g., OAuth, webhooks). Without it, you might get mixed-content warnings or connection failures.

### 8. (Alternative) Manual ngrok Usage
If the bench ngrok command fails or you prefer more control, you can run ngrok manually:

Make sure your Frappe site is running:
```bash
bench start
```
> (This typically serves your site at http://localhost:8000)
In a new terminal, run:
```bash
ngrok http 8000
```
This bypasses Frappe’s wrapper and uses ngrok directly. You’ll still need to authenticate ngrok once using:

```bash
ngrok authtoken your_ngrok_authtoken
```
> (Only required the first time on a new machine.) 

---

### How ngrok Works?
watch the following video to understand how ngrok works:
[The What and Why of ngrok](https://www.youtube.com/watch?v=KvyMtP8NTgU&list=LL&index=14)

---

## Additional Notes

- **Security**: ngrok is secure but not designed for production use. It’s best for testing and development.
- **Paid Plans**: For custom subdomains and longer session durations, consider upgrading to a paid plan.
- **limitations**: ngrok has a limit bandwidth and request per month for free plan.
- **Alternative**: you can use [localtunnel](https://localtunnel.github.io/www/) or [pagekite](https://pagekite.net/) or [cloudflare tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/) as an alternative to ngrok.

**video how to use cloudflare tunnel**  
[How to Expose Your Local Server to the Internet Using Cloudflare Tunnel](https://www.youtube.com/watch?v=ey4u7OUAF3c&t=8s)
