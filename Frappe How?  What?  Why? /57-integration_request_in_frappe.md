# Integration Request in Frappe

## Table of Contents
- **1. What is Integration Request?**
- **2. When to Use Integration Request**  
- **3. Why Use Integration Request?**
- **4. How Integration Request Works**
- **5. Integration Request DocType Structure**
- **6. Using Integration Request for Logging and Debugging**
- **7. Practical Examples**
- **8. Best Practices**
- **9. Common Use Cases**
- **10.Troubleshooting and Debugging**


## What is Integration Request?

**Integration Request** is a Frappe DocType designed to track, log, and manage external API calls and integrations. It serves as a centralized logging system for all outbound and inbound API requests, making it an essential tool for debugging, monitoring, and maintaining integrations with third-party services.

### Key Characteristics:
- **Centralized Logging**: All API calls are logged in one place
- **Status Tracking**: Tracks the lifecycle of API requests (Queued → Authorized → Completed/Failed)
- **Error Handling**: Captures both successful responses and error details
- **Reference Linking**: Can be linked to specific documents that triggered the integration
- **Audit Trail**: Provides complete audit trail for compliance and debugging

## When to Use Integration Request

### 1. **Payment Gateway Integrations**
- Stripe, PayPal, Razorpay, Paytm, M-Pesa
- Tracking payment processing requests
- Handling payment callbacks and webhooks

### 2. **Third-Party API Calls**
- External service integrations (SMS, Email, CRM)
- Data synchronization with external systems
- Webhook implementations

### 3. **E-commerce Integrations**
- Order processing with external platforms
- Inventory synchronization
- Customer data exchange

### 4. **Custom API Integrations**
- Any custom external API calls
- Data import/export processes
- Real-time data synchronization

## Why Use Integration Request?

### 1. **Debugging and Troubleshooting**
```python
# Without Integration Request - Hard to debug
response = requests.post(url, data=payload)
# If this fails, you have no record of what was sent

# With Integration Request - Easy to debug
integration_request = create_request_log(payload, service_name="MyService")
response = requests.post(url, data=payload)
integration_request.handle_success(response.json())
```

### 2. **Audit and Compliance**
- Complete audit trail of all API interactions
- Regulatory compliance requirements
- Security monitoring and analysis

### 3. **Error Recovery**
- Retry failed requests
- Manual intervention for failed integrations
- Status tracking for long-running processes

### 4. **Performance Monitoring**
- Track API response times
- Monitor success/failure rates
- Identify integration bottlenecks

## How Integration Request Works

### 1. **Request Lifecycle**
```
1. Queued    → Request created, waiting to be processed
2. Authorized → Request authorized, ready for execution
3. Completed → Request executed successfully
4. Failed    → Request failed with error details
5. Cancelled → Request was cancelled
```

### 2. **Core Methods**
```python
# Create a new integration request
integration_request = create_request_log(
    data=request_data,
    service_name="ServiceName",
    request_headers=headers,
    reference_doctype="Sales Invoice",
    reference_docname="SINV-001"
)

# Handle successful response
integration_request.handle_success(response_data)

# Handle failed response
integration_request.handle_failure(error_data)

# Update status manually
integration_request.update_status(params, "Completed")
```

## Integration Request DocType Structure

### Fields Overview:

| Field | Type | Description |
|-------|------|-------------|
| `request_id` | Data | Unique identifier for the request |
| `integration_request_service` | Data | Name of the service (e.g., "Stripe", "PayPal") |
| `is_remote_request` | Check | Whether this is a remote API call |
| `request_description` | Data | Human-readable description |
| `status` | Select | Current status (Queued/Authorized/Completed/Cancelled/Failed) |
| `url` | Small Text | API endpoint URL |
| `request_headers` | Code | HTTP headers sent with request |
| `data` | Code | Request payload/data |
| `output` | Code | Successful response data |
| `error` | Code | Error response data |
| `reference_doctype` | Link | Document type that triggered this request |
| `reference_docname` | Dynamic Link | Specific document that triggered this request |

### Status Values:
- **Queued**: Initial state, request created but not yet processed
- **Authorized**: Request is authorized and ready for execution
- **Completed**: Request executed successfully
- **Cancelled**: Request was cancelled before completion
- **Failed**: Request failed with errors

## Using Integration Request for Logging and Debugging

### 1. **Basic Logging Pattern**
```python
import frappe
from frappe.integrations.utils import create_request_log

def make_api_call(data):
    # Create integration request for logging
    integration_request = create_request_log(
        data=data,
        service_name="MyAPI",
        request_headers={"Authorization": "Bearer token"},
        reference_doctype="Sales Invoice",
        reference_docname=data.get("invoice_id")
    )
    
    try:
        # Make the actual API call
        response = requests.post(
            "https://api.example.com/endpoint",
            json=data,
            headers={"Authorization": "Bearer token"}
        )
        response.raise_for_status()
        
        # Log successful response
        integration_request.handle_success(response.json())
        return response.json()
        
    except Exception as e:
        # Log error
        integration_request.handle_failure({
            "error": str(e),
            "status_code": getattr(response, 'status_code', None)
        })
        raise e
```

### 2. **Advanced Logging with Custom Fields**
```python
def create_custom_integration_request(data, service_name):
    integration_request = frappe.get_doc({
        "doctype": "Integration Request",
        "integration_request_service": service_name,
        "data": frappe.as_json(data),
        "request_headers": frappe.as_json({"Content-Type": "application/json"}),
        "reference_doctype": data.get("doctype"),
        "reference_docname": data.get("name"),
        "request_description": f"Sync {data.get('doctype')} {data.get('name')}",
        "is_remote_request": 1,
        "url": "https://api.example.com/sync"
    })
    
    integration_request.insert(ignore_permissions=True)
    frappe.db.commit()
    
    return integration_request
```

### 3. **Debugging Failed Requests**
```python
def debug_failed_requests():
    # Get all failed integration requests
    failed_requests = frappe.get_all(
        "Integration Request",
        filters={"status": "Failed"},
        fields=["name", "integration_request_service", "error", "data", "reference_doctype", "reference_docname"]
    )
    
    for request in failed_requests:
        print(f"Failed Request: {request.name}")
        print(f"Service: {request.integration_request_service}")
        print(f"Error: {request.error}")
        print(f"Reference: {request.reference_doctype} - {request.reference_docname}")
        print("---")
```

### 4. **Retry Failed Requests**
```python
def retry_failed_request(integration_request_name):
    integration_request = frappe.get_doc("Integration Request", integration_request_name)
    
    # Reset status to Queued for retry
    integration_request.status = "Queued"
    integration_request.error = None
    integration_request.save()
    
    # Process the request again
    process_integration_request(integration_request)
```

## Practical Examples

### 1. **Payment Gateway Integration (Stripe)**
```python
# From apps/payments/payments/payment_gateways/doctype/stripe_settings/stripe_settings.py
def get_payment_url(self, **kwargs):
    # Create integration request for tracking
    self.integration_request = create_request_log(
        self.data, 
        service_name="Stripe"
    )
    
    try:
        # Create charge on Stripe
        return self.create_charge_on_stripe()
    except Exception as e:
        # Handle failure
        self.integration_request.handle_failure({"error": str(e)})
        raise e
```

### 2. **Webhook Processing**
```python
def process_webhook(webhook_data):
    # Create integration request for incoming webhook
    integration_request = create_request_log(
        data=webhook_data,
        service_name="Webhook",
        is_remote_request=0,  # This is an incoming request
        request_description="Incoming webhook data"
    )
    
    try:
        # Process webhook data
        result = process_webhook_data(webhook_data)
        integration_request.handle_success(result)
    except Exception as e:
        integration_request.handle_failure({"error": str(e)})
```

### 3. **Data Synchronization**
```python
def sync_customer_data(customer_doc):
    sync_data = {
        "customer_id": customer_doc.name,
        "customer_name": customer_doc.customer_name,
        "email": customer_doc.email_id,
        "reference_doctype": "Customer",
        "reference_docname": customer_doc.name
    }
    
    integration_request = create_request_log(
        data=sync_data,
        service_name="CRM Sync",
        reference_doctype="Customer",
        reference_docname=customer_doc.name
    )
    
    try:
        # Sync with external CRM
        response = sync_with_crm(sync_data)
        integration_request.handle_success(response)
    except Exception as e:
        integration_request.handle_failure({"error": str(e)})
```

## Best Practices

### 1. **Always Use Integration Request for External API Calls**
```python
# Good Practice
def make_external_api_call(data):
    integration_request = create_request_log(data, service_name="ExternalAPI")
    try:
        response = requests.post(url, json=data)
        integration_request.handle_success(response.json())
    except Exception as e:
        integration_request.handle_failure({"error": str(e)})
        raise

# Bad Practice - No logging
def make_external_api_call(data):
    response = requests.post(url, json=data)
    return response.json()
```

### 2. **Include Reference Information**
```python
# Always include reference document information
integration_request = create_request_log(
    data=data,
    service_name="ServiceName",
    reference_doctype=doc.doctype,
    reference_docname=doc.name
)
```

### 3. **Use Descriptive Service Names**
```python
# Good - Descriptive service names
create_request_log(data, service_name="Stripe Payment")
create_request_log(data, service_name="SMS Notification")
create_request_log(data, service_name="Email Service")

# Bad - Generic service names
create_request_log(data, service_name="API")
create_request_log(data, service_name="Service")
```

### 4. **Handle Errors Properly**
```python
def robust_api_call(data):
    integration_request = create_request_log(data, service_name="RobustAPI")
    
    try:
        response = requests.post(url, json=data, timeout=30)
        response.raise_for_status()
        integration_request.handle_success(response.json())
        
    except requests.exceptions.Timeout:
        integration_request.handle_failure({
            "error": "Request timeout",
            "error_type": "Timeout"
        })
        
    except requests.exceptions.ConnectionError:
        integration_request.handle_failure({
            "error": "Connection error",
            "error_type": "ConnectionError"
        })
        
    except requests.exceptions.HTTPError as e:
        integration_request.handle_failure({
            "error": f"HTTP {e.response.status_code}: {e.response.text}",
            "error_type": "HTTPError",
            "status_code": e.response.status_code
        })
        
    except Exception as e:
        integration_request.handle_failure({
            "error": str(e),
            "error_type": "Unknown"
        })
```

## Common Use Cases

### 1. **Payment Processing**
- Track payment gateway requests
- Handle payment callbacks
- Monitor payment failures

### 2. **Notification Services**
- SMS notifications
- Email services
- Push notifications

### 3. **Data Synchronization**
- CRM synchronization
- Inventory updates
- Customer data exchange

### 4. **Webhook Management**
- Incoming webhook processing
- Outgoing webhook delivery
- Webhook retry mechanisms

### 5. **Third-Party Integrations**
- Social media APIs
- Analytics services
- Marketing automation

## Troubleshooting and Debugging

### 1. **Query Integration Requests**
```python
# Get all integration requests for a specific service
stripe_requests = frappe.get_all(
    "Integration Request",
    filters={"integration_request_service": "Stripe"},
    fields=["name", "status", "error", "output", "creation"]
)

# Get failed requests
failed_requests = frappe.get_all(
    "Integration Request",
    filters={"status": "Failed"},
    fields=["name", "integration_request_service", "error", "reference_doctype", "reference_docname"]
)

# Get requests for a specific document
document_requests = frappe.get_all(
    "Integration Request",
    filters={
        "reference_doctype": "Sales Invoice",
        "reference_docname": "SINV-001"
    }
)
```

### 2. **Monitor Integration Health**
```python
def get_integration_health():
    # Get statistics for each service
    services = frappe.get_all(
        "Integration Request",
        fields=["integration_request_service", "status"],
        group_by="integration_request_service, status"
    )
    
    health_report = {}
    for service in services:
        service_name = service.integration_request_service
        if service_name not in health_report:
            health_report[service_name] = {"total": 0, "failed": 0, "success": 0}
        
        health_report[service_name]["total"] += 1
        if service.status == "Failed":
            health_report[service_name]["failed"] += 1
        elif service.status == "Completed":
            health_report[service_name]["success"] += 1
    
    return health_report
```

### 3. **Clean Up Old Logs**
```python
# Clean up integration requests older than 30 days
IntegrationRequest.clear_old_logs(days=30)

# Or clean up specific service logs
def cleanup_service_logs(service_name, days=30):
    from frappe.query_builder import Interval
    from frappe.query_builder.functions import Now
    
    table = frappe.qb.DocType("Integration Request")
    frappe.db.delete(
        table, 
        filters=(
            (table.integration_request_service == service_name) &
            (table.modified < (Now() - Interval(days=days)))
        )
    )
```

### 4. **Debug Specific Request**
```python
def debug_integration_request(request_name):
    integration_request = frappe.get_doc("Integration Request", request_name)
    
    print(f"Request ID: {integration_request.name}")
    print(f"Service: {integration_request.integration_request_service}")
    print(f"Status: {integration_request.status}")
    print(f"URL: {integration_request.url}")
    print(f"Request Data: {integration_request.data}")
    print(f"Request Headers: {integration_request.request_headers}")
    print(f"Response: {integration_request.output}")
    print(f"Error: {integration_request.error}")
    print(f"Reference: {integration_request.reference_doctype} - {integration_request.reference_docname}")
```

## Conclusion

Integration Request is a powerful tool in Frappe for managing external API integrations. It provides:

- **Complete audit trail** of all API interactions
- **Centralized logging** for easy debugging
- **Status tracking** for monitoring integration health
- **Error handling** with detailed error information
- **Reference linking** to track which documents triggered integrations

By following the best practices outlined in this guide, you can build robust, maintainable integrations that are easy to debug and monitor. Always use Integration Request for external API calls to ensure you have complete visibility into your integration processes.