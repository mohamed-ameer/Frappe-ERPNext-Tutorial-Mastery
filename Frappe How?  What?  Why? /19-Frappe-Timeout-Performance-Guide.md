
# Fixing Production Request Timeout & Performance Tuning in Frappe

This guide covers common solutions for fixing **Production Request Timeout** in Frappe and improving system performance by tuning key services such as **Gunicorn**, **MariaDB**, and **Redis**.

---

## 1. Check Background Workers and Scheduler

Use `bench doctor` to verify that workers and scheduler are running properly:

```bash
bench doctor
```

If workers or the scheduler are down, timeout issues and stuck jobs may occur.

---

## 2. Increase HTTP Timeout

Increase the HTTP timeout for long-running requests:

```bash
bench config http_timeout 600   # Timeout in seconds
```

---

## 3. Apply Config Changes to Supervisor and Nginx

After updating the timeout, regenerate supervisor and nginx configs:

```bash
bench setup supervisor
bench setup nginx
```

---

## 4. Restart Services (as root user)

Restart services to apply the changes:

```bash
sudo supervisorctl reload
sudo service nginx reload
```

---

## 5. Increase Gunicorn Workers

Increase Gunicorn worker count to improve request handling under load.

Edit `common_site_config.json`:

```json
"gunicorn_workers": 5,
```

The recommended formula for number of workers is:

```
workers = 2 * CPU cores + 1
```

Then run:

```bash
bench setup supervisor
sudo supervisorctl reread
sudo supervisorctl update
bench restart
```

---

## 6. Tune MariaDB for Better Performance

### Step 1: Edit MariaDB Configuration

```bash
sudo nano /etc/mysql/mariadb.conf.d/50-server.cnf
```

### Step 2: Under `[mysqld]`, add or update the following:

```ini
innodb_buffer_pool_size = 8G
```

> Adjust the value based on your server's RAM. For example:
> - 2 GB RAM: 512M – 1G  
> - 4 GB RAM: 1G – 2G  
> - 8 GB RAM: 4G – 6G

### Step 3: Restart MariaDB

```bash
sudo systemctl restart mariadb
```

### Step 4: Verify the Buffer Pool Size

```bash
mysql -u root -p -e "SHOW VARIABLES LIKE 'innodb_buffer_pool_size';"
```

> Note: Value will be shown in bytes (e.g., `1073741824` = 1G)

---

## 7. Increase Redis RAM Usage

### Step 1: Edit Redis Configuration

```bash
sudo nano /etc/redis/redis.conf
```

### Step 2: Find and set `maxmemory`:

```ini
maxmemory 1gb
maxmemory-policy allkeys-lru
```

> Replace `1gb` with the amount of RAM you want Redis to use (e.g., `512mb`, `2gb`).

### Step 3: Restart Redis

```bash
sudo systemctl restart redis
```

### Step 4: Verify Redis Memory Settings

```bash
redis-cli info memory
```

Look for the following lines:
- `maxmemory`
- `used_memory`
- `maxmemory_policy`

---

## Summary Table

| Component         | Action                                 |
|------------------|-----------------------------------------|
| Frappe            | Set HTTP timeout with `bench config`   |
| Supervisor/Nginx | Reload configs after changes            |
| Gunicorn         | Increase workers in `common_site_config.json` |
| MariaDB          | Tune `innodb_buffer_pool_size`          |
| Redis            | Set `maxmemory` and eviction policy     |

---

> Apply these optimizations to ensure your Frappe app performs well under load and avoids request timeout issues or any slowness in your site.

---

## References

1. [Database Optimization - Hardware and Configuration | Frappe Documentation](https://docs.frappe.io/framework/user/en/database-optimization-hardware-and-configuration)
2. [Optimizing ERPNext Performance: Tips for Faster and Smoother Operations](https://codewithkarani.com/2024/06/02/optimizing-erpnext-performance-tips-for-faster-and-smoother-operations/)
3. [ERPNext Performance Tuning](https://github.com/frappe/erpnext/wiki/ERPNext-Performance-Tuning)
4. [Performance Optimization Tips for ERPNext in Manufacturing Environments](https://www.solufyerp.com/erp-blog/performance-optimization-tips-for-erpnext-in-manufacturing-environments/)
5. [Slow Query Log Overview](https://mariadb.com/docs/server/server-management/server-monitoring-logs/slow-query-log/slow-query-log-overview)
6. [how to setup the slow query log](https://discuss.frappe.io/t/how-do-i-turn-on-and-then-view-mariadb-slow-query-log-with-v10/70826/2)
7. [Check MySQL (MariaDB) Configuration](https://discuss.frappe.io/t/erp-running-very-slow-please-in-need-your-help/139780/3)
8. [ERPNext running slow](https://discuss.frappe.io/t/erpnext-running-slow/14302/16)