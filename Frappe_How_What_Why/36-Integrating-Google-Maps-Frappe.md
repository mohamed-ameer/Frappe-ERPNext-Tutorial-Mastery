# **Integrating Google Maps into Frappe Framework: A Step-by-Step Guide**

![image](https://github.com/user-attachments/assets/6ed8cde4-971a-457b-b0e2-53d8fc0bbe83)



This documentation provides a clean and structured explanation of how to replace **OpenStreetMap** with **Google Maps** in a Frappe-based application. The example demonstrates integrating Google Maps for geolocation visualization and updating the map dynamically based on latitude and longitude values.

---
## **1. Overview**

The goal is to replace OpenStreetMap with Google Maps for better usability and functionality. This involves:

* Fetching the Google Maps API key securely.
* Initializing the Google Maps JavaScript API.
* Dynamically updating the map based on latitude and longitude values stored in the document.
* Ensuring proper error handling and debouncing for performance optimization.

---
## **2. Implementation**

### **2.1 Backend Configuration**

#### **a. Fetching the Google Maps API Key**

To ensure security, the Google Maps API key is stored encrypted in the `iScore Settings` document. A custom method retrieves the decrypted key.

```
import frappe
from frappe.utils.password import get_decrypted_password
@frappe.whitelist()
def get_google_map_api_key():
    """
    Retrieves the decrypted Google Maps API key from the system settings.
    """
    return get_decrypted_password("System Settings", "System Settings", "google_map_api_key")
```
---
### **2.2 Frontend Integration**

#### **a. Loading the Google Maps JavaScript API**

The Google Maps JavaScript API is loaded dynamically using the `importLibrary` method. This ensures modularity and avoids loading unnecessary libraries.

```
refresh: function(frm) {
    frappe.call({
        method: 'your_app.your_module.get_google_map_api_key',
        callback: function(response) {
            (g=>{var h,a,k,p="The Google Maps JavaScript API",c="google",l="importLibrary",q="__ib__",m=document,b=window;b=b[c]||(b[c]={});var d=b.maps||(b.maps={}),r=new Set,e=new URLSearchParams,u=()=>h||(h=new Promise(async(f,n)=>{await (a=m.createElement("script"));e.set("libraries",[...r]+"");for(k in g)e.set(k.replace(/[A-Z]/g,t=>"_"+t[0].toLowerCase()),g[k]);e.set("callback",c+".maps."+q);a.src=`https://maps.${c}apis.com/maps/api/js?`+e;d[q]=f;a.onerror=()=>h=n(Error(p+" could not load."));a.nonce=m.querySelector("script[nonce]")?.nonce||"";m.head.append(a)}));d[l]?console.warn():d[l]=(f,...n)=>r.add(f)&&u().then(()=>d[l](f,...n))})({
                key: response.message,
                v: "weekly",
            });
        // Initialize the map after loading the API
        initializeMap(frm);
        }
    });
}
```
---
#### **b. Initializing the Map**

Once the API is loaded, the map is initialized in the form's UI. The map replaces the existing OpenStreetMap element and is dynamically updated based on the document's latitude and longitude.

```
function initializeMap(frm) {
    const originalElement = frm.$wrapper.find('.frappe-control[data-fieldtype="Geolocation"][data-fieldname="map"] .control-input-wrapper');
    if (originalElement.length) {
        originalElement.hide(); // Hide the original OpenStreetMap element
        if (!document.getElementById('google_map')) {
            // Create a new div for Google Maps
            $('<div id="google_map" style="height:500px;width:100%"></div>').insertAfter(originalElement);
        }
    }
    updateMap(parseFloat(frm.doc.latitude), parseFloat(frm.doc.longitude));
}
```
---
#### **c. Updating the Map Dynamically**

The map and marker are updated whenever the latitude and longitude values change. If the map does not exist, it is initialized; otherwise, the existing map and marker are updated.

```
let map;
let marker;
async function updateMap(lat,lon) {
    const position = { lat: lat, lng: lon };
    if (!map) {
        // First time initialization
        const { Map } = await google.maps.importLibrary("maps");
        const { Marker } = await google.maps.importLibrary("marker");
        map = new Map(document.getElementById('google_map'), {
            center: position,
            zoom: 17
        });
        marker = new Marker({
            position,
            map,
            title: "Selected Location"
        });
    } else {
        // Update existing map and marker
        map.setCenter(position);
        marker.setPosition(position);
    }

```
---
## **3. Key Benefits**

1. **Improved Usability** : Google Maps provides a familiar interface with advanced features like street view and satellite imagery.
2. **Dynamic Updates** : The map updates automatically based on latitude and longitude values, ensuring real-time visualization.
3. **Security** : The Google Maps API key is stored securely and fetched dynamically.

---

## **4. Prerequisites**

1. **Google Maps API Key** : Obtain a valid API key from the [Google Cloud Console ](https://console.cloud.google.com/).
2. **Frappe Framework** : Ensure you are using a compatible version of Frappe.
3. **Encrypted Storage** : Use the `get_decrypted_password` utility to securely store and retrieve the API key.
