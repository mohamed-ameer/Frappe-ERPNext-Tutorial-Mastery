# ERPNext: Configuration, Implementation & Customization?

## What is ERP System?

ERP is a system unifies the data of all departments within an organization and organizes them in an integrated way. This enables the company to manage its operations more effectively, monitor performance, and evaluate the profitability of its activities.

**ERP** is a system that centralizes and integrates the data of all departments within an organization in one place, in one program.

By bringing information into one unified platform, it helps the company:
- Streamline (organize / control) operations and reduce duplication of work,
- Track performance across departments in real time, and
- Evaluate profitability and business outcomes with greater accuracy.

---

## The importance of The Data:

Data is like the raw material for information. In an ERP system, we organize and manage all the company's data from different departments (or resources) like HR, Accounting, and Sales. This helps us turn the data into useful information that we can use to make better business decisions.

---
## What is the difference between Configuration, Implementation, Customization:

## Configuration in ERPNext (or any other ERP)

In ERPNext, configuration is done using the built-in Setup menus and standard DocTypes without writing any code.


### Examples:

- **Setting currencies**: Accounts > Currency
- **Defining tax rules**: Accounts > Tax Rule
- **Managing user permissions**: Role Permissions Manager
- **Setting email templates**: Email Templates

**All of this is handled through the user interface (UI), no coding required.**

---

## Implementation in ERPNext

Implementation refers to the entire project of deploying ERPNext in an organization. (Apply the ERP system ideology in the organization)

### Typical phases:

1. **Business Process Analysis** → Reviewing sales, purchase, and operational cycles
2. **Data Migration** → Importing customers, suppliers, and products using the Data Import Tool
3. **Configuration** → Setting up system parameters as explained above
4. **Training** → Teaching the company's staff how to use ERPNext
5. **Go-Live** → Officially running daily operations on ERPNext instead of the old system (Excel or another ERP)

**Implementation is a full digital transformation journey, not just clicking a few buttons.**

---

## Customization in ERPNext

Customization involves changes that require development or more advanced modifications.

### Ways to customize in ERPNext:

- **Custom Fields** → Adding new fields (e.g., "Tax ID" for suppliers)
- **Custom Scripts (Client & Server Scripts)** → Writing JavaScript or Python to change system behavior (e.g., hiding a field under certain conditions)
- **Custom Apps** → Building entirely new applications using the Frappe Framework and linking them to ERPNext
- **Custom Reports** → Creating new Query Reports or Script Reports

**Example**: If a restaurant needs a special "Quick Delivery" button that prints invoices in a custom color → this requires coding (Customization).

---

## Practical Summary in ERPNext

- **Configuration**: Ready-made settings (currencies, taxes, permissions)
- **Implementation**: The full project to launch ERPNext (analysis + data + training + go-live)
- **Customization**: Developing or modifying features that don't exist out of the box

---

## Who Performs Customization?

### **Developer:**

- Handles full-code customization (Custom Scripts, Custom Apps, modifying DocTypes, external API integrations)
- Requires knowledge of Frappe Framework (Python, JavaScript, Jinja, MariaDB)
- **Example**: building a complex workflow or writing custom reports with SQL/Python

### **Implementor / Functional Consultant:**

- Handles lightweight customization (low-code/no-code) using ERPNext's built-in tools
- **Examples**: adding custom fields, creating print formats, setting up workflows

### **Rule of Thumb:**

- **Light customization** → Implementor
- **Deep customization** → Developer

---

## Conclusion

Customization in ERPNext can be done at two levels:

1. **Low-code** by the Implementor
2. **Full-code** by the Developer

---

## Key Takeaways

| Aspect | Description | Who Does It | Skills Required |
|--------|-------------|-------------|-----------------|
| **Configuration** | Using built-in settings | Anyone | Basic ERPNext knowledge |
| **Implementation** | Full deployment project | Implementor/Consultant | Business analysis + ERPNext |
| **Customization** | Code-based modifications | Developer | Frappe Framework + Programming |

---

## Why the name ERPNext?

because it was the cheapest domain name which include the word "ERP" that they could find at the time. (that's the story)

---

## Why ERPNext is better than other ERPs? Why ERPNext Is Different From Other Business Software?

ERPNext is special because:

- It is completely free forever - no hidden costs, no licenses to buy.
- It has all features included - no extra modules to buy.
- It is easy to change for your business needs - no need to hire expensive programmers.
- You can host it on your own server - your data stays safe with you.
- It uses modern technology - fast and works well.
- It has a big helpful community - many people use and support it.

In short: ERPNext gives you everything you need to run your business, for free, with full control, and you can make it fit perfectly for your company.

---