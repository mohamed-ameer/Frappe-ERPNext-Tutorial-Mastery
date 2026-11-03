# How a Frappe document gets its name

**Code this lesson is taken from**

| Item | Value |
| --- | --- |
| App | `apps/frappe` |
| Branch | `version-15` |
| Version | `15.122.0` (`__version__` in `frappe/__init__.py`) |
| Commit | `b0b5b99a1d9d2cb3d54b32293d3854bf2c15f4a4` |
| Commit date | 2026-10-06 |
| ERPNext | Used only to show which DocTypes already set `autoname` to `autoincrement` |

Every statement about behaviour below is tied to a file in that tree. If a behaviour was not read from that source, the text says so.

---

## How to read this

You are new to Frappe. The question in front of you is: “Can I name documents with an integer that the database increments, the way a normal MySQL table uses `AUTO_INCREMENT`?”

Before that question makes sense, you need the words Frappe uses for a row, a table, a name, a series, and a sequence. Each section does four things:

1. Says what the word means in ordinary language.
2. Shows a small example.
3. Points at the function or SQL that actually does it.
4. Says what that means for integer names.

---

## 1. Glossary

Read this once. Come back when a later section uses a word.

| Term | Meaning in this codebase |
| --- | --- |
| **DocType** | The definition of a business object: its fields, its table name, and how its rows are named. Stored as a document whose own DocType is `DocType`. Example: Sales Invoice. |
| **Document** | One saved record of a DocType. In Python it is an instance of `frappe.model.document.Document` (or a subclass). |
| **Controller** | The Python class for that DocType, for example `SalesInvoice`. Methods on it (`autoname`, `validate`, `before_insert`) run during the lifecycle. |
| **`name`** | The primary key of the row. It is both the database key and the id you see in the URL and in Link fields. Frappe does not keep a hidden numeric id plus a separate display code. The `name` column **is** the id. |
| **`tab` prefix** | The physical table for DocType `Sales Invoice` is `` `tabSales Invoice` ``. Child tables follow the same rule. |
| **Single** | A DocType with only one logical record (settings). Its `name` is the DocType name. It does not get a sequence. |
| **Child table / `istable`** | A DocType that exists only as rows inside a parent. Columns `parent`, `parentfield`, `parenttype` point back at the parent. |
| **Link field** | A field that stores another document’s `name`. In MariaDB it is `varchar(140)`, not a foreign key to a bigint. |
| **Dynamic Link** | A pair of fields: one holds the target DocType, one holds the target `name`. The name column is still `varchar(140)`. |
| **`autoname`** | A property on the DocType. It tells `set_new_name` which recipe to use. Values you will meet: `naming_series:`, `field:item_code`, `prompt`, `format:...`, `hash`, `autoincrement`, or a pattern that contains `#`. |
| **Naming series** | A pattern such as `SINV-.YYYY.-.#####`. The `#` run is a counter. The counter lives in a table called `tabSeries`. |
| **`tabSeries`** | One row per prefix. Column `name` is the prefix (`SINV-2026-`). Column `current` is the last integer handed out. |
| **Hash name** | A 10-character random-looking string used when no other rule produced a name. Child rows usually get this. |
| **Sequence** | A MariaDB (or Postgres) counter object, separate from any table. `nextval` returns the next integer. This is what `autoname = autoincrement` uses. |
| **`AUTO_INCREMENT`** | A MySQL/MariaDB column attribute. The engine fills the column during `INSERT` if you omit it. **Frappe’s autoincrement option does not create this attribute.** |
| **Primary key** | The column (or columns) that uniquely identifies a row. For a normal DocType that column is `name`. InnoDB clusters the row data with the primary key, so the key’s size and order affect the whole table. |
| **`docstatus`** | 0 draft, 1 submitted, 2 cancelled. Not related to how the name is generated, except that submitted documents are often amended, and amendment changes the name (section 8). |
| **Amend** | A new document created from a cancelled one. Standard string naming appends `-1`, `-2`, … to the old name. |
| **`VARCHAR_LEN`** | `140`. Defined on the database class. Used for `name` (when it is a string), Link, Data, and the child `parent` column. |

`VARCHAR_LEN` is set here:

```61:61:apps/frappe/frappe/database/database.py
	VARCHAR_LEN = 140
```

---

## 2. Two layers: the Python object and the SQL row

When you write:

```python
doc = frappe.get_doc({
    "doctype": "Sales Invoice",
    "customer": "CUST-0001",
    "company": "Wind Power LLC",
})
doc.insert()
```

two things exist:

1. A Python object. Before insert, `doc.name` may be `None`.
2. After a successful insert, a row in `` `tabSales Invoice` ``. The primary key of that row is whatever string or integer was placed in `doc.name` **before** the `INSERT`.

`Document.insert` (`frappe/model/document.py`) does the work in a fixed order. The steps that matter for naming are:

1. Mark the document local (`__islocal`).
2. Defaults, timestamps, docstatus, permission, link checks.
3. `before_insert`.
4. **`set_new_name`** — this is where `name` is chosen.
5. Copy that name into each child’s `parent`.
6. `validate`, then the actual `INSERT`.

So the name is decided in Python, then written as an ordinary column value. The database is not asked to invent the name during `INSERT`, except in the special case of section 7 — and even there Python asks a sequence for a number and then inserts that number itself.

Small picture:

```text
Python object                MariaDB
--------------               ---------------------------
doc.name = None
        |
        |  set_new_name()
        v
doc.name = "SINV-2026-00001"
        |
        |  INSERT
        v
                             name = 'SINV-2026-00001'   <-- primary key
```

---

## 3. What the table looks like

`MariaDBTable.create` in `frappe/database/mariadb/schema.py` builds the `CREATE TABLE`.

For a normal DocType the name piece is:

```text
name varchar(140) primary key
```

Then the standard columns: `creation`, `modified`, `modified_by`, `owner`, `docstatus`, `idx`, then your fields, then indexes. Engine is InnoDB unless the DocType says otherwise. Character set is `utf8mb4`.

A non-child table also gets `index modified(modified)`.

A child table (`istable`) instead gets:

```text
parent varchar(140)
parentfield varchar(140)
parenttype varchar(140)
index parent(parent)
```

**Example.** A Sales Invoice Item row does not point at the invoice with a foreign-key integer. It stores:

| column | example value |
| --- | --- |
| `name` | `a3k9xq2p1b` (hash, because the child has no naming rule) |
| `parent` | `SINV-2026-00001` |
| `parentfield` | `items` |
| `parenttype` | `Sales Invoice` |

`parent` is `varchar(140)` even if, someday, the parent’s `name` were a bigint. The child would store the characters `1`, `2`, `3`, not an integer-typed foreign key.

**Link fields** are declared as `varchar` of length 140 in `frappe/database/mariadb/database.py` (`"Link": ("varchar", self.VARCHAR_LEN)`). A field “Customer” on Sales Invoice stores the customer’s `name` as text, for example `CUST-0001`. There is no database foreign key from that column to `` `tabCustomer`.name ``.

That is why changing one DocType’s primary key type does not change the columns that mention it.

---

## 4. The function that chooses the name

`Document.set_new_name` (`document.py`) calls `frappe.model.naming.set_new_name` for the parent, then again for every child.

`set_new_name` (`frappe/model/naming.py`) is the whole policy. Read it as a ladder. The first step that fills `doc.name` wins.

```text
before_naming
    |
    |  if autoname is not "prompt" and this is not an import:
    |      doc.name = None          # throw away anything already sitting there
    |
    |  if autoname == "autoincrement" and not a Single:
    |      doc.name = nextval(sequence)
    |      return                   # ladder stops here
    |
    |  if amended_from is set:
    |      name = old name + "-1" (or -2, …)
    |      return if that worked
    |
    |  if Single:
    |      doc.name = doctype name
    |
    |  Document Naming Rule (first matching rule)
    |  controller method autoname()
    |  DocType.autoname property
    |      field:      copy a field onto name
    |      naming_series:   use the series pattern
    |      prompt:     user typed the name
    |      format:     braces, dates, series
    |      pattern with #:  make_autoname
    |
    |  if still empty:
    |      hash (10 characters)
    |
    |  validate_name()
```

The early `doc.name = None` matters. If you set `doc.name = "MY-NAME"` in Python and autoname is `naming_series:`, that value is wiped unless `frappe.flags.in_import` is set or autoname is `prompt`. Import is the supported way to keep an existing name.

`Document.set_new_name` has one extra door: if autoname is `prompt` and the form sent `__newname`, it validates that string and returns without calling the ladder. Prompt means “the user typed the id”.

---

## 5. Worked example: naming series (the ERPNext default)

Sales Invoice in this bench has:

```json
"autoname": "naming_series:"
```

in `erpnext/accounts/doctype/sales_invoice/sales_invoice.json`. The document also has a field called `naming_series`. A typical option looks like `SINV-.YYYY.-.#####` (the exact options live on the field; the mechanism does not depend on one string).

`set_name_by_naming_series` does:

```python
doc.name = make_autoname(doc.naming_series + ".#####", "", doc)
```

If `naming_series` is already `SINV-.YYYY.-.`, the extra `.#####` still adds a counter. If the field value already contains `#`, you should look at `make_autoname` / `parse_naming_series` before assuming a second counter is appended — the function concatenates `.#####` unconditionally when autoname is `naming_series:`. Check the field’s options on your site before you predict the final pattern.

### What the pattern means

`parse_naming_series` splits on `.`.

| Part | Becomes |
| --- | --- |
| `SINV-` | the characters `SINV-` |
| `YYYY` | current year, four digits |
| `MM` | month, two digits |
| `DD` | day |
| `YY` | year, two digits |
| `WW` | week number, with a year-boundary adjustment in `determine_consecutive_week_number` |
| `#####` | a counter, zero-padded to the number of `#` characters |
| a field name, if `doc` has that field | the field value |
| anything else | the text itself |

**Example, assuming the date is in 2026 and this prefix’s counter is currently 41:**

```text
pattern:  SINV-.YYYY.-.#####
parts:    SINV-   YYYY   #####
result:   SINV-2026-00042
```

The prefix that is stored in `tabSeries` is the text **before** the `#` part, so `SINV-2026-`. Next year’s invoice uses a different prefix (`SINV-2027-`) and the counter starts again. That is why you see `00001` every January. It is a new row in `tabSeries`, not a reset of the old row.

### How the counter is updated

`getseries(key, digits)`:

```sql
SELECT current FROM tabSeries WHERE name = 'SINV-2026-' FOR UPDATE
```

- If the row exists, `UPDATE tabSeries SET current = current + 1 WHERE name = 'SINV-2026-'`, then the new current is formatted with leading zeros.
- If the row does not exist, `INSERT INTO tabSeries (name, current) VALUES ('SINV-2026-', 1)`.

`FOR UPDATE` locks that one prefix row until the request’s transaction ends. Two workers creating `SINV-2026-` invoices queue on that row. Two workers creating different prefixes (`SINV-2026-` and `PINV-2026-`) do not lock each other.

These statements go through `frappe.db.sql`, the normal connection. They are part of the request transaction. If the request rolls back, the `UPDATE` of `current` rolls back with it. (Sequence objects in section 7 are a different story; do not mix the two.)

**Walk the numbers.**

| Step | `tabSeries.current` for `SINV-2026-` | Name produced |
| --- | --- | --- |
| no row yet | — | first call inserts `current = 1` → `SINV-2026-00001` |
| next invoice | 1, then update to 2 | `SINV-2026-00002` |
| next invoice | 2, then update to 3 | `SINV-2026-00003` |

The code sets `current` to the value it just handed out (`cint(current) + 1` after the update). The next call reads that value and adds one again.

### Delete of the last number

`revert_series_if_last` runs on delete only for some autoname styles. `delete_doc.py` skips it when the autoname prefix is `Prompt`, `field`, `hash`, or `autoincrement`.

For a series, it decrements `tabSeries.current` **only if** the deleted document’s counter equals the current value. Deleting `SINV-2026-00003` while current is 3 puts current back to 2. Deleting `SINV-2026-00001` while current is 3 does nothing to the counter. The hole remains. The next name is still `…00004`.

---

## 6. The other string recipes (short, with one example each)

All of these run only when the autoincrement branch did **not** return.

**`field:item_code`.** The name becomes the value of `item_code`. If that field is empty, Frappe throws `"{label} is required"`. Item often uses this, so the id you see (`ITEM-001` or a barcode-like code) is a real field, not a series. On rename, `update_autoname_field` in `rename_doc.py` writes the new name back into that field so the field and the primary key stay equal.

**`hash`.** `make_autoname("hash")` builds 10 characters:

- 1 character from the request/job trace id (documents created in the same request share it),
- 3 characters from a wrapped timestamp,
- 7 characters of random base32.

The comment in `_generate_random_string` explains the alphabet: MySQL’s default collation for these tables is case-insensitive (`utf8mb4_unicode_ci` is set on the table), so upper and lower case would not be distinct. Base32 hex, then lowercased, avoids that.

If nothing else set a name, `set_new_name` uses this hash. That is why a child row’s `name` looks like noise. You almost never type it. You reach the row through `parent`.

**`prompt`.** The user supplies the name (`__newname` on the document). `validate_name` rejects empty names, the placeholder `"New " + doctype`, the DocType’s own name (except for the DocType named `DocType`), and the characters `<` and `>`.

**`format:`.** Replaces `{fieldname}`, date tokens, and a series inside the format string. Same idea as the series parser, different entry point (`_format_autoname`).

**Controller `autoname`.** If the Python class defines `autoname(self)`, it runs after Document Naming Rule and before the property parser. The method’s job is to set `self.name`. If it leaves `name` empty, the ladder continues.

**Document Naming Rule.** A user-configurable rule (DocType `Document Naming Rule`) can set the name from conditions. `set_new_name` loads enabled rules for that DocType, highest priority first, and stops when one of them sets `doc.name`. Log doctypes and a few framework doctypes are skipped (`IGNORED_DOCTYPES` in `set_naming_from_document_naming_rule`).

**Integer passed by mistake.** `validate_name` accepts an `int` only when the DocType is autoincrement. Otherwise it throws `NameError`: `Invalid name type (integer) for varchar name column`. A varchar primary key must be a string.

---

## 7. What `autoname: autoincrement` really does

This is the feature people mean when they say “database-style integer names”. Here is the exact behaviour.

### 7.1 When the table is created

Inside `MariaDBTable.create`, after the child-or-parent index logic:

```python
if not self.meta.issingle and self.meta.autoname == "autoincrement":
    frappe.db.create_sequence(self.doctype, check_not_exists=True)
    name_column = "name bigint primary key"
```

Two consequences:

1. A sequence object is created.
2. The primary key is an 8-byte integer, not `varchar(140)`.

There is no `AUTO_INCREMENT` word in that SQL. The comment in the same function says why `nextval()` is not used as a column `DEFAULT`: restoring a database that contains sequences has been buggy in MariaDB (they cite [MDEV-20070](https://jira.mariadb.org/browse/MDEV-20070)). Frappe would rather call `nextval` itself than depend on the server filling the column.

Postgres (`frappe/database/postgres/schema.py`) uses the same idea: `name bigint primary key` plus a sequence. The rest of this lesson uses the MariaDB path because that is what the module docstring of Frappe describes as the database.

### 7.2 The sequence object

`frappe/database/sequence.py`:

```text
sequence name = scrub(doctype_name + "_id_seq")
```

`scrub` turns spaces and odd characters into a safe identifier. A DocType named `CRM Note` produces a sequence whose name is the scrubbed form of `CRM Note_id_seq` (spaces become underscores). The function returns that name; the DDL is `create sequence if not exists <that name> …`.

On MariaDB the statement adds `nocache` and `nocycle` because `SEQUENCE_CACHE` is `0`.

Why `nocache` is not a small detail: the comment at the top of `sequence.py` says MariaDB’s default cache is 1000. During backup, if the sequence was used, the cache is dropped and `SETVAL` writes the next non-cached value into the backup. After restore, the counter jumps. A per-connection cache on Postgres has the same class of surprise, because Frappe opens and closes connections per request and the unused cache is skipped. So the project forces no cache.

`get_next_val` runs:

```sql
SELECT nextval(`crm_note_id_seq`)
```

(The backticks and the exact scrubbed name come from `get_next_val`.) The return value is an integer. `set_new_name` assigns it to `doc.name` and **returns immediately**.

### 7.3 What that return skips

Because of the `return`, an autoincrement DocType does **not** get:

- the amended name (`SINV-2026-00001-1`),
- a Document Naming Rule,
- the controller’s `autoname` method,
- `naming_series`, `field:`, `format:`, or hash,
- `validate_name` on that path.

`is_autoincremented` is true only when `meta.autoname == "autoincrement"` (the whole string, same case) and the DocType is not a Single. `naming_series:` does not partially match.

### 7.4 A numeric story

Imagine a new DocType `Shelf Label`, autoname `autoincrement`, created by migrate so the table and the sequence exist.

| Action | What Python does | What you can see in the table |
| --- | --- | --- |
| First `insert()` | `nextval` → `1`, then `INSERT` with `name = 1` | one row, primary key `1` |
| Second `insert()` | `nextval` → `2` | primary key `2` |
| Delete the row `2` | sequence is **not** decremented (`delete_doc.py` excludes `autoincrement` from `revert_series_if_last`) | next insert is `3`, not `2` |
| Someone calls `insert` with an explicit integer name `50`, and that call goes through `validate_name` | `set_next_sequence_val(doctype, 50, is_val_used=True)` | the sequence’s current value becomes 50; the next `nextval` is 51 |

The last row is `validate_name`, not the short-circuit inside `set_new_name`. The short-circuit always takes `nextval` and returns, and it clears `doc.name` first (unless import or prompt). So the usual `doc.insert()` path **ignores** a name you set on the object and replaces it with the next sequence value. The `set_next_sequence_val` path is for the case where `validate_name` is asked to accept an integer (the `set_name` argument on `Document.set_new_name` is one such caller: it validates before the ladder when `set_name` is passed).

Read that twice, because it surprises people:

- `doc.name = 10` then `doc.insert()` → still `nextval`, not 10.
- `doc.insert(set_name=10)` → `validate_name` sees an int, moves the sequence to 10 with `is_val_used=True`, and that integer is kept.

### 7.5 This is not `AUTO_INCREMENT`

Put the two mechanisms side by side with the same desired result (primary keys 1, 2, 3).

**Classic MariaDB, which Frappe does not emit:**

```sql
CREATE TABLE shelf (
  id bigint NOT NULL AUTO_INCREMENT PRIMARY KEY,
  title varchar(140)
);

INSERT INTO shelf (title) VALUES ('A');
-- the engine chooses id
```

You can omit `id`. The table metadata holds the counter. You learn the id after the insert (or by `LAST_INSERT_ID()`).

**What Frappe emits and runs:**

```sql
CREATE SEQUENCE shelf_label_id_seq nocache nocycle;
CREATE TABLE `tabShelf Label` (
  name bigint primary key,
  creation datetime(6),
  ...
);

SELECT nextval(`shelf_label_id_seq`);   -- returns 1 in Python
INSERT INTO `tabShelf Label` (name, ...) VALUES (1, ...);
```

The application knows the primary key **before** the `INSERT`. The column has no `AUTO_INCREMENT` attribute. A backup/restore story is about the sequence object, not about an auto-increment counter stored in the table.

### 7.6 Gaps

`tabSeries` updates are ordinary `UPDATE`s in the request transaction, so a rollback gives the number back.

`nextval` is a separate statement. `sequence.py` does not wrap it in retry logic and does not call `setval` if the later `INSERT` fails. Whether MariaDB returns that value on transaction rollback is **not** answered by this source. The file only tells you that sequence state is sensitive enough that they disabled the cache and refused to use `nextval` as a default. Treat gaps as normal. Do not write business rules that assume the next Shelf Label is always `max(name)+1`.

### 7.7 Changing an existing DocType later

`MariaDBTable.alter` adds columns, changes column definitions for fields, and adds or drops indexes. It never rewrites the `name` column (it even `continue`s when a dropped index would be on `name`).

So this sequence of events does **not** happen by itself:

1. Site has lived for two years with `name varchar(140)` and values `SINV-2024-00001`.
2. A developer sets `autoname` to `autoincrement` in the DocType JSON.
3. `bench migrate` converts the primary key to `bigint` and renumbers rows.

Step 3 is not in `schema.py`. Migrate will try to create the sequence (`create_sequence` is called from `create`, not from `alter`). The existing column stays a varchar. `get_next_sequence_val` will then start putting integers into a varchar column if inserts still go through `set_new_name`. That is a mixed table: old rows are `SINV-…`, new rows are `"1"`, `"2"` stored as text. Links that store the old names still hold the old strings.

A real conversion is a data migration you would write yourself: new key for every row, then update every `varchar(140)` that copied that key (`parent`, every Link, Dynamic Link, comments, files, versions, routes, and any custom table). Frappe’s rename tool (`rename_doc`) knows how to replace one string name with another string name across Link fields. It is not a bulk type change. This lesson did not read every `UPDATE` inside `rename_doc` against a bigint primary key; do not assume rename of `1` → `2` has been exercised for autoincrement DocTypes.

---

## 8. Amendment, in one example

For a **string** document, `set_new_name` sees `amended_from` and calls `_set_amended_name`. The new name is the old name plus `-1`. If `SINV-2026-00001-1` already exists, it tries `-2`, and so on.

```text
original   SINV-2026-00001     submitted, then cancelled
amendment  SINV-2026-00001-1   new draft
```

People, print formats, and support staff use that suffix to see the history in the id itself.

An autoincrement DocType never reaches `_set_amended_name`, because `set_new_name` returns at `nextval`. The amendment would be a new integer, for example `48`, with `amended_from` pointing at `47`. The relationship is a field, not the shape of the name. If your users depend on `-1` in the id, this option removes that convention.

---

## 9. Where the name travels after insert

The primary key is copied, as text, into many other places. That is the cost of “the name is the id”.

**Child `parent`.** `set_parent_in_children` runs immediately after `set_new_name` in `insert`. Each child row stores the parent name in a `varchar(140)` column.

**Link fields.** Customer `CUST-0001` is stored on the invoice as the characters `C U S T - 0 0 0 1`. If customer names became integers, existing invoices would still contain the old text until you rewrote them. New invoices would contain `"15"` (the characters of the integer) in a varchar column. MariaDB will often coerce `varchar` = `bigint` in a join, but the index used, the collation, and the plan are not the same as bigint = bigint. This source does not include a query plan for that join. Do not claim it is free.

**URLs and client code.** Desk routes use the name (`/app/sales-invoice/SINV-2026-00001`). Any script that does `name.startswith("SINV-")` or splits on `-` is parsing a convention, not a framework guarantee. Integer names make those parsers fail closed or, worse, parse `"15"` as something unintended.

**Series helpers.** `append_number_if_name_exists` builds a suffix when a field value is already used. It is for string autoname collisions, not for the sequence.

---

## 10. What ERPNext already does with this option

On this bench, `"autoname": "autoincrement"` is set on:

- `Prospect Opportunity` (`erpnext/crm/doctype/prospect_opportunity/`)
- `CRM Note`
- `Ledger Health`
- `Bisect Nodes`

These are rows whose id the user does not choose and does not print as a document number. The human meaning is in other fields (the note text, the parent prospect, and so on). They were created with this autoname, so their `name` column is `bigint` from the first migrate. Nobody has to rewrite a history of `SINV-…` keys.

Sales Invoice, and the other large transactional DocTypes, stay on `naming_series:` or `field:`. That split is the practical design already in the tree: integer primary key for internal lines, patterned string for documents people say out loud.

---

## 11. Comparison you can keep

| Question | `naming_series:` | `hash` | `autoincrement` | Column `AUTO_INCREMENT` |
| --- | --- | --- | --- | --- |
| Who picks the value? | `getseries` in Python | `make_autoname("hash")` | `nextval` in Python | The storage engine, if the column is omitted |
| Where is the counter? | `tabSeries.current` | none (random) | sequence `*_id_seq` | table metadata |
| Primary key type | `varchar(140)` | `varchar(140)` | `bigint` | not generated by Frappe |
| Known before `INSERT`? | yes | yes | yes | no, unless the client sends it |
| Readable in a phone call? | yes (`SINV-2026-00042`) | no | only as a bare number | only as a bare number |
| Locked row on create? | the one `tabSeries` prefix | no | the sequence (engine-internal) | the auto-increment counter |
| Rollback returns the number? | yes, because the update is in the request transaction | not applicable | not specified in `sequence.py` | engine-specific; usually no |
| Amend suffix `-1`? | yes | only if that code path runs | no | no |
| Document Naming Rule? | yes, if it sets the name first | only as fallback | no | no |
| Migrate converts old rows? | — | — | no | — |

---

## 12. What you gain, and what you pay, if you switch a real document

**Gain, for a DocType that is born this way**

- The clustered primary key is 8 bytes. InnoDB appends the primary key to every secondary index. A short integer makes those indexes smaller than a 20-character invoice number. The gain against a 10-character hash is smaller.
- Inserts do not take the `tabSeries` row lock for that prefix. They take whatever locking `nextval` uses. That matters if one prefix is a hotspot. It does not reduce locking on stock or general ledger tables you did not convert.
- You cannot run out of `varchar(140)` with an integer. You can run out of a signed bigint only at values you will not reach in an ERP. `nocycle` means the sequence will error at its limit instead of wrapping. `get_next_val` turns an empty result into `SequenceGeneratorLimitExceeded`.

**You pay**

- The id no longer contains company, year, or document type. If “one series per company” is a legal or operational requirement, you still need a field and a unique index for that business number. The framework will not add it because autoname changed.
- Every Link and every `parent` stays `varchar(140)`. You did not get integer foreign keys.
- Amendment, naming rules, and `autoname()` on the controller stop running.
- Existing sites are not migrated by `alter`.
- External systems, print formats, and support scripts that embed `SINV-` break.
- Deleted numbers are not reused. Failed inserts may also skip numbers. `max(name)+1` in a report is not the next id.

**A design that keeps today’s names**

Add your own integer column if you need a numeric key for a new integration, and leave `name` as the string the rest of ERPNext already stores. That is a normal DocField (Int or a custom column). It is not `autoname: autoincrement`, and it is not a second primary key. Frappe will not treat that column as the document id. Links will keep storing `name`.

Use `autoname: autoincrement` when the document is new, internal, and never identified by a patterned code. That is the condition the four ERPNext DocTypes in section 10 already satisfy.

---

## 13. Checklist before you change a DocType

1. Confirm the DocType has never been migrated in production, **or** accept that you must write a patch. `MariaDBTable.alter` will not change `name`.
2. Search Link and Dynamic Link fields whose options are this DocType. Each stores `varchar(140)`.
3. Search child tables whose `parenttype` is this DocType. `parent` is `varchar(140)`.
4. Search `name.startswith`, series parsing, and print formats.
5. Decide how amendment should look, because `-1` will not be generated.
6. Decide the business number (the thing on the PDF). It will not be `name` anymore unless you format the integer yourself.
7. Do not assume `nextval` rolls back. Test that on the MariaDB version you run if gaps are unacceptable. This repository does not contain that test.
8. Leave `tabSeries` document types alone unless you have done steps 1–7. The series code is the one that matches how Sales Invoice already works.

---

## 14. Advantages, disadvantages, performance, and the rest of the system

This section is the decision. It uses three sources:

1. The Frappe 15.122.0 code paths already cited (naming, schema, insert order, child load).
2. MariaDB’s documented behaviour for InnoDB primary keys, type conversion, and sequences.
3. What those two imply when they meet. No benchmark was run on this bench. Where a number would require a measurement, the text says “not measured”.

### 14.1 Two different costs

People mix these up. Separate them.

**Cost A — allocating the next id** (once per insert).

- String series: `getseries` runs `SELECT current … FOR UPDATE` on one `tabSeries` row, then `UPDATE current = current + 1`. Both statements use `frappe.db.sql`, so they belong to the request transaction. `Document.insert` calls `set_new_name` **before** `run_before_save_methods` (`document.py`). The row lock therefore starts before `validate` and is released only when the request commits or rolls back. Every other insert that needs the same prefix waits for the whole save, not just for the counter update.
- Integer sequence: `set_new_name` calls `SELECT nextval(...)` and returns. MariaDB implements a sequence as its own table and documents `nextval` as an update of that table ([Sequence Overview](https://mariadb.com/kb/en/sequence-overview/)). `sequence.py` forces `nocache` because a cache of 1000 is written into backups and then skips values. With no cache, each `nextval` is a durable update. That update is not held across `validate`: the statement finishes, then Python continues. Concurrent inserts of the same DocType do not queue on one `tabSeries` row for the rest of the save.

**Cost B — using the id afterwards** (every `get_doc`, every child load, every Link join, every secondary index).

- InnoDB stores the row in the primary key (the clustered index). MariaDB’s InnoDB primary-key page states that the primary key is appended to every secondary index ([InnoDB Primary Key](https://mariadb.com/kb/en/innodb-primary-key/)). A `bigint` primary key is 8 bytes. A `varchar(140)` primary key is the bytes of the actual string under `utf8mb4`, plus length overhead, and the comparison uses the table collation `utf8mb4_unicode_ci` (set in `MariaDBTable.create`). A short integer comparison touches fewer bytes and packs more keys per index page than `SINV-2026-00042` or a 10-character hash.
- Hash names are random. Sequential bigint values append to the right edge of the clustered index. Random primary keys insert into the middle and split pages. That difference is InnoDB’s normal behaviour for clustered indexes; this bench was not profiled to put a millisecond figure on it.

Cost A is why a busy naming series shows up as lock waits on `tabSeries`. Cost B is why the choice still matters on a DocType that is inserted rarely but read and joined constantly. A DocType can win on A and lose on B, or the reverse.

### 14.2 What improves when you use `autoincrement`

**The series row lock goes away for that DocType.** Inserts no longer serialise on `tabSeries` for that prefix. Validation, link checks, and hooks of two such documents can run at the same time. This is the largest concurrency difference the source actually sets up. It applies only to DocTypes whose autoname is `autoincrement`. Sales Invoice on `naming_series:` is unchanged.

**The clustered index and every secondary index of that one table get smaller.** Secondary indexes on `` `tabShelf Label` `` store an 8-byte pointer back to the row instead of a copy of a string name. Point lookups by primary key (`WHERE name = …`) compare integers. For a table with millions of rows and several indexes (GL Entry is the kind of shape people have in mind), this is a real reduction in index pages. How many pages, and whether it moves a given query from disk to memory, was not measured here.

**New rows are appended in primary-key order.** After the sequence, the next `name` is greater than the previous one. InnoDB’s insert hotspot is the end of the clustered index, which is the pattern `AUTO_INCREMENT` is also chosen for. Hash names do the opposite. A naming series is roughly increasing inside one prefix, but the key is still a long string, and many prefixes share one clustered index, so those leaves interleave (`SINV-…`, `SINV-RET-…`, another company prefix).

**The id cannot collide because of case or collation.** `utf8mb4_unicode_ci` treats upper and lower case as equal. `_generate_random_string` exists partly for that reason. A bigint has no case and no collation.

**Delete and failed transactions do not have to rewind a shared counter for correctness.** The sequence is not decremented (`delete_doc.py`). Holes are normal. You do not need `revert_series_if_last`, which itself takes `FOR UPDATE` on the series row.

### 14.3 What gets worse or stays a trap

**`nocache` is a write on every number.** MariaDB’s sequence documentation describes `CACHE` as a count of values kept in memory; values in the cache can be lost on crash, which is why Frappe refuses the default cache of 1000. The price of that safety is one sequence-table update per insert. A classic `AUTO_INCREMENT` column can hand out many values under `innodb_autoinc_lock_mode` without a second table round-trip ([AUTO_INCREMENT](https://mariadb.com/kb/en/auto_increment/)). Frappe does not create that column. Do not expect `autoname: autoincrement` to be as cheap per insert as a native auto-increment column. Expect it to be cheaper in **lock time** than `tabSeries`, and similar or slightly heavier in **writes per id** than a cached auto-increment. Not measured on this MariaDB.

**`nextval` is not described as rolled back in Frappe’s code.** MariaDB documents that sequence values are not transactional in the way a normal `UPDATE` is: a rolled-back transaction does not put the value back (see the sequence overview’s notes on `nextval` and on values that disappear when a cache is discarded). `tabSeries` does give the number back, because it is an ordinary `UPDATE` in the request transaction. After a failed Sales Invoice, the next series number is the same one again if nothing else committed. After a failed autoincrement insert, the next id is typically the one after the lost value. Gaps are a disadvantage if an auditor expects a continuous printed sequence. They are not a performance defect.

**The Python value and the SQL parameter are often strings anyway.** On update, `db_update` does `name = cstr(d["name"])` and binds that string in `WHERE name=%s`. Child load uses `tbl.parent == str(self.name)` (`document.py`). So the hot read path does not keep the id as an integer end to end. MariaDB’s type-conversion rules say that a numeric column compared to a string constant converts the constant, not the column ([Type Conversion](https://mariadb.com/kb/en/type-conversion/)). `WHERE name = '15'` on a `bigint` primary key can still use the primary key. That part is fine.

The dangerous direction is the other way. `parent` and every Link column stay `varchar(140)` (`VARCHAR_LEN`, schema, Link type map). Comparing that varchar **column** to a numeric constant converts the column to a number, and a converted column is not used as a plain index range. Frappe usually avoids this for children by binding `str(self.name)`, so the predicate is string = string and the `parent` index applies. Any custom SQL that writes `parent = 15` or joins `link_column = bigint_name` without casting both sides to the same type steps into that rule. Wrong type in a report is how an autoincrement DocType becomes slower than the varchar one it replaced. The framework’s own child query casts to `str`. Custom queries are your responsibility.

**Lexical order and numeric order are different, and list filters use the column’s type.** As strings, `'10' < '2'`. As bigints, `2 < 10`. A DocType converted in place without rewriting old rows (section 7.7) mixes `SINV-…` text and numeric text in the same varchar column. Sorting and `LIKE` then follow string rules. A true bigint column sorts numerically. Reports that did `ORDER BY name` to get “document order” change meaning. Frappe’s list view more often sorts by `modified`, which is a separate index (`index modified(modified)` on non-child tables). Confirm the sort you actually ship.

**One sequence per DocType, not per company or year.** `tabSeries` isolates counters by prefix (`SINV-2026-` versus `SINV-2027-`, or one prefix per company). The sequence in `create_sequence` is `scrub(doctype + "_id_seq")` — a single counter. You lose the ability to restart each January or to keep two companies’ numbers apart, unless you store that second number in another field and maintain it yourself. That second counter, if you build it with `getseries`, brings Cost A back.

**System-wide, almost nothing else changes type.** Link, Dynamic Link, `parent`, `parenttype`, comments, file attachments, versions, routes, and the desk URL all store or pass the id as text. `autoname: autoincrement` retypes **one** primary key. It does not build integer foreign keys, does not shrink Link indexes on other tables, and does not speed up a join that still probes a `varchar(140)` column. The win is local to `` `tabThatDocType` `` and to the absence of its `tabSeries` lock.

**Code that assumes a string method on `name` breaks when the value is still an int.** `set_new_name` assigns the raw `nextval` integer and returns before `validate_name`. Later, `cstr` is applied on update and `str()` on child load, but not at the moment of naming. A controller that runs after naming and calls `self.name.startswith(...)` throws `AttributeError` if `name` is still an `int`. String DocTypes never do this. This is a correctness fault that shows up as soon as business code treats `name` as text. Search for `.name.startswith`, `name.split`, and f-strings that slice the name before you enable the option.

**Amend, naming rules, and `autoname()` do not run** (section 7.3). That is a functional disadvantage, not a performance one. It is the reason submitted documents with a legal “-1” revision id should stay on the string ladder.

### 14.4 Effect on the rest of Frappe

Think of the system as a web of string ids.

| Piece | Effect of one DocType moving to `autoincrement` |
| --- | --- |
| That DocType’s table | New installs get `name bigint primary key`. `alter` does not convert an existing `varchar(140)`. |
| `tabSeries` | No row is taken for this DocType. Other DocTypes still lock their own prefixes. |
| Child tables of this DocType | `parent` stays `varchar(140)`. Load filters use `str(self.name)`, so the `parent` index still matches a string. Child `name` stays a hash unless the child also sets `autoincrement`. |
| Other documents’ Link fields | Stay `varchar(140)`. They store `"15"`, not an integer foreign key. Their indexes do not shrink. |
| `get_doc` / `db_update` | Lookup is `WHERE name=%s` with a string from `cstr`. The bigint primary key can be used because the constant is converted. |
| Rename | Built for string replacement across Links (`rename_doc.py`). Not a tested bigint migration in the code read for this lesson. |
| Permissions, docstatus, workflow | Keyed by doctype + name as an identifier. They do not care about the recipe, as long as the value is stable and unique. |
| Print formats and integrations | Anything that parses a prefix stops working. Performance is irrelevant if the printed number is wrong. |
| Backup and restore | `sequence.py` disables the cache specifically so a restore does not jump the counter by up to 1000. You still restore a sequence object, not an `AUTO_INCREMENT` counter. Test restore on your MariaDB version; the code comment exists because this has already gone wrong once (MDEV-20070). |
| Postgres sites | Same branch in `postgres/schema.py` (`bigint` plus a sequence, cache avoided because connections are per request). A performance story measured only on MariaDB is not automatically the Postgres story. |

Nothing in this design speeds up Stock Ledger or General Ledger **unless those DocTypes themselves are the ones you change**, and only on a new table or after a migration you write. Changing Customer’s autoname does not make Sales Invoice posting faster.

### 14.5 When to use it

Use `autoname: autoincrement` when all of the following are true:

1. The DocType is created with that autoname **before** the first production migrate, so `MariaDBTable.create` builds `bigint` from the start.
2. The name is an internal row id. Users, PDFs, and external systems do not depend on a prefix, a year, or `-1`.
3. You do not need a separate counter per company or per year. If you do, keep a series, or add an explicit field for that business number and accept its cost.
4. Child rows and Links are acceptable as `varchar` storing the decimal text. You are not trying to build a pure integer schema.
5. Controller code does not call string methods on `self.name` without `cstr` / `str`.
6. Insert concurrency on **this** DocType is limited by `tabSeries`, or the table will be large enough that an 8-byte clustered key is worth more than a readable id.

That is the situation of `CRM Note`, `Prospect Opportunity`, `Ledger Health`, and `Bisect Nodes` on this ERPNext tree.

### 14.6 When not to use it

Do not use it when any of the following are true:

1. The DocType already has production rows with string names. Migrate will not retype `name` or rewrite Links.
2. The number on the document is a business or legal sequence (sales invoice, payment, stock entry). Gaps, a single global counter, and the loss of the amend suffix are the wrong semantics. The `tabSeries` lock is real, but the remedy used in ERPNext is a series per prefix, not a bigint primary key.
3. You need Document Naming Rule or a controller `autoname` method. Both are skipped.
4. You hoped for MariaDB `AUTO_INCREMENT` so the engine would fill the key during `INSERT` with no extra round-trip. This code path is `nextval` plus a normal insert, with `nocache`.
5. You hoped every foreign key in the database would become an integer. Link and `parent` stay `varchar(140)`. A custom query that compares them as numbers can lose the index.
6. The table is small and the name is a code humans type (`field:item_code`, `prompt`). A bigint saves little index space and throws away the id people already know.

### 14.7 A direct recommendation

For a new internal child-like DocType, `autoincrement` matches the code Frappe already ships and avoids a `tabSeries` lock you do not need.

For Sales Invoice and anything like it, keep `naming_series:`. If `tabSeries` lock time is the problem you measured, the source-level levers are: shorten the work done while that lock is held (it is held from `set_new_name` until commit), or split prefixes so different companies do not share one series row. Replacing the primary key with a sequence does not remove posting locks on stock and ledger tables, and it removes the number your users already treat as the document.

If you need both a readable number and a dense key, add the readable number as its own field. Leave `name` as whichever of the two recipes section 11 describes. Do not expect one column to be a legal sequence and an 8-byte clustered key and a stable link target for old rows at the same time.

---

## 15. Operation-by-operation performance comparison

`varchar` here means the normal Frappe primary key: `name varchar(140)` with table collation `utf8mb4_unicode_ci`, value produced by a naming series or a hash.

`autoincrement` means `name bigint primary key` plus `SELECT nextval` on a `nocache` sequence, which is what `MariaDBTable.create` and `set_new_name` actually do. It is **not** a column declared `AUTO_INCREMENT`.

No timings were taken on this bench. “Faster” means fewer bytes, a shorter lock, or a sequential page write, as those mechanisms are described in the Frappe source and in the MariaDB pages linked in section 14. A row marked **same** means the work that dominates the operation does not change with the key type.

| Operation | What Frappe runs | varchar name | autoincrement `bigint` | Why |
| --- | --- | --- | --- | --- |
| Allocate the id | Series: `getseries` → `SELECT current FROM tabSeries WHERE name=%s FOR UPDATE`, then `UPDATE current = current + 1`. Integer: `get_next_sequence_val` → `SELECT nextval(seq)`. Both happen inside `set_new_name`, **before** `validate`. | Slower under concurrency | Faster under concurrency | The series lock is a normal InnoDB row lock in the **request** transaction, so it is held through validation until commit. Every insert with that prefix waits. `nextval` on a MariaDB sequence finishes in its own statement. MariaDB documents a sequence as a table updated by `nextval`, and documents that cached values are skipped after crash or backup; Frappe sets `nocache`, so each call is a durable update, but that update is not held for the rest of the save. |
| Single-row `INSERT` of the parent (the write itself) | `Document.db_insert` writes a row whose primary key is already known. | Random or long key | Shorter, usually appended | InnoDB clusters the row in the primary key ([InnoDB Primary Key](https://mariadb.com/kb/en/innodb-primary-key/)). A `bigint` leaf entry is 8 bytes plus row data. A string leaf entry carries the real `utf8mb4` bytes of the name (up to 4 bytes per character, plus length). Hash names land in random leaves and split pages. Sequence values increase, so new rows go to the right edge of the clustered index. A naming series also increases inside one prefix, but the key is longer and many prefixes share one index. The `nocache` sequence update is an extra write the varchar path does not do; the series path pays a write on `tabSeries` instead. Net insert cost of one quiet row was not measured. The structural difference is page splits and key width, not a second copy of the business columns. |
| `INSERT` of child rows | Child `name` is chosen by the child’s own autoname (usually hash). `parent` is set from the parent name and stored in `varchar(140)`. | Same for the child primary key | Same for the child primary key | `set_new_name` on the child does not inherit the parent’s recipe. A hash child stays `varchar(140)` either way. The parent id is copied into `parent` as characters (`set_parent_in_children`). You do not get a bigint foreign key. Child insert I/O is dominated by the child’s own clustered index, which this option does not change. |
| Load children for a form | `WHERE parent = str(self.name) AND parenttype = … AND parentfield = …` (`document.py`). There is `index parent(parent)`. | Same, if the bind stays a string | Same, if the bind stays a string | Both sides of `parent = %s` are strings, because Frappe casts with `str(self.name)`. MariaDB then uses a plain string comparison and can use the `parent` index. The index entries are the characters of the id. A bigint parent name is usually shorter (`"15"` versus `"SINV-2026-00042"`), so those index entries are slightly smaller. That is a small width win, not a new access method. If a custom query binds an integer instead of a string, MariaDB converts the **varchar column** to a number ([Type Conversion](https://mariadb.com/kb/en/type-conversion/)) and the index on `parent` is no longer a simple range. That makes the bigint design slower, and it is easy to write by mistake. |
| Point read `get_doc` / `WHERE name = %s` | `db_update` and the loader identify the row by `name`. Updates bind `cstr(name)`, so the parameter is a string even when the column is `bigint`. | Wider key, collation compare | Narrower key, integer compare | For `bigint`, MariaDB converts the string constant to a number and can still seek the primary key (constant conversion, not column conversion). The seek compares 8-byte integers. For `varchar`, the seek walks `utf8mb4_unicode_ci`, which applies Unicode case-folding weights, not a raw byte compare. The clustered index is also taller when each key is wider, because a 16 KB InnoDB page holds fewer keys. One row by primary key is still one short seek either way. The difference grows when this seek is repeated (every form open, every link title) or when the buffer pool is tight. Not measured here. |
| `UPDATE` of other columns | `UPDATE tabX SET col=%s, … WHERE name=%s`. The `name` column is removed from the SET list (`db_update`). | Same row rewrite, wider lookup | Same row rewrite, narrower lookup | InnoDB must find the clustered row and rewrite it. Finding it is the point-read case above. The size of the business columns does not change. Updating `name` itself is rare; Frappe’s normal save does not. |
| `DELETE` of the document | Delete the row by primary key. For a series name, `revert_series_if_last` may `SELECT … FOR UPDATE` on `tabSeries` and decrement. Autoincrement is excluded from that call (`delete_doc.py`). | Extra series lock if this name is the last in the prefix | No sequence rewind | Deleting the clustered row is the same shape as a point read plus a page merge. The varchar series path can take the same `tabSeries` lock as insert, and only when the deleted counter equals `current`. The sequence path does not update the sequence on delete. Concurrent deletes of series documents can queue on `tabSeries`. Concurrent deletes of autoincrement documents do not. |
| `INSERT` / `UPDATE` that touches a secondary index | Any indexed DocField (`MariaDBTable` adds `` ADD INDEX `field_index` ``). | Fatter secondary entries | Thinner secondary entries | InnoDB stores the primary key in every secondary index entry so it can find the full row. A secondary index on `posting_date` contains `posting_date` **plus** `name`. Replacing a 20-character invoice id with an 8-byte integer shrinks every secondary index of **this** table. Link indexes on **other** tables stay `varchar(140)` and do not shrink. This is the main steady-state win for a large table with several indexes (ledger-shaped tables). |
| List view, report filter on a normal field (`status`, `company`, `modified`) | Filter uses that column’s index, then looks up the clustered row. Non-child tables have `index modified(modified)`. | Same filter, then a wider PK lookup | Same filter, then a narrower PK lookup | The filter index is unchanged. Each hit still fetches the clustered record by primary key, and that lookup carries the key-width difference above. Sorting by `modified` (the usual list sort) does not sort `name` at all. |
| Filter or sort by `name` | `WHERE name = …`, `name in (…)`, `ORDER BY name`, `name like 'SINV-2026-%'`. | Prefix search works and uses the PK order | Numeric order; prefix search does not mean the same thing | Equality and `IN` on the primary key are the point-read case, faster on the narrower key. `ORDER BY name` on varchar is collation order (`'10' < '2'`). On bigint it is numeric order (`2 < 10`). `LIKE 'SINV-%'` is a range on the varchar primary key and can use that index. A bigint column has no prefix; `LIKE` casts the number to a string and will not use the primary key as a prefix range. Reports that search “all invoices for this series” are a varchar win. Reports that sort “by document number” change meaning, not just speed. |
| Link resolution (Customer on a Sales Invoice) | The Link column lives on the **referencing** table and is `varchar(140)`. The lookup is “load the named Customer”. | Unchanged | Unchanged, unless Customer itself was converted | The index that matters is the Customer primary key, or the varchar Link column on the invoice. Converting Shelf Label to bigint does not change the Customer index or the invoice’s customer column. Converting Customer itself hits the point-read and secondary-index rows above, and every invoice still stores the customer id as text. A join written as `varchar_link = bigint_name` without a cast converts one side under MariaDB’s type rules. Cast the varchar to integer, or bind both as strings, or the optimizer may refuse the index. |
| `tabSeries` and other DocTypes | Untouched. | Their cost stays | Their cost stays | One DocType’s sequence does not remove another DocType’s `FOR UPDATE`. Sales Invoice posting locks (stock, GL, naming of the invoice itself) remain if you only convert a side table. |
| Uniqueness check on `name` | Primary key constraint. Duplicate raises `DuplicateEntryError` on insert. | Collation equality | Integer equality | Two strings that differ only by case are the same key under `utf8mb4_unicode_ci`. Integers do not have that rule. The check is the primary-key insert either way. There is no extra `SELECT` in the happy path. |
| Explicit rename | `rename_doc` updates `name` and then string-replaces that value in Link and `parent` columns. | Supported path | Not what this code was built for | Rename rewrites the clustered primary key (delete + insert inside InnoDB) **and** every varchar that copied it. That cost exists for string names and would exist for integers, and it is large because Frappe stores the id in many tables. This lesson did not trace rename against a bigint column. Do not treat rename as a cheap operation in either design. |
| Transaction rollback after the id was taken | Series: `UPDATE tabSeries` is in the request transaction. Sequence: `nextval` as implemented and documented for MariaDB sequences. | Number usually returns | Number usually does not return | A rolled-back series update releases `current`, so the next successful insert can reuse it. MariaDB does not put a consumed sequence value back when the surrounding transaction rolls back. Reuse is a correctness property. The performance effect is extra holes, not a slower successful commit. |
| Backup and restore | `mysqldump` of tables plus sequence objects. | Dump the varchar rows | Dump rows and the sequence | Frappe’s `nocache` exists so a dump’s `SETVAL` does not jump forward by the default cache (1000). Restore cost is dominated by reloading InnoDB pages. Narrower secondary indexes reload fewer bytes. Sequence restore has a separate history of bugs (the MDEV-20070 comment in `schema.py`). Correctness of the counter after restore is the risk; bulk reload time follows index size. |
| Disk and buffer pool for that table | InnoDB pages of the clustered index and of every secondary index. | More bytes per key | Fewer bytes per key | A page is 16 KB by default. Wider keys mean fewer keys per page, a taller B-tree, and more pages to keep in the buffer pool for the same number of rows. The business columns (`text`, `longtext`, amounts) often dwarf the key. The win is large when the table is many millions of **narrow** rows with several secondary indexes. The win is noise when each row is a fat document and the table is small. Child-table hash names are already short (10 characters), so switching only the parent helps the parent table, not the child clustered index. |

### How to read the table

Count only the rows that your DocType actually hits.

- High-concurrency inserts of one series: the first row dominates. `autoincrement` wins because the lock is short.
- A large ledger-like table that is read by primary key and by secondary indexes: the point-read row and the secondary-index row dominate. `bigint` wins on bytes per key.
- “Find all documents whose name starts with this prefix”, printed numbers, amend suffixes: the filter-by-name row and the product behaviour dominate. `varchar` wins, and the performance gap does not matter if the feature is gone.
- Loading a parent with its children: child load stays a varchar `parent` index either way. Do not expect the form to get faster because the parent key became an integer.
- Converting one master (Customer) and hoping Sales Invoice posting gets faster: the Link row says no.

---

## 16. Source map

| You want to know | Open |
| --- | --- |
| Order of insert vs naming | `frappe/model/document.py` — `insert`, `set_new_name` |
| The ladder | `frappe/model/naming.py` — `set_new_name`, `is_autoincremented`, `validate_name` |
| Series counter | `frappe/model/naming.py` — `getseries`, `revert_series_if_last`, `parse_naming_series` |
| Hash alphabet and why lowercase | `frappe/model/naming.py` — `_get_timestamp_prefix`, `_generate_random_string` |
| Table DDL | `frappe/database/mariadb/schema.py` — `MariaDBTable.create`, `alter` |
| Link column type | `frappe/database/mariadb/database.py` — type map `"Link"` |
| `140` | `frappe/database/database.py` — `VARCHAR_LEN` |
| Sequence DDL and `nextval` | `frappe/database/sequence.py` |
| Wrappers | `frappe/database/database.py` — `create_sequence`, `get_next_sequence_val`, `set_next_sequence_val` |
| Delete does not rewind autoincrement | `frappe/model/delete_doc.py` — the `autoname` branch around `revert_series_if_last` |
| Postgres twin | `frappe/database/postgres/schema.py` |
| Sales Invoice’s recipe | `erpnext/accounts/doctype/sales_invoice/sales_invoice.json` — `"autoname": "naming_series:"` |
