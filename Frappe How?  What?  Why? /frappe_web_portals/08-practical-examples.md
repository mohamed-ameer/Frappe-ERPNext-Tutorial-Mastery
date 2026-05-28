# Chapter 8: Practical Examples

This chapter presents real-world, complete examples of portal pages. Each example includes the folder structure, the Python controller, the HTML template, and an explanation of how everything works together.

## Example 1: A Simple Public Profile Page

**Goal:** Create a page at `/profile` that displays the logged-in user's information. Guests are redirected to login.

**Folder Structure:**
```
your_app/
  www/
    profile.html
    profile.py
```

**Controller: `www/profile.py`**

```python
import frappe

def get_context(context):
    if frappe.session.user == "Guest":
        frappe.local.flags.redirect_location = "/login"
        raise frappe.Redirect
    
    user = frappe.get_doc("User", frappe.session.user)
    context.user_fullname = user.full_name
    context.user_email = user.email
    context.user_image = user.user_image
    context.user_bio = user.bio
    context.user_roles = frappe.get_roles()
    context.show_sidebar = True
    context.title = _("My Profile")
```

**Template: `www/profile.html`**

```jinja
{% extends "templates/web.html" %}

{% block page_content %}
<div class="profile-page">
    <div class="row">
        <div class="col-md-4 text-center">
            <div class="profile-image mb-3">
                {% if user_image %}
                <img src="{{ user_image }}" class="rounded-circle" width="150" height="150">
                {% else %}
                <div class="rounded-circle bg-light d-inline-flex align-items-center justify-content-center" 
                     style="width:150px;height:150px;">
                    <span class="display-4 text-muted">{{ user_fullname[0] }}</span>
                </div>
                {% endif %}
            </div>
        </div>
        <div class="col-md-8">
            <h2>{{ user_fullname }}</h2>
            <p class="text-muted">{{ user_email }}</p>
            
            {% if user_bio %}
            <div class="bio mt-3">
                <h5>{{ _("About") }}</h5>
                <p>{{ user_bio }}</p>
            </div>
            {% endif %}
            
            <div class="roles mt-3">
                <h5>{{ _("Roles") }}</h5>
                <div>
                    {% for role in user_roles %}
                    <span class="badge bg-primary me-1">{{ role }}</span>
                    {% endfor %}
                </div>
            </div>
        </div>
    </div>
</div>
{% endblock %}
```

**How It Works:**

1. When a user visits `/profile`, the `TemplatePage` renderer finds `www/profile.html`
2. It also finds `www/profile.py` as the co-located controller
3. `get_context()` checks the session — if the user is a guest, it raises a `Redirect` to `/login`
4. For authenticated users, it fetches the user's document and extracts profile information
5. The context is passed to the Jinja template, which renders the profile card with the user's image, name, email, bio, and roles
6. The `show_sidebar = True` enables the sidebar navigation

---

## Example 2: Custom Dashboard with Summary Cards

**Goal:** Create a dashboard at `/dashboard` that shows summary statistics from multiple DocTypes.

**Folder Structure:**
```
your_app/
  www/
    dashboard.html
    dashboard.py
    dashboard.css
```

**Controller: `www/dashboard.py`**

```python
import frappe
from frappe import _

def get_context(context):
    if frappe.session.user == "Guest":
        frappe.throw(_("Please login to access the dashboard"), frappe.PermissionError)
    
    current_user = frappe.session.user
    
    context.dashboard_cards = [
        {
            "label": _("Open Tickets"),
            "count": frappe.db.count("Support Ticket", 
                filters={"status": "Open", "raised_by": current_user}),
            "color": "blue",
            "icon": "ticket"
        },
        {
            "label": _("Pending Orders"),
            "count": frappe.db.count("Sales Order",
                filters={"status": ["!=", "Completed"], "owner": current_user}),
            "color": "orange",
            "icon": "order"
        },
        {
            "label": _("Unpaid Invoices"),
            "count": frappe.db.count("Sales Invoice",
                filters={"status": "Unpaid", "owner": current_user}),
            "color": "red",
            "icon": "invoice"
        },
        {
            "label": _("Completed This Month"),
            "count": frappe.db.count("Task",
                filters={
                    "status": "Completed",
                    "owner": current_user,
                    "modified": [">=", frappe.utils.month_start(frappe.utils.today())]
                }),
            "color": "green",
            "icon": "check"
        },
    ]
    
    context.recent_activities = frappe.get_all(
        "Activity Log",
        filters={"user": current_user},
        fields=["name", "subject", "status", "creation"],
        order_by="creation desc",
        limit=10
    )
    
    context.show_sidebar = True
    context.title = _("Dashboard")
```

**Template: `www/dashboard.html`**

```jinja
{% extends "templates/web.html" %}

{% block page_content %}
<div class="dashboard">
    <h3 class="mb-4">{{ _("Welcome, {0}").format(frappe.session.user_fullname or frappe.session.user) }}</h3>
    
    <div class="row">
        {% for card in dashboard_cards %}
        <div class="col-md-3 mb-4">
            <div class="card border-{{ card.color }} h-100">
                <div class="card-body text-center">
                    <h2 class="card-count text-{{ card.color }}">{{ card.count }}</h2>
                    <p class="card-text text-muted">{{ card.label }}</p>
                </div>
            </div>
        </div>
        {% endfor %}
    </div>
    
    <div class="row mt-4">
        <div class="col-12">
            <div class="card">
                <div class="card-header">
                    <h5 class="mb-0">{{ _("Recent Activities") }}</h5>
                </div>
                <div class="card-body">
                    {% if recent_activities %}
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead>
                                <tr>
                                    <th>{{ _("Activity") }}</th>
                                    <th>{{ _("Date") }}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {% for activity in recent_activities %}
                                <tr>
                                    <td>{{ activity.subject }}</td>
                                    <td>{{ frappe.utils.format_datetime(activity.creation) }}</td>
                                </tr>
                                {% endfor %}
                            </tbody>
                        </table>
                    </div>
                    {% else %}
                    <p class="text-muted mb-0">{{ _("No recent activities.") }}</p>
                    {% endif %}
                </div>
            </div>
        </div>
    </div>
</div>
{% endblock %}
```

**Styles: `www/dashboard.css`**

```css
.dashboard .card-count {
    font-size: 2.5rem;
    font-weight: 700;
}

.dashboard .card {
    transition: transform 0.2s;
}

.dashboard .card:hover {
    transform: translateY(-3px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
```

**How It Works:**

1. The controller checks authentication and fetches aggregate data from multiple DocTypes
2. Four dashboard cards display counts for tickets, orders, invoices, and completed tasks
3. A recent activity table shows the last 10 log entries for the user
4. The template uses Bootstrap's card components with color variants
5. The co-located CSS file adds custom hover effects and transitions
6. The page is user-specific — each logged-in user sees their own data

---

## Example 3: Portal Table Listing with Filters

**Goal:** Display a filtered, paginated list of support tickets at `/support/tickets`.

**Folder Structure:**
```
your_app/
  www/
    support/
      tickets.html
      tickets.py
```

**Controller: `www/support/tickets.py`**

```python
import frappe
from frappe import _

@frappe.whitelist()
def get_tickets(status=None, priority=None, search=None, limit_start=0, limit_page_length=20):
    filters = {"raised_by": frappe.session.user}
    
    if status:
        filters["status"] = status
    if priority:
        filters["priority"] = priority
    if search:
        filters["subject"] = ["like", f"%{search}%"]
    
    tickets = frappe.get_list(
        "Support Ticket",
        filters=filters,
        fields=["name", "subject", "status", "priority", "ticket_type", "creation", "_assign"],
        limit_start=int(limit_start),
        limit_page_length=int(limit_page_length),
        order_by="creation desc"
    )
    
    total_count = frappe.db.count("Support Ticket", filters=filters)
    
    return {
        "tickets": tickets,
        "total": total_count
    }

def get_context(context):
    if frappe.session.user == "Guest":
        frappe.throw(_("Please login to continue"), frappe.PermissionError)
    
    context.title = _("My Support Tickets")
    context.show_sidebar = True
    context.add_breadcrumbs = True
    context.parents = [
        {"route": "/", "title": _("Home")},
        {"route": "/support", "title": _("Support")}
    ]
    
    context.statuses = frappe.get_all("Support Ticket", 
        pluck="status", distinct=True)
    context.priorities = ["Low", "Medium", "High", "Urgent"]
```

**Template: `www/support/tickets.html`**

```jinja
{% extends "templates/web.html" %}

{% block page_content %}
<div class="tickets-page">
    <div class="mb-4">
        <h3>{{ _("My Support Tickets") }}</h3>
        <a href="/support/new-ticket" class="btn btn-primary btn-sm">
            {{ _("New Ticket") }}
        </a>
    </div>
    
    <div class="card">
        <div class="card-body">
            <div class="row mb-3">
                <div class="col-md-3">
                    <select class="form-control form-control-sm" id="status-filter">
                        <option value="">{{ _("All Statuses") }}</option>
                        {% for s in statuses %}
                        <option value="{{ s }}">{{ s }}</option>
                        {% endfor %}
                    </select>
                </div>
                <div class="col-md-3">
                    <select class="form-control form-control-sm" id="priority-filter">
                        <option value="">{{ _("All Priorities") }}</option>
                        {% for p in priorities %}
                        <option value="{{ p }}">{{ p }}</option>
                        {% endfor %}
                    </select>
                </div>
                <div class="col-md-4">
                    <input type="text" class="form-control form-control-sm" 
                           id="search-input" placeholder="{{ _('Search tickets...') }}">
                </div>
                <div class="col-md-2">
                    <button class="btn btn-sm btn-secondary w-100" id="apply-filters">
                        {{ _("Filter") }}
                    </button>
                </div>
            </div>
            
            <div class="table-responsive">
                <table class="table table-hover" id="tickets-table">
                    <thead>
                        <tr>
                            <th>{{ _("ID") }}</th>
                            <th>{{ _("Subject") }}</th>
                            <th>{{ _("Status") }}</th>
                            <th>{{ _("Priority") }}</th>
                            <th>{{ _("Created") }}</th>
                        </tr>
                    </thead>
                    <tbody id="tickets-body">
                        <!-- Populated by JavaScript -->
                    </tbody>
                </table>
            </div>
            
            <div id="pagination" class="d-flex justify-content-center">
                <!-- Populated by JavaScript -->
            </div>
        </div>
    </div>
</div>
{% endblock %}

{% block script %}
<script>
frappe.ready(function() {
    let currentPage = 0;
    const pageLength = 20;
    
    function loadTickets() {
        const params = {
            status: document.getElementById('status-filter').value,
            priority: document.getElementById('priority-filter').value,
            search: document.getElementById('search-input').value,
            limit_start: currentPage * pageLength,
            limit_page_length: pageLength
        };
        
        frappe.call({
            method: "your_app.www.support.tickets.get_tickets",
            args: params,
            callback: function(r) {
                renderTickets(r.message.tickets);
                renderPagination(r.message.total);
            }
        });
    }
    
    function renderTickets(tickets) {
        const tbody = document.getElementById('tickets-body');
        if (!tickets.length) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">{{ _("No tickets found.") }}</td></tr>';
            return;
        }
        tbody.innerHTML = tickets.map(t => `
            <tr>
                <td><a href="/support/ticket/${t.name}">${t.name}</a></td>
                <td>${t.subject}</td>
                <td><span class="badge bg-${t.status === 'Open' ? 'warning' : t.status === 'Closed' ? 'success' : 'info'}">${t.status}</span></td>
                <td>${t.priority || '-'}</td>
                <td>${frappe.datetime.str_to_user(t.creation)}</td>
            </tr>
        `).join('');
    }
    
    function renderPagination(total) {
        const totalPages = Math.ceil(total / pageLength);
        let html = '<nav><ul class="pagination pagination-sm">';
        for (let i = 0; i < totalPages; i++) {
            html += `<li class="page-item ${i === currentPage ? 'active' : ''}">
                <a class="page-link" href="#" data-page="${i}">${i + 1}</a>
            </li>`;
        }
        html += '</ul></nav>';
        document.getElementById('pagination').innerHTML = html;
        
        document.querySelectorAll('#pagination .page-link').forEach(el => {
            el.addEventListener('click', function(e) {
                e.preventDefault();
                currentPage = parseInt(this.dataset.page);
                loadTickets();
            });
        });
    }
    
    document.getElementById('apply-filters').addEventListener('click', function() {
        currentPage = 0;
        loadTickets();
    });
    
    loadTickets();
});
</script>
{% endblock %}
```

**How It Works:**

1. The controller defines a `get_context` for initial page data and a `@frappe.whitelist()` method `get_tickets` for AJAX calls
2. The template renders filter dropdowns, a search box, and a table container
3. JavaScript uses `frappe.call()` to fetch filtered ticket data via the whitelisted method
4. Pagination is handled entirely on the client side with page buttons
5. The `show_sidebar` and `add_breadcrumbs` enhance navigation
6. This pattern separates initial page load from dynamic data fetching, giving a fast initial render with dynamic filtering

---

## Example 4: Public Landing Page (No Login Required)

**Goal:** Create a public landing page at `/landing` that anyone can visit without logging in.

**Folder Structure:**
```
your_app/
  www/
    landing.html
    landing.py
    landing.css
```

**Controller: `www/landing.py`**

```python
import frappe
from frappe import _

def get_context(context):
    context.title = _("Welcome to Our Platform")
    context.no_header = True
    context.full_width = True
    context.hide_login = False
    
    context.features = [
        {"icon": "rocket", "title": _("Fast"), "description": _("Lightning fast performance")},
        {"icon": "shield", "title": _("Secure"), "description": _("Enterprise-grade security")},
        {"icon": "heart", "title": _("Reliable"), "description": _("99.99% uptime guarantee")},
    ]
    
    context.testimonials = [
        {"quote": _("Best platform we have ever used!"), "author": "John Doe", "company": "Acme Inc"},
        {"quote": _("Transformed our business operations."), "author": "Jane Smith", "company": "Globex Corp"},
    ]
    
    context.stats = [
        {"number": "10,000+", "label": _("Active Users")},
        {"number": "99.9%", "label": _("Uptime")},
        {"number": "150+", "label": _("Countries")},
    ]
```

**Template: `www/landing.html`**

```jinja
{% extends "templates/web.html" %}

{% block page_content %}
<div class="landing-page">
    <!-- Hero Section -->
    <section class="hero-section text-center py-5" style="background: linear-gradient(135deg, var(--primary) 0%, #667eea 100%); color: white;">
        <div class="container">
            <h1 class="display-4 fw-bold mb-4">{{ _("Welcome to Our Platform") }}</h1>
            <p class="lead mb-5">{{ _("The most powerful business management platform") }}</p>
            {% if frappe.session.user == "Guest" %}
            <a href="/login" class="btn btn-light btn-lg px-5">{{ _("Get Started") }}</a>
            {% else %}
            <a href="/dashboard" class="btn btn-light btn-lg px-5">{{ _("Go to Dashboard") }}</a>
            {% endif %}
        </div>
    </section>
    
    <!-- Features Section -->
    <section class="features-section py-5">
        <div class="container">
            <h2 class="text-center mb-5">{{ _("Why Choose Us") }}</h2>
            <div class="row">
                {% for feature in features %}
                <div class="col-md-4 mb-4">
                    <div class="card h-100 text-center border-0 shadow-sm">
                        <div class="card-body py-5">
                            <div class="feature-icon mb-3">
                                <i class="bi bi-{{ feature.icon }} display-4" style="color: var(--primary);"></i>
                            </div>
                            <h4>{{ feature.title }}</h4>
                            <p class="text-muted">{{ feature.description }}</p>
                        </div>
                    </div>
                </div>
                {% endfor %}
            </div>
        </div>
    </section>
    
    <!-- Stats Section -->
    <section class="stats-section py-5 bg-light">
        <div class="container">
            <div class="row text-center">
                {% for stat in stats %}
                <div class="col-md-4 mb-3">
                    <h2 class="display-5 fw-bold" style="color: var(--primary);">{{ stat.number }}</h2>
                    <p class="text-muted">{{ stat.label }}</p>
                </div>
                {% endfor %}
            </div>
        </div>
    </section>
    
    <!-- Testimonials -->
    <section class="testimonials-section py-5">
        <div class="container">
            <h2 class="text-center mb-5">{{ _("What Our Users Say") }}</h2>
            <div class="row">
                {% for testimonial in testimonials %}
                <div class="col-md-6 mb-4">
                    <div class="card border-0 shadow-sm">
                        <div class="card-body p-4">
                            <p class="card-text lead">"{{ testimonial.quote }}"</p>
                            <div class="mt-3">
                                <strong>{{ testimonial.author }}</strong>
                                <br>
                                <small class="text-muted">{{ testimonial.company }}</small>
                            </div>
                        </div>
                    </div>
                </div>
                {% endfor %}
            </div>
        </div>
    </section>
</div>
{% endblock %}
```

**Styles: `www/landing.css`**

```css
.landing-page .hero-section {
    margin-top: -1rem;
}

.landing-page .feature-icon i {
    font-size: 3rem;
}

.landing-page .card {
    transition: transform 0.3s, box-shadow 0.3s;
}

.landing-page .card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.1) !important;
}
```

---

## Example 5: Portal Form with Submission

**Goal:** Create a new ticket form at `/support/new-ticket` that submits to the database.

**Folder Structure:**
```
your_app/
  www/
    support/
      new-ticket.html
      new-ticket.py
```

**Controller: `www/support/new-ticket.py`**

```python
import frappe
from frappe import _

def get_context(context):
    if frappe.session.user == "Guest":
        frappe.throw(_("Please login"), frappe.PermissionError)
    
    if frappe.request.method == "POST":
        subject = frappe.form_dict.get("subject")
        description = frappe.form_dict.get("description")
        priority = frappe.form_dict.get("priority", "Medium")
        ticket_type = frappe.form_dict.get("ticket_type")
        
        if not subject or not description:
            context.error = _("Subject and description are required.")
        else:
            try:
                ticket = frappe.get_doc({
                    "doctype": "Support Ticket",
                    "subject": subject,
                    "description": description,
                    "priority": priority,
                    "ticket_type": ticket_type,
                    "raised_by": frappe.session.user
                })
                ticket.insert(ignore_permissions=True)
                frappe.db.commit()
                frappe.local.flags.redirect_location = f"/support/ticket/{ticket.name}"
                raise frappe.Redirect
            except Exception as e:
                context.error = _("Failed to create ticket: {0}").format(str(e))
                context.form = frappe.form_dict
    
    context.title = _("New Support Ticket")
    context.show_sidebar = True
    context.add_breadcrumbs = True
    context.parents = [
        {"route": "/", "title": _("Home")},
        {"route": "/support", "title": _("Support")},
        {"route": "/support/tickets", "title": _("My Tickets")}
    ]
    
    context.ticket_types = frappe.get_all("Ticket Type", pluck="name")
    context.priorities = ["Low", "Medium", "High", "Urgent"]
```

**Template: `www/support/new-ticket.html`**

```jinja
{% extends "templates/web.html" %}

{% block page_content %}
<div class="new-ticket-page">
    <h3>{{ _("Create New Support Ticket") }}</h3>
    
    {% if error %}
    <div class="alert alert-danger">{{ error }}</div>
    {% endif %}
    
    <div class="card">
        <div class="card-body">
            <form method="POST" action="/support/new-ticket">
                <div class="mb-3">
                    <label class="form-label">{{ _("Subject") }} <span class="text-danger">*</span></label>
                    <input type="text" class="form-control" name="subject" required
                           value="{{ form.subject if form else '' }}">
                </div>
                
                <div class="row mb-3">
                    <div class="col-md-6">
                        <label class="form-label">{{ _("Type") }}</label>
                        <select class="form-control" name="ticket_type">
                            <option value="">{{ _("Select Type") }}</option>
                            {% for t in ticket_types %}
                            <option value="{{ t }}" {{ 'selected' if form and form.ticket_type == t }}>
                                {{ t }}
                            </option>
                            {% endfor %}
                        </select>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">{{ _("Priority") }}</label>
                        <select class="form-control" name="priority">
                            {% for p in priorities %}
                            <option value="{{ p }}" {{ 'selected' if form and form.priority == p }}>
                                {{ p }}
                            </option>
                            {% endfor %}
                        </select>
                    </div>
                </div>
                
                <div class="mb-3">
                    <label class="form-label">{{ _("Description") }} <span class="text-danger">*</span></label>
                    <textarea class="form-control" name="description" rows="6" required>{{ form.description if form else '' }}</textarea>
                </div>
                
                <button type="submit" class="btn btn-primary">{{ _("Submit Ticket") }}</button>
                <a href="/support/tickets" class="btn btn-secondary">{{ _("Cancel") }}</a>
            </form>
        </div>
    </div>
</div>
{% endblock %}
```

**How It Works:**

1. When the user visits the page via GET, the form is displayed empty
2. When the user submits the form via POST, the same controller handles the submission
3. The controller validates the input, creates a new `Support Ticket` document, and redirects to the ticket detail page
4. If validation fails, the error is displayed and the form is re-populated with the submitted values
5. The `frappe.form_dict` contains either GET query parameters or POST form data

---

## Example 6: REST API-Style Endpoint with JSON Response

**Goal:** Create an endpoint at `/api/my-data` that returns JSON (not HTML).

**Folder Structure:**
```
your_app/
  www/
    api/
      my-data.py
```

Note: There is no `.html` file — this controller generates a JSON response directly.

**Controller: `www/api/my-data.py`**

```python
import frappe
from frappe import _

def get_context(context):
    if frappe.session.user == "Guest":
        frappe.local.response["http_status_code"] = 401
        frappe.local.response["message"] = _("Authentication required")
        return
    
    data = frappe.get_all(
        "Your DocType",
        filters={"owner": frappe.session.user},
        fields=["name", "status", "creation"],
        order_by="creation desc",
        limit=50
    )
    
    frappe.local.response["content_type"] = "application/json"
    frappe.local.response["data"] = {
        "data": data,
        "count": len(data),
        "user": frappe.session.user
    }
```

**How It Works:**

1. The controller sets `frappe.local.response` directly instead of modifying the context
2. It sets `content_type` to `application/json` so the response is JSON, not HTML
3. The response dictionary is serialized to JSON by Frappe's response handler
4. No `.html` template is needed — the controller generates the response entirely in Python
5. This is useful for building custom API endpoints within the portal

---

## Example 7: Page with Dynamic Route (URL Parameters)

**Goal:** Create a ticket detail page at `/support/ticket/TKT-0001` using dynamic route handling.

**Folder Structure:**
```
your_app/
  www/
    support/
      ticket.html
      ticket.py
```

**Controller: `www/support/ticket.py`**

```python
import frappe
from frappe import _

def get_context(context):
    if frappe.session.user == "Guest":
        frappe.throw(_("Please login"), frappe.PermissionError)
    
    ticket_name = frappe.form_dict.get("name")
    if not ticket_name:
        frappe.throw(_("Ticket ID is required"))
    
    try:
        ticket = frappe.get_doc("Support Ticket", ticket_name)
    except frappe.DoesNotExistError:
        frappe.throw(_("Ticket not found"), frappe.PageDoesNotExistError)
    
    if ticket.raised_by != frappe.session.user and "System Manager" not in frappe.get_roles():
        frappe.throw(_("You do not have permission to view this ticket"), frappe.PermissionError)
    
    context.ticket = ticket
    context.communications = frappe.get_all(
        "Communication",
        filters={
            "reference_doctype": "Support Ticket",
            "reference_name": ticket_name
        },
        fields=["subject", "content", "sender", "creation"],
        order_by="creation asc"
    )
    
    context.title = _("Ticket {0}").format(ticket_name)
    context.show_sidebar = True
    context.add_breadcrumbs = True
    context.parents = [
        {"route": "/", "title": _("Home")},
        {"route": "/support/tickets", "title": _("My Tickets")}
    ]
```

**Template: `www/support/ticket.html`**

```jinja
{% extends "templates/web.html" %}

{% block page_content %}
<div class="ticket-detail">
    <div class="card mb-4">
        <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="mb-0">{{ ticket.subject }}</h5>
            <span class="badge bg-{{ 'warning' if ticket.status == 'Open' else 'success' if ticket.status == 'Closed' else 'info' }}">
                {{ ticket.status }}
            </span>
        </div>
        <div class="card-body">
            <div class="row mb-3">
                <div class="col-md-3 text-muted">{{ _("Ticket ID") }}:</div>
                <div class="col-md-9">{{ ticket.name }}</div>
            </div>
            <div class="row mb-3">
                <div class="col-md-3 text-muted">{{ _("Priority") }}:</div>
                <div class="col-md-9">{{ ticket.priority }}</div>
            </div>
            <div class="row mb-3">
                <div class="col-md-3 text-muted">{{ _("Created") }}:</div>
                <div class="col-md-9">{{ frappe.utils.format_datetime(ticket.creation) }}</div>
            </div>
            <hr>
            <div class="ticket-description">
                {{ ticket.description }}
            </div>
        </div>
    </div>
    
    {% if communications %}
    <div class="card">
        <div class="card-header">
            <h5 class="mb-0">{{ _("Communications") }}</h5>
        </div>
        <div class="card-body">
            {% for comm in communications %}
            <div class="communication-item mb-3 pb-3 border-bottom">
                <div class="d-flex justify-content-between">
                    <strong>{{ comm.sender }}</strong>
                    <small class="text-muted">{{ frappe.utils.format_datetime(comm.creation) }}</small>
                </div>
                <p class="mt-2 mb-0">{{ comm.content }}</p>
            </div>
            {% endfor %}
        </div>
    </div>
    {% endif %}
</div>
{% endblock %}
```

**How It Works:**

1. The URL `/support/ticket/TKT-0001` is matched by the `TemplatePage` to `www/support/ticket.html`
2. The `name` portion of the URL becomes available via `frappe.form_dict.name`
3. The controller loads the ticket document and verifies that the current user owns it
4. It also loads all communications related to the ticket
5. The template displays the ticket details and a communication thread

Note: For this to work with URLs like `/support/ticket/TKT-0001` (where `TKT-0001` is a path segment after `ticket`), the file name must be `ticket.html` and the dynamic part is captured as a query parameter by Frappe's route matching. Actually, this requires the path to be matched as `/support/ticket` with `name` as a query parameter. To handle `/support/ticket/TKT-0001` as a clean URL, you would need to use a dynamic route in a Web Page doctype or use the `path_resolver` hooks.

For a simpler approach, the ticket detail can be accessed at `/support/ticket?name=TKT-0001`. For clean URLs, you would create a custom renderer or use a Web Page with `dynamic_route=1`.

---

## Example 8: Overriding a Standard Page

**Goal:** Override the standard `/login` page with a custom branded login page.

**Folder Structure:**
```
your_app/
  www/
    login.html
    login.py
```

**Controller: `www/login.py`**

```python
import frappe
from frappe import _
from frappe.www.login import get_context as original_get_context

def get_context(context):
    original_get_context(context)
    
    context.title = _("Welcome Back")
    context.no_header = True
    context.brand_html = '<h2 class="text-center mb-4">My Company</h2>'
    context.custom_css = """
        .page-card {
            max-width: 400px;
            margin: 80px auto;
            border-radius: 12px;
            box-shadow: 0 8px 30px rgba(0,0,0,0.1);
        }
    """
```

**Template: `www/login.html`**

```jinja
{% extends "templates/web.html" %}

{% block page_content %}
<div class="container">
    <div class="page-card card p-4">
        {{ brand_html }}
        {{ super() }}
    </div>
</div>
{% endblock %}

{% block style %}
<style>
    body {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        min-height: 100vh;
    }
    .page-card {
        background: white;
        padding: 2rem;
    }
</style>
{% endblock %}
```

**How It Works:**

1. By placing `login.html` and `login.py` in your custom app's `www/` folder, you override Frappe's standard login page
2. The controller imports and extends the original `get_context` using `super()` pattern
3. Custom CSS and branding are added to the context
4. The template wraps the original login form in a custom card layout with a gradient background
5. No changes to any configuration files are needed — the file system does the override automatically

---

## Summary of Patterns

| Pattern | When to Use | Key Technique |
|---------|-------------|--------------|
| Simple data page | Static or semi-static content | `get_context` fetches data, template displays it |
| Dashboard | Aggregate data from multiple sources | Multiple `frappe.db.count` / `get_all` calls |
| Filtered table | List views with search/filter/pagination | `@frappe.whitelist()` method + AJAX in JS |
| Landing page | Public-facing marketing content | No auth check, `full_width`, `no_header` |
| Form with submission | User input that creates documents | POST handling in `get_context`, redirect on success |
| JSON API | Programmatic data access | Set `frappe.local.response` directly |
| Dynamic detail page | Individual document view | Read `frappe.form_dict`, load doc, check permissions |
| Page override | Customize standard Frappe pages | Same file name in custom app, extend original controller |
