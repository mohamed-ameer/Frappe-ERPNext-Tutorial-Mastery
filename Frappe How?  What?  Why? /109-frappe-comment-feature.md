# Frappe Add Comment Programmatically - Complete Story

## Table of Contents
1. [Introduction](#introduction)
2. [Understanding Comments in Frappe](#understanding-comments-in-frappe)
3. [The `add_comment()` Method](#the-add_comment-method)
4. [Comment Types](#comment-types)
5. [Adding Comments with Mentions](#adding-comments-with-mentions)
6. [Real-World Examples](#real-world-examples)
7. [Comment Storage and Caching](#comment-storage-and-caching)
8. [Retrieving Comments](#retrieving-comments)
9. [Best Practices](#best-practices)
10. [Quick Reference](#quick-reference)

---

## Introduction

### What Are Comments in Frappe?

**Comments** in Frappe are notes, logs, or messages attached to documents. They are used for:
- **User comments** - Manual notes added by users
- **System logs** - Automatic activity tracking (Created, Updated, Submitted, etc.)
- **Workflow logs** - Workflow state changes
- **Assignment logs** - Task assignments and completions
- **Attachment logs** - File uploads and removals
- **Share logs** - Document sharing activities
- **Likes** - User likes on documents

### Why Add Comments Programmatically?

You might want to add comments programmatically to:
- **Log activities** - Track document changes automatically
- **Notify users** - Mention users in comments to send notifications
- **Audit trail** - Keep a record of automated processes
- **Workflow tracking** - Log workflow state changes
- **Integration logs** - Record API calls or external system interactions

---

## Understanding Comments in Frappe

### The Comment DocType

Comments are stored in the **Comment** DocType with these fields:

**Source:** `frappe/frappe/core/doctype/comment/comment.json`

| Field | Type | Description |
|-------|------|-------------|
| `comment_type` | Select | Type of comment (Comment, Info, Created, etc.) |
| `comment_email` | Data | Email of the user who commented |
| `comment_by` | Data | Display name of the commenter |
| `reference_doctype` | Link | DocType of the document being commented on |
| `reference_name` | Dynamic Link | Name of the document being commented on |
| `content` | HTML Editor | The comment text (supports HTML and mentions) |
| `published` | Check | Whether comment is published (for web) |
| `seen` | Check | Whether comment has been seen |
| `subject` | Text | Subject of the comment |
| `ip_address` | Data | IP address of the commenter |

### How Comments Work

1. **User adds comment** → Comment document is created
2. **Comment is saved** → Stored in `Comment` DocType
3. **Cache is updated** → Comment is added to `_comments` field in parent document
4. **Mentions are extracted** → Users mentioned with `@` are notified
5. **Realtime update** → Form is updated in real-time for other users

---

## The `add_comment()` Method

### Method Signature

**Source:** `frappe/frappe/model/document.py` (Lines 1450-1471)

```python
doc.add_comment(
    comment_type="Comment",
    text=None,
    comment_email=None,
    comment_by=None
)
```

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `comment_type` | str | No | `"Comment"` | Type of comment (see Comment Types below) |
| `text` | str | No | `comment_type` | The comment text/content |
| `comment_email` | str | No | `frappe.session.user` | Email of the commenter |
| `comment_by` | str | No | `None` | Display name of the commenter |

### Return Value

Returns a **Comment** document object.

### Basic Usage

```python
# Get a document
doc = frappe.get_doc("Sales Order", "SO-00001")

# Add a simple comment
comment = doc.add_comment("Comment", "This is a test comment")

# The comment is automatically saved
print(comment.name)  # Comment-XXXXX
```

---

## Comment Types

Frappe supports **19 different comment types**. Each type serves a specific purpose.

**Source:** `frappe/frappe/core/doctype/comment/comment.py` (Lines 25-45)

### Complete List of Comment Types

| Comment Type | Purpose | When to Use |
|--------------|---------|-------------|
| `Comment` | User comment | Manual notes, discussions |
| `Like` | User liked document | Social features |
| `Info` | Information log | General information |
| `Label` | Label change | Tag/label modifications |
| `Workflow` | Workflow change | Workflow state transitions |
| `Created` | Document created | Automatic log when doc is created |
| `Submitted` | Document submitted | Automatic log when doc is submitted |
| `Cancelled` | Document cancelled | Automatic log when doc is cancelled |
| `Updated` | Document updated | Automatic log when doc is updated |
| `Deleted` | Document deleted | Automatic log when doc is deleted |
| `Assigned` | Task assigned | When document is assigned to user |
| `Assignment Completed` | Task completed | When assignment is marked complete |
| `Attachment` | File attached | When file is uploaded |
| `Attachment Removed` | File removed | When file is deleted |
| `Shared` | Document shared | When doc is shared with user |
| `Unshared` | Share removed | When sharing is revoked |
| `Bot` | Bot message | Automated bot messages |
| `Relinked` | Link updated | When document links are updated |
| `Edit` | Edit log | Manual edit logs |

### Comment Type Examples

#### 1. User Comment (Most Common)
```python
doc.add_comment("Comment", "Please review this order")
```

#### 2. Info Log
```python
doc.add_comment("Info", "Payment gateway returned success")
```

#### 3. Workflow Log
```python
doc.add_comment("Workflow", "Status changed from Draft to Approved")
```

#### 4. Assignment Log
```python
doc.add_comment("Assigned", "Assigned to John Doe")
```

#### 5. Edit Log
```python
doc.add_comment("Edit", "Delivery date changed from 2024-01-01 to 2024-01-15")
```

---

## Adding Comments with Mentions

### What Are Mentions?

**Mentions** allow you to notify specific users by tagging them with `@` in comments. When a user is mentioned, they receive a notification.

### How Mentions Work

1. **Add mention in HTML** - Use special HTML format for mentions
2. **Comment is saved** - Frappe extracts mentions from HTML
3. **Users are notified** - Mentioned users receive notifications

**Source:** `frappe/frappe/desk/notifications.py` (Lines 390-422, 425-440)

### Mention HTML Format

```html
<span class="mention" data-id="user@example.com" data-value="User Name" data-denotation-char="@">@User Name</span>
```

### Adding Comments with Mentions

```python
# Simple mention
comment_text = '''
<span class="mention" data-id="john@example.com" data-value="John Doe" data-denotation-char="@">@John Doe</span>
Please review this order.
'''

doc.add_comment("Comment", comment_text)
```

### Mentioning Multiple Users

```python
comment_text = '''
<span class="mention" data-id="john@example.com" data-value="John Doe" data-denotation-char="@">@John Doe</span>
<span class="mention" data-id="jane@example.com" data-value="Jane Smith" data-denotation-char="@">@Jane Smith</span>
Please review and approve this order.
'''

doc.add_comment("Comment", comment_text)
```

### Mentioning User Groups

```python
comment_text = '''
<span class="mention" data-id="Sales Team" data-value="Sales Team" data-is-group="true" data-denotation-char="@">@Sales Team</span>
New order received.
'''

doc.add_comment("Comment", comment_text)
```

**Note:** When mentioning a User Group, all members of the group are notified.

---

## Real-World Examples

### Example 1: Add Simple Comment in Server Script

```python
# In a server script or controller method
doc = frappe.get_doc("Sales Order", "SO-00001")
doc.add_comment("Comment", "Order confirmed by customer")
```

### Example 2: Log Workflow Change

```python
# In a workflow action or controller
def on_update(self):
    if self.has_value_changed("workflow_state"):
        old_state = self.get_doc_before_save().workflow_state
        new_state = self.workflow_state

        self.add_comment(
            "Workflow",
            f"Workflow state changed from {old_state} to {new_state}"
        )
```

### Example 3: Add Comment with Mention in API Method

```python
@frappe.whitelist()
def approve_order(order_name):
    doc = frappe.get_doc("Sales Order", order_name)
    doc.workflow_state = "Approved"
    doc.save()

    # Notify the sales manager
    comment_text = '''
    <span class="mention" data-id="manager@example.com" data-value="Sales Manager" data-denotation-char="@">@Sales Manager</span>
    Order has been approved and is ready for processing.
    '''

    doc.add_comment("Comment", comment_text)

    return {"success": True}
```

### Example 4: Log Integration Activity

```python
# After API call to external system
def sync_with_external_system(self):
    try:
        response = make_api_call(self.name)

        if response.get("success"):
            self.add_comment(
                "Info",
                f"Successfully synced with external system. Reference: {response.get('reference_id')}"
            )
        else:
            self.add_comment(
                "Info",
                f"Sync failed: {response.get('error')}"
            )
    except Exception as e:
        self.add_comment("Info", f"Sync error: {str(e)}")
```

### Example 5: Add Comment in Background Job

```python
def process_bulk_orders():
    """Background job to process orders"""
    orders = frappe.get_all("Sales Order", filters={"status": "Pending"})

    for order in orders:
        doc = frappe.get_doc("Sales Order", order.name)

        # Process the order
        process_order(doc)

        # Log the activity
        doc.add_comment(
            "Info",
            f"Processed by background job at {frappe.utils.now()}"
        )

        frappe.db.commit()
```

### Example 6: Add Comment with Custom User

```python
# Add comment as a specific user (e.g., system user)
doc = frappe.get_doc("Sales Order", "SO-00001")

doc.add_comment(
    comment_type="Info",
    text="Automatic inventory check completed",
    comment_email="system@example.com",
    comment_by="System"
)
```

### Example 7: Mention Multiple Users in Approval Workflow

```python
def request_approval(self):
    """Request approval from multiple managers"""

    # Get all users with "Approver" role
    approvers = frappe.get_all(
        "User",
        filters={"enabled": 1},
        fields=["email", "full_name"]
    )

    # Build mention HTML for all approvers
    mentions = []
    for approver in approvers:
        mention = f'''<span class="mention" data-id="{approver.email}" data-value="{approver.full_name}" data-denotation-char="@">@{approver.full_name}</span>'''
        mentions.append(mention)

    comment_text = f"{' '.join(mentions)} Please review and approve this order."

    self.add_comment("Comment", comment_text)
```

---

## Comment Storage and Caching

### How Comments Are Stored

**Source:** `frappe/frappe/core/doctype/comment/comment.py` (Lines 110-150)

1. **Comment DocType** - Each comment is a separate document in `tabComment` table
2. **Parent Document Cache** - Comments are cached in the `_comments` field of the parent document
3. **JSON Format** - The `_comments` field stores a JSON array of comment summaries

### The `_comments` Field Format

```python
# Example of _comments field content
[
    {
        "comment": "This is a test comment",
        "by": "user@example.com",
        "name": "Comment-XXXXX"
    },
    {
        "comment": "Another comment here",
        "by": "admin@example.com",
        "name": "Comment-YYYYY"
    }
]
```

### Cache Behavior

- **Automatic Update** - When a comment is added, the `_comments` field is automatically updated
- **Truncation** - Only the first 100 characters of each comment are stored in cache
- **Limit** - Only the last 100 comments are cached
- **Realtime** - Changes are published via Socket.IO for live updates

**Source:** `frappe/frappe/core/doctype/comment/comment.py` (Lines 177-194)

```python
# Frappe only keeps last 100 comments in cache
frappe.db.sql(
    f"""update `tab{reference_doctype}` set `_comments`=%s where name=%s""",
    (json.dumps(_comments[-100:]), reference_name),
)
```

### Realtime Updates

When a comment is added, Frappe publishes a realtime event:

**Source:** `frappe/frappe/core/doctype/comment/comment.py` (Lines 76-95)

```python
frappe.publish_realtime(
    "docinfo_update",
    {"doc": self.as_dict(), "key": key, "action": action},
    doctype=self.reference_doctype,
    docname=self.reference_name,
    after_commit=True,
)
```

This updates the form in real-time for all users viewing the document.

---

## Retrieving Comments

### Get All Comments for a Document

```python
# Method 1: Using frappe.get_all
comments = frappe.get_all(
    "Comment",
    filters={
        "reference_doctype": "Sales Order",
        "reference_name": "SO-00001"
    },
    fields=["name", "content", "comment_type", "comment_email", "creation"],
    order_by="creation desc"
)

for comment in comments:
    print(f"{comment.comment_email}: {comment.content}")
```

### Get Comments by Type

```python
# Get only user comments (not system logs)
user_comments = frappe.get_all(
    "Comment",
    filters={
        "reference_doctype": "Sales Order",
        "reference_name": "SO-00001",
        "comment_type": "Comment"
    },
    fields=["content", "comment_email", "creation"]
)
```

### Get Comments from Cache

```python
# Get comments from the _comments field (faster but limited)
import json

doc = frappe.get_doc("Sales Order", "SO-00001")
comments_cache = json.loads(doc.get("_comments") or "[]")

for comment in comments_cache:
    print(f"{comment['by']}: {comment['comment']}")
```

### Get Latest Comment

```python
# Get the most recent comment
latest_comment = frappe.get_all(
    "Comment",
    filters={
        "reference_doctype": "Sales Order",
        "reference_name": "SO-00001"
    },
    fields=["content", "comment_email", "creation"],
    order_by="creation desc",
    limit=1
)

if latest_comment:
    print(latest_comment[0].content)
```

### Count Comments

```python
# Count total comments
comment_count = frappe.db.count(
    "Comment",
    filters={
        "reference_doctype": "Sales Order",
        "reference_name": "SO-00001"
    }
)

print(f"Total comments: {comment_count}")
```

### Get Comments with Mentions

```python
# Get comments that mention a specific user
comments_with_mentions = frappe.get_all(
    "Comment",
    filters={
        "reference_doctype": "Sales Order",
        "reference_name": "SO-00001",
        "content": ["like", "%@john@example.com%"]
    },
    fields=["content", "comment_email", "creation"]
)
```

### Using the `get_comments()` Helper Function

**Source:** `frappe/frappe/desk/form/load.py` (Lines 222-246)

```python
from frappe.desk.form.load import get_comments

# Get user comments
comments = get_comments("Sales Order", "SO-00001", "Comment")

# Get assignment logs
assignments = get_comments("Sales Order", "SO-00001", "assignment")

# Get share logs
shares = get_comments("Sales Order", "SO-00001", "share")

# Get attachment logs
attachments = get_comments("Sales Order", "SO-00001", "attachment")

# Get multiple types
multiple_types = get_comments("Sales Order", "SO-00001", ["Comment", "Info", "Workflow"])
```

---

## Best Practices

### Do's ✅

1. **Use appropriate comment types** - Use `Info` for logs, `Comment` for user notes
2. **Add context** - Include relevant details in comment text
3. **Use mentions wisely** - Only mention users who need to be notified
4. **Log important changes** - Track workflow changes, integrations, etc.
5. **Keep comments concise** - Long comments are truncated in cache
6. **Use HTML for formatting** - Comments support HTML for better readability
7. **Check permissions** - Ensure user has permission to add comments
8. **Handle errors** - Wrap in try-except for production code
9. **Commit after bulk operations** - Use `frappe.db.commit()` in background jobs
10. **Use system user for automated comments** - Set `comment_email` to system user

### Don'ts ❌

1. **Don't spam comments** - Avoid adding too many comments in loops
2. **Don't store sensitive data** - Comments are visible to users with read access
3. **Don't use comments for data storage** - Use custom fields instead
4. **Don't mention users unnecessarily** - Avoid notification fatigue
5. **Don't forget to sanitize HTML** - Frappe does this automatically, but be aware
6. **Don't rely on cache** - Use database queries for critical operations
7. **Don't add comments in validate()** - Use `after_insert()` or `on_update()`
8. **Don't hardcode user emails** - Fetch dynamically from User DocType
9. **Don't ignore return value** - The method returns the Comment document
10. **Don't add comments to deleted documents** - Check if document exists first

### When to Use Each Comment Type

| Scenario | Comment Type | Example |
|----------|--------------|---------|
| User adds manual note | `Comment` | "Customer requested expedited shipping" |
| System logs activity | `Info` | "Payment gateway returned success" |
| Workflow state changes | `Workflow` | "Status changed from Draft to Approved" |
| Document is assigned | `Assigned` | "Assigned to John Doe" |
| Assignment completed | `Assignment Completed` | "Task completed by John Doe" |
| File uploaded | `Attachment` | "invoice.pdf attached" |
| File removed | `Attachment Removed` | "invoice.pdf removed" |
| Document shared | `Shared` | "Shared with john@example.com" |
| Share revoked | `Unshared` | "Unshared from john@example.com" |
| Bot/automation | `Bot` | "Automated reminder sent" |
| Manual edit log | `Edit` | "Delivery date changed" |

### Performance Considerations

1. **Batch operations** - If adding many comments, commit periodically
2. **Use cache for display** - Read from `_comments` field for UI
3. **Query database for accuracy** - Use `frappe.get_all()` for critical data
4. **Limit results** - Use `limit` parameter when querying comments
5. **Index optimization** - Frappe automatically indexes `reference_doctype` and `reference_name`

---

## Quick Reference

### Method Signature Cheat Sheet

```python
# Basic usage
doc.add_comment("Comment", "Your comment text")

# With all parameters
doc.add_comment(
    comment_type="Comment",
    text="Your comment text",
    comment_email="user@example.com",
    comment_by="User Name"
)

# With mention
doc.add_comment("Comment", '<span class="mention" data-id="user@example.com" data-value="User Name" data-denotation-char="@">@User Name</span> Please review')
```

### Comment Types Quick List

```python
# User interactions
"Comment"              # User comment
"Like"                 # User liked

# System logs
"Info"                 # Information log
"Created"              # Document created
"Updated"              # Document updated
"Submitted"            # Document submitted
"Cancelled"            # Document cancelled
"Deleted"              # Document deleted

# Workflow
"Workflow"             # Workflow change
"Label"                # Label change

# Assignments
"Assigned"             # Task assigned
"Assignment Completed" # Task completed

# Attachments
"Attachment"           # File attached
"Attachment Removed"   # File removed

# Sharing
"Shared"               # Document shared
"Unshared"             # Share removed

# Other
"Bot"                  # Bot message
"Relinked"             # Link updated
"Edit"                 # Edit log
```

### Common Scenarios

| What You Want | Code |
|---------------|------|
| Add simple comment | `doc.add_comment("Comment", "text")` |
| Log info | `doc.add_comment("Info", "text")` |
| Log workflow change | `doc.add_comment("Workflow", "text")` |
| Mention user | `doc.add_comment("Comment", '<span class="mention" data-id="email">@Name</span> text')` |
| Get all comments | `frappe.get_all("Comment", filters={"reference_doctype": dt, "reference_name": dn})` |
| Get from cache | `json.loads(doc.get("_comments") or "[]")` |
| Count comments | `frappe.db.count("Comment", filters={...})` |

### Testing Your Comments

```python
# Test in Frappe console (bench console)
doc = frappe.get_doc("Sales Order", "SO-00001")

# Add test comment
comment = doc.add_comment("Comment", "Test comment")
print(f"Comment created: {comment.name}")

# Verify it was saved
saved_comment = frappe.get_doc("Comment", comment.name)
print(f"Content: {saved_comment.content}")
print(f"Type: {saved_comment.comment_type}")
print(f"By: {saved_comment.comment_email}")

# Check cache
import json
comments_cache = json.loads(doc.get("_comments") or "[]")
print(f"Comments in cache: {len(comments_cache)}")
```

---

## Summary

### Key Takeaways

1. **`doc.add_comment()`** is the main method to add comments programmatically
2. **19 comment types** available for different purposes
3. **Mentions** notify users using special HTML format
4. **Comments are cached** in the `_comments` field (last 100 comments)
5. **Realtime updates** via Socket.IO keep forms in sync
6. **Use appropriate types** - `Comment` for users, `Info` for logs, `Workflow` for state changes
7. **Retrieve with `frappe.get_all()`** for accurate data
8. **Follow best practices** to avoid performance issues and notification spam

### Additional Resources

- **Source Code:** `frappe/frappe/model/document.py` (Lines 1450-1471)
- **Comment DocType:** `frappe/frappe/core/doctype/comment/`
- **Notifications:** `frappe/frappe/desk/notifications.py` (Lines 390-440)
- **Test Cases:** `frappe/frappe/core/doctype/comment/test_comment.py`