# Workflow in Frappe: A Comprehensive Guide

## Overview

Workflow in Frappe is a powerful mechanism for managing document states and controlling the approval process. It enables organizations to define structured business processes by specifying states that documents can exist in and the transitions (actions) that move documents between these states, with role-based access control and conditional logic.

## Mind Storming: Initial Conceptual Understanding

> **Note**: This section contains my initial brainstorming and conceptual thinking about workflows. It represents my raw understanding before refinement and may contain some informal language and conceptual simplifications.

### What is Workflow in Frappe?

Workflow in Frappe refers to the process of managing the state and transitions of documents. It allows you to define a set of states and transitions that a document can go through, based on certain conditions and user actions.

Workflow is nothing but the cycle of states that a document goes through until it be approved.

Workflow feature works only with submittable doctypes.

Submittable doctypes are the doctypes that have the `is_submittable` and it has 3 states: draft, submitted, and cancelled.
- draft (0): the document is created but not yet submitted.
- submitted (1): the document is submitted and can't be edited (except fields that has `allow_on_submit` property set to 1).
- cancelled (2): the document is cancelled and can't be edited but we can amend it.

Each submittable document has a field called `workflow_state` that is used to track the state of the document. This field is automatically created when you create a workflow for a doctype.

Each submittable document has a field called `Amend` which is allow you to create a new document with the same data of cancelled document.
Amend is like you create a new document that is linked to the cancelled document.

Even if the child doctype is not submittable but once it's parent is submittable, it will be affected by the state of the parent which means that it will be read-only when the parent is submitted.

Any Submittable doctype has only 3 states: draft (0), submitted (1), and cancelled (2), only 0, 1, and 2 are the only valid values for the `workflow_state` field, we only gave different names to these states like draft, send for approval, returned, send to loan officer, ..etc, at the end, it's still 0, 1, and 2.

So the workflow is nothing but a way to manage the states of a document and the transitions between these states.

Any workflow has two main components:
1. state (the state of the document (0, 1, or 2)) 
2. transition (the path between the states, which is the action that will be taken to reach the next state)

Each state has:
- state (name of the state)
- Doc status (the state number of the state which is the docstatus (0 [Draft], 1 [Submitted], or 2 [Cancelled]))
- transition (what is the next state?)
- Only Allow Edit For (role that can edit the document in this state)
- Update Field (fields that can be edited in this state)
- Update Value (value that will be set to the field when the document reaches this state)

Each transition has:
- Action (what is the action that will be taken when the transition is taken?)
- Allowed (who is allowed to do this transition?)
- Condition (when should this transition be allowed? a python condition that will be evaluated to true or false and btw it is optional)

Transition is the path from one state to another, and only allowed people can walk on this path to reach the next state, and each path has a name which is the transition.

The `Action` button is the button that will be shown to the user and will show what is the available paths/transitions that the user can take from the current state to the next state.

Each state is nothing but 0, 1, or 2 but with a name.

The default workflow is:
- draft (0) -> submitted (1) -> cancelled (2)
- draft (0) -> cancelled (2)

The First state will be the default state of the document and it always has the number 0, usually it's called draft.

The Final state will be either cancelled (2) or submitted (1).

Remember: at the end, it is either 0 or 1 or 2, we only have 3 states only but we can name them whatever we want with any number of states but at the end, it's still 0, 1, or 2 REMEMBER THIS.

the `workflow_state` field is the field that will be used to track the state of the document, and it's a field that is automatically created when you create a workflow for a doctype if we didn't create custom one. and it has the name of the current state of the document (has the name but not the number).

Update Field is the field that will be updated when the document reaches this state, and it's optional and usually used to set the value of the `workflow_state` field to the name of the current state and we name it `status` (a select field, or we can use checkbox field with the name of the state as the label prefix with `is_` like `is_draft`, `is_submitted`, `is_cancelled`) usually instead of using `workflow_state` field.

the docstatus field is the field that will be used to track the state of the document, and it's a field that is automatically created when you create a submittable doctype. and it has 3 states: draft (0), submitted (1), and cancelled (2).

---

## Core Concepts

### What is a Workflow?

A workflow in Frappe is a defined sequence of states and transitions that a document must follow during its lifecycle. It provides a structured approach to managing document approval processes, ensuring that documents move through predefined stages with appropriate authorization and validation.

**Key Characteristics:**
- Workflows are only applicable to **submittable DocTypes** (DocTypes with `is_submittable` enabled)
- Each workflow defines custom states with meaningful names (e.g., "Pending Approval", "Approved", "Rejected")
- States are mapped to underlying document status values (docstatus: 0, 1, or 2)
- Transitions define how documents move between states, with role-based permissions and optional conditions

### Submittable DocTypes and Document Status

Submittable DocTypes have three fundamental document statuses (docstatus):

1. **Draft (0)**: The document is created but not yet submitted. It can be edited freely.
2. **Submitted (1)**: The document has been submitted and is typically read-only, except for fields marked with `allow_on_submit = 1`.
3. **Cancelled (2)**: The document has been cancelled. It cannot be edited, but can be amended to create a new document based on the cancelled one.

**Important Distinction:**
- `docstatus` is a system field that tracks the submission state (0, 1, or 2)
- `workflow_state` is a custom field that stores the current workflow state name (e.g., "Pending", "Approved")
- These are **separate fields** that work together to manage document state

### Child Table Behavior

When a parent document is submittable, child table documents (even if not submittable themselves) inherit read-only behavior when the parent is submitted. This ensures data integrity across related documents.

## Workflow Components

A workflow consists of two primary components: **States** and **Transitions**.

### States

A state represents a stage in the document's lifecycle. Each state has the following properties:

#### State Properties

1. **State Name**: A descriptive name for the state (e.g., "Pending Approval", "Approved", "Rejected")
   - This name is stored in the `workflow_state` field
   - States are defined as Link fields to the "Workflow State" DocType

2. **Doc Status**: The underlying document status value (0, 1, or 2)
   - **0 (Draft)**: Document remains editable
   - **1 (Submitted)**: Document is submitted and typically read-only
   - **2 (Cancelled)**: Document is cancelled

3. **Update Field** (Optional): A field that will be updated when the document reaches this state
   - Commonly used to update a `status` field with a user-friendly value
   - Example: Setting `status = "Approved"` when workflow_state becomes "Approved"

4. **Update Value** (Optional): The value to set in the update field
   - Works in conjunction with `update_field`

5. **Only Allow Edit For**: Specifies which role(s) can edit the document in this state
   - Can be set to "All" to allow any user with write permissions
   - Restricts editing to specific roles when set to a particular role

6. **Is Optional State**: If checked, no workflow action is created for this state
   - Useful for intermediate states that don't require user action

7. **Send Email On State**: If checked, an email notification is sent when the document transitions to this state

8. **Message**: Optional message displayed to users when the document is in this state

### Transitions

A transition defines how a document moves from one state to another. Each transition has the following properties:

#### Transition Properties

1. **State**: The current state from which the transition originates

2. **Action**: The action name that triggers this transition
   - Defined as a Link to "Workflow Action Master" DocType
   - Examples: "Approve", "Reject", "Send for Review"
   - This action appears as a button in the document form

3. **Next State**: The target state after the transition is executed

4. **Allowed**: The role that is permitted to execute this transition
   - Only users with this role can see and execute the action

5. **Allow Self Approval**: If checked, the document creator can approve their own document
   - By default, self-approval is not allowed

6. **Condition** (Optional): A Python expression that must evaluate to `True` for the transition to be available
   - Evaluated in a sandboxed environment with access to:
     - `doc`: The document object (as a dictionary)
     - `frappe.db.get_value()` and `frappe.db.get_list()`
     - `frappe.session`
     - Date/time utilities: `frappe.utils.now_datetime()`, `frappe.utils.add_to_date()`, etc.
   - Example: `doc.grand_total > 1000` - transition only available if grand total exceeds 1000

7. **Send Email To Creator**: If checked and self-approval is allowed, sends email to the document creator

## Workflow State Field

### Automatic Field Creation

When you create a workflow for a DocType, Frappe automatically creates a custom field to track the workflow state:

- **Field Name**: Specified in the workflow's `workflow_state_field` property (default: "workflow_state")
- **Field Type**: Link field pointing to "Workflow State" DocType
- **Properties**:
  - Hidden by default
  - `allow_on_submit = 1` (can be updated even after submission)
  - `no_copy = 1` (not copied when duplicating documents)

### Custom Workflow State Fields

You can use an existing field instead of creating a new one by:
1. Creating a custom field in your DocType (e.g., `status`, `approval_status`)
2. Setting the `workflow_state_field` in the workflow to match your custom field name

**Common Patterns:**
- Using a Select field named `status` with options matching workflow state names
- Using checkbox fields with state names (e.g., `is_pending`, `is_approved`)

## Workflow Execution Flow

### Default Workflow Behavior

Without a custom workflow, submittable documents follow this default flow:
- **Draft (0)** → **Submitted (1)** → **Cancelled (2)**
- **Draft (0)** → **Cancelled (2)** (direct cancellation)

### Custom Workflow Flow

With a custom workflow:
1. **Initial State**: The first state defined in the workflow becomes the default state (must have doc_status = 0)
2. **State Transitions**: Documents move between states based on user actions
3. **Final States**: Typically end in either:
   - A state with doc_status = 1 (Submitted)
   - A state with doc_status = 2 (Cancelled)

### Workflow Action Execution

When a user clicks a workflow action button:

1. **Validation**: System checks if:
   - The user has the required role (`allowed` field)
   - Self-approval is allowed (if user is the creator)
   - The transition condition (if any) evaluates to `True`

2. **State Update**: 
   - The `workflow_state` field is updated to the `next_state`
   - If specified, the `update_field` is set to `update_value`

3. **Document Status Change**:
   - If transitioning from Draft (0) to Draft (0): Document is saved
   - If transitioning from Draft (0) to Submitted (1): Document is submitted
   - If transitioning from Submitted (1) to Submitted (1): Document is saved (with updated workflow state)
   - If transitioning from Submitted (1) to Cancelled (2): Document is cancelled

4. **Notifications**: 
   - A comment is added to the document
   - Email notifications are sent if configured

## Important Considerations

### State and DocStatus Relationship

**Critical Understanding:**
- Workflow states have **names** (e.g., "Pending", "Approved", "Rejected")
- Each state maps to a **docstatus value** (0, 1, or 2)
- The `workflow_state` field stores the **state name**, not the docstatus number
- Multiple states can map to the same docstatus (e.g., "Pending Approval" and "Under Review" both with docstatus = 0)

**Example:**
```
State: "Pending Approval" → docstatus: 0 → workflow_state: "Pending Approval"
State: "Approved" → docstatus: 1 → workflow_state: "Approved"
State: "Rejected" → docstatus: 0 → workflow_state: "Rejected"
```

### Workflow Restrictions

Frappe enforces several validation rules for workflows:

1. **Cannot cancel before submitting**: A transition cannot go from docstatus 0 directly to docstatus 2
2. **Cannot revert submitted to draft**: A transition cannot go from docstatus 1 back to docstatus 0
3. **Cannot change cancelled state**: Once a document is cancelled (docstatus 2), no workflow transitions are allowed

### Amendment Process

When a cancelled document is amended:
- A new document is created with the same data
- The new document is linked to the cancelled document via the `amended_from` field
- The new document starts in the initial workflow state (docstatus = 0)

## Best Practices

### Workflow Design

1. **Plan Before Implementation**: Always diagram your workflow on paper and review it with stakeholders before creating it in Frappe
2. **Meaningful State Names**: Use clear, descriptive names that reflect the business process
3. **Role-Based Access**: Assign appropriate roles to transitions based on organizational hierarchy
4. **Conditional Logic**: Use transition conditions to handle different scenarios (e.g., different approval paths based on amount)
5. **Status Field Updates**: Consider using the `update_field` feature to maintain a user-friendly status field separate from the workflow state

### Common Patterns

1. **Simple Approval**: Draft → Pending → Approved
2. **Multi-Level Approval**: Draft → Pending Level 1 → Pending Level 2 → Approved
3. **Rejection Flow**: Draft → Pending → (Approved OR Rejected)
4. **Review Cycle**: Draft → Under Review → Pending Approval → Approved

### Testing Workflows

1. Test with different user roles to ensure proper access control
2. Verify transition conditions work as expected
3. Test edge cases (self-approval, cancellation, amendment)
4. Validate email notifications are sent correctly
5. Ensure child table behavior is correct when parent is submitted

## Workflow vs. Document Status

It's important to understand the distinction:

- **Document Status (docstatus)**: System-level field with three values (0, 1, 2) that controls document submission state
- **Workflow State**: Custom field that stores the current workflow state name, providing business process context
- **Status Field**: Optional user-facing field (like `status` or `approval_status`) that can be updated by workflow states

These three concepts work together to provide both system-level control and business process management.

## Conclusion

Workflows in Frappe provide a robust framework for managing document approval processes. By understanding the relationship between states, transitions, docstatus, and workflow_state, developers can create sophisticated business process automation that enforces organizational policies while maintaining flexibility and user-friendliness.

Remember: Workflows add a layer of business process management on top of Frappe's document submission system, allowing you to create custom approval flows while leveraging the framework's built-in submission and cancellation mechanisms.