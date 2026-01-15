# Complete Guide to Frappe Notifications

## Table of Contents

1. [Introduction](#introduction)
2. [Theory and Basics](#theory-and-basics)
3. [What are Notifications?](#what-are-notifications)
4. [Why Use Notifications?](#why-use-notifications)
5. [When to Use Notifications](#when-to-use-notifications)
6. [Notification Architecture](#notification-architecture)
7. [Notification Lifecycle](#notification-lifecycle)
8. [Configuration and Setup](#configuration-and-setup)
9. [Events and Triggers](#events-and-triggers)
10. [Conditions](#conditions)
11. [Jinja Templates](#jinja-templates)
12. [Recipients](#recipients)
13. [Channels](#channels)
14. [Advanced Features](#advanced-features)
15. [Examples and Scenarios](#examples-and-scenarios)
16. [Troubleshooting](#troubleshooting)
17. [Testing Notifications](#testing-notifications)
18. [Best Practices](#best-practices)
19. [Common Issues and Solutions](#common-issues-and-solutions)

---

## Introduction

Frappe Notifications are a powerful automation feature that allows you to send automated messages (emails, SMS, Slack messages, or system notifications) when specific events occur in your documents. This comprehensive guide covers everything you need to know about creating, managing, and troubleshooting notifications in Frappe.

---

## Theory and Basics

### Core Concepts

**Notification**: A configuration that defines when, how, and to whom automated messages should be sent based on document events.

**Event**: A specific action or state change in a document that triggers a notification (e.g., New, Save, Submit, Cancel, Value Change).

**Channel**: The medium through which the notification is delivered (Email, SMS, Slack, System Notification).

**Condition**: A Python expression that determines whether a notification should be sent.

**Template**: A Jinja2 template that defines the message content with dynamic data from the document.

---

## What are Notifications?

Notifications in Frappe are automated messaging rules that:

- **Monitor document events**: Track when documents are created, saved, submitted, cancelled, or when specific field values change
- **Evaluate conditions**: Check if certain criteria are met before sending
- **Render dynamic content**: Use Jinja2 templates to create personalized messages
- **Deliver via multiple channels**: Send emails, SMS, Slack messages, or system notifications
- **Target specific recipients**: Send to document owners, assignees, roles, or custom fields

### Key Characteristics

- **Event-driven**: Triggered automatically by document lifecycle events
- **Conditional**: Can include complex logic to determine when to send
- **Template-based**: Use Jinja2 for dynamic content generation
- **Multi-channel**: Support for Email, SMS, Slack, and System Notifications
- **Flexible recipients**: Multiple ways to specify who receives notifications

---

## Why Use Notifications?

### Business Benefits

1. **Automation**: Reduce manual work by automating communication
2. **Consistency**: Ensure all stakeholders are notified consistently
3. **Timeliness**: Immediate notifications when important events occur
4. **Traceability**: All notifications are logged in the Communication doctype
5. **Multi-channel**: Reach users through their preferred communication method

### Use Cases

- **Order Confirmations**: Notify customers when orders are placed
- **Status Updates**: Alert users when document status changes
- **Reminders**: Send reminders for upcoming deadlines or events
- **Approval Requests**: Notify approvers when documents need review
- **Error Alerts**: Alert administrators about critical issues
- **Workflow Notifications**: Keep team members informed about workflow progress

---

## When to Use Notifications

### Appropriate Scenarios

 **Use Notifications When:**
- You need to notify users about document state changes
- You want to send reminders based on dates
- You need to alert users when specific field values change
- You want to automate routine communications
- You need to track and log all automated communications

### When NOT to Use Notifications

 **Avoid Notifications For:**
- Real-time chat or instant messaging
- Complex business logic that should be in Python hooks
- Heavy data processing or calculations
- Operations that require database transactions
- Situations where you need guaranteed delivery (use Email Queue directly)

---

## Notification Architecture

### System Components

```
┌─────────────────┐
│   Document      │
│   (Save/Submit) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Document Hooks  │
│ (on_update, etc)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ run_notifications│
│   (method)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ evaluate_alert │
│  (validation)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Notification   │
│   .send()       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Channel       │
│ (Email/SMS/etc) │
└─────────────────┘
```

### Key Files and Functions

- **`frappe/model/document.py`**: `run_notifications()` method called during document lifecycle
- **`frappe/email/doctype/notification/notification.py`**: Core notification logic
  - `evaluate_alert()`: Validates conditions and triggers notifications
  - `trigger_notifications()`: Handles daily alerts
  - `Notification.send()`: Sends the actual notification

---

## Notification Lifecycle

### Complete Lifecycle Flow

#### 1. **Document Event Occurs**
```
User Action → Document Save/Submit/Cancel
```

#### 2. **Document Hook Triggered**
```
Document.save() → run_post_save_methods() → run_notifications(method)
```

#### 3. **Notification Discovery**
```python
# Cached lookup of enabled notifications for doctype
notifications = frappe.cache.hget("notifications", doctype, _get_notifications)
```

#### 4. **Event Mapping**
```python
event_map = {
    "on_update": "Save",
    "after_insert": "New",
    "on_submit": "Submit",
    "on_cancel": "Cancel",
    "on_change": "Value Change"  # Only if not new document
}
```

#### 5. **Notification Evaluation**
For each matching notification:
- Check if already executed (prevents duplicates)
- Call `evaluate_alert(doc, alert, event)`

#### 6. **Condition Evaluation**
```python
if alert.condition:
    if not frappe.safe_eval(alert.condition, None, context):
        return  # Skip this notification
```

#### 7. **Value Change Check** (if event is "Value Change")
```python
doc_before_save = doc.get_doc_before_save()
if value_not_changed:
    return  # Skip if value didn't actually change
```

#### 8. **Document Reload** (for non-Value Change events)
```python
if event != "Value Change" and not doc.is_new():
    doc.reload()  # Get latest values and comments
```

#### 9. **Send Notification**
```python
alert.send(doc)
```

#### 10. **Context Building**
```python
context = {
    "doc": doc,
    "alert": self,
    "comments": json.loads(doc.get("_comments")) if doc.get("_comments") else None,
    "nowdate": nowdate,
    "frappe": Frappe(utils=get_safe_globals().get("frappe").get("utils"))
}
```

#### 11. **Template Rendering**
```python
subject = frappe.render_template(self.subject, context)
message = frappe.render_template(self.message, context)
```

#### 12. **Recipient Resolution**
```python
recipients, cc, bcc = self.get_list_of_recipients(doc, context)
```

#### 13. **Channel Delivery**
- Email → `send_an_email()`
- SMS → `send_sms()`
- Slack → `send_a_slack_msg()`
- System Notification → `create_system_notification()`

#### 14. **Post-Send Actions**
```python
if self.set_property_after_alert:
    doc.set(fieldname, value)
    doc.save(ignore_permissions=True)
```

#### 15. **Communication Logging**
All notifications are logged in the Communication doctype with `communication_type = "Automated Message"`

### Lifecycle Exceptions

**Notifications are SKIPPED when:**
- `frappe.flags.in_import` is True and `frappe.flags.mute_emails` is True
- `frappe.flags.in_patch` is True
- `frappe.flags.in_install` is True
- Notification is disabled (`enabled = 0`)
- Condition evaluates to False
- For Value Change: value didn't actually change
- Notification already executed in this transaction

---

## Configuration and Setup

### Creating a Notification

1. **Navigate to**: Setup → Email → Notification
2. **Click**: "New"
3. **Fill Required Fields**:
   - Document Type
   - Event
   - Channel
   - Subject (for Email/Slack/System Notification)
   - Message
   - Recipients

### Required Fields

| Field | Required For | Description |
|-------|--------------|-------------|
| Document Type | All | The DocType to monitor |
| Event | All | When to trigger (New, Save, Submit, etc.) |
| Channel | All | Delivery method (Email, SMS, Slack, System Notification) |
| Subject | Email, Slack, System Notification | Message subject (supports Jinja) |
| Message | All | Message body (supports Jinja) |
| Recipients | Email, SMS | Who receives the notification |

### Optional Fields

- **Condition**: Python expression to evaluate
- **Value Changed**: Field to monitor (for Value Change event)
- **Date Changed**: Date field to monitor (for Days Before/After events)
- **Days in Advance**: Number of days (for Days Before/After events)
- **Method**: Method name (for Method event)
- **Set Property After Alert**: Field to update after sending
- **Attach Print**: Attach PDF print format
- **Send to All Assignees**: Include all document assignees

---

## Events and Triggers

### Available Events

#### 1. **New** (`after_insert`)
**When**: Document is first created and inserted into database

**Trigger Point**: After `INSERT` statement completes

**Use Cases**:
- Welcome emails for new users
- Order confirmation emails
- New record notifications

**Example**:
```python
# Notification Configuration
Event: New
Document Type: User
Condition: doc.enabled == 1
Message: Welcome {{ doc.full_name }}!
```

**Lifecycle**:
```
User.create() → after_insert hook → run_notifications("after_insert") → Event: "New"
```

#### 2. **Save** (`on_update`)
**When**: Document is saved (insert or update)

**Trigger Point**: After `INSERT` or `UPDATE` statement completes

**Use Cases**:
- Update confirmations
- Change notifications
- General save notifications

**Example**:
```python
# Notification Configuration
Event: Save
Document Type: Task
Condition: doc.status == "Open"
Message: Task {{ doc.subject }} has been updated.
```

**Lifecycle**:
```
doc.save() → on_update hook → run_notifications("on_update") → Event: "Save"
```

**Note**: Triggers for both new and existing documents

#### 3. **Submit** (`on_submit`)
**When**: Document is submitted (docstatus = 1)

**Trigger Point**: After document is successfully submitted

**Use Cases**:
- Submission confirmations
- Approval requests
- Post-submission workflows

**Example**:
```python
# Notification Configuration
Event: Submit
Document Type: Sales Order
Message: Order {{ doc.name }} has been submitted for processing.
```

**Lifecycle**:
```
doc.submit() → on_submit hook → run_notifications("on_submit") → Event: "Submit"
```

#### 4. **Cancel** (`on_cancel`)
**When**: Document is cancelled (docstatus = 2)

**Trigger Point**: After document is successfully cancelled

**Use Cases**:
- Cancellation notifications
- Refund processing alerts
- Cleanup notifications

**Example**:
```python
# Notification Configuration
Event: Cancel
Document Type: Sales Invoice
Message: Invoice {{ doc.name }} has been cancelled.
```

**Lifecycle**:
```
doc.cancel() → on_cancel hook → run_notifications("on_cancel") → Event: "Cancel"
```

#### 5. **Value Change** (`on_change`)
**When**: A specific field value changes

**Trigger Point**: During document save, after field value comparison

**Use Cases**:
- Status change notifications
- Priority change alerts
- Field-specific updates

**Configuration**:
- **Value Changed**: Field to monitor (required)

**Example**:
```python
# Notification Configuration
Event: Value Change
Document Type: Task
Value Changed: status
Condition: doc.status == "Closed"
Message: Task {{ doc.subject }} has been closed.
```

**Lifecycle**:
```
doc.save() → on_change hook → run_notifications("on_change") → Event: "Value Change"
→ Compare old vs new value → Send if changed
```

**Important Notes**:
- Only triggers if value **actually changed** (not just on save)
- Uses `doc.get_doc_before_save()` to compare values
- Automatically disabled if field doesn't exist
- Type casting is applied for proper comparison

**Value Change Detection Logic**:
```python
doc_before_save = doc.get_doc_before_save()
field_value_before = doc_before_save.get(alert.value_changed) if doc_before_save else None
fieldtype = doc.meta.get_field(alert.value_changed).fieldtype

# Type-aware comparison
if cast(fieldtype, doc.get(alert.value_changed)) == cast(fieldtype, field_value_before):
    return  # Value didn't change, skip notification
```

#### 6. **Days Before**
**When**: A specified number of days before a date field value

**Trigger Point**: Daily via scheduler (runs `trigger_daily_alerts()`)

**Configuration**:
- **Date Changed**: Date/Datetime field to monitor (required)
- **Days in Advance**: Number of days before (required)

**Use Cases**:
- Reminder notifications
- Deadline warnings
- Event reminders

**Example**:
```python
# Notification Configuration
Event: Days Before
Document Type: Task
Date Changed: due_date
Days in Advance: 2
Message: Task {{ doc.subject }} is due in 2 days!
```

**Lifecycle**:
```
Scheduler (daily) → trigger_daily_alerts() → 
For each notification with "Days Before" event:
  → get_documents_for_today() → 
  → Filter documents where date matches (today + days_in_advance) →
  → evaluate_alert() → send()
```

**Date Matching Logic**:
```python
reference_date = add_to_date(nowdate(), days=days_in_advance)
reference_date_start = reference_date + " 00:00:00.000000"
reference_date_end = reference_date + " 23:59:59.000000"

# Find documents where date field is between start and end of reference date
doc_list = frappe.get_all(
    doctype,
    filters=[
        {date_changed: (">=", reference_date_start)},
        {date_changed: ("<=", reference_date_end)},
    ]
)
```

#### 7. **Days After**
**When**: A specified number of days after a date field value

**Trigger Point**: Daily via scheduler (runs `trigger_daily_alerts()`)

**Configuration**:
- **Date Changed**: Date/Datetime field to monitor (required)
- **Days in Advance**: Number of days after (required, but treated as negative)

**Use Cases**:
- Overdue notifications
- Follow-up reminders
- Post-event notifications

**Example**:
```python
# Notification Configuration
Event: Days After
Document Type: Payment Entry
Date Changed: posting_date
Days in Advance: 7
Message: Payment {{ doc.name }} was processed 7 days ago. Please verify.
```

**Lifecycle**:
```
Scheduler (daily) → trigger_daily_alerts() → 
For each notification with "Days After" event:
  → get_documents_for_today() → 
  → Filter documents where date matches (today - days_in_advance) →
  → evaluate_alert() → send()
```

**Date Matching Logic**:
```python
diff_days = -days_in_advance  # Negative for "after"
reference_date = add_to_date(nowdate(), days=diff_days)
# Rest same as Days Before
```

#### 8. **Method**
**When**: A specific document method is called

**Trigger Point**: When the specified method is executed

**Configuration**:
- **Method**: Method name to monitor (required)
  - Examples: `before_insert`, `after_insert`, `on_update`, `validate`, `before_save`, `on_submit`, `on_cancel`, etc.

**Use Cases**:
- Custom method triggers
- Specific workflow steps
- Custom business logic hooks

**Example**:
```python
# Notification Configuration
Event: Method
Document Type: Sales Order
Method: before_submit
Message: Sales Order {{ doc.name }} is about to be submitted.
```

**Lifecycle**:
```
Custom method called → run_notifications(method_name) → 
If alert.event == "Method" and alert.method == method_name:
  → evaluate_alert() → send()
```

**Available Methods**:
- `before_insert`
- `after_insert`
- `validate`
- `before_save`
- `on_update`
- `on_submit`
- `on_cancel`
- `on_update_after_submit`
- `on_change`
- Any custom method defined in your DocType

#### 9. **Custom**
**When**: Manually triggered via code

**Trigger Point**: Explicitly called from Python code

**Use Cases**:
- Custom automation
- Complex business logic
- External integrations

**Example**:
```python
# In your Python code
from frappe.email.doctype.notification.notification import evaluate_alert

notification = frappe.get_doc("Notification", "Custom Notification Name")
evaluate_alert(doc, notification, "Custom")
```

### Event Comparison Table

| Event | Trigger | Frequency | Use Case |
|-------|---------|-----------|----------|
| New | after_insert | Once per document | Welcome messages, confirmations |
| Save | on_update | Every save | General updates |
| Submit | on_submit | Once per document | Submission confirmations |
| Cancel | on_cancel | Once per document | Cancellation notices |
| Value Change | on_change | When field changes | Status updates |
| Days Before | Scheduler (daily) | Daily check | Reminders |
| Days After | Scheduler (daily) | Daily check | Follow-ups |
| Method | Method execution | When method called | Custom triggers |
| Custom | Manual | On demand | Custom automation |

---

## Conditions

### What are Conditions?

Conditions are Python expressions that determine whether a notification should be sent. They are evaluated using `frappe.safe_eval()` with a restricted execution environment.

### Condition Syntax

Conditions are written as Python expressions that return `True` or `False`.

**Basic Syntax**:
```python
doc.fieldname == "value"
doc.fieldname > 100
doc.fieldname in ["option1", "option2"]
```

### Available Variables in Conditions

#### 1. **`doc`** - The Document Object
Access any field from the document:
```python
doc.status == "Open"
doc.total > 1000
doc.customer == "CUST-001"
```

#### 2. **`nowdate()`** - Current Date Function
```python
doc.due_date == nowdate()
doc.due_date < nowdate()
doc.due_date >= nowdate()
```

#### 3. **`frappe.utils`** - Frappe Utilities
Limited Frappe utility functions:
```python
frappe.utils.nowdate()
frappe.utils.add_days(nowdate(), 7)
```

### Condition Examples

#### Simple Field Comparison
```python
# Status check
doc.status == "Open"

# Numeric comparison
doc.total > 10000

# Date comparison
doc.due_date == nowdate()

# String comparison
doc.customer_type == "Company"
```

#### Multiple Conditions (AND)
```python
# All conditions must be true
doc.status == "Open" and doc.priority == "High"
doc.total > 1000 and doc.customer_type == "Company"
```

#### Multiple Conditions (OR)
```python
# Any condition can be true
doc.status == "Open" or doc.status == "Pending"
doc.priority == "High" or doc.priority == "Urgent"
```

#### List/Array Checks
```python
# Check if value is in list
doc.status in ["Open", "Pending", "In Progress"]

# Check if value is not in list
doc.status not in ["Closed", "Cancelled"]
```

#### Null/None Checks
```python
# Check if field is empty
doc.notes is None
doc.notes == ""

# Check if field has value
doc.notes is not None
doc.notes != ""
```

#### Date Comparisons
```python
# Due today
doc.due_date == nowdate()

# Overdue
doc.due_date < nowdate()

# Due in future
doc.due_date > nowdate()

# Due within 7 days
doc.due_date <= frappe.utils.add_days(nowdate(), 7)
```

#### Numeric Comparisons
```python
# Greater than
doc.total > 1000

# Less than
doc.total < 500

# Between values
doc.total >= 1000 and doc.total <= 5000

# Equal to
doc.quantity == 10
```

#### String Operations
```python
# Contains substring
"urgent" in doc.subject.lower()

# Starts with
doc.name.startswith("SO-")

# Ends with
doc.name.endswith("-001")
```

#### Child Table Conditions
```python
# Check if child table has items
len(doc.items) > 0

# Check specific child table field
any(item.item_code == "ITEM-001" for item in doc.items)

# Count items
len([item for item in doc.items if item.quantity > 10]) > 0
```

#### Complex Conditions
```python
# Multiple AND conditions
doc.status == "Open" and doc.priority == "High" and doc.total > 1000

# Mixed AND/OR
(doc.status == "Open" or doc.status == "Pending") and doc.total > 500

# Nested conditions
doc.status == "Open" and (doc.priority == "High" or doc.total > 10000)
```

### Using `doc.get_doc_before_save()` in Conditions

**⚠️ IMPORTANT**: You **CANNOT** directly use `doc.get_doc_before_save()` in conditions because conditions are evaluated using `frappe.safe_eval()` which has restricted access.

**However**, for **Value Change** events, the system automatically compares old vs new values, so you don't need to check this in the condition.

**Workaround for comparing old values**:
If you need to compare with previous values in conditions, you would need to:
1. Store the old value in a custom field before save
2. Use that field in your condition
3. Or use a Python hook to set a flag that your condition can check

**Example Workaround**:
```python
# In your DocType Python file
def before_save(doc, method):
    doc.db_set("_previous_status", doc.get_doc_before_save().status if doc.get_doc_before_save() else None)

# In Notification Condition
doc.status != doc._previous_status and doc.status == "Closed"
```

### Condition Validation

Conditions are validated when the notification is saved:
```python
def validate_condition(self):
    temp_doc = frappe.new_doc(self.document_type)
    if self.condition:
        try:
            frappe.safe_eval(self.condition, None, get_context(temp_doc.as_dict()))
        except Exception:
            frappe.throw(_("The Condition '{0}' is invalid").format(self.condition))
```

**Common Validation Errors**:
- Syntax errors
- Undefined variables
- Invalid field references
- Unsupported operations

### Condition Best Practices

1. **Keep it simple**: Complex logic should be in Python hooks
2. **Test thoroughly**: Test with various document states
3. **Use parentheses**: Clarify operator precedence
4. **Handle None values**: Check for None before comparisons
5. **Document complex conditions**: Add comments in notification description

---

## Jinja Templates

### What is Jinja2?

Jinja2 is a templating engine that allows you to create dynamic content by embedding Python-like expressions in your templates.

### Jinja Syntax Basics

#### Variables
```jinja
{{ doc.name }}
{{ doc.customer }}
{{ doc.total }}
```

#### Expressions
```jinja
{{ doc.total * 1.1 }}  {# Add 10% #}
{{ doc.quantity + 10 }}
{{ doc.name.upper() }}
```

#### Filters
```jinja
{{ doc.name|upper }}
{{ doc.total|currency }}
{{ doc.description|truncate(50) }}
```

#### Control Structures

**If Statements**:
```jinja
{% if doc.status == "Open" %}
    This is an open document.
{% endif %}

{% if doc.total > 1000 %}
    High value order!
{% else %}
    Regular order.
{% endif %}

{% if doc.status == "Open" %}
    Open
{% elif doc.status == "Closed" %}
    Closed
{% else %}
    Unknown
{% endif %}
```

**For Loops**:
```jinja
{% for item in doc.items %}
    Item: {{ item.item_code }} - Qty: {{ item.quantity }}
{% endfor %}

{% for comment in comments %}
    Comment by {{ comment.by }}: {{ comment.comment }}
{% endfor %}
```

### Available Context Variables

#### 1. **`doc`** - The Document Object
Access any field from the document:
```jinja
{{ doc.name }}
{{ doc.customer }}
{{ doc.total }}
{{ doc.status }}
{{ doc.creation }}
{{ doc.modified_by }}
```

**Document Methods**:
```jinja
{{ doc.get_formatted("total") }}
{{ doc.get_url() }}
```

#### 2. **`alert`** - The Notification Object
Access notification configuration:
```jinja
{{ alert.name }}
{{ alert.subject }}
{{ alert.channel }}
```

#### 3. **`comments`** - Document Comments
List of comments on the document:
```jinja
{% if comments %}
    Last comment: {{ comments[-1].comment }} by {{ comments[-1].by }}
{% endif %}

{% for comment in comments %}
    {{ comment.by }}: {{ comment.comment }}
{% endfor %}
```

**Comment Structure**:
```python
{
    "comment": "Comment text",
    "by": "user@example.com",
    "creation": "2024-01-01 10:00:00",
    "comment_type": "Comment"
}
```

#### 4. **`nowdate`** - Current Date Function
```jinja
Today's date: {{ nowdate() }}
Due date: {{ doc.due_date }}
Days until due: {{ (doc.due_date - nowdate()).days }}
```

#### 5. **`frappe.utils`** - Frappe Utilities
Limited Frappe utility functions:
```jinja
{{ frappe.utils.format_date(doc.due_date) }}
{{ frappe.utils.format_currency(doc.total, doc.currency) }}
{{ frappe.utils.format_datetime(doc.creation) }}
```

### Common Jinja Patterns

#### Formatting Numbers
```jinja
{{ doc.total|int }}  {# Integer #}
{{ doc.total|float }}  {# Float #}
{{ doc.total|round(2) }}  {# Round to 2 decimals #}
```

#### Formatting Dates
```jinja
{{ doc.due_date|string|truncate(10) }}  {# Date only #}
{{ doc.creation }}  {# Full datetime #}
```

#### Conditional Content
```jinja
{% if doc.status == "Open" %}
    <p style="color: green;">Status: Open</p>
{% else %}
    <p style="color: red;">Status: {{ doc.status }}</p>
{% endif %}
```

#### Looping Through Child Tables
```jinja
<h4>Items:</h4>
<ul>
{% for item in doc.items %}
    <li>{{ item.item_code }} - {{ item.quantity }} x {{ item.rate }}</li>
{% endfor %}
</ul>
```

#### Accessing Last Comment
```jinja
{% if comments %}
    <p>Last comment: {{ comments[-1].comment }}</p>
    <p>By: {{ comments[-1].by }}</p>
{% endif %}
```

#### Safe String Operations
```jinja
{{ doc.name|upper }}  {# Uppercase #}
{{ doc.name|lower }}  {# Lowercase #}
{{ doc.description|truncate(100) }}  {# Truncate #}
{{ doc.description|replace("\n", "<br>") }}  {# Replace newlines #}
```

### HTML Email Templates

#### Basic HTML Structure
```jinja
<h3>Order Notification</h3>

<p>Dear Customer,</p>

<p>Your order <strong>{{ doc.name }}</strong> has been {{ doc.status }}.</p>

<h4>Order Details:</h4>
<ul>
    <li>Customer: {{ doc.customer }}</li>
    <li>Total: {{ doc.grand_total }}</li>
    <li>Date: {{ doc.transaction_date }}</li>
</ul>

{% if comments %}
    <h4>Latest Comment:</h4>
    <p>{{ comments[-1].comment }}</p>
{% endif %}
```

#### Styled HTML
```jinja
<div style="font-family: Arial, sans-serif;">
    <h2 style="color: #333;">Order {{ doc.name }}</h2>
    
    <table style="border-collapse: collapse; width: 100%;">
        <tr>
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Customer:</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">{{ doc.customer }}</td>
        </tr>
        <tr>
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Total:</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">{{ doc.grand_total }}</td>
        </tr>
    </table>
</div>
```

### Markdown Templates

```jinja
# Order Notification

**Order Number:** {{ doc.name }}

**Status:** {{ doc.status }}

## Details

- Customer: {{ doc.customer }}
- Total: {{ doc.grand_total }}
- Date: {{ doc.transaction_date }}

{% if comments %}
## Latest Comment

{{ comments[-1].comment }}

_By: {{ comments[-1].by }}_
{% endif %}
```

### Plain Text Templates

```jinja
Order Notification

Order Number: {{ doc.name }}
Status: {{ doc.status }}

Details:
- Customer: {{ doc.customer }}
- Total: {{ doc.grand_total }}
- Date: {{ doc.transaction_date }}

{% if comments %}
Latest Comment:
{{ comments[-1].comment }}
By: {{ comments[-1].by }}
{% endif %}
```

### Advanced Jinja Examples

#### Complex Conditional Logic
```jinja
{% if doc.status == "Open" %}
    {% if doc.priority == "High" %}
        <p style="color: red;">URGENT: High priority open task</p>
    {% else %}
        <p>Open task</p>
    {% endif %}
{% elif doc.status == "Closed" %}
    <p style="color: green;">Task completed</p>
{% else %}
    <p>Task status: {{ doc.status }}</p>
{% endif %}
```

#### Looping with Conditions
```jinja
<h4>High Value Items:</h4>
<ul>
{% for item in doc.items %}
    {% if item.amount > 1000 %}
        <li><strong>{{ item.item_code }}</strong>: {{ item.amount }}</li>
    {% endif %}
{% endfor %}
</ul>
```

#### Accessing Related Documents
```jinja
{% set customer_doc = frappe.get_doc("Customer", doc.customer) %}
<p>Customer Email: {{ customer_doc.email_id }}</p>
<p>Customer Phone: {{ customer_doc.mobile_no }}</p>
```

**Note**: Direct database access in templates is limited. Use with caution.

#### Date Calculations
```jinja
{% set days_until_due = (doc.due_date - nowdate()).days %}
{% if days_until_due < 0 %}
    <p style="color: red;">OVERDUE by {{ -days_until_due }} days</p>
{% elif days_until_due == 0 %}
    <p style="color: orange;">Due today!</p>
{% else %}
    <p>Due in {{ days_until_due }} days</p>
{% endif %}
```

#### String Manipulation
```jinja
{% set customer_name = doc.customer_name|upper %}
Dear {{ customer_name }},

{% if doc.description %}
    <p>{{ doc.description|truncate(200) }}</p>
{% endif %}
```

### Template Validation

Templates are validated when the notification is saved:
```python
validate_template(self.subject)  # For Email/Slack/System Notification
validate_template(self.message)
```

**Common Template Errors**:
- Syntax errors (missing `{% endfor %}`, etc.)
- Undefined variables
- Invalid filter usage
- Missing quotes in expressions

### Template Best Practices

1. **Test templates**: Preview with sample data
2. **Handle None values**: Use `{% if doc.field %}` before accessing
3. **Escape HTML**: Be careful with user-generated content
4. **Keep it readable**: Use proper formatting and indentation
5. **Document complex logic**: Add comments for future maintainers

---

## Recipients

### Recipient Configuration

Recipients are configured in the "Recipients" table of the Notification form. Each recipient can have:
- Receiver by Document Field
- Receiver by Role
- Condition (optional)
- CC (optional)
- BCC (optional)

### Recipient Types

#### 1. **Receiver by Document Field**

**Single Field**:
```python
# Configuration
receiver_by_document_field: "owner"
# Sends to document owner's email
```

**Email Field**:
```python
# Configuration
receiver_by_document_field: "contact_email"
# Sends to contact_email field value
```

**User Link Field**:
```python
# Configuration
receiver_by_document_field: "assigned_to"
# Sends to assigned_to user's email
```

**Multiple Emails (Comma-separated)**:
```python
# Configuration
receiver_by_document_field: "email_list"
# If email_list = "user1@example.com,user2@example.com"
# Sends to both users
```

**Child Table Field**:
```python
# Configuration
receiver_by_document_field: "email_id,email_ids"
# Format: "fieldname,child_table_fieldname"
# Sends to all email_id values in email_ids child table
```

**Example - Child Table Recipients**:
```python
# Contact DocType has email_ids child table
# Each row has email_id field
receiver_by_document_field: "email_id,email_ids"
# Sends to all email addresses in the email_ids table
```

#### 2. **Receiver by Role**

**Single Role**:
```python
# Configuration
receiver_by_role: "System Manager"
# Sends to all users with System Manager role
```

**Multiple Roles** (multiple recipient rows):
```python
# Row 1
receiver_by_role: "Sales Manager"

# Row 2
receiver_by_role: "Sales User"
# Sends to all users in both roles
```

**How it Works**:
```python
emails = get_info_based_on_role(recipient.receiver_by_role, "email", ignore_permissions=True)
# Returns list of email addresses for all users with the role
```

#### 3. **Send to All Assignees**

**Configuration**:
```python
# In Notification form
send_to_all_assignees: 1 (checked)
```

**How it Works**:
```python
# Gets all open ToDo assignments for the document
assignees = frappe.get_all(
    "ToDo",
    filters={
        "status": "Open",
        "reference_name": doc.name,
        "reference_type": doc.doctype
    },
    fields=["allocated_to"]
)
# Returns list of email addresses
```

**Use Cases**:
- Task assignments
- Document reviews
- Approval workflows

#### 4. **CC (Carbon Copy)**

**Static CC**:
```python
# Configuration
cc: "manager@example.com"
# Always includes this email in CC
```

**Dynamic CC (Jinja)**:
```python
# Configuration
cc: "{{ doc.manager_email }}"
# Includes manager_email field value in CC
```

**Multiple CC (Comma-separated)**:
```python
# Configuration
cc: "{{ doc.manager_email }},{{ doc.supervisor_email }}"
# Includes both emails in CC
```

**CC from Template**:
```python
# Configuration
cc: "{{ doc.customer }},admin@example.com"
# Renders template and splits by comma/newline
```

#### 5. **BCC (Blind Carbon Copy)**

**Same as CC**, but recipients are hidden:
```python
# Configuration
bcc: "archive@example.com"
# Includes this email in BCC (hidden from other recipients)
```

### Recipient Conditions

Each recipient can have its own condition:

**Example**:
```python
# Recipient 1
receiver_by_document_field: "owner"
condition: doc.status == "Open"
# Only sends to owner if status is Open

# Recipient 2
receiver_by_role: "Sales Manager"
condition: doc.total > 10000
# Only sends to Sales Manager if total > 10000
```

**How Recipient Conditions Work**:
```python
for recipient in self.recipients:
    if recipient.condition:
        if not frappe.safe_eval(recipient.condition, None, context):
            continue  # Skip this recipient
    # Add recipient to list
```

### Recipient Resolution Process

#### Step 1: Collect Recipients
```python
recipients = []
cc = []
bcc = []

for recipient in self.recipients:
    # Check recipient condition
    if recipient.condition:
        if not frappe.safe_eval(recipient.condition, None, context):
            continue
    
    # Resolve receiver_by_document_field
    if recipient.receiver_by_document_field:
        # Handle child table fields
        if "," in recipient.receiver_by_document_field:
            # Child table: "fieldname,child_table_fieldname"
            fields = recipient.receiver_by_document_field.split(",")
            for row in doc.get(fields[1]):
                email = row.get(fields[0])
                if validate_email_address(email):
                    recipients.append(email)
        else:
            # Parent field
            email_value = doc.get(recipient.receiver_by_document_field)
            if validate_email_address(email_value):
                # Handle comma-separated emails
                emails = email_value.replace(",", "\n").split("\n")
                recipients.extend(emails)
    
    # Resolve receiver_by_role
    if recipient.receiver_by_role:
        emails = get_info_based_on_role(recipient.receiver_by_role, "email")
        recipients.extend(emails)
    
    # Resolve CC
    if recipient.cc:
        cc_emails = get_emails_from_template(recipient.cc, context)
        cc.extend(cc_emails)
    
    # Resolve BCC
    if recipient.bcc:
        bcc_emails = get_emails_from_template(recipient.bcc, context)
        bcc.extend(bcc_emails)
```

#### Step 2: Add Assignees (if enabled)
```python
if self.send_to_all_assignees:
    assignee_emails = get_assignees(doc)
    recipients.extend(assignee_emails)
```

#### Step 3: Deduplicate
```python
return list(set(recipients)), list(set(cc)), list(set(bcc))
```

### Recipient Examples

#### Example 1: Simple Owner Notification
```python
# Notification Configuration
Recipients:
  - receiver_by_document_field: "owner"
```

#### Example 2: Multiple Recipients
```python
# Notification Configuration
Recipients:
  - receiver_by_document_field: "owner"
  - receiver_by_role: "Sales Manager"
  - receiver_by_document_field: "contact_email"
```

#### Example 3: Conditional Recipients
```python
# Notification Configuration
Recipients:
  - receiver_by_document_field: "owner"
    condition: doc.status == "Open"
  - receiver_by_role: "System Manager"
    condition: doc.total > 10000
```

#### Example 4: Child Table Recipients
```python
# Contact DocType with email_ids child table
# Notification Configuration
Recipients:
  - receiver_by_document_field: "email_id,email_ids"
    # Sends to all email addresses in email_ids table
```

#### Example 5: CC and BCC
```python
# Notification Configuration
Recipients:
  - receiver_by_document_field: "owner"
    cc: "manager@example.com"
    bcc: "archive@example.com"
```

#### Example 6: Dynamic CC
```python
# Notification Configuration
Recipients:
  - receiver_by_document_field: "owner"
    cc: "{{ doc.manager_email }},{{ doc.supervisor_email }}"
```

#### Example 7: Assignees
```python
# Notification Configuration
send_to_all_assignees: 1
Recipients:
  - receiver_by_role: "Sales Manager"
    # Sends to all assignees + Sales Manager role
```

### SMS Recipients

For SMS channel, recipients are resolved differently:

```python
def get_receiver_list(self, doc, context):
    receiver_list = []
    for recipient in self.recipients:
        if recipient.condition:
            if not frappe.safe_eval(recipient.condition, None, context):
                continue
        
        # Owner's mobile number
        if recipient.receiver_by_document_field == "owner":
            receiver_list += get_user_info([dict(user_name=doc.get("owner"))], "mobile_no")
        
        # Document field with phone number
        elif recipient.receiver_by_document_field:
            receiver_list.append(doc.get(recipient.receiver_by_document_field))
        
        # Role-based mobile numbers
        if recipient.receiver_by_role:
            receiver_list += get_info_based_on_role(recipient.receiver_by_role, "mobile_no")
    
    return receiver_list
```

**SMS Recipient Requirements**:
- Field must be of type "Phone" or "Data" with phone number
- For owner: Uses User's mobile_no field
- For roles: Uses User's mobile_no field for all users in role

---

## Channels

### Available Channels

#### 1. **Email**

**Configuration**:
- Subject (required, supports Jinja)
- Message (required, supports Jinja)
- Sender (optional, Email Account)
- Sender Email (auto-filled from Email Account)
- Recipients (required)
- Attach Print (optional)
- Send System Notification (optional, also sends system notification)

**Features**:
- HTML/Markdown/Plain Text support
- Print format attachments
- CC and BCC support
- Communication logging
- Email Queue integration

**How it Works**:
```python
def send_an_email(self, doc, context):
    # Render templates
    subject = frappe.render_template(self.subject, context)
    message = frappe.render_template(self.message, context)
    
    # Get recipients
    recipients, cc, bcc = self.get_list_of_recipients(doc, context)
    
    # Get sender
    sender = formataddr((self.sender, self.sender_email)) if self.sender else None
    
    # Create communication record
    communication = make_communication(
        doctype=get_reference_doctype(doc),
        name=get_reference_name(doc),
        content=message,
        subject=subject,
        sender=sender,
        recipients=recipients,
        communication_medium="Email",
        send_email=False,
        attachments=attachments,
        cc=cc,
        bcc=bcc,
        communication_type="Automated Message",
    )
    
    # Send email
    frappe.sendmail(
        recipients=recipients,
        subject=subject,
        sender=sender,
        cc=cc,
        bcc=bcc,
        message=message,
        reference_doctype=get_reference_doctype(doc),
        reference_name=get_reference_name(doc),
        attachments=attachments,
        communication=communication.get("name"),
    )
```

**Email Account Setup**:
1. Setup → Email Domain → Create Email Domain
2. Setup → Email Account → Create Email Account
3. Link Email Account to Notification (Sender field)

#### 2. **SMS**

**Configuration**:
- Message (required, supports Jinja)
- Recipients (required, must be phone fields)

**Prerequisites**:
- SMS Settings must be configured
- SMS Provider must be set up

**How it Works**:
```python
def send_sms(self, doc, context):
    receiver_list = self.get_receiver_list(doc, context)
    message = frappe.render_template(self.message, context)
    
    send_sms(
        receiver_list=receiver_list,
        msg=message,
    )
```

**SMS Recipient Fields**:
- Must be Phone type fields
- Or Data fields containing phone numbers
- Owner field uses User's mobile_no
- Role-based uses User's mobile_no for all users in role

#### 3. **Slack**

**Configuration**:
- Subject (required, supports Jinja)
- Message (required, supports Jinja)
- Slack Webhook URL (required)

**Prerequisites**:
- Slack Webhook URL must be created
- Setup → Integrations → Slack Webhook URL

**How it Works**:
```python
def send_a_slack_msg(self, doc, context):
    message = frappe.render_template(self.message, context)
    
    send_slack_message(
        webhook_url=self.slack_webhook_url,
        message=message,
        reference_doctype=get_reference_doctype(doc),
        reference_name=get_reference_name(doc),
    )
```

**Slack Webhook Setup**:
1. Create Slack App in Slack
2. Enable Incoming Webhooks
3. Create Webhook URL
4. Setup → Integrations → Slack Webhook URL → Create
5. Link to Notification

#### 4. **System Notification**

**Configuration**:
- Subject (required, supports Jinja)
- Message (required, supports Jinja)
- Recipients (required)

**Features**:
- Appears in notification bell (top right)
- Clickable links to documents
- Can be combined with Email channel

**How it Works**:
```python
def create_system_notification(self, doc, context):
    subject = frappe.render_template(self.subject, context)
    message = frappe.render_template(self.message, context)
    recipients, cc, bcc = self.get_list_of_recipients(doc, context)
    
    users = recipients + cc + bcc
    
    notification_doc = {
        "type": "Alert",
        "document_type": get_reference_doctype(doc),
        "document_name": get_reference_name(doc),
        "subject": subject,
        "from_user": doc.modified_by or doc.owner,
        "email_content": message,
    }
    
    enqueue_create_notification(users, notification_doc)
```

**System Notification Features**:
- Real-time updates
- Document links
- Notification center
- Mark as read/unread

### Channel Comparison

| Channel | Subject | Message | Recipients | Attachments | Real-time |
|---------|---------|---------|------------|-------------|-----------|
| Email | ✅ | ✅ | ✅ | ✅ | ❌ |
| SMS | ❌ | ✅ | ✅ | ❌ | ❌ |
| Slack | ✅ | ✅ | N/A | ❌ | ✅ |
| System Notification | ✅ | ✅ | ✅ | ❌ | ✅ |

### Multi-Channel Notifications

You can send the same notification through multiple channels by:
1. Creating separate notifications for each channel
2. Using "Send System Notification" checkbox with Email channel

**Example - Email + System Notification**:
```python
# Single Notification
Channel: Email
Send System Notification: ✅ (checked)
# Sends both email and system notification
```

---

## Advanced Features

### 1. Set Property After Alert

**Purpose**: Automatically update a document field after sending a notification.

**Configuration**:
- Set Property After Alert: Field to update
- Value To Be Set: Value to set

**How it Works**:
```python
if self.set_property_after_alert:
    allow_update = True
    # Check if field allows update on submit
    if (doc.docstatus.is_submitted() and 
        not doc.meta.get_field(self.set_property_after_alert).allow_on_submit):
        allow_update = False
    
    if allow_update and not doc.flags.in_notification_update:
        fieldname = self.set_property_after_alert
        value = self.property_value
        
        # Handle numeric fields
        if doc.meta.get_field(fieldname).fieldtype in frappe.model.numeric_fieldtypes:
            value = frappe.utils.cint(value)
        
        doc.reload()
        doc.set(fieldname, value)
        doc.flags.updater_reference = {
            "doctype": self.doctype,
            "docname": self.name,
            "label": _("via Notification"),
        }
        doc.flags.in_notification_update = True
        doc.save(ignore_permissions=True)
        doc.flags.in_notification_update = False
```

**Use Cases**:
- Mark document as "notified"
- Set notification timestamp
- Update status after notification
- Track notification sent flag

**Example**:
```python
# Notification Configuration
Set Property After Alert: notification_sent
Value To Be Set: 1

# After notification is sent, document.notification_sent = 1
```

**Limitations**:
- Cannot update fields that don't allow update on submit (if document is submitted)
- Uses `ignore_permissions=True` to bypass permission checks
- Prevents infinite loops with `doc.flags.in_notification_update`

### 2. Attach Print

**Purpose**: Attach a PDF print format to email notifications.

**Configuration**:
- Attach Print: ✅ (checked)
- Print Format: Select print format

**How it Works**:
```python
def get_attachment(self, doc):
    if not self.attach_print:
        return None
    
    print_settings = frappe.get_doc("Print Settings", "Print Settings")
    
    # Check if draft/cancelled documents are allowed
    if (doc.docstatus == 0 and not print_settings.allow_print_for_draft) or \
       (doc.docstatus == 2 and not print_settings.allow_print_for_cancelled):
        status = "Draft" if doc.docstatus == 0 else "Cancelled"
        frappe.throw(_("Not allowed to attach {0} document").format(status))
    
    return [{
        "print_format_attachment": 1,
        "doctype": doc.doctype,
        "name": doc.name,
        "print_format": self.print_format,
        "print_letterhead": print_settings.with_letterhead,
        "lang": frappe.db.get_value("Print Format", self.print_format, "default_print_language") 
                if self.print_format else "en",
    }]
```

**Requirements**:
- Print Settings must allow print for draft/cancelled (if applicable)
- Print Format must exist for the DocType
- Only works with Email channel

**Use Cases**:
- Invoice PDFs
- Quotation PDFs
- Report attachments
- Document summaries

### 3. Standard Notifications

**Purpose**: Store notification templates in files for version control.

**Configuration**:
- Is Standard: ✅ (checked)
- Module: Select module

**How it Works**:
```python
def get_template(self, md_as_html=False):
    module = get_doc_module(self.module, self.doctype, self.name)
    path = os.path.join(os.path.dirname(module.__file__), frappe.scrub(self.name))
    extension = FORMATS.get(self.message_type, ".md")
    file_path = path + extension
    
    if os.path.exists(file_path):
        with open(file_path) as f:
            template = f.read()
    
    if extension == ".md":
        return frappe.utils.md_to_html(template)
    
    return template
```

**File Structure**:
```
apps/frappe/frappe/module_name/doctype/notification/
  notification_name.md  (or .html, .txt)
  notification_name.py  (optional, for get_context)
```

**Custom Context**:
```python
# notification_name.py
import frappe

def get_context(context):
    # Add custom variables to context
    context["custom_var"] = "value"
    context["custom_data"] = frappe.get_all("DocType")
    return context
```

**Benefits**:
- Version control
- Easy updates
- Reusable templates
- Custom context functions

**Limitations**:
- Cannot edit in UI (must disable and duplicate)
- Requires developer mode to create

### 4. Custom Events

**Purpose**: Trigger notifications from custom Python code.

**How to Use**:
```python
from frappe.email.doctype.notification.notification import evaluate_alert

# Get notification
notification = frappe.get_doc("Notification", "Custom Notification Name")

# Trigger
evaluate_alert(doc, notification, "Custom")
```

**Use Cases**:
- Custom workflows
- External integrations
- Complex business logic
- Scheduled tasks

### 5. Notification Caching

**Purpose**: Improve performance by caching enabled notifications.

**How it Works**:
```python
# Cache key: "notifications:{doctype}"
self.flags.notifications = frappe.cache.hget("notifications", self.doctype, _get_notifications)

# Cache is cleared when:
# - Notification is saved/updated
# - Notification is deleted
frappe.cache.hdel("notifications", self.document_type)
```

**Cache Invalidation**:
- On notification save/update
- On notification delete
- Manual cache clear

---

## Examples and Scenarios

### Scenario 1: Order Confirmation Email

**Requirement**: Send email to customer when Sales Order is submitted.

**Configuration**:
```
Document Type: Sales Order
Event: Submit
Channel: Email
Subject: Order Confirmation - {{ doc.name }}
Message: |
    <h3>Thank you for your order!</h3>
    <p>Your order <strong>{{ doc.name }}</strong> has been confirmed.</p>
    <h4>Order Details:</h4>
    <ul>
        <li>Customer: {{ doc.customer }}</li>
        <li>Total: {{ doc.grand_total }}</li>
        <li>Date: {{ doc.transaction_date }}</li>
    </ul>
Recipients:
  - receiver_by_document_field: contact_email
```

### Scenario 2: Task Assignment Notification

**Requirement**: Notify assignees when task status changes to "In Progress".

**Configuration**:
```
Document Type: Task
Event: Value Change
Value Changed: status
Condition: doc.status == "In Progress"
Channel: System Notification
Subject: Task {{ doc.subject }} started
Message: Task {{ doc.subject }} has been started.
Recipients:
  - (empty, uses send_to_all_assignees)
Send To All Assignees: ✅
```

### Scenario 3: Overdue Invoice Reminder

**Requirement**: Send reminder 3 days after invoice due date.

**Configuration**:
```
Document Type: Sales Invoice
Event: Days After
Date Changed: due_date
Days in Advance: 3
Condition: doc.outstanding_amount > 0
Channel: Email
Subject: Payment Reminder - Invoice {{ doc.name }}
Message: |
    <p>Dear {{ doc.customer_name }},</p>
    <p>This is a reminder that invoice <strong>{{ doc.name }}</strong> 
    is overdue by 3 days.</p>
    <p>Outstanding Amount: {{ doc.outstanding_amount }}</p>
Recipients:
  - receiver_by_document_field: contact_email
```

### Scenario 4: High Value Order Alert

**Requirement**: Notify manager when order value exceeds $10,000.

**Configuration**:
```
Document Type: Sales Order
Event: Submit
Condition: doc.grand_total > 10000
Channel: Email
Subject: High Value Order Alert - {{ doc.name }}
Message: |
    <h3>High Value Order Alert</h3>
    <p>Order <strong>{{ doc.name }}</strong> with value 
    <strong>{{ doc.grand_total }}</strong> has been submitted.</p>
Recipients:
  - receiver_by_role: Sales Manager
    cc: "finance@example.com"
```

### Scenario 5: Status Change with Comment

**Requirement**: Send notification when document status changes, including latest comment.

**Configuration**:
```
Document Type: Issue
Event: Value Change
Value Changed: status
Channel: Email
Subject: Issue {{ doc.name }} - Status Changed
Message: |
    <h3>Status Update</h3>
    <p>Issue <strong>{{ doc.name }}</strong> status has been changed to 
    <strong>{{ doc.status }}</strong>.</p>
    
    {% if comments %}
    <h4>Latest Comment:</h4>
    <p>{{ comments[-1].comment }}</p>
    <p><em>By: {{ comments[-1].by }}</em></p>
    {% endif %}
Recipients:
  - receiver_by_document_field: owner
  - receiver_by_role: Support Team
```

### Scenario 6: Multi-Channel Notification

**Requirement**: Send email and Slack notification for critical issues.

**Email Notification**:
```
Document Type: Issue
Event: New
Condition: doc.priority == "Critical"
Channel: Email
Subject: Critical Issue - {{ doc.name }}
Message: Critical issue {{ doc.name }} has been created.
Recipients:
  - receiver_by_role: Support Manager
Send System Notification: ✅
```

**Slack Notification**:
```
Document Type: Issue
Event: New
Condition: doc.priority == "Critical"
Channel: Slack
Subject: Critical Issue Alert
Message: 🚨 Critical issue {{ doc.name }} created: {{ doc.subject }}
Slack Webhook URL: [Your Slack Webhook]
```

### Scenario 7: Reminder Before Deadline

**Requirement**: Send reminder 2 days before task deadline.

**Configuration**:
```
Document Type: Task
Event: Days Before
Date Changed: due_date
Days in Advance: 2
Condition: doc.status != "Completed"
Channel: Email
Subject: Reminder: Task {{ doc.subject }} due in 2 days
Message: |
    <p>This is a reminder that task <strong>{{ doc.subject }}</strong> 
    is due in 2 days ({{ doc.due_date }}).</p>
Recipients:
  - receiver_by_document_field: owner
  - (all assignees via send_to_all_assignees)
Send To All Assignees: ✅
```

### Scenario 8: Conditional Recipients

**Requirement**: Send to different recipients based on order value.

**Configuration**:
```
Document Type: Sales Order
Event: Submit
Channel: Email
Subject: New Order - {{ doc.name }}
Message: New order {{ doc.name }} has been submitted.
Recipients:
  - receiver_by_role: Sales Manager
    condition: doc.grand_total > 50000
  - receiver_by_role: Sales User
    condition: doc.grand_total <= 50000
  - receiver_by_document_field: owner
```

### Scenario 9: Child Table Recipients

**Requirement**: Send to all email addresses in Contact's email_ids child table.

**Configuration**:
```
Document Type: Contact
Event: Save
Channel: Email
Subject: Contact Updated - {{ doc.first_name }}
Message: Contact {{ doc.first_name }} {{ doc.last_name }} has been updated.
Recipients:
  - receiver_by_document_field: email_id,email_ids
    # Format: "fieldname,child_table_fieldname"
```

### Scenario 10: Post-Notification Update

**Requirement**: Mark document as notified after sending notification.

**Configuration**:
```
Document Type: Sales Order
Event: Submit
Channel: Email
Subject: Order Confirmation - {{ doc.name }}
Message: Your order has been confirmed.
Set Property After Alert: notification_sent
Value To Be Set: 1
Recipients:
  - receiver_by_document_field: contact_email
```

### Scenario 11: Invoice with PDF Attachment

**Requirement**: Send invoice email with PDF attachment.

**Configuration**:
```
Document Type: Sales Invoice
Event: Submit
Channel: Email
Subject: Invoice {{ doc.name }} - {{ doc.customer }}
Message: |
    <p>Dear {{ doc.customer_name }},</p>
    <p>Please find attached invoice {{ doc.name }}.</p>
Attach Print: ✅
Print Format: Standard
Recipients:
  - receiver_by_document_field: contact_email
```

### Scenario 12: Method-Based Notification

**Requirement**: Send notification when custom method is called.

**Python Code** (in DocType file):
```python
def custom_approval_method(doc, method):
    # Your custom logic
    pass
```

**Notification Configuration**:
```
Document Type: [Your DocType]
Event: Method
Method: custom_approval_method
Channel: Email
Subject: Document Approved - {{ doc.name }}
Message: Document {{ doc.name }} has been approved.
Recipients:
  - receiver_by_role: Manager
```

### Scenario 13: Date-Based Follow-up

**Requirement**: Send follow-up 7 days after payment date.

**Configuration**:
```
Document Type: Payment Entry
Event: Days After
Date Changed: posting_date
Days in Advance: 7
Channel: Email
Subject: Payment Follow-up - {{ doc.name }}
Message: |
    <p>Payment {{ doc.name }} was processed 7 days ago.</p>
    <p>Please verify the payment details.</p>
Recipients:
  - receiver_by_role: Accounts Manager
```

### Scenario 14: Complex Condition

**Requirement**: Send notification only for specific status and value combination.

**Configuration**:
```
Document Type: Sales Order
Event: Submit
Condition: (doc.status == "Confirmed" and doc.grand_total > 5000) or doc.priority == "High"
Channel: Email
Subject: Important Order - {{ doc.name }}
Message: Important order {{ doc.name }} requires attention.
Recipients:
  - receiver_by_role: Sales Manager
```

### Scenario 15: Dynamic CC Based on Field

**Requirement**: CC manager email from document field.

**Configuration**:
```
Document Type: Task
Event: Save
Channel: Email
Subject: Task Update - {{ doc.subject }}
Message: Task {{ doc.subject }} has been updated.
Recipients:
  - receiver_by_document_field: owner
    cc: "{{ doc.manager_email }}"
```

---

## Troubleshooting

### Common Issues

#### 1. Notification Not Sending

**Symptoms**:
- Notification configured but not triggering
- No email/SMS/system notification received

**Possible Causes**:

**A. Notification Disabled**
```python
# Check
frappe.db.get_value("Notification", "notification_name", "enabled")
# Should be 1
```

**Solution**: Enable the notification

**B. Condition Not Met**
```python
# Test condition manually
doc = frappe.get_doc("DocType", "doc_name")
context = {"doc": doc, "nowdate": nowdate, "frappe": ...}
frappe.safe_eval("your_condition", None, context)
# Should return True
```

**Solution**: Adjust condition or test with actual document values

**C. Event Not Triggering**
```python
# Check if event is correct
# New: after_insert
# Save: on_update
# Submit: on_submit
# Cancel: on_cancel
# Value Change: on_change (only if value actually changed)
```

**Solution**: Verify event matches document action

**D. Value Change - Value Didn't Actually Change**
```python
# For Value Change events, system compares:
old_value = doc.get_doc_before_save().get(fieldname)
new_value = doc.get(fieldname)
# Notification only sends if values are different
```

**Solution**: Ensure value actually changed, not just document saved

**E. Import/Patch Mode**
```python
# Notifications are skipped during:
frappe.flags.in_import
frappe.flags.in_patch
frappe.flags.in_install
```

**Solution**: Notifications will work after import/patch completes

**F. No Recipients**
```python
# Check if recipients are resolved
recipients, cc, bcc = notification.get_list_of_recipients(doc, context)
# Should not be empty
```

**Solution**: Verify recipient configuration and document field values

**G. Email Account Not Configured**
```python
# For Email channel, check sender
frappe.db.get_value("Email Account", sender_name, "enable_outgoing")
# Should be 1
```

**Solution**: Configure Email Account with enable_outgoing = 1

#### 2. Template Errors

**Symptoms**:
- Error when saving notification
- "Error while evaluating Notification" message

**Common Template Errors**:

**A. Syntax Error**
```jinja
{# Wrong #}
{% if doc.status == "Open"
{# Missing endif #}

{# Correct #}
{% if doc.status == "Open" %}
{% endif %}
```

**B. Undefined Variable**
```jinja
{# Wrong #}
{{ doc.non_existent_field }}

{# Correct #}
{% if doc.field %}{{ doc.field }}{% endif %}
```

**C. Invalid Filter**
```jinja
{# Wrong #}
{{ doc.total|invalid_filter }}

{# Correct #}
{{ doc.total|int }}
```

**Solution**: Fix template syntax, check variable names, use valid filters

#### 3. Condition Errors

**Symptoms**:
- "The Condition is invalid" error
- Condition not working as expected

**Common Condition Errors**:

**A. Syntax Error**
```python
# Wrong
doc.status = "Open"  # Should be ==

# Correct
doc.status == "Open"
```

**B. Field Not Found**
```python
# Wrong
doc.non_existent_field == "value"

# Correct
# Use existing field or check if field exists first
```

**C. Type Mismatch**
```python
# Wrong
doc.total == "1000"  # Comparing int with string

# Correct
doc.total == 1000
# or
str(doc.total) == "1000"
```

**Solution**: Fix condition syntax, verify field names and types

#### 4. Recipient Issues

**Symptoms**:
- Notification triggers but no recipients
- Wrong recipients receiving notification

**Common Recipient Issues**:

**A. Empty Email Field**
```python
# Check
doc.get("contact_email")
# Should not be None or empty
```

**B. Invalid Email Format**
```python
# System validates email addresses
validate_email_address(email)
# Must be valid email format
```

**C. Role Has No Users**
```python
# Check
users = get_info_based_on_role("Role Name", "email")
# Should return list of emails
```

**D. Child Table Field Format**
```python
# Wrong format
receiver_by_document_field: "email_id,email_ids"  # Extra space

# Correct format
receiver_by_document_field: "email_id,email_ids"  # No spaces
```

**Solution**: Verify email fields have values, check role assignments, verify field names

#### 5. Value Change Not Triggering

**Symptoms**:
- Value Change event not firing
- Notification disabled automatically

**Common Issues**:

**A. Field Doesn't Exist**
```python
# System automatically disables notification if field missing
if not frappe.db.has_column(doc.doctype, alert.value_changed):
    alert.db_set("enabled", 0)
```

**Solution**: Check field exists, re-enable notification

**B. Value Didn't Actually Change**
```python
# System compares with type casting
old_value = cast(fieldtype, doc_before_save.get(fieldname))
new_value = cast(fieldtype, doc.get(fieldname))
if old_value == new_value:
    return  # Notification not sent
```

**Solution**: Ensure value actually changes, not just document saved

**C. Field Type Mismatch**
```python
# System casts values for comparison
# Ensure field types are compatible
```

**Solution**: Check field types match expected values

#### 6. Days Before/After Not Working

**Symptoms**:
- Daily alerts not sending
- Wrong documents receiving alerts

**Common Issues**:

**A. Scheduler Not Running**
```python
# Check scheduler status
frappe.utils.scheduler.is_scheduler_inactive()
# Should be False
```

**Solution**: Ensure scheduler is running

**B. Date Field Format**
```python
# System matches dates with time range
reference_date_start = reference_date + " 00:00:00.000000"
reference_date_end = reference_date + " 23:59:59.000000"
```

**Solution**: Ensure date field is Date or Datetime type

**C. Days Calculation**
```python
# Days Before: add_to_date(nowdate(), days=days_in_advance)
# Days After: add_to_date(nowdate(), days=-days_in_advance)
```

**Solution**: Verify days_in_advance value is correct

#### 7. Print Attachment Issues

**Symptoms**:
- PDF not attaching
- Error when attaching print

**Common Issues**:

**A. Print Settings**
```python
# Draft documents
if doc.docstatus == 0 and not print_settings.allow_print_for_draft:
    # Error thrown
```

**Solution**: Enable "Allow Print For Draft" in Print Settings

**B. Cancelled Documents**
```python
# Cancelled documents
if doc.docstatus == 2 and not print_settings.allow_print_for_cancelled:
    # Error thrown
```

**Solution**: Enable "Allow Print For Cancelled" in Print Settings

**C. Print Format Not Found**
```python
# Check print format exists
frappe.db.exists("Print Format", print_format_name)
```

**Solution**: Verify print format exists and is linked to DocType

#### 8. System Notification Not Appearing

**Symptoms**:
- System notification not showing in bell
- Notification sent but not visible

**Common Issues**:

**A. User Not in Recipients**
```python
# Check recipients
users = recipients + cc + bcc
# Current user must be in this list
```

**Solution**: Verify user email is in recipients

**B. Notification Log Not Created**
```python
# Check notification log
frappe.db.get_all("Notification Log", filters={"subject": subject})
```

**Solution**: Check for errors in notification creation

#### 9. SMS Not Sending

**Symptoms**:
- SMS notification configured but not sending

**Common Issues**:

**A. SMS Settings Not Configured**
```python
# Check SMS settings
frappe.db.get_single_value("SMS Settings", "sms_gateway_url")
```

**Solution**: Configure SMS Settings

**B. Phone Field Not Found**
```python
# Check phone field
doc.get(recipient.receiver_by_document_field)
# Should return phone number
```

**Solution**: Verify phone field exists and has value

**C. Invalid Phone Number**
```python
# Phone number must be valid format
```

**Solution**: Ensure phone numbers are in correct format

#### 10. Slack Not Sending

**Symptoms**:
- Slack notification not posting

**Common Issues**:

**A. Webhook URL Not Configured**
```python
# Check webhook URL
frappe.db.get_value("Slack Webhook URL", webhook_name, "webhook_url")
```

**Solution**: Configure Slack Webhook URL

**B. Invalid Webhook URL**
```python
# Webhook URL must be valid Slack webhook
```

**Solution**: Verify webhook URL is correct and active

### Debugging Techniques

#### 1. Enable Debug Logging
```python
import frappe
frappe.conf.developer_mode = 1
frappe.conf.logging = 2
```

#### 2. Check Notification Execution
```python
# In document save hook
def on_update(doc, method):
    print("Notifications executed:", doc.flags.notifications_executed)
```

#### 3. Test Condition Manually
```python
doc = frappe.get_doc("DocType", "doc_name")
context = get_context(doc)
result = frappe.safe_eval("your_condition", None, context)
print("Condition result:", result)
```

#### 4. Test Template Rendering
```python
doc = frappe.get_doc("DocType", "doc_name")
context = get_context(doc)
context.update({"alert": notification, "comments": None})
message = frappe.render_template(notification.message, context)
print("Rendered message:", message)
```

#### 5. Check Recipients
```python
notification = frappe.get_doc("Notification", "notification_name")
doc = frappe.get_doc("DocType", "doc_name")
context = get_context(doc)
recipients, cc, bcc = notification.get_list_of_recipients(doc, context)
print("Recipients:", recipients)
print("CC:", cc)
print("BCC:", bcc)
```

#### 6. Check Email Queue
```python
# Check if email was queued
frappe.db.get_all("Email Queue", filters={
    "reference_doctype": "DocType",
    "reference_name": "doc_name"
})
```

#### 7. Check Communication Log
```python
# Check if communication was created
frappe.db.get_all("Communication", filters={
    "reference_doctype": "DocType",
    "reference_name": "doc_name",
    "communication_type": "Automated Message"
})
```

---

## Testing Notifications

### Manual Testing

#### 1. Test New Event
```python
# Create new document
doc = frappe.new_doc("DocType")
doc.field1 = "value1"
doc.insert()
# Check if notification sent
```

#### 2. Test Save Event
```python
# Update existing document
doc = frappe.get_doc("DocType", "doc_name")
doc.field1 = "new_value"
doc.save()
# Check if notification sent
```

#### 3. Test Submit Event
```python
# Submit document
doc = frappe.get_doc("DocType", "doc_name")
doc.submit()
# Check if notification sent
```

#### 4. Test Value Change Event
```python
# Change specific field
doc = frappe.get_doc("DocType", "doc_name")
old_value = doc.status
doc.status = "New Status"
doc.save()
# Check if notification sent (only if value actually changed)
```

#### 5. Test Condition
```python
# Test with condition true
doc = frappe.get_doc("DocType", "doc_name")
doc.status = "Open"  # Condition: doc.status == "Open"
doc.save()
# Should send

# Test with condition false
doc.status = "Closed"
doc.save()
# Should not send
```

#### 6. Test Recipients
```python
# Check recipient resolution
notification = frappe.get_doc("Notification", "notification_name")
doc = frappe.get_doc("DocType", "doc_name")
context = get_context(doc)
recipients, cc, bcc = notification.get_list_of_recipients(doc, context)
assert len(recipients) > 0, "No recipients found"
```

#### 7. Test Template Rendering
```python
# Test template
notification = frappe.get_doc("Notification", "notification_name")
doc = frappe.get_doc("DocType", "doc_name")
context = get_context(doc)
context.update({"alert": notification, "comments": None})

subject = frappe.render_template(notification.subject, context)
message = frappe.render_template(notification.message, context)

print("Subject:", subject)
print("Message:", message)
```

### Automated Testing

#### Unit Test Example
```python
import frappe
from frappe.tests.utils import FrappeTestCase

class TestNotification(FrappeTestCase):
    def setUp(self):
        # Create test notification
        self.notification = frappe.get_doc({
            "doctype": "Notification",
            "name": "Test Notification",
            "document_type": "ToDo",
            "event": "Save",
            "channel": "Email",
            "subject": "Test Subject",
            "message": "Test Message",
            "recipients": [{"receiver_by_document_field": "owner"}]
        }).insert()
    
    def test_notification_triggered(self):
        # Create document
        doc = frappe.new_doc("ToDo")
        doc.description = "Test"
        doc.insert()
        
        # Check email queue
        email_queue = frappe.db.get_value(
            "Email Queue",
            {"reference_doctype": "ToDo", "reference_name": doc.name},
            "name"
        )
        self.assertTrue(email_queue, "Notification not sent")
    
    def tearDown(self):
        # Cleanup
        self.notification.delete()
```

### Testing Checklist

- [ ] Notification enabled
- [ ] Event triggers correctly
- [ ] Condition evaluates correctly
- [ ] Recipients resolved correctly
- [ ] Template renders correctly
- [ ] Email/SMS/System notification sent
- [ ] Communication logged
- [ ] Print attachment works (if enabled)
- [ ] Property updated (if set_property_after_alert)
- [ ] No duplicate notifications
- [ ] Works with different document states
- [ ] Works with edge cases (None values, empty fields, etc.)

---

## Best Practices

### 1. Naming Conventions

**Good Names**:
- "Sales Order - Submit Confirmation"
- "Task - Status Change to Closed"
- "Invoice - Payment Reminder 3 Days"

**Bad Names**:
- "Notification 1"
- "Test"
- "Alert"

### 2. Condition Best Practices

**Keep Conditions Simple**:
```python
# Good
doc.status == "Open"

# Avoid (move complex logic to Python hooks)
doc.status == "Open" and doc.total > 1000 and doc.customer_type == "Company" and len(doc.items) > 5
```

**Handle None Values**:
```python
# Good
doc.due_date and doc.due_date < nowdate()

# Avoid
doc.due_date < nowdate()  # May fail if due_date is None
```

### 3. Template Best Practices

**Use Conditional Checks**:
```jinja
{# Good #}
{% if doc.field %}{{ doc.field }}{% endif %}

{# Avoid #}
{{ doc.field }}  {# May show None #}
```

**Format Numbers and Dates**:
```jinja
{# Good #}
{{ doc.total|int }}
{{ doc.due_date|string|truncate(10) }}

{# Avoid #}
{{ doc.total }}  {# May show decimal places #}
```

**Keep Templates Readable**:
```jinja
{# Good - Well formatted #}
<h3>Order {{ doc.name }}</h3>
<p>Customer: {{ doc.customer }}</p>
<p>Total: {{ doc.grand_total }}</p>

{# Avoid - Hard to read #}
<h3>Order {{ doc.name }}</h3><p>Customer: {{ doc.customer }}</p><p>Total: {{ doc.grand_total }}</p>
```

### 4. Recipient Best Practices

**Use Specific Recipients**:
```python
# Good - Specific field
receiver_by_document_field: "contact_email"

# Avoid - Generic (unless needed)
receiver_by_document_field: "owner"  # May not be intended recipient
```

**Use Conditions for Recipients**:
```python
# Good - Conditional recipient
receiver_by_role: "Manager"
condition: doc.total > 10000

# Avoid - Always sending to all roles
receiver_by_role: "Manager"  # Sends even for small orders
```

### 5. Performance Best Practices

**Limit Recipients**:
- Don't send to entire roles unnecessarily
- Use conditions to limit recipients
- Consider using specific fields instead of roles

**Optimize Conditions**:
- Keep conditions simple and fast
- Avoid complex calculations in conditions
- Use indexed fields when possible

**Cache Considerations**:
- Notifications are cached per doctype
- Cache clears on notification save/delete
- Consider cache impact when updating notifications frequently

### 6. Security Best Practices

**Validate User Input**:
- Templates are rendered with document data
- Be careful with user-generated content
- Escape HTML when needed

**Permission Considerations**:
- Notifications use `ignore_permissions=True` for property updates
- Recipients are resolved with `ignore_permissions=True` for roles
- Be careful with sensitive data in notifications

### 7. Maintenance Best Practices

**Document Notifications**:
- Add descriptions explaining purpose
- Document complex conditions
- Note any special requirements

**Version Control**:
- Use Standard Notifications for version control
- Keep custom notifications documented
- Track changes in notification purpose

**Testing**:
- Test notifications thoroughly before enabling
- Test with various document states
- Test edge cases (None values, empty fields)

---

## Common Issues and Solutions

### Issue 1: Using `doc.get_doc_before_save()` in Conditions

**Question**: Can I use `doc.get_doc_before_save()` in notification conditions?

**Answer**: **NO**, you cannot directly use `doc.get_doc_before_save()` in conditions because:
1. Conditions are evaluated using `frappe.safe_eval()` which has restricted access
2. `get_doc_before_save()` is not available in the safe evaluation context

**Workaround**:
```python
# In your DocType Python file
def before_save(doc, method):
    if doc.get_doc_before_save():
        doc.db_set("_previous_status", doc.get_doc_before_save().status)

# In Notification Condition
doc.status != doc._previous_status and doc.status == "Closed"
```

**Better Solution**: Use **Value Change** event instead:
```
Event: Value Change
Value Changed: status
Condition: doc.status == "Closed"
# System automatically compares old vs new value
```

### Issue 2: Notification Not Running During Import

**Question**: Why don't notifications run during data import?

**Answer**: Notifications are intentionally disabled during import to:
- Prevent spam during bulk imports
- Improve import performance
- Avoid unintended notifications

**Code**:
```python
if frappe.flags.in_import and frappe.flags.mute_emails:
    return  # Notifications skipped
```

**Solution**: 
- Notifications will work after import completes
- If you need notifications during import, you can manually trigger them after import

### Issue 3: Duplicate Notifications

**Question**: Why am I receiving duplicate notifications?

**Answer**: Common causes:
1. Multiple notifications with same event
2. Notification triggered multiple times in same transaction
3. Both Email and System Notification enabled

**Prevention**:
```python
# System prevents duplicates within same transaction
if alert.name in self.flags.notifications_executed:
    return  # Skip if already executed
```

**Solution**:
- Check for multiple notifications with same event
- Disable duplicate notifications
- Use conditions to differentiate notifications

### Issue 4: Value Change Not Triggering

**Question**: Why isn't Value Change event triggering?

**Answer**: Value Change only triggers if:
1. Value **actually changed** (not just document saved)
2. Field exists in database
3. Document is not new

**Code**:
```python
doc_before_save = doc.get_doc_before_save()
old_value = doc_before_save.get(fieldname) if doc_before_save else None
new_value = doc.get(fieldname)

# Type-aware comparison
if cast(fieldtype, new_value) == cast(fieldtype, old_value):
    return  # Value didn't change, skip notification
```

**Solution**:
- Ensure value actually changes
- Check field exists
- Verify field name is correct

### Issue 5: Days Before/After Not Working

**Question**: Why aren't daily alerts sending?

**Answer**: Common causes:
1. Scheduler not running
2. Date field format incorrect
3. Days calculation wrong
4. No documents match date criteria

**Check Scheduler**:
```python
frappe.utils.scheduler.is_scheduler_inactive()
# Should be False
```

**Check Date Matching**:
```python
# System matches dates with time range
reference_date = add_to_date(nowdate(), days=days_in_advance)
reference_date_start = reference_date + " 00:00:00.000000"
reference_date_end = reference_date + " 23:59:59.000000"
```

**Solution**:
- Ensure scheduler is running
- Verify date field is Date/Datetime type
- Check days_in_advance value
- Test with "Get Alerts for Today" button

### Issue 6: Template Rendering Errors

**Question**: Why am I getting template errors?

**Answer**: Common causes:
1. Syntax errors (missing `{% endif %}`, etc.)
2. Undefined variables
3. Invalid filters
4. Type mismatches

**Debug Template**:
```python
try:
    message = frappe.render_template(template, context)
except Exception as e:
    print("Template error:", str(e))
```

**Solution**:
- Fix syntax errors
- Check variable names
- Use valid Jinja filters
- Handle None values with `{% if %}`

### Issue 7: Recipients Not Receiving Notifications

**Question**: Why aren't recipients receiving notifications?

**Answer**: Common causes:
1. Empty email fields
2. Invalid email format
3. Role has no users
4. Recipient condition not met
5. Email account not configured

**Check Recipients**:
```python
recipients, cc, bcc = notification.get_list_of_recipients(doc, context)
print("Recipients:", recipients)  # Should not be empty
```

**Solution**:
- Verify email fields have values
- Check email format is valid
- Ensure role has assigned users
- Check recipient conditions
- Configure email account

### Issue 8: Print Attachment Not Working

**Question**: Why isn't PDF attaching to email?

**Answer**: Common causes:
1. Print Settings don't allow draft/cancelled
2. Print Format doesn't exist
3. Document is draft/cancelled

**Check Print Settings**:
```python
print_settings = frappe.get_doc("Print Settings", "Print Settings")
# allow_print_for_draft
# allow_print_for_cancelled
```

**Solution**:
- Enable print for draft/cancelled in Print Settings
- Verify print format exists
- Check document status

### Issue 9: System Notification Not Appearing

**Question**: Why isn't system notification showing?

**Answer**: Common causes:
1. User not in recipients
2. Notification log not created
3. Real-time updates not working

**Check Notification Log**:
```python
frappe.db.get_all("Notification Log", filters={
    "subject": subject,
    "for_user": user
})
```

**Solution**:
- Verify user email in recipients
- Check for errors in notification creation
- Ensure real-time updates enabled

### Issue 10: SMS Not Sending

**Question**: Why isn't SMS sending?

**Answer**: Common causes:
1. SMS Settings not configured
2. Phone field not found
3. Invalid phone number format
4. SMS provider not working

**Check SMS Settings**:
```python
frappe.db.get_single_value("SMS Settings", "sms_gateway_url")
```

**Solution**:
- Configure SMS Settings
- Verify phone field exists and has value
- Check phone number format
- Test SMS provider

---

## Conclusion

Frappe Notifications are a powerful automation tool that can significantly improve your application's communication capabilities. By understanding the concepts, lifecycle, and best practices outlined in this guide, you can create effective notification systems that keep your users informed and engaged.

Remember to:
- Test notifications thoroughly
- Use conditions wisely
- Keep templates readable
- Document complex configurations
- Monitor notification performance
- Handle edge cases gracefully

---

