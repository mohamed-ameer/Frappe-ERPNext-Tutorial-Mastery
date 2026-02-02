# Geolocation Field in Frappe & Nominatim API Guide

This guide explains the Geolocation field type in Frappe Framework and how to use OpenStreetMap's Nominatim API for reverse geocoding to get location information in Arabic (or any language).

---

## Table of Contents

1. [What is the Geolocation Field?](#what-is-the-geolocation-field)
2. [What is Nominatim?](#what-is-nominatim)
3. [Geolocation Field in Frappe](#geolocation-field-in-frappe)
4. [Nominatim Reverse Geocoding API](#nominatim-reverse-geocoding-api)
5. [Using Nominatim with Arabic Language](#using-nominatim-with-arabic-language)
6. [Real-World Examples from Frappe](#real-world-examples-from-frappe)
7. [Complete Implementation Guide](#complete-implementation-guide)
8. [Best Practices](#best-practices)

---

## What is the Geolocation Field?

The **Geolocation** field type in Frappe is a specialized field that allows users to:

- **Draw and store geographic data** on an interactive map
- **Mark locations** using markers, circles, polygons, and polylines
- **Store data in GeoJSON format** (industry-standard geographic data format)
- **Visualize locations** using Leaflet.js and OpenStreetMap tiles

### Key Features

| Feature | Description |
|---------|-------------|
| **Interactive Map** | Built-in map interface using Leaflet.js |
| **Drawing Tools** | Markers, circles, polygons, rectangles, polylines |
| **GeoJSON Storage** | Stores data in standardized GeoJSON format |
| **OpenStreetMap** | Uses free OSM tiles (no API key required) |
| **Locate Control** | Built-in button to get user's current location |
| **Read-Only Mode** | Can display maps without editing capabilities |

---

## What is Nominatim?

**Nominatim** is a free, open-source geocoding service that uses OpenStreetMap data to:

1. **Geocoding**: Convert addresses to coordinates (lat/lon)
2. **Reverse Geocoding**: Convert coordinates to addresses
3. **Search**: Find locations by name or address

### History of Nominatim

- **Created**: 2009 by Brian Quinion
- **Purpose**: Provide geocoding services for OpenStreetMap
- **Name Origin**: Latin word meaning "by name"
- **Current Version**: 5.2.0 (as of 2025)
- **Maintained by**: OpenStreetMap Foundation
- **GitHub**: [osm-search/Nominatim](https://github.com/osm-search/Nominatim)
- **License**: GPL-2.0 (Free and Open Source)

### Why Nominatim?

- ✅ **Free** - No API keys or costs
- ✅ **Open Source** - Transparent and community-driven
- ✅ **Global Coverage** - Uses OpenStreetMap data worldwide
- ✅ **Multi-language** - Supports 100+ languages including Arabic
- ✅ **Privacy-Friendly** - No tracking or data collection
- ✅ **Self-Hostable** - Can run your own instance

---

## Geolocation Field in Frappe

### How It Works

**Source:** `frappe/frappe/public/js/frappe/form/controls/geolocation.js`

The Geolocation field:
1. Creates an interactive map using **Leaflet.js**
2. Uses **OpenStreetMap** tiles for the map background
3. Provides **drawing tools** for marking locations
4. Stores data as **GeoJSON** in the database
5. Supports **locate control** to get current GPS position

### Data Format (GeoJSON)

The field stores data in GeoJSON format:

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {},
      "geometry": {
        "type": "Point",
        "coordinates": [38.03700188, 24.08119324]
      }
    }
  ]
}
```

**Important**: GeoJSON uses `[longitude, latitude]` order (reverse of typical lat/lon)!

### Adding Geolocation Field to DocType

**In DocType JSON:**
```json
{
  "fieldname": "location",
  "fieldtype": "Geolocation",
  "label": "Location"
}
```

**In Form Builder:**
1. Add new field
2. Set Field Type: "Geolocation"
3. Set Label: "Location"
4. Save

### Example from ERPNext

**Location DocType** (`erpnext/erpnext/assets/doctype/location/location.json`):

```json
{
  "fieldname": "location",
  "fieldtype": "Geolocation",
  "label": "Location"
}
```

### Example from HRMS

**Shift Location DocType** (`hrms/hrms/hr/doctype/shift_location/shift_location.json`):

```json
{
  "fieldname": "geolocation",
  "fieldtype": "Geolocation",
  "label": "Geolocation"
}
```

---

## Nominatim Reverse Geocoding API

### What is Reverse Geocoding?

**Reverse Geocoding** converts GPS coordinates (latitude, longitude) into a human-readable address.

**Example:**
- **Input**: `24.08119324, 38.03700188`
- **Output**: "المدينة المنورة، منطقة المدينة المنورة، المملكة العربية السعودية"

### API Endpoint

```
https://nominatim.openstreetmap.org/reverse
```

### Base URL Structure

```
https://nominatim.openstreetmap.org/reverse?lat={latitude}&lon={longitude}&format=json
```

### Required Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `lat` | Latitude coordinate | `24.08119324` |
| `lon` | Longitude coordinate | `38.03700188` |
| `format` | Response format | `json`, `xml`, `jsonv2`, `geojson` |

### Optional Parameters

| Parameter | Description | Values | Default |
|-----------|-------------|--------|---------|
| `accept-language` | Language for results | `ar`, `en`, `fr`, etc. | `en` |
| `addressdetails` | Include address breakdown | `0` or `1` | `0` |
| `zoom` | Level of detail | `0-18` | `18` |
| `namedetails` | Include name translations | `0` or `1` | `0` |
| `extratags` | Include OSM tags | `0` or `1` | `0` |

### Example API Call (Arabic)

```
https://nominatim.openstreetmap.org/reverse?lat=24.08119324&lon=38.03700188&format=json&addressdetails=1&accept-language=ar
```

### Response Format

**JSON Response:**

```json
{
  "place_id": 123456789,
  "licence": "Data © OpenStreetMap contributors, ODbL 1.0. https://osm.org/copyright",
  "osm_type": "way",
  "osm_id": 987654321,
  "lat": "24.08119324",
  "lon": "38.03700188",
  "display_name": "المدينة المنورة، منطقة المدينة المنورة، المملكة العربية السعودية",
  "address": {
    "city": "المدينة المنورة",
    "state": "منطقة المدينة المنورة",
    "country": "المملكة العربية السعودية",
    "country_code": "sa"
  },
  "boundingbox": ["24.0", "24.2", "38.0", "38.2"]
}
```

### Address Details Breakdown

When `addressdetails=1`, you get detailed address components:

```json
{
  "address": {
    "road": "شارع الملك فهد",
    "suburb": "العزيزية",
    "city": "المدينة المنورة",
    "state": "منطقة المدينة المنورة",
    "postcode": "42311",
    "country": "المملكة العربية السعودية",
    "country_code": "sa"
  }
}
```

### Zoom Levels

| Zoom | Detail Level | Example |
|------|--------------|---------|
| 3 | Country | Saudi Arabia |
| 5 | State/Region | Medina Region |
| 8 | County | - |
| 10 | City | Medina |
| 14 | Suburb | Al-Aziziyah |
| 16 | Major Streets | King Fahd Road |
| 17 | Major/Minor Streets | - |
| 18 | Building | Specific building |

---

## Using Nominatim with Arabic Language

### Language Parameter

The `accept-language` parameter controls the response language:

```
accept-language=ar
```

### Supported Languages

Nominatim supports 100+ languages including:
- `ar` - Arabic (العربية)
- `en` - English
- `fr` - French
- `es` - Spanish
- `de` - German
- `zh` - Chinese
- `ru` - Russian

### Example: Get Address in Arabic

**API Call:**
```bash
curl "https://nominatim.openstreetmap.org/reverse?lat=24.08119324&lon=38.03700188&format=json&addressdetails=1&accept-language=ar"
```

**Response:**
```json
{
  "display_name": "المدينة المنورة، منطقة المدينة المنورة، المملكة العربية السعودية",
  "address": {
    "city": "المدينة المنورة",
    "state": "منطقة المدينة المنورة",
    "country": "المملكة العربية السعودية",
    "country_code": "sa"
  }
}
```

### Multiple Languages

You can request multiple languages (fallback):

```
accept-language=ar,en
```

This will:
1. Try to return Arabic names first
2. Fall back to English if Arabic not available

---

## Real-World Examples from Frappe

### Example 1: Converting Latitude/Longitude to GeoJSON

**Source:** `hrms/hrms/hr/utils.py` (lines 886-905)

```python
@frappe.whitelist()
def set_geolocation_from_coordinates(doc):
    if not frappe.db.get_single_value("HR Settings", "allow_geolocation_tracking"):
        return

    if not (doc.latitude and doc.longitude):
        return

    doc.geolocation = frappe.json.dumps(
        {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "properties": {},
                    # geojson needs coordinates in reverse order: long, lat instead of lat, long
                    "geometry": {"type": "Point", "coordinates": [doc.longitude, doc.latitude]},
                }
            ],
        }
    )
```

**Key Points:**
- GeoJSON uses `[longitude, latitude]` order (reversed!)
- Wraps coordinates in FeatureCollection format
- Can be called from client-side using `frappe.call()`

### Example 2: Shift Location with Geolocation

**Source:** `hrms/hrms/hr/doctype/shift_location/shift_location.py`

```python
class ShiftLocation(Document):
    def validate(self):
        self.set_geolocation()

    @frappe.whitelist()
    def set_geolocation(self):
        set_geolocation_from_coordinates(self)
```

**Client Script:** `hrms/hrms/hr/doctype/shift_location/shift_location.js`

```javascript
frappe.ui.form.on("Shift Location", {
    fetch_geolocation: (frm) => {
        hrms.fetch_geolocation(frm);
    },
});
```

### Example 3: Displaying Geolocation in List View

**Source:** `hrms/frontend/src/components/FormattedField.vue`

```vue
<div
    v-else-if="props.fieldtype === 'geolocation'"
    class="rounded border-4 translate-z-0 block overflow-hidden w-full h-170 mt-2"
>
    <iframe
        width="100%"
        height="170"
        frameborder="0"
        scrolling="no"
        marginheight="0"
        marginwidth="0"
        style="border: 0"
        :src="`https://maps.google.com/maps?q=${getCoordinates(props.value).latitude},${
            getCoordinates(props.value).longitude
        }&hl=en&z=15&amp;output=embed`"
    >
    </iframe>
</div>
```

---

## Complete Implementation Guide

### Scenario: Store Location and Get Arabic Address

Let's create a complete example that:
1. Stores latitude/longitude
2. Converts to GeoJSON for Geolocation field
3. Calls Nominatim API to get Arabic address

### Step 1: Create DocType Fields

```json
{
  "fields": [
    {
      "fieldname": "latitude",
      "fieldtype": "Float",
      "label": "Latitude",
      "precision": "8"
    },
    {
      "fieldname": "longitude",
      "fieldtype": "Float",
      "label": "Longitude",
      "precision": "8"
    },
    {
      "fieldname": "geolocation",
      "fieldtype": "Geolocation",
      "label": "Map Location"
    },
    {
      "fieldname": "address_ar",
      "fieldtype": "Small Text",
      "label": "Address (Arabic)",
      "read_only": 1
    },
    {
      "fieldname": "address_en",
      "fieldtype": "Small Text",
      "label": "Address (English)",
      "read_only": 1
    },
    {
      "fieldname": "fetch_address",
      "fieldtype": "Button",
      "label": "Fetch Address from Coordinates"
    }
  ]
}
```

### Step 2: Python Server-Side Code

**File:** `your_app/your_module/doctype/your_doctype/your_doctype.py`

```python
import frappe
import requests
from frappe.model.document import Document

class YourDocType(Document):
    def validate(self):
        # Auto-update geolocation when lat/lon changes
        if self.latitude and self.longitude:
            self.set_geolocation_from_coordinates()

    def set_geolocation_from_coordinates(self):
        """Convert latitude/longitude to GeoJSON format"""
        if not (self.latitude and self.longitude):
            return

        self.geolocation = frappe.json.dumps({
            "type": "FeatureCollection",
            "features": [{
                "type": "Feature",
                "properties": {},
                # Important: GeoJSON uses [longitude, latitude] order!
                "geometry": {
                    "type": "Point",
                    "coordinates": [float(self.longitude), float(self.latitude)]
                }
            }]
        })

    @frappe.whitelist()
    def fetch_address_from_nominatim(self):
        """Fetch address from Nominatim API in Arabic and English"""
        if not (self.latitude and self.longitude):
            frappe.throw("Latitude and Longitude are required")

        # Fetch Arabic address
        address_ar = self.get_nominatim_address(language="ar")
        if address_ar:
            self.address_ar = address_ar

        # Fetch English address
        address_en = self.get_nominatim_address(language="en")
        if address_en:
            self.address_en = address_en

        self.save()
        frappe.msgprint("Address fetched successfully!")

    def get_nominatim_address(self, language="en"):
        """
        Get address from Nominatim API

        Args:
            language (str): Language code (ar, en, fr, etc.)

        Returns:
            str: Formatted address or None
        """
        try:
            url = "https://nominatim.openstreetmap.org/reverse"
            params = {
                "lat": self.latitude,
                "lon": self.longitude,
                "format": "json",
                "addressdetails": 1,
                "accept-language": language
            }

            # Add User-Agent header (required by Nominatim usage policy)
            headers = {
                "User-Agent": f"{frappe.local.site}/1.0"
            }

            response = requests.get(url, params=params, headers=headers, timeout=10)
            response.raise_for_status()

            data = response.json()

            if "error" in data:
                frappe.log_error(f"Nominatim API Error: {data['error']}")
                return None

            # Extract address components
            address = data.get("address", {})
            display_name = data.get("display_name", "")

            # Build formatted address
            address_parts = []

            # Add road/street
            if address.get("road"):
                address_parts.append(address["road"])

            # Add suburb/neighborhood
            if address.get("suburb"):
                address_parts.append(address["suburb"])

            # Add city
            if address.get("city"):
                address_parts.append(address["city"])
            elif address.get("town"):
                address_parts.append(address["town"])
            elif address.get("village"):
                address_parts.append(address["village"])

            # Add state/region
            if address.get("state"):
                address_parts.append(address["state"])

            # Add country
            if address.get("country"):
                address_parts.append(address["country"])

            # Return formatted address or display_name
            return ", ".join(address_parts) if address_parts else display_name

        except requests.exceptions.RequestException as e:
            frappe.log_error(f"Nominatim API Request Failed: {str(e)}")
            return None
        except Exception as e:
            frappe.log_error(f"Error fetching address: {str(e)}")
            return None
```

### Step 3: Client-Side JavaScript Code

**File:** `your_app/your_module/doctype/your_doctype/your_doctype.js`

```javascript
frappe.ui.form.on('Your DocType', {
    // When latitude or longitude changes, update geolocation
    latitude: function(frm) {
        update_geolocation(frm);
    },

    longitude: function(frm) {
        update_geolocation(frm);
    },

    // Button click handler
    fetch_address: function(frm) {
        if (!frm.doc.latitude || !frm.doc.longitude) {
            frappe.msgprint(__('Please enter Latitude and Longitude first'));
            return;
        }

        frappe.show_alert({
            message: __('Fetching address from Nominatim...'),
            indicator: 'blue'
        });

        // Call server-side method
        frm.call({
            method: 'fetch_address_from_nominatim',
            doc: frm.doc,
            freeze: true,
            freeze_message: __('Fetching address...'),
            callback: function(r) {
                if (!r.exc) {
                    frm.refresh_fields();
                    frappe.show_alert({
                        message: __('Address fetched successfully!'),
                        indicator: 'green'
                    }, 5);
                }
            }
        });
    },

    // Get current location from browser
    get_current_location: function(frm) {
        if (navigator.geolocation) {
            frappe.show_alert({
                message: __('Getting your location...'),
                indicator: 'blue'
            });

            navigator.geolocation.getCurrentPosition(
                function(position) {
                    // Success callback
                    frm.set_value('latitude', position.coords.latitude);
                    frm.set_value('longitude', position.coords.longitude);

                    frappe.show_alert({
                        message: __('Location captured successfully!'),
                        indicator: 'green'
                    }, 5);
                },
                function(error) {
                    // Error callback
                    let message = '';
                    switch(error.code) {
                        case error.PERMISSION_DENIED:
                            message = __('Location permission denied');
                            break;
                        case error.POSITION_UNAVAILABLE:
                            message = __('Location information unavailable');
                            break;
                        case error.TIMEOUT:
                            message = __('Location request timed out');
                            break;
                        default:
                            message = __('An unknown error occurred');
                    }
                    frappe.msgprint(message);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        } else {
            frappe.msgprint(__('Geolocation is not supported by your browser'));
        }
    }
});

// Helper function to update geolocation field
function update_geolocation(frm) {
    if (frm.doc.latitude && frm.doc.longitude) {
        // Create GeoJSON format
        const geojson = {
            "type": "FeatureCollection",
            "features": [{
                "type": "Feature",
                "properties": {},
                "geometry": {
                    "type": "Point",
                    // Important: GeoJSON uses [longitude, latitude] order!
                    "coordinates": [
                        parseFloat(frm.doc.longitude),
                        parseFloat(frm.doc.latitude)
                    ]
                }
            }]
        };

        frm.set_value('geolocation', JSON.stringify(geojson));
    }
}
```

### Step 4: Add Custom Button (Optional)

Add a button to get current location:

```javascript
frappe.ui.form.on('Your DocType', {
    refresh: function(frm) {
        // Add custom button to get current location
        if (!frm.is_new()) {
            frm.add_custom_button(__('Get Current Location'), function() {
                frm.trigger('get_current_location');
            }, __('Location'));

            // Add button to fetch address
            if (frm.doc.latitude && frm.doc.longitude) {
                frm.add_custom_button(__('Fetch Address'), function() {
                    frm.trigger('fetch_address');
                }, __('Location'));
            }
        }
    }
});
```

### Step 5: Usage Example

**User Workflow:**

1. **Enter coordinates manually:**
   - Latitude: `24.08119324`
   - Longitude: `38.03700188`

2. **Or click "Get Current Location"** to auto-fill from GPS

3. **Geolocation field auto-updates** with map marker

4. **Click "Fetch Address"** button

5. **Result:**
   - Address (Arabic): "المدينة المنورة، منطقة المدينة المنورة، المملكة العربية السعودية"
   - Address (English): "Medina, Medina Region, Saudi Arabia"

---

## Best Practices

### 1. Nominatim Usage Policy

⚠️ **Important**: Nominatim has a fair usage policy:

```python
# ALWAYS include User-Agent header
headers = {
    "User-Agent": f"{frappe.local.site}/1.0"  # Required!
}
```

**Usage Limits:**
- Maximum 1 request per second
- No heavy usage (bulk geocoding)
- Must include User-Agent header
- Consider self-hosting for heavy usage

### 2. Caching Strategy

Cache results to avoid repeated API calls:

```python
@frappe.whitelist()
def fetch_address_from_nominatim(self):
    # Check cache first
    cache_key = f"nominatim_{self.latitude}_{self.longitude}"
    cached_address = frappe.cache().get_value(cache_key)

    if cached_address:
        return cached_address

    # Fetch from API
    address = self.get_nominatim_address()

    # Cache for 30 days
    frappe.cache().set_value(cache_key, address, expires_in_sec=2592000)

    return address
```

### 3. Error Handling

Always handle API failures gracefully:

```python
try:
    response = requests.get(url, params=params, headers=headers, timeout=10)
    response.raise_for_status()
except requests.exceptions.Timeout:
    frappe.msgprint("Request timed out. Please try again.")
except requests.exceptions.RequestException as e:
    frappe.log_error(f"Nominatim API Error: {str(e)}")
    frappe.msgprint("Failed to fetch address. Please try again later.")
```

### 4. GeoJSON Coordinate Order

⚠️ **Critical**: GeoJSON uses `[longitude, latitude]` order (reversed!)

```python
# CORRECT ✅
"coordinates": [longitude, latitude]

# WRONG ❌
"coordinates": [latitude, longitude]
```

### 5. Privacy Considerations

- **User Consent**: Always get user permission before accessing GPS location
- **Data Storage**: Consider privacy laws (GDPR, etc.) when storing location data
- **Accuracy**: GPS coordinates can reveal exact user location

### 6. Self-Hosting Nominatim

For heavy usage, consider self-hosting:

```bash
# Using Docker
docker pull mediagis/nominatim
docker run -it --rm \
  -e PBF_URL=https://download.geofabrik.de/asia/saudi-arabia-latest.osm.pbf \
  -p 8080:8080 \
  mediagis/nominatim:latest
```

Then update your API URL:

```python
url = "http://your-server:8080/reverse"
```

### 7. Rate Limiting

Implement rate limiting to respect Nominatim's usage policy:

```python
import time
from frappe.utils import now_datetime

def get_nominatim_address(self, language="en"):
    # Check last request time
    last_request = frappe.cache().get_value("nominatim_last_request")

    if last_request:
        elapsed = (now_datetime() - last_request).total_seconds()
        if elapsed < 1:
            time.sleep(1 - elapsed)  # Wait to respect 1 req/sec limit

    # Make request
    response = requests.get(url, params=params, headers=headers)

    # Update last request time
    frappe.cache().set_value("nominatim_last_request", now_datetime())

    return response.json()
```

---

## Quick Reference

### API Endpoint Template

```
https://nominatim.openstreetmap.org/reverse?lat={LAT}&lon={LON}&format=json&addressdetails=1&accept-language={LANG}
```

### Common Language Codes

| Code | Language |
|------|----------|
| `ar` | Arabic (العربية) |
| `en` | English |
| `fr` | French |
| `es` | Spanish |
| `de` | German |
| `zh` | Chinese |
| `ru` | Russian |
| `ja` | Japanese |
| `ko` | Korean |
| `hi` | Hindi |

### GeoJSON Point Format

```json
{
  "type": "FeatureCollection",
  "features": [{
    "type": "Feature",
    "properties": {},
    "geometry": {
      "type": "Point",
      "coordinates": [longitude, latitude]
    }
  }]
}
```

### Python Quick Example

```python
import requests

lat, lon = 24.08119324, 38.03700188
url = f"https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lon}&format=json&addressdetails=1&accept-language=ar"
headers = {"User-Agent": "MyApp/1.0"}
response = requests.get(url, headers=headers)
data = response.json()
print(data["display_name"])
```

### JavaScript Quick Example

```javascript
const lat = 24.08119324;
const lon = 38.03700188;
const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1&accept-language=ar`;

fetch(url)
    .then(response => response.json())
    .then(data => console.log(data.display_name));
```

---

## Additional Resources

### Official Documentation
- **Nominatim API Docs**: https://nominatim.org/release-docs/latest/api/Reverse/
- **Nominatim GitHub**: https://github.com/osm-search/Nominatim
- **OpenStreetMap**: https://www.openstreetmap.org/
- **Leaflet.js**: https://leafletjs.com/
- **GeoJSON Spec**: https://geojson.org/

### Frappe Framework References
- **Geolocation Control**: `frappe/frappe/public/js/frappe/form/controls/geolocation.js`
- **HRMS Geolocation Utils**: `hrms/hrms/hr/utils.py` (lines 886-905)
- **Shift Location Example**: `hrms/hrms/hr/doctype/shift_location/`
- **ERPNext Location**: `erpnext/erpnext/assets/doctype/location/`

### Testing Tools
- **Nominatim Search**: https://nominatim.openstreetmap.org/
- **GeoJSON Validator**: https://geojson.io/
- **Coordinate Finder**: https://www.latlong.net/

---

## Summary

This guide covered:

- ✅ **Geolocation Field** - Interactive map field in Frappe using Leaflet.js and GeoJSON
- ✅ **Nominatim API** - Free, open-source reverse geocoding service
- ✅ **Arabic Language Support** - Using `accept-language=ar` parameter
- ✅ **Real Examples** - From HRMS and ERPNext codebases
- ✅ **Complete Implementation** - Python server-side and JavaScript client-side code
- ✅ **Best Practices** - Caching, rate limiting, error handling, privacy

**Key Takeaways:**
1. GeoJSON uses `[longitude, latitude]` order (reversed!)
2. Always include `User-Agent` header in Nominatim requests
3. Respect 1 request/second rate limit
4. Cache results to minimize API calls
5. Consider self-hosting for heavy usage