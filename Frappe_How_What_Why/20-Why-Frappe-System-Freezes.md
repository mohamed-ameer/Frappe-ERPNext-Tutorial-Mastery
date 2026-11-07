# Causes of Sudden Freezes in ERPNext v15

ERPNext v15 (built on Frappe Framework) can become unresponsive ("freeze") for many reasons. These may be server-side issues (CPU/RAM exhaustion, database locks, Redis/cache problems, scheduler/backlog, custom scripts, or OS/configuration issues) or client-side factors (browser/JavaScript performance, large data loads, network latency, caching). Below we analyze each cause in detail, explain it clearly, and give both Beginner-level and Advanced-level solutions. Verified remedies include command-line steps, configuration edits, and code examples. We also cover best practices for monitoring and maintenance.

## 1. Server-Side Issues

### 1.1 CPU and Resource Bottlenecks

**Cause**: If the server's CPU is fully utilized by ERPNext processes, the system can hang or be very slow. For example, many background jobs or heavy requests (reports, data imports) can max out all cores. When CPU load exceeds the number of cores, new tasks queue up.

- **Beginner**: Check CPU usage with a tool like `htop` or `top`. For example:
  ```bash
  sudo apt-get install htop
  htop
  ```
  If the load (shown in `htop`) is higher than your core count, that indicates CPU overload. Free any extraneous processes (restart bench/Gunicorn, limit heavy jobs). Consider upgrading hardware (more CPU cores) if possible. Also reduce simultaneous users or heavy tasks.
- **Advanced**: Profile your Python code to find bottlenecks. Use Python's `cProfile` to profile slow transactions (e.g., `%prun` in bench console). Ensure Gunicorn has an appropriate number of worker processes (typically `2 ×` the CPU cores). Use asynchronous workers if needed. Optimize any custom scripts (avoid infinite loops or blocking calls). If a specific background job hogs CPU, consider offloading it or optimizing its algorithm.

### 1.2 Memory Exhaustion (RAM and Swap)

**Cause**: If ERPNext's processes use up all RAM with no or insufficient swap, the OS can freeze or kill processes. For example, an 8 GB server with no swap saw nearly 7.8 GB used and only ~50 MB free. With no swap (0KB total), even small extra memory demands caused the system to hang. This is a classic Linux issue: without swap, once RAM is exhausted, the machine can become unresponsive (the GUI or services freeze).

- **Beginner**: Ensure you have swap enabled. If not, create a swap file. For example, to add 2 GB swap:
  ```bash
  sudo fallocate -l 2G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  ```
  Check with `free -m` that swap is active. Also monitor RAM usage with `free -m` or `htop`; if free RAM is consistently near 0% and swap is filling, the system is under memory pressure. Add more physical RAM if possible.
- **Advanced**: Investigate memory leaks or heavy usage. Identify which processes use the most RAM (in `htop` the "RES" column). If a Python worker or Redis is growing, restart it periodically or fix the leak. Use tools like `tracemalloc` or `psutil` to profile memory usage in custom code. Lower the number of Gunicorn workers if too many. Tune Linux's `oom-killer` behavior via `vm.swappiness` (e.g., `vm.swappiness=10` in `/etc/sysctl.conf`) to make swap usage less aggressive. Ensure critical processes (MariaDB, Redis) have enough memory. If memory spikes occur during backups or reports, schedule them off-hours or upgrade hardware.

### 1.3 Redis and Caching Issues

**Cause**: ERPNext uses Redis for caching, queues, and real-time updates. Misconfigured or overloaded Redis can cause slow responses or deadlocks. For instance, if Redis's memory isn't capped, it can grow without bound. If Redis is down, many operations (locks, cache fetches) hang. In one case, upgrading MariaDB improved Redis behavior, implying Redis was holding locks improperly.

- **Beginner**: Check that Redis is running and healthy. Run `redis-cli INFO memory` to see its memory usage. Ensure Redis has a `maxmemory` limit set (e.g., in `/etc/redis/redis.conf`, `maxmemory 2gb`). If Redis is using >80% memory or shows `used_memory_peak` hitting the limit, it may slow down. Restart Redis service if unresponsive:
  ```bash
  sudo systemctl restart redis-server
  ```
  Also clear any huge cache if needed.
- **Advanced**: Enable Redis caching for ERPNext to reduce DB load. In `sites/common_site_config.json` add:
  ```json
  {
      "cache": { "enabled": 1, "redis_server": "redis://localhost:6379" }
  }
  ```
  This uses Redis for Frappe cache, reducing database hits. Similarly, set `redis_cache` and `redis_queue` in `common_site_config.json` if separate instances. Use Redis monitoring (e.g., `redis-cli MONITOR` or the Redis dashboard) to profile slow commands. For advanced setups, configure Redis persistence or use separate Redis instances for queues and cache.

### 1.4 Database (MariaDB) Bottlenecks

**Cause**: MariaDB is a common choke point. Unindexed tables, long queries, or locks can freeze the system for other users. For example, generating reports on large tables (like Stock Ledger) can lock the database, causing other operations to hang. Brian Pond (ERPNext dev) notes that MariaDB can get "stuck" on long-running queries (e.g., in "Sending data" state) that never time out. If a query enters such a state, the DB may freeze tables until manually killed.

- **Beginner**: Tune MariaDB basic settings. Check `innodb_buffer_pool_size` (the wiki recommends ~70-80% of RAM). For example, if you have 16 GB RAM, set `innodb_buffer_pool_size=12G`. You can test with:
  ```sql
  SHOW VARIABLES LIKE 'innodb_buffer_pool_size';
  ```
  If it's very low (default ~128MB), increase it in `/etc/mysql/my.cnf` and restart MariaDB. Also enable the slow query log to catch long queries: in `my.cnf` add `slow_query_log=1` and `long_query_time=1` (seconds). Use `sudo bench mariadb` to enable it:
  ```sql
  SET GLOBAL slow_query_log = 1;
  SHOW VARIABLES LIKE 'slow_query_log';
  ```
  This logs queries >1s to MySQL's slow log (see `/var/log/mysql/slow.log`).
- **Advanced**: Analyze slow queries and add missing indexes. Use `SHOW FULL PROCESSLIST;` to see active queries. Look for queries in "Locked" state or repeats. The Frappe wiki suggests capturing problematic queries via the slow log and then using `EXPLAIN` to optimize. For instance, queries on `tabStock Ledger Entry` are often heavy; ensure fields like `posting_date` and `item_code` are indexed. Use tools like MySQLTuner to get tuning suggestions (buffer sizes, cache sizes). If deadlocks occur under concurrency, consider changing transaction isolation to `READ COMMITTED` and/or add manual locks in code to serialize critical sections. In extreme cases where tables freeze ("Creating sort index" lock), only killing the MariaDB process or rebooting may help - to avoid this, split large transactions or switch to a more robust DB engine if necessary.

### 1.5 Scheduler and Background Jobs

**Cause**: Frappe's background workers (Scheduler, Worker, Web sockets) handle tasks like email sending, long jobs (file uploads, reports), and real-time pushes. If the scheduler or workers halt or overload, UI operations can wait indefinitely. A backlog of queued jobs can consume CPU/memory. Custom code in scheduled tasks might also hang.

- **Beginner**: Ensure the scheduler is running (`bench start` or Supervisor). Check `frappe-bench/logs/scheduler.log` and `worker.error.log` for errors. If you recently added a scheduled script (e.g., via Server Script), disable it to test. For example, disable cron by commenting out tasks in `hooks.py` of custom apps, then restart bench.
- **Advanced**: Throttle scheduler frequency. In `sites/common_site_config.json`, you can set something like `scheduler_interval=300000` (milliseconds) to slow it down if overloaded. Use the "System Settings" doctype to limit resource-intensive jobs. Profile tasks by enabling `DEBUG` logging in `scheduler.py` or use `bench --site [sitename] console` to enqueue test tasks. If third-party apps add heavy jobs, optimize or rewrite those jobs. You can also launch additional worker processes (`bench worker`) if needed, but only after ensuring CPU/RAM can handle them.

### 1.6 Custom Code and Apps

**Cause**: Custom scripts (Python or JavaScript) can introduce freezes. For example, a faulty client-side script might block the UI thread, or a server-side script might enter an infinite loop. Even well-meaning customizations (like large Customized Forms or Property Setters) can slow down actions dramatically.

- **Beginner**: Disable new custom apps or scripts to see if performance returns. For a specific form freeze (like in the "Customize Form" example), try clearing the browser cache or using a different browser (some issues are Chrome-specific). If the freeze happens on certain actions only (e.g., Save on a custom form), inspect the browser's JavaScript console for errors.
- **Advanced**: Audit custom Python code with profiling (`cProfile`) to detect slow functions. In the "Customize Form" issue, the function `update_fields_from_form_builder` took 2 minutes. To fix, either avoid customizing too many fields at once or patch the client script. For client scripts, use Chrome's DevTools "Performance" tab to profile. Ensure you rebuild assets (`bench build`) after JavaScript changes. For server scripts, use `bench console` and `%prun` or logging to isolate slow parts. Always follow best practices (avoid heavy loops, use asynchronous calls where possible, use `frappe.enqueue` for lengthy tasks).

### 1.7 OS and Environment Issues

**Cause**: Underlying OS misconfigurations or limitations can cause freezes. Examples include missing CPU virtualization, insufficient `ulimit` settings, or disk I/O bottlenecks. If the machine runs out of file handles or disk space, ERPNext can hang. In one case, an ERPNext OVA required enabling virtualization in BIOS to avoid issues. Similarly, if no swap is set (see above), the OS itself can lock up.

- **Beginner**: Verify server environment: ensure virtualization is enabled (for VMs), enough disk space, and check Linux limits:
  ```bash
  ulimit -n  # open file descriptors
  ```
  Compare to ERPNext's requirements (5000+ is recommended). Check for disk I/O waits (`iostat` or `iostat -x`). If disk is the bottleneck (high `%iowait` in `top`), move to faster storage.
- **Advanced**: Tune Linux kernel and services. Set higher `ulimits` for the bench user or supervisor. Optimize Linux's scheduler (e.g., `sysctl vm.dirty_ratio=10`). If using Docker or cloud instances, ensure adequate CPU/memory. For heavy I/O (backups, imports), use a separate DB instance or change storage to NVMe. Consider using a process monitor (Supervisor or `systemd`) to auto-restart crashed services. Finally, always keep the OS updated to benefit from performance fixes.

## 2. Client-Side Issues

### 2.1 Browser and JavaScript Performance

**Cause**: The user's browser can freeze if the ERPNext UI script is heavy or encounters errors. Complex pages (many fields, child tables, or reports) consume CPU/memory in the browser. In v15, the "Customize Form" save froze Chrome for minutes, but ran fine in Edge, showing a browser-specific issue. Similarly, faulty browser extensions or caches can interfere (one user found Chrome's cache caused module icons to "do nothing" until cleared).

- **Beginner**: Update or switch browsers. If ERPNext hangs in Chrome, try Firefox or Edge. Clear the browser cache (especially after an upgrade), then reload the page. Disable plugins (ad-blockers, script-blockers) that may conflict with Frappe's scripts. Use the browser's Task Manager (Chrome: Shift+Esc) to see if the tab's process is spiking in CPU or memory. Ensure the client device itself isn't under heavy load.
- **Advanced**: Profile front-end code. Use Chrome DevTools "Performance" and "Network" tools to see if any script is long-running or if certain assets fail to load. For example, the heavy `update_fields_from_form_builder` call in "Customize Form" could be trimmed by avoiding unnecessary field updates. Rebuild front-end assets with `bench build` if you suspect stale code. Ensure no console errors (use `console.log` or the Frappe system console for debugging). For custom JS, debounce heavy UI updates or limit use of synchronous calls.

### 2.2 Large Data Loads and UI Rendering

**Cause**: Loading thousands of rows or rendering large DOM trees can freeze the browser. ERPNext Gantt charts or list views with very large result sets are known culprits. (A 2017 issue showed the browser's memory ballooning to multiple GB when opening a Gantt with many tasks.) Even default list filters returning 10,000+ rows can lock the UI.

- **Beginner**: Use filters and pagination. Avoid opening long lists or reports at once. For example, add filters in List Views (by date, status, etc.) to limit results. For child tables, try to load only necessary rows (set a reasonable limit). If using the Gantt chart or similar, try reducing the time range or task count.
- **Advanced**: Enable server-side pagination or background processing for large datasets. You can customize queries (via `frappe.get_list` parameters) to fetch in chunks. For Gantt or charts, consider implementing a "load more" pattern or use Web Workers to process data off the main thread. Monitor front-end memory; if Chrome's Task Manager shows ERPNext tab using >2 GB, you have a rendering issue. In v15, this was partly solved by code fixes, but custom apps may reintroduce large scripts.

### 2.3 Network Latency and Connectivity

**Cause**: Slow or unreliable network between client and server can make the UI appear frozen (waiting for responses). While ERPNext can work offline in POS mode, normal desk operations depend on quick AJAX calls. High latency or packet loss causes requests (forms loading, saves) to delay or timeout.

- **Beginner**: Test network speed and latency. From the client machine, ping the server (`ping your.server.ip`) and measure response. If latency is tens of seconds, that will "freeze" the UI during requests. Check the browser's Network tab: are requests (e.g., `/api/method/`) pending or failing? Ensure no firewall or proxy is blocking WebSocket or HTTP connections.
- **Advanced**: Enable keepalives and adjust timeouts. In Nginx or your proxy config, increase `proxy_read_timeout` and `uwsgi_read_timeout` to avoid 504 errors on slow queries. Use HTTPS/HTTP2 to speed up asset delivery. If using ERPNext over VPN or satellite link, consider setting up a geographically closer mirror or CDN for static files. For very high-latency networks, use the ERPNext offline features (e.g., offline POS) or a robust caching proxy.

### 2.4 Browser Extensions and Cache

**Cause**: Extensions (like ad-blockers, Grammarly, etc.) or a corrupted cache can break ERPNext pages. One reported issue had Chrome caching old JS, causing UI actions to silently fail until a manual reload.

- **Beginner**: Try opening ERPNext in a private/incognito window (which disables most extensions and uses a fresh cache). If that resolves the freeze, an extension is likely the cause. Common culprits include ad-blockers or developer tools that inject scripts. Clear the browser cache fully (empty HTTP cache) and reload the page.
- **Advanced**: If freezes persist, check Developer Console for errors. ERPNext logs include messages if assets fail to load (look in Network panel for 404/500s on `*.js` or `*.css`). As a last resort, rebuild and version static files on the server (`bench build`) and clear any CDN caches. Educate users to disable problematic extensions or whitelist the ERPNext domain.

## 3. Solutions and Best Practices

- **Monitor Resources**: Regularly check CPU, memory, disk I/O. Use `htop` or tools like Glances. For example, the ERPNext docs explicitly advise checking if load exceeds cores or memory is full. Set up alerts when usage is high.
- **Enable Logging**: Turn on MariaDB slow query log and review it daily. Use `frappe.log` and `worker.error.log` for Python errors. Aggregate logs with ELK or Graylog for analysis.
- **Use Bench Commands**: Run `bench doctor` to detect common issues. After fixing problems, do `bench restart` to reload services. After upgrades, always run `bench migrate --patch` and rebuild assets (`bench build`).
- **Optimize Configurations**: As noted, tune `my.cnf` (buffer pool, cache sizes), set Redis `maxmemory`, adjust Gunicorn worker count, and verify Supervisor or `systemd` services are running. Use MySQLTuner to guide DB settings.
- **Scale Infrastructure**: For many users or large data, split the stack: e.g., separate DB server (with tuned MariaDB) and web worker server. Use load balancers if needed. Ensure virtualization is enabled (cloud VMs) and swap is present.
- **Backup and Upgrade**: Keep ERPNext updated (patches often include performance fixes). Backup data before big changes. In development, replicate issues and test solutions on a staging server first.

## Summary Checklist

- **CPU/Memory**: Verify CPU load vs. cores and add more CPU or RAM if needed. Ensure swap is enabled (avoid 0KB swap!).
- **MariaDB**: Set `innodb_buffer_pool_size` ≈ 70-80% of RAM. Enable slow query log and examine `SHOW FULL PROCESSLIST` to find locks. Use MySQLTuner for extra guidance.
- **Redis/Cache**: Ensure Redis services are running, with memory limits. Enable Frappe Redis caching in `common_site_config.json`. Monitor `redis-cli INFO memory`.
- **Scheduler/Jobs**: Check that background workers and scheduler are active. Look at `worker.error.log`. If jobs pile up, increase workers or optimize tasks.
- **Custom Code**: Temporarily disable recent customizations to isolate issues. Profile any new server script or client script that runs slowly.
- **Browser/Client**: Clear browser cache and try a different browser. Make sure users' machines have enough RAM. If the page is stuck, open DevTools to debug.
- **Network**: Ping the server to check latency. Verify Nginx/Gunicorn timeouts are long enough. Consider a CDN or offline mode for high-latency users.
- **Monitoring**: Install tools like Prometheus/Grafana or New Relic as suggested. Track metrics (response times, DB queries per second, memory usage).
- **Maintenance**: Regularly vacuum or truncate log tables (Error Log, Version Log, etc. if huge). Update ERPNext and dependencies. Use `bench migrate --patch` after upgrades.

By systematically diagnosing freezes (server and client), applying the above remedies, and following proactive monitoring practices, ERPNext v15 can run smoothly with minimal unresponsiveness. When issues do arise, the steps above - from simple configuration checks to deep profiling - will help restore performance and prevent future freezes.

## References

1. ERPNext Performance Tuning • frappe/erpnext Wiki • GitHub https://github.com/frappe/erpnext/wiki/ERPNext-Performance-Tuning
2. Optimizing ERPNext Performance: Tips for Faster and Smoother Operations - Code with Karani https://codewithkarani.com/2024/06/02/optimizing-erpnext-performance-tips-for-faster-and-smoother-operations/
3. Deadlock issue on Frappe v14 - ERPNext - Frappe Forum https://discuss.frappe.io/t/deadlock-issue-on-frappe-v14/109049
4. Server Memory Issues - ERPNext - Frappe Forum https://discuss.frappe.io/t/server-memory-issues/24059
5. kernel - How can Ubuntu become unresponsive when OOM without thrashing? - Ask Ubuntu https://askubuntu.com/questions/1142201/how-can-ubuntu-become-unresponsive-when-oom-without-thrashing
6. Kubuntu/Ubuntu freezing when run out of RAM and swap - Reddit https://www.reddit.com/r/Kubuntu/comments/1fy6t44/kubuntuubuntu_freezing_when_run_out_of_ram_and/
7. ERPNext running slow - Deployment - Frappe Forum https://discuss.frappe.io/t/erpnext-running-slow/14302
8. Issue with Version-15 Customize Form, it freeze when saving - Customization - Frappe Forum https://discuss.frappe.io/t/issue-with-version-15-customize-form-it-freeze-when-saving/131378
9. ERPNext gets stuck when clicking module icons - User Forum - Frappe Forum https://discuss.frappe.io/t/erpnext-gets-stuck-when-clicking-module-icons/79818
10. ERPNext Production v15.0.0 ova download link - Frappe Forum https://discuss.frappe.io/t/erpnext-production-v15-0-0-ova-download-link/112947
11. [BUG] Browser Freezes when opening Project Tasks (as Gantt) #8724 https://github.com/frappe/erpnext/issues/8724