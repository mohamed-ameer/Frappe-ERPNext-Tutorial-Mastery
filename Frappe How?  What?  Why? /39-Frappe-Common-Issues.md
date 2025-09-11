<details>
  <summary><h3>`bench start` crash (not working) in Frappe</h3></summary>
  
# `bench start` crash (not working) in Frappe

Solutions for two common issues in Frappe development while trying to start the `bench`:

- Port conflicts that prevent `bench start` from working.

- Crashes caused by old or corrupted cache content.

i don't know why but it always happen because of redis issue (either port or cache)

---

### The Solution In Short:

```bash

sudo lsof -i :11000

sudo kill <PID1> <PID2> <PID3> .....

sudo lsof -i :13000

sudo kill <PID1> <PID2> <PID3> .....

bench --site your-site-name clear-cache

bench --site your-site-name clear-website-cache

bench start

```

---

### Explaination:

### Part 1: Fixing Port Conflicts in Frappe

When running `bench start`, you might see errors like:

```

TCP listening socket on 127.0.0.1:11000 is already in use.

TCP listening socket on 127.0.0.1:13000 is already in use.

```

These ports are used by Redis for different purposes.

- port `11000`: Used by the Redis cache instance to store frequently accessed data and improve application performance.

- port `13000`: Used by the Redis queue instance to manage background tasks and asynchronous operations.

This `Address already in use` issue usually occurs if previous `bench` processes didn’t shut down properly.

In my case, i forgot to close bench before shut down my machine.

---

### Solution:

#### 1. Identify Which Processes Are Using the Ports

```bash

sudo lsof -i :11000

sudo lsof -i :13000

```

This shows which process (and its PID) is currently using the port.

---

#### 2. Kill the Conflicting Processes

```bash

sudo kill <PID1> <PID2> <PID3> .....

```

Frees up the ports so `bench start` can use them.

This ensures Redis starts correctly and Frappe can utilize caching and queuing systems without issues.

---

#### 3. Restart the Bench

```bash

bench start

```

With the ports now free and available, the bench should start normally.

---

### Part 2: Fixing Bench Start Crashes via Cache Clearing

Sometimes `bench start` crashes due to corrupted cache content.

---

#### 1. Clear Browser Cache

```bash

bench --site your-site-name clear-website-cache

```

The command `clear-website-cache`:

1. Browser-level, for web display.

2. Clears browser cache (HTML, CSS, JS, images) for a website.

3. Fixes display issues or forces browser to load latest site files.

4. Clears your browser cache just in case you have cached content that may be causing this problem.

---

#### 2. Clear Backend Cache

```bash

bench --site your-site-name clear-cache

```

The command `clear-cache`:

1. it's Application-level, for Frappe/ERPNext.

2. Clears internal caches (metadata, doctypes) in Frappe-based apps like ERPNext, after code or config changes to ensure app uses latest data.

3. Sometimes when you make changes in code or config (like modifying hooks, custom fields), Frappe still uses old data from memory. This can cause strange errors or crashes when starting the bench.

---

#### 3. Restart Bench

```bash

bench start

```

---

- Always shut down bench properly using `Ctrl` + `c`.

- Use `lsof` to detect what's taken ports.

- Cache can cause strange issues, clear it regularly while developing.
- the port `11000` or `13000` may change based on your server or the configurations, they are not constant.
</details>

<details>
  <summary><h3>❌ NameError: name 'null' is not defined</h3></summary>

**Cause:**  
This usually happens due to cached assets or browser issues after switching branches.  

**Solutions:**  
- Run: `bench clear-cache`  
- Or try accessing with a different browser  

🔗 [Reference](https://discuss.frappe.io/t/server-error-at-the-front-of-any-page/120135)  
</details>

<details>
  <summary><h3>❌ bench stop / bench start fails: Missing module (e.g., "Cannot find module 'superagent'")</h3></summary>

**Cause:**  
Node.js dependencies are missing after switching branches.  

**Solution:**  
Re-install required packages:  
```bash
bench setup requirements
```

🔗 [Reference](https://discuss.frappe.io/t/bench-start-with-serveral-errors/40904/13?u=mohamed-ameer)

</details>

<details>
  <summary><h3>❌ ValueError: id must not contain ":"</h3></summary>

**Cause:**
Older Frappe version had a bug in job ID generation (create_job_id in frappe/utils/backgroundjobs.py).

**Solution:**

Best fix: Update to the latest Frappe version.

Manual fix: Update the function to replace : with |:

```python
def create_job_id(job_id: str | None = None) -> str:
	"""
	Generate unique job id for deduplication
	"""
	if not job_id:
		job_id = str(uuid4())
	else:
		job_id = job_id.replace(":", "|")
	return f"{frappe.local.site}||{job_id}"
```

🔗 [Reference](https://discuss.frappe.io/t/migrate-command-error-in/145017/2?u=mohamed-ameer)

</details>