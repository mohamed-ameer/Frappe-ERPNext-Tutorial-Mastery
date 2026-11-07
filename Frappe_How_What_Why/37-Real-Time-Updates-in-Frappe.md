# Introduction

In environments where multiple users work together, it is very important that everyone has access to the latest and most up-to-date information. In the past, users had to manually refresh their browser pages to see new changes, which was time-consuming and could lead to situations where different users were looking at different versions of the same data — causing confusion and mistakes.

Frappe’s real-time features solve this problem by automatically updating data across all users' screens as soon as a change happens. This means everyone sees the latest information without needing to do anything manually.

# Solution Overview

To enable real-time updates in Frappe, the solution uses two main parts that work together:

- **Server-Side Event Publishing**: This means sending messages or updates from the server (the central system running the application) to all users who are connected. In Frappe, this is done using the function `frappe.publish_realtime()`. When something changes on the server—like a document being updated—this function sends an event to all clients (users' browsers) so they can react to the change.
- **Client-Side Event Listening**: On the user’s side (in their web browser), the application listens for incoming events using `frappe.realtime.on()`. When a message is received, the user interface can be automatically updated—such as refreshing a form or showing a notification—so users always see the most up-to-date information without needing to reload the page manually.

# Implementation Details

## Step 1: Server-Side Event Publishing

On the server side, you create special functions that send or "publish" real-time events whenever certain actions happen—such as when a document is saved, updated, or changed in any important way. These functions act like messengers that notify all users currently using the system about the change.

You can set up these functions to run automatically at key moments in a document’s lifecycle (like after saving or submitting a form), ensuring that everyone working in the system sees the latest data without needing to refresh their browser manually.

For example, you might define a function called `refresh_status()` that sends an update to all connected users whenever a document's `status` changes. This is done using Frappe’s built-in method `frappe.publish_realtime()`, which broadcasts messages across the network.

This step is important because it ensures that all users are always looking at the same, most up-to-date information — improving teamwork and reducing errors.

### Example Code

```python
@frappe.whitelist()
def refresh_status(doc_type, doc_name):
    """
    Publishes a global event to refresh the status of a given document type.
    Any page listening to this event will reload itself.
    """
    event_name = f"refresh_{doc_type.lower()}"
    frappe.publish_realtime(
        event=event_name,
        message={
            "message": f"{doc_type} status refreshed!",
            "doc_name": doc_name
        }
    )
```

### Key Points

- The `frappe.publish_realtime()` function broadcasts an event with a unique name (e.g., `refresh_invoice`) and optional data (e.g., `{"doc_name": doc_name}`).
- This ensures that all clients subscribed to the event receive the notification.

## Step 2: Client-Side Event Listening

On the user's side (in their web browser), we use JavaScript to "listen" or wait for events that are sent from the server. When the server sends a message — like "this document has been updated" — the browser checks if it’s relevant and then updates what the user sees on the screen, without needing to reload the whole page.

This is done using the `frappe.realtime.on()` function. You give it the name of the event you want to listen for (like "refresh_invoice"), and provide a small piece of code (a callback function) that tells the system what to do when that event is received.

For example, when a document is updated, the server sends a message. The browser receives it and checks if it's related to the document currently being viewed. If it is, the system automatically reloads that document so the user sees the latest changes right away.

This makes the application feel faster and more responsive, and ensures all users are always looking at the most up-to-date information.

### Example Code

```javascript
// Listen for status updates
frappe.realtime.on("refresh_invoice", function(data) {
    if (cur_frm.doc.name === data.doc_name) { // rememper we sent doc_name as payload with the event
        cur_frm.reload_doc(); // Reload the document to reflect changes
    }
});
```
### Explanation:
This JavaScript code runs in the user’s web browser and listens for real-time events coming from the server.

`frappe.realtime.on("refresh_invoice", function(data) { ... })`
This sets up a listener that waits for an event named `"refresh_invoice"` to be sent from the server. 

When the event arrives, it runs the function provided, which contains the instructions for what to do next. The data parameter holds any additional information that was sent along with the event (like the name of the document `doc_name` that changed).

`if (cur_frm.doc.name === data.doc_name)` Before making any changes, the code checks whether the event is related to the document currently open in the user's browser (cur_frm.doc.name) by comparing it with `data.doc_name`, which was included when the event was published. This ensures that only the relevant document gets updated.

`cur_frm.reload_doc();`
If the names match, this line reloads the current document in the browser, so the user sees the latest data without having to manually refresh the page.

#### Why This Matters:
This part of the system makes sure that users always see the most recent version of the data they're working on. It improves collaboration and prevents outdated information from being used.

### Key Points

- The `frappe.realtime.on()` function listens for events with specific names (e.g., `refresh_invoice`).
- When an event is received, the client checks if the data matches the current document and reloads the document (`cur_frm.reload_doc()`) to reflect the changes.

## Step 3: Triggering Events During Document Updates

To make sure that real-time updates happen at the right moments (like when a document is saved or changed), we need to connect our event-publishing function to important events in the document’s life cycle.

In Frappe, documents have built-in events such as `after_save`, `on_submit`, or `before_save`. These are like hooks that let us run custom code whenever something important happens to the document.

For example, you can use the `after_save` event to automatically send a real-time update to all users whenever someone saves changes to a document. This helps keep everyone's view of the data up to date.

### Example Code

```javascript
frappe.ui.form.on('Any Doctype', {
    after_save: function(frm) {
        frappe.call({
            method: 'your_app.utils.refresh_status',
            args: {
                doc_type: frm.doctype,
                doc_name: frm.docname
            }
        });
    }
});
```
### What This Does:
When a user saves a document of type Any Doctype, the `after_save` function runs.

It calls the server-side function `refresh_status` using `frappe.call()`.

The function sends the document’s type and name to the server, which then triggers a real-time event to notify all connected users.

#### Why This Is Important:
By linking your real-time publishing function to key document events, you ensure that updates are sent exactly when needed—without delays or manual actions. This improves collaboration and ensures consistency across all users viewing the same data.

### Key Points

- The `after_save` trigger ensures that the event is published whenever the document is saved.
- The `frappe.call()` function invokes the server-side method to publish the real-time event.

# General Use Cases

This approach can be applied to various scenarios requiring real-time updates:

- **Collaborative Workflows**: Notify team members about updates to shared tasks or documents.
- **Status Tracking**: Automatically update the UI when the status of any document changes.
- **Notifications**: Alert users about new messages, approvals, or system events.

# Benefits

- **Real-Time Synchronization**: Ensures all users see the latest data without manual intervention.
- **Scalability**: Works seamlessly across multiple clients and devices.
- **Customizability**: Can be tailored to specific workflows or requirements.

# Conclusion

By leveraging `frappe.publish_realtime()` and `frappe.realtime.on()`, you can implement robust real-time updates in your Frappe-based applications. This ensures that all users stay in sync with the latest data, improving collaboration and reducing errors. Use the provided code snippets as a template to integrate real-time updates into your own projects.