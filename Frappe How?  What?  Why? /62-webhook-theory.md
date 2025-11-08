# Webhook Theory

## Intro
Before we talk about webhooks in Frappe, let's first understand what a webhook actually is and how it works.
And before that, we need to understand some key web concepts like HTTP requests, HTTP responses, and web services.

---

## API vs Webhook
At the beginnig we need to understand the difference between API and webhook.
Both API and webhook are used to integrate two applications (transfer data between two software applications), but they are used in different scenarios. let's understand the difference between them.

## What is the difference between API and webhook?
### API
API (Application Programming Interface) is a set of defined methods (endpoints) and protocols that let one application request data or actions from another.
Typically, a client app sends an HTTP request (like GET or POST) to the API, and the server responds with data.
### Webhook
Webhook is a way for an application to send real-time data to another application. Webhooks are typically used to send data to another application when something happens in the first application (external event). 
A webhook lets an application automatically send data in real time to another application when an event occurs.
Instead of waiting for another app to request data, the first app pushes data immediately.

For example, when a new order is placed in an e-commerce store, a webhook can be sent to a shipping application to notify it of the new order.
### Difference
- API is a pull mechanism, while webhook is a push mechanism.
- API is a request-response mechanism, while webhook is a event-based mechanism.
- API calls are typically made by clients (like browsers or apps) to a server, while webhooks are usually server-to-server HTTP requests.
- API works on a request-response cycle (send request, wait for response), while webhook works on a event-based cycle (event occurs in first application,the first application send data (post request) to the second application without waiting for a response from the second application and without even knowing if the second application received the data or not and even without need a request from the second application).
- API is a two-way communication, while webhook is a one-way communication.
- webhook send data to a specific URL (webhook URL) when an event occurs in the first application without waiting for a request from the second application, while API requires a request from the client to get data.
- webhook use HTTP POST request to send data to the webhook URL without waiting for a response and without even knowing if the second application received the data or not and even without need a request from the second application (it is a one-way communication depends on event occurrence in the first application and the second application will have the logic to handle the data), while API can use HTTP GET, POST, PUT, DELETE, etc. to request data from the API endpoint. (but technically Webhooks usually send HTTP POST requests and expect a simple acknowledgment (like HTTP 200 OK), but they don’t wait for or require a complex response. let's just say that webhook doesn't wait for a response from the second application)
- webhook will send data even if we didn't ask for it (it is a one-way communication depends on event occurrence in the first application), while API requires a request from the client to get data.
- To be honest, webhook is a type of API, but it is a one-way communication API (it is a push mechanism), while API can be a two-way communication (it is a pull mechanism). The webhook does usually expect a simple response like HTTP 200 OK — it doesn’t “ignore the response” entirely.

--- 

## What is a HTTP request?
HTTP (Hypertext Transfer Protocol) is the foundation of web communication.
A request is sent from a client (like a browser or an app) to a server, asking it to perform an action — such as fetching or sending data.

## What is a HTTP response?
An HTTP response is a message sent by a server to a client in response to a HTTP request (the result/output/answer of the request).

An HTTP response is the message the server sends back after processing the request — it includes:
- A status code (e.g. 200 OK, 404 Not Found)
- Optional data (e.g. JSON, HTML, etc.)

## What is a Web Service?
A web service is a general term for any system that allows applications to communicate over the web using standard protocols (like HTTP) and formats (like JSON or XML).

In simple terms, a web service is a way for two applications to communicate with each other over the internet. It's like a conversation between two people, but instead of using words, they use a standard format called XML or JSON.

An example of web service is a weather app that displays the current weather in a city. The app sends a request to a web service that provides weather data, and the web service responds with the current weather in the requested city.

**Is webhook a type of web service?**

yes, a webhook can be considered a type of web service, because it also allows applications to communicate over HTTP.

## What is a Webhook?
A webhook is an HTTP callback (call me back at this URL when something happens) — a way for one system to automatically notify another when an event occurs.
Instead of asking for updates, the receiving app just waits for the sender to POST new data.

A webhook is a way for an application to provide other applications with real-time information. It does this by sending a "webhook" - which is just a small piece of data - to a specified URL whenever something happens.

For example, if you have an e-commerce store and you want to know when a new order is placed, you can set up a webhook. Whenever a new order is placed, your store will send a webhook to a URL you specify. This webhook might contain information about the order, like the customer's name and the items they ordered.

## How does it work?
When an event occurs (like a new order being placed), the application that detected the event sends a HTTP POST request to the specified URL with the webhook data. The receiving application then processes this data as needed.

**How Does It Work?**

1. An event happens in App A (e.g., “new order created”).
2. App A sends an HTTP POST request to a preconfigured webhook URL in App B.
3. App B receives the request and executes its own logic (e.g., sends an SMS, updates a record, etc.).
4. App B usually replies with a simple 200 OK to confirm receipt.

## Why use webhooks?
Webhooks are a powerful tool for building real-time applications. They allow you to build applications that can react to events as they happen, rather than having to poll for updates. This can make your applications more responsive and efficient.

## Example
Let's say you have an e-commerce store and you want to send a notification to a customer whenever their order is shipped. You can set up a webhook that sends a notification to a specified URL whenever an order is shipped. The receiving application can then process this data and send a notification to the customer.

## How to use webhooks?

You need two applications:

1. Receiver (App B, the second app, the server, the one that will receive the webhook):
    - Implement an API endpoint (e.g. /api/webhooks/order)
    - This endpoint should accept POST requests and process the incoming data.

2. Sender (App A, the first app, the client, the one that will send the webhook):
    - Define which event should trigger the webhook (e.g. new order, payment received).
    - Configure the receiver’s URL in its webhook settings.

Now, whenever the event occurs, App A will send a POST request to App B’s URL.

---

you will have two applications, the first application is the one that will send the webhook (the one that has the event) and the second application is the one that will receive the webhook (the one that will process the data).

1. in the second app you need to prepare the function or the logic that will process the data that will be sent from the first app 
2. then you need to prepare URL to expose this function to the internet (make endpoint/route/URL for it) -- (If your app is hosted locally (like during development), you can use a tunneling service like ngrok or cloudflared to expose your local endpoint to the internet for testing.)
3. in the first app (that you want to integrate with the second app) you need to specify the URL of the second app endpoint in the webhook settings (to be used as the webhook URL, the URL that the first app will send the webhook data to) and the event that will trigger the webhook.
4. now whenever the event occurs in the first app, the first app will send a HTTP POST request to the specified URL with the webhook data. (which means we have data that will i get even if i didn't ask for it)

---

**Who Is the Client and Who Is the Server?**

- The sender (App A) acts as the client, because it initiates the HTTP request.
- The receiver (App B) acts as the server, because it listens for incoming requests.

**Note:**

The webhook is not the app itself — it’s the mechanism or the HTTP callback URL.
So:

- App A is the sender (webhook provider)
- App B is the receiver (webhook consumer)
- The “webhook” refers to the notification request itself (the POST call + payload).

---

### Summary

- Webhook = automated HTTP POST triggered by an event.
- API = manual HTTP request made when needed.
- Webhooks are ideal for real-time, event-driven integrations.
- They are widely used in systems like GitHub, Stripe, Frappe, Shopify, and others.
