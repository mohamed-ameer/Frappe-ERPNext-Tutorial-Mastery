### what is the problem?
Frappe automatically triggers a **save** when an `Attach` field is updated, which can be problematic if you want to prevent partial saves, or wait for user confirmation.



**In my case:** 
I have multiple attach fields and it's a horrible UX for the end-user,
The user needs to attach 5 files, so I don't want to auto-save 5 times.

Make sense, i only need him to save by himself when he finishes. 

---
### Why this auto save happenes?

In `frappe/public/js/frappe/form/controls/attach.js` file, the following js lines cause this save action:
```
// inside the clear_attachment() method
me.frm.doc.docstatus == 1 ? me.frm.save("Update") : me.frm.save();
// inside the on_upload_complete() method
this.frm.doc.docstatus == 1 ? this.frm.save("Update") : this.frm.save();
```
you just need to comment or remove them 
**BUT** edit the core basecode is not recommended because that will affect on all your custom_apps and you will need to hard coded this again in production and with each update

---
### What is the proper solution?
use **monkey patching** technique

step 1: in your custom app, create js file to override this core attach.js code.
give it anyname but it's recommended to name it the same name of the file that you  want to override.
```
your_app/
├── public/
│   └── js/
│       └── attach.js
└── hooks.py
```
step 2: in `hook.py` define your `attach.js` file.
```
# hook.py
app_include_js = ["/assets/your_app/js/attach.js"]
```
step 3: add the following code:
```
frappe.ui.form.ControlAttach = class ControlAttach extends frappe.ui.form.ControlAttach {
    clear_attachment() {
        console.log("attached image 14")
		let me = this;
		if (this.frm) {
			me.parse_validate_and_set_in_model(null);
			me.refresh();
			me.frm.attachments.remove_attachment_by_filename(me.value, async () => {
				await me.parse_validate_and_set_in_model(null);
				me.refresh();
				// me.frm.doc.docstatus == 1 ? me.frm.save("Update") : me.frm.save();
			});
		} else {
			this.dataurl = null;
			this.fileobj = null;
			this.set_input(null);
			this.parse_validate_and_set_in_model(null);
			this.refresh();
		}
	}
    async on_upload_complete(attachment) {
        console.log("attached image 15")
		if (this.frm) {
			await this.parse_validate_and_set_in_model(attachment.file_url);
			this.frm.attachments.update_attachment(attachment);
			// this.frm.doc.docstatus == 1 ? this.frm.save("Update") : this.frm.save();
		}
		this.set_value(attachment.file_url);
	}
}
frappe.ui.form.ControlAttachImage = class ControlAttachImage extends frappe.ui.form.ControlAttach{
	make_input() {
		console.log("attached image 1ccc")
		super.make_input();

		let $file_link = this.$value.find(".attached-file-link");
		$file_link.popover({
			trigger: "hover",
			placement: "top",
			content: () => {
				return `<div>
					<img src="${this.get_value()}"
						width="150px"
						style="object-fit: contain;"
					/>
				</div>`;
			},
			html: true,
		});
	}
	set_upload_options() {
		console.log("attached image 2ccc")
		super.set_upload_options();
		this.upload_options.restrictions.allowed_file_types = ["image/*"];
	}
};
```

### Exlaination:
`frappe.ui.form.ControlAttach = class ControlAttach extends frappe.ui.form.ControlAttach`
i did nothing but making a copy from `frappe.ui.form.ControlAttach` Class by extend from it (inheritance)
then override the logic of `clear_attachment()` and `on_upload_complete` methods.

and i did the same with `frappe.ui.form.ControlAttachImage` class because it extend from the core old `frappe.ui.form.ControlAttach` so i want to make it extend from my copy one.

---
## to learn more about monkey patching check this topic
https://discuss.frappe.io/t/frappe-monkey-patching-guide-overriding-change-core-code-without-touching-it/148237?u=mohamed-ameer