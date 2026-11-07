# Frappe ORM & Database Operations – Comprehensive Guide

## 1. Concept Introduction
| Concept | Why it matters |
| --- | --- |
| **DocTypes & Documents** | Every database table (and Single) is defined as a DocType; interacting with those records happens via the `Document` class (`frappe/model/document.py`) which enforces validation, permissions, and hooks |
| **Database facade (`frappe.db`)** | Instance of `Database` that wraps low-level SQL, connection state, caching, and dialect quirks; provides helper CRUD APIs (`get_value`, `set_value`, `exists`, etc.) |
| **Query Builder (`frappe.qb`)** | PyPika-powered fluent interface that generates parameterized SQL while handling joins, functions, ordering, locking |
| **Transactions & Locks** | `frappe.db.sql` enforces transaction write limits, implicit commit checks, `FOR UPDATE`/`SKIP LOCKED`, and query timeout hooks |
| **Singles vs Standard tables** | Singles live in `tabSingles`; multi-record DocTypes map to their own `tab<DocType>` tables; helper APIs abstract the difference (`get_singles_dict`, `set_single_value`) |
| **Child Tables & Dynamic Fields** | Link fields, child tables, and `DynamicTableField` provide automatic joins; Document APIs keep parent/child `idx`, `parenttype`, `parentfield` consistent |

## 2. Implementation Walkthrough

### 2.1 Mental Model: How the ORM Maps to SQL
- Every DocType becomes either:
  - `tab<DocType>` table (standard)
  - Rows in `tabSingles` (Single DocTypes; each row stores `(doctype, field, value)`)
- The `Document` class wraps a row, tracks dirty state, and coordinates hooks (`before_insert`, `validate`, `on_update`, etc.)
- `frappe.db` is injected per-request (`frappe.local.db`) and exposes:
  - **Raw SQL**: `frappe.db.sql(query, values=None, as_dict=False, debug=False, auto_commit=False, for_update=False, pluck=False, as_iterator=False)`
  - **Convenience readers**: `get_value`, `get_values`, `get_all`, `get_list`, `exists`, `has_table`, `has_column`, `count`, `get_single_value`
  - **Mutators**: `set_value`, `set_single_value`, `bulk_insert`, `bulk_update`, `delete`, `truncate`, `sql_ddl`
  - **Transactions**: `commit`, `rollback`, `savepoint`, `release_savepoint`, `sql("START TRANSACTION")` guarded by `transaction_writes`

### 2.2 Document Lifecycle & Database Touchpoints
1. **Loading** (`Document.__init__`, `load_from_db`)
   - If `meta.issingle`: use `frappe.db.get_singles_dict`
   - Else: `frappe.db.get_value(..., fieldname="*", as_dict=True, for_update=flags.for_update)`
   - Child tables fetched with `frappe.db.get_values(child_doctype, {"parent": self.name, ...}, order_by="idx asc")`
   - `reload()` simply re-runs `load_from_db`
2. **Insert (`Document.insert`)**
   - Sets defaults, permissions, naming (`set_new_name`), parent refs, validations
   - Standard DocTypes call `self.db_insert()` which issues `INSERT` using `frappe.db.sql`
   - Child rows call `db_insert`; Singles call `update_single`
3. **Save / Update (`Document.save`)**
   - Branches to insert if `__islocal`, otherwise `db_update`
   - `db_update` builds `self.get_valid_dict()`, runs `frappe.db.update(self.doctype, ...)`
4. **Delete (`Document.delete`)**
   - Permission checks ➜ `self.run_method("on_trash")` ➜ `frappe.db.delete(self.doctype, self.name)`
   - Child rows cascade via DB constraints or manual `DELETE`
5. **Submit / Cancel / Amend**
   - DocStatus transitions happen before DB writes; `db_set` updates a single field in place with `UPDATE tab{DocType} SET field=value WHERE name=%s`
6. **Utilities**
   - `db_set(fieldname, value, update_modified=True)` uses `_get_update_dict` to include `modified` metadata
   - `get_latest()`, `load_doc_before_save()` fetch prior version for compare
   - Document locking uses file locks (not DB locks) but interacts with `for_update` to avoid optimistic conflicts

### 2.3 Read APIs (`frappe.db`)

| API | Best for | Notes |
| --- | --- | --- |
| `get_value(doctype, filters, fieldname="name", as_dict=False, pluck=False, distinct=False, for_update=False, skip_locked=False)` | Single row/field reads | Wraps `get_values(..., limit=1)`; handles Singles fallback automatically |
| `get_values(doctype, filters, fieldname="*", as_dict=False, distinct=False, limit=None)` | Multi-row reads | Accepts dict/list filters, handles caching for string filters |
| `get_all`, `get_list` | High-level DocType queries with permissions | Proxy to `frappe.get_all/list`; support `fields`, `filters`, `order_by`, `limit_page_length`, `or_filters`, `group_by`, `as_list`, `debug` |
| `exists(doctype, name=None)` | Presence checks | Returns truthy if a record exists; caches for Singles |
| `count(doctype, filters=None, cache=False)` | Efficient counts | Internally calls query builder `Count("*")` |
| `has_column`, `has_table`, `get_tables` | Schema introspection | Use for migrations/safe schema edits |
| `get_single_value`, `get_singles_dict`, `set_single_value` | System settings, Singles | Transparent caching, field-type casting |
| `get_default`, `set_default`, `get_system_settings` | Defaults API | Builds on Singles + `tabDefaultValue` |
| `multi_lang` helpers | `get_translation`, etc. | Works with `tabTranslation` |

**Filters**: Accept dictionaries (`{"status": "Open"}`), tuples (`{"name": ("like", "A%")}`), lists (`[["DocType", "field", "operator", value]]`), or PyPika `Criterion`. Operators map through `frappe.database.operator_map.OPERATOR_MAP` (e.g., `"in"`, `"between"`, `"ancestors of"` for nested sets).

### 2.4 Write APIs (`frappe.db`)
- **`set_value(doctype, docname, fieldname, value, modified=None, commit=True)`**
  - Builds update dict including `modified` metadata; flushes document cache
- **`set_single_value(doctype, fieldname | dict, value=None)`**
  - Deletes existing rows in `tabSingles` then bulk inserts new values
- **`bulk_insert(doctype, rows, ignore_duplicates=False, chunk_size=10_000)`**
  - Builds parameterized `INSERT` via Query Builder; respects column validation
- **`bulk_update(docs, chunk_size=10_000)`**
  - Accepts list of dicts containing `doctype`, `name`, and updated fields
- **`delete(doctype, filters=None, with_children=False)`**
  - Accepts filters or name; optionally deletes child rows
- **`sql_ddl(query)`**
  - Runs schema statements after `check_implicit_commit`; auto-clears table cache
- **`create_index`, `add_column`, `change_column_type`, `rename_table`**
  - Dialect-aware operations implemented in MariaDB/Postgres subclasses

### 2.5 Query Builder (`frappe.qb`)
1. **Setup**: `frappe.qb` is patched PyPika builder with MariaDB/Postgres dialect classes. It overrides Field accessors, parameter handling, and `.run()` execution (see `frappe/query_builder/utils.py`).
2. **Basic usage**
   ```python
   Lead = frappe.qb.DocType("Lead")

   query = (
       frappe.qb.from_(Lead)
       .select(Lead.name, Lead.company_name)
       .where((Lead.status == "Open") & (Lead.modified >= "2024-01-01"))
       .orderby(Lead.modified, order=Order.desc)
       .limit(50)
   )

   rows = query.run(as_dict=True)  # parameterized, safe
   ```
3. **Advanced features**
   - **Implicit joins via dynamic filters**: referencing `customer.customer_name` auto-joins `Customer` when the field is a Link
   - **Child Queries**: pass dicts in `fields` to auto-fetch children (`fields=[..., {"items": ["item_code", "qty"]}]`)
   - **Locking**: `.for_update(skip_locked=True, nowait=True)` for concurrency control
   - **Aggregations**: `frappe.qb.avg`, `.sum`, `.max`, custom `functions.Function`
   - **Unions**: `query1.union(query2).run()`
   - **Subqueries**: use `frappe.qb.from_(subquery.as_("alias"))`
4. **When to favor Query Builder**
   - Complex filters, dynamic field resolution, or DB portability
   - Need to compose queries programmatically while retaining parameterization
   - Want to post-process results (child queries) without manual loops

### 2.6 Transactions, Locks, and Timeouts
- **Connection lifecycle**: `frappe.db.connect()` opens DB session, sets execution timeout (using `get_query_execution_timeout`), and stores `_conn`, `_cursor`
- **Transaction writes**: `Database.transaction_writes` increments on write queries; `MAX_WRITES_PER_TRANSACTION` guard triggers `TooManyWritesError`
- **Implicit commit protection**: `check_implicit_commit` blocks `ALTER`, `CREATE`, etc. inside active write transactions (prevents auto-commit)
- **Manual control**
  ```python
  frappe.db.savepoint("before_mass_update")
  try:
      # perform writes
      frappe.db.commit()
  except Exception:
      frappe.db.rollback(save_point="before_mass_update")
      raise
  ```
- **Locking**:
  - `for_update=True` on read helpers → `SELECT ... FOR UPDATE`
  - `skip_locked=True` avoids waiting on locked rows (Postgres & MariaDB 10.6+)
  - `wait=False` (aka `nowait`) raises immediately if lock can’t be acquired
- **Query timeout**: `set_execution_timeout` implemented per backend; exceeded queries raise `frappe.QueryTimeoutError`
- **Deadlocks**: `is_deadlocked` detection maps DB errors to `frappe.QueryDeadlockError`

### 2.7 Raw SQL & Safe Execution
- **Use cases**: migrations, analytics, performance-sensitive code
- **Best practices**
  - Always pass parameters (`frappe.db.sql("select ... where name=%s", (name,))`)
  - Toggle `debug=True` while developing to log query + EXPLAIN
  - Prefer Query Builder when possible; raw SQL is still required for vendor-specific features (CTEs, window functions not exposed yet)
  - In server scripts / safe exec context, only SELECT queries are allowed unless explicitly whitelisted; Query Builder enforces this via call stack inspection

### 2.8 Schema Operations & Metadata
- `frappe.db.describe(doctype)` returns column definitions (used by model sync)
- `frappe.db.add_index`, `drop_index`, `add_unique`, `drop_column`
- `frappe.reload_doc(module, "doctype", "DocTypeName")` regenerates schema from JSON and syncs DB via `frappe.model.sync`
- `frappe.db.updatedb(doctype)` syncs meta and handles column creations/drops
- `frappe.db.type_map` ensures fieldtype-to-column-type conversions (set in backend-specific classes)

### 2.9 Performance & Caching Tips
- **Value cache**: simple request-level dict keyed by `(doctype, name, fieldname)`; used by `get_value`/`get_single_value`
- **Redis cache**: use `frappe.cache` for cross-request caching; store expensive query results keyed by filters
- **Indexing**
  - Add indexes on frequently filtered columns via DocType settings or `frappe.db.add_index`
  - Monitor slow queries; use `frappe.monitor` trace IDs for correlation
- **Batching**
  - Use `SQL_ITERATOR_BATCH_SIZE` (1000) by setting `as_iterator=True` to stream large result sets
  - `bulk_insert`/`bulk_update` to reduce round-trips
- **Explain plan**: `frappe.db.sql(..., debug=True, explain=True)` prints EXPLAIN output

### 2.10 Recipes
1. **Get the latest submitted Sales Order totals**
  ```python
  SalesOrder = frappe.qb.DocType("Sales Order")
  totals = (
      frappe.qb.from_(SalesOrder)
      .select(SalesOrder.name, SalesOrder.grand_total)
      .where((SalesOrder.docstatus == 1) & (SalesOrder.modified >= "2024-01-01"))
      .orderby(SalesOrder.modified, order=Order.desc)
      .limit(100)
  ).run(as_dict=True)
  ```
2. **Update a field without touching hooks**
  ```python
  frappe.db.set_value("Task", task_id, {"status": "Completed"}, update_modified=False)
  frappe.db.commit()
  ```
3. **Chunked background migration**
  ```python
  while names := frappe.db.get_all("Invoice", filters={"migrated": 0}, pluck="name", limit=500):
      frappe.db.multi_set("Invoice", {"migrated": 1}, filters={"name": ("in", names)})
      frappe.db.commit()
  ```
4. **Safe raw SQL with iterator**
  ```python
  for row in frappe.db.sql("select name from tabEmail Queue where status=%s", "Sent", as_dict=True, as_iterator=True):
      process(row.name)
  ```

## 4. Default Code Review / Validation Notes
- `Database.sql` normalizes queries (IFNULL ➜ COALESCE) and clears table cache on DDL
- Permission enforcement is caller’s responsibility except for `frappe.get_list/get_all` which call `frappe.has_permission`
- Server scripts restricted to SELECT via QB patch; direct `frappe.db.sql` blocked unless query is whitelisted in `check_safe_sql_query`
- `Document` enforces optimistic concurrency by checking `modified` timestamps (`check_if_latest`)

## 5. Learning Check
1. When should you favor `frappe.qb` over raw SQL?
2. What is the difference between `get_value` and `get_single_value`?
3. How do `for_update`, `skip_locked`, and `wait=False` change locking behavior?
4. How would you bulk update 100k rows without exhausting memory?
5. Why can’t you run `ALTER TABLE` mid-transaction when `transaction_writes > 0`?

## 6. Next Steps
- Practice writing custom reports using Query Builder (joins, aggregates)
- Explore backend-specific classes (`frappe/database/mariadb/database.py`, `postgres/database.py`) for dialect nuances
- Combine ORM knowledge with background jobs (`frappe.enqueue`) to design safe long-running data tasks
- Consider adding automated tests: e.g., pytest fixtures using `frappe.db.rollback()` for isolation