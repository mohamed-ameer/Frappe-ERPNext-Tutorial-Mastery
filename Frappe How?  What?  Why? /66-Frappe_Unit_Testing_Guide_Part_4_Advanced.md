# Frappe Unit Testing Guide - Part 4: Advanced Testing Techniques

## Table of Contents
1. [Mocking and Patching](#mocking-and-patching)
2. [Testing Background Jobs](#testing-background-jobs)
3. [Testing Hooks](#testing-hooks)
4. [Testing with External Services](#testing-with-external-services)
5. [Testing Transactions](#testing-transactions)
6. [Testing Concurrency](#testing-concurrency)
7. [Testing Performance](#testing-performance)
8. [Testing Caching](#testing-caching)
9. [Testing Custom Methods](#testing-custom-methods)
10. [Advanced Context Managers](#advanced-context-managers)
11. [Testing with Multiple Sites](#testing-with-multiple-sites)
12. [Testing Async Operations](#testing-async-operations)

---

## Mocking and Patching

Mocking allows you to replace real objects with fake ones during testing. This is useful for isolating code under test and avoiding side effects.

### Basic Mocking with unittest.mock

Frappe uses Python's built-in `unittest.mock` module for mocking.

#### Simple Mock

```python
from unittest.mock import Mock, patch
import frappe
from frappe.tests.utils import FrappeTestCase

class TestMyFunction(FrappeTestCase):
    def test_with_mock(self):
        # Create a mock object
        mock_obj = Mock()
        mock_obj.method.return_value = "mocked_value"
        
        # Use the mock
        result = mock_obj.method()
        self.assertEqual(result, "mocked_value")
        
        # Verify the method was called
        mock_obj.method.assert_called_once()
```

#### Patching Functions

```python
from unittest.mock import patch

class TestMyDocType(FrappeTestCase):
    @patch('frappe.get_doc')
    def test_with_patched_function(self, mock_get_doc):
        # Configure mock return value
        mock_doc = Mock()
        mock_doc.name = "test-doc"
        mock_get_doc.return_value = mock_doc
        
        # Your code that uses frappe.get_doc
        doc = frappe.get_doc("MyDocType", "test-doc")
        
        # Verify it was called correctly
        mock_get_doc.assert_called_once_with("MyDocType", "test-doc")
        self.assertEqual(doc.name, "test-doc")
```

#### Patching as Context Manager

```python
def test_with_context_manager(self):
    with patch('frappe.get_doc') as mock_get_doc:
        mock_doc = Mock()
        mock_doc.name = "test-doc"
        mock_get_doc.return_value = mock_doc
        
        doc = frappe.get_doc("MyDocType", "test-doc")
        self.assertEqual(doc.name, "test-doc")
    
    # Patch is automatically removed after context
```

#### Patching Object Attributes

```python
@patch.object(frappe.utils.frappecloud, "on_frappecloud", return_value=True)
def test_patch_object_attribute(self, mock_on_frappecloud):
    # Test code that uses frappe.utils.frappecloud.on_frappecloud
    result = frappe.utils.frappecloud.on_frappecloud()
    self.assertTrue(result)
    mock_on_frappecloud.assert_called_once()
```

#### Patching Dictionary Values

```python
@patch.dict(frappe.conf, {"developer_mode": 0, "http_timeout": 20})
def test_patch_config(self):
    # Test code that reads from frappe.conf
    self.assertEqual(frappe.conf.developer_mode, 0)
    self.assertEqual(frappe.conf.http_timeout, 20)
```

#### Patching Multiple Objects

```python
@patch('frappe.get_doc')
@patch('frappe.db.get_value')
@patch('frappe.cache')
def test_multiple_patches(self, mock_cache, mock_db, mock_get_doc):
    # Configure all mocks
    mock_get_doc.return_value = Mock(name="test-doc")
    mock_db.get_value.return_value = "test-value"
    
    # Your test code
    pass
```

**Note**: Patch decorators are applied bottom-to-top, so the last decorator is the first parameter.

### Mocking Document Methods

```python
from unittest.mock import Mock, patch

class TestDocumentMethods(FrappeTestCase):
    def test_mock_document_method(self):
        doc = frappe.get_doc({
            "doctype": "ToDo",
            "description": "test"
        })
        
        # Mock a method
        doc.notify_update = Mock()
        doc.insert()
        
        # Verify method was called
        self.assertEqual(doc.notify_update.call_count, 1)
    
    def test_mock_run_method(self):
        doc = frappe.get_doc("User", "Administrator")
        
        # Override a method
        def my_as_dict(*args, **kwargs):
            return "success"
        
        doc.as_dict = my_as_dict
        
        # Test run_method with override
        result = doc.run_method("as_dict")
        self.assertEqual(result, "success")
```

### When to Use Mocking

**Use mocking when**:
- Testing code that makes external API calls
- Testing code that depends on expensive operations
- Testing error handling without causing real errors
- Isolating units of code
- Testing code that depends on time/date functions

**Avoid mocking when**:
- You can test with real objects easily
- Mocking makes tests more complex than the code
- You need to test real integration
- Mocking hides important behavior

---

## Testing Background Jobs

Frappe uses RQ (Redis Queue) for background job processing. Testing background jobs requires special handling.

### Testing Enqueued Jobs

```python
import frappe
from frappe.tests.utils import FrappeTestCase
from frappe.utils.background_jobs import get_queue

class TestBackgroundJobs(FrappeTestCase):
    def test_enqueue_job(self):
        # Enqueue a job
        job = frappe.enqueue(
            method="frappe.handler.ping",
            queue="short"
        )
        
        # Verify job was enqueued
        self.assertIsNotNone(job)
        self.assertIsNotNone(job.id)
    
    def test_enqueue_with_kwargs(self):
        def my_function(arg1, arg2):
            return arg1 + arg2
        
        job = frappe.enqueue(
            method=my_function,
            queue="default",
            arg1=10,
            arg2=20
        )
        
        self.assertIsNotNone(job)
    
    def test_enqueue_at_front(self):
        """Test high priority jobs"""
        # Enqueue normal job
        low_priority = frappe.enqueue(
            method="frappe.handler.ping",
            queue="short"
        )
        
        # Enqueue high priority job
        high_priority = frappe.enqueue(
            method="frappe.handler.ping",
            queue="short",
            at_front=True
        )
        
        # High priority should be earlier in queue
        self.assertTrue(
            high_priority.get_position() < low_priority.get_position()
        )
```

### Testing Job Execution

```python
import time
from frappe.utils.background_jobs import execute_job

class TestJobExecution(FrappeTestCase):
    def test_execute_job_synchronously(self):
        """Test job execution without async"""
        result = frappe.enqueue(
            method="frappe.handler.ping",
            queue="short",
            is_async=False  # Execute immediately
        )
        
        self.assertEqual(result, "pong")
    
    def test_execute_job_with_now(self):
        """Test immediate job execution"""
        result = frappe.enqueue(
            method="frappe.handler.ping",
            queue="short",
            now=True  # Execute immediately
        )
        
        self.assertEqual(result, "pong")
    
    def test_wait_for_job_completion(self):
        """Test waiting for async job to complete"""
        job = frappe.enqueue(
            method="frappe.handler.ping",
            queue="short"
        )
        
        # Wait for completion
        while job.is_queued or job.is_started:
            time.sleep(0.1)
        
        # Verify job completed
        self.assertTrue(job.is_finished)
        self.assertEqual(job.result, "pong")
```

### Testing Job Hooks

```python
import time
from unittest.mock import patch
from frappe.utils.background_jobs import execute_job

class TestJobHooks(FrappeTestCase):
    def test_before_job_hook(self):
        """Test before_job hook execution"""
        hook_called = []
        
        def before_job_handler(*args, **kwargs):
            hook_called.append("before")
        
        with patch('frappe.get_hooks', return_value={
            'before_job': ['my_app.hooks.before_job_handler']
        }):
            execute_job(
                site=frappe.local.site,
                method="frappe.handler.ping",
                event=None,
                job_name="test",
                is_async=True,
                kwargs={}
            )
            
            self.assertIn("before", hook_called)
    
    def test_after_job_hook(self):
        """Test after_job hook execution"""
        hook_called = []
        
        def after_job_handler(*args, **kwargs):
            hook_called.append("after")
        
        with patch('frappe.get_hooks', return_value={
            'after_job': ['my_app.hooks.after_job_handler']
        }):
            execute_job(
                site=frappe.local.site,
                method="frappe.handler.ping",
                event=None,
                job_name="test",
                is_async=True,
                kwargs={}
            )
            
            self.assertIn("after", hook_called)
```

### Testing Failed Jobs

```python
from frappe.core.doctype.rq_job.rq_job import remove_failed_jobs
from frappe.utils.background_jobs import get_redis_conn, generate_qname
from rq import Queue

class TestFailedJobs(FrappeTestCase):
    def test_remove_failed_jobs(self):
        """Test removing failed jobs from queue"""
        # Enqueue a job that will fail
        frappe.enqueue(
            method="frappe.tests.test_background_jobs.fail_function",
            queue="short"
        )
        
        # Wait for job to fail
        time.sleep(2)
        
        # Check failed jobs exist
        conn = get_redis_conn()
        queues = Queue.all(conn)
        
        for queue in queues:
            if queue.name == generate_qname("short"):
                fail_registry = queue.failed_job_registry
                self.assertGreater(fail_registry.count, 0)
        
        # Remove failed jobs
        remove_failed_jobs()
        
        # Verify failed jobs removed
        for queue in queues:
            if queue.name == generate_qname("short"):
                fail_registry = queue.failed_job_registry
                self.assertEqual(fail_registry.count, 0)

def fail_function():
    """Function that always fails"""
    return 1 / 0
```

### Testing Job Deduplication

```python
class TestJobDeduplication(FrappeTestCase):
    def test_deduplicate_jobs(self):
        """Test that duplicate jobs are not enqueued"""
        job_id = "unique-job-id"
        
        # Enqueue first job
        job1 = frappe.enqueue(
            method="frappe.handler.ping",
            queue="short",
            job_id=job_id,
            deduplicate=True
        )
        
        # Try to enqueue duplicate
        job2 = frappe.enqueue(
            method="frappe.handler.ping",
            queue="short",
            job_id=job_id,
            deduplicate=True
        )
        
        # Second job should not be enqueued
        self.assertIsNone(job2)
```

---

## Testing Hooks

Hooks are a powerful Frappe feature that allows apps to extend functionality. Testing hooks requires patching the hook system.

### Testing Document Hooks

```python
from unittest.mock import patch
import frappe

class TestDocumentHooks(FrappeTestCase):
    def test_before_insert_hook(self):
        """Test before_insert hook"""
        hook_called = []
        
        def before_insert_handler(doc, method):
            hook_called.append("before_insert")
        
        with patch('frappe.get_doc_hooks', return_value={
            'MyDocType': {
                'before_insert': ['my_app.hooks.before_insert_handler']
            }
        }):
            doc = frappe.get_doc({
                "doctype": "MyDocType",
                "field1": "value1"
            })
            doc.insert()
            
            self.assertIn("before_insert", hook_called)
    
    def test_on_update_hook(self):
        """Test on_update hook"""
        hook_called = []
        
        def on_update_handler(doc, method):
            hook_called.append("on_update")
        
        with patch('frappe.get_doc_hooks', return_value={
            'MyDocType': {
                'on_update': ['my_app.hooks.on_update_handler']
            }
        }):
            doc = frappe.get_doc({
                "doctype": "MyDocType",
                "field1": "value1"
            })
            doc.insert()
            doc.field1 = "new_value"
            doc.save()
            
            self.assertIn("on_update", hook_called)
```

### Testing App Hooks

```python
from frappe.tests.utils import patch_hooks

class TestAppHooks(FrappeTestCase):
    def test_custom_hook(self):
        """Test custom app hook"""
        overridden_hooks = {
            'my_custom_hook': ['my_app.hooks.custom_handler']
        }
        
        with patch_hooks(overridden_hooks):
            hooks = frappe.get_hooks('my_custom_hook')
            self.assertIn('my_app.hooks.custom_handler', hooks)
```

### Testing Permission Hooks

```python
class TestPermissionHooks(FrappeTestCase):
    def test_permission_query_hook(self):
        """Test permission query hook"""
        def custom_permission_query(doctype, user):
            return f"`tab{doctype}`.owner = '{user}'"
        
        with patch('frappe.get_hooks', return_value={
            'permission_query_conditions': {
                'MyDocType': ['my_app.hooks.custom_permission_query']
            }
        }):
            # Test that permission query is applied
            pass
```

---

## Testing with External Services

When your code interacts with external services (APIs, email, etc.), you should mock those interactions.

### Testing HTTP Requests

Frappe provides `MockedRequestTestCase` for testing code that makes HTTP requests.

```python
from frappe.tests.utils import MockedRequestTestCase
import responses

class TestExternalAPI(MockedRequestTestCase):
    def test_external_api_call(self):
        """Test code that calls external API"""
        # Mock the external API response
        self.responses.add(
            responses.GET,
            "https://api.example.com/data",
            json={"status": "ok", "data": "test"},
            status=200
        )
        
        # Your code that calls the API
        import requests
        response = requests.get("https://api.example.com/data")
        
        # Verify response
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "ok")
    
    def test_api_error_handling(self):
        """Test handling of API errors"""
        # Mock API error
        self.responses.add(
            responses.GET,
            "https://api.example.com/data",
            status=500
        )
        
        # Test error handling
        import requests
        response = requests.get("https://api.example.com/data")
        self.assertEqual(response.status_code, 500)
```

### Testing Email Sending

```python
from unittest.mock import patch

class TestEmailSending(FrappeTestCase):
    @patch('frappe.sendmail')
    def test_send_email(self, mock_sendmail):
        """Test email sending without actually sending"""
        # Configure mock
        mock_sendmail.return_value = True
        
        # Your code that sends email
        frappe.sendmail(
            recipients=["test@example.com"],
            subject="Test",
            message="Test message"
        )
        
        # Verify email was "sent"
        mock_sendmail.assert_called_once()
        call_args = mock_sendmail.call_args
        self.assertIn("test@example.com", call_args[1]["recipients"])
    
    def test_email_queue(self):
        """Test email queuing"""
        frappe.sendmail(
            recipients=["test@example.com"],
            subject="Test",
            message="Test message"
        )
        
        # Verify email is queued
        email_queue = frappe.get_all("Email Queue", filters={"status": "Not Sent"})
        self.assertGreater(len(email_queue), 0)
```

### Testing File Operations

```python
from unittest.mock import patch, mock_open
import os

class TestFileOperations(FrappeTestCase):
    @patch('builtins.open', new_callable=mock_open, read_data="file content")
    def test_read_file(self, mock_file):
        """Test file reading"""
        with open("test.txt", "r") as f:
            content = f.read()
        
        self.assertEqual(content, "file content")
        mock_file.assert_called_once_with("test.txt", "r")
    
    @patch('os.path.exists', return_value=True)
    def test_file_exists(self, mock_exists):
        """Test file existence check"""
        exists = os.path.exists("test.txt")
        self.assertTrue(exists)
        mock_exists.assert_called_once_with("test.txt")
```

---

## Testing Transactions

Frappe automatically manages transactions in tests, but sometimes you need to test transaction behavior explicitly.

### Testing Savepoints

```python
from frappe.database import savepoint

class TestTransactions(FrappeTestCase):
    def test_savepoint_rollback(self):
        """Test savepoint and rollback"""
        # Create document
        doc = frappe.get_doc({
            "doctype": "MyDocType",
            "field1": "value1"
        })
        doc.insert()
        
        # Create savepoint
        sp = savepoint()
        
        # Make changes
        doc.field1 = "new_value"
        doc.save()
        
        # Rollback to savepoint
        frappe.db.rollback(save_point=sp)
        
        # Verify changes were rolled back
        doc.reload()
        self.assertEqual(doc.field1, "value1")
```

### Testing Transaction Isolation

```python
class TestTransactionIsolation(FrappeTestCase):
    def test_isolation_with_connections(self):
        """Test transaction isolation between connections"""
        # Primary connection
        with self.primary_connection():
            doc = frappe.get_doc({
                "doctype": "MyDocType",
                "field1": "value1"
            })
            doc.insert()
            # Don't commit yet
        
        # Secondary connection (shouldn't see uncommitted changes)
        with self.secondary_connection():
            # Try to read - should not see the document
            docs = frappe.get_all("MyDocType", filters={"field1": "value1"})
            self.assertEqual(len(docs), 0)
```

### Testing Deadlock Handling

```python
class TestDeadlockHandling(FrappeTestCase):
    def test_deadlock_retry(self):
        """Test handling of database deadlocks"""
        # Simulate deadlock scenario
        with self.primary_connection():
            doc1 = frappe.get_doc("MyDocType", "doc1")
            # Lock row
        
        with self.secondary_connection():
            doc2 = frappe.get_doc("MyDocType", "doc2")
            # Try to lock same row - may cause deadlock
        
        # Frappe should handle deadlock and retry
        pass
```

---

## Testing Concurrency

Testing concurrent operations helps identify race conditions and locking issues.

### Testing Concurrent Document Updates

```python
import threading
import time

class TestConcurrency(FrappeTestCase):
    def test_concurrent_updates(self):
        """Test concurrent document updates"""
        doc = frappe.get_doc({
            "doctype": "MyDocType",
            "field1": "initial"
        })
        doc.insert()
        
        results = []
        
        def update_document(value):
            try:
                d = frappe.get_doc("MyDocType", doc.name)
                d.field1 = value
                d.save()
                results.append(("success", value))
            except Exception as e:
                results.append(("error", str(e)))
        
        # Create multiple threads
        threads = []
        for i in range(5):
            t = threading.Thread(target=update_document, args=(f"value{i}",))
            threads.append(t)
            t.start()
        
        # Wait for all threads
        for t in threads:
            t.join()
        
        # Verify results
        # Some updates may fail due to conflicts
        self.assertGreater(len(results), 0)
```

### Testing Document Locks

```python
class TestDocumentLocks(FrappeTestCase):
    def test_document_lock(self):
        """Test document locking mechanism"""
        doc = frappe.get_doc({
            "doctype": "MyDocType",
            "field1": "value1"
        })
        doc.insert()
        
        # Lock document
        frappe.db.set_value("MyDocType", doc.name, "locked", 1)
        
        # Try to update locked document
        doc.field1 = "new_value"
        with self.assertRaises(frappe.ValidationError):
            doc.save()
```

---

## Testing Performance

Performance testing ensures your code meets performance requirements.

### Testing Query Performance

```python
class TestQueryPerformance(FrappeTestCase):
    def test_query_count(self):
        """Test that queries are optimized"""
        with self.assertQueryCount(5):  # Maximum 5 queries
            # Your code that should be optimized
            docs = frappe.get_all("MyDocType", limit=10)
            for doc in docs:
                frappe.get_doc("MyDocType", doc.name)
    
    def test_rows_read(self):
        """Test that not too many rows are read"""
        with self.assertRowsRead(100):  # Maximum 100 rows
            # Your code that reads data
            frappe.get_all("MyDocType", limit=100)
```

### Testing Cache Performance

```python
class TestCachePerformance(FrappeTestCase):
    def test_redis_calls(self):
        """Test that cache calls are optimized"""
        with self.assertRedisCallCounts(3):  # Maximum 3 Redis calls
            # Your code that uses cache
            frappe.cache().get_value("key1")
            frappe.cache().get_value("key2")
            frappe.cache().set_value("key3", "value")
```

### Profiling Tests

```python
import cProfile
import pstats
from io import StringIO

class TestPerformance(FrappeTestCase):
    def test_with_profiling(self):
        """Test with performance profiling"""
        profiler = cProfile.Profile()
        profiler.enable()
        
        # Your code to profile
        for i in range(1000):
            frappe.get_doc("User", "Administrator")
        
        profiler.disable()
        
        # Analyze results
        s = StringIO()
        ps = pstats.Stats(profiler, stream=s)
        ps.sort_stats('cumulative')
        ps.print_stats(10)  # Top 10 functions
        
        # Check for performance issues
        output = s.getvalue()
        # Analyze output for bottlenecks
```

---

## Testing Caching

Frappe uses Redis for caching. Test cache behavior to ensure correct caching logic.

### Testing Cache Operations

```python
class TestCaching(FrappeTestCase):
    def test_cache_set_get(self):
        """Test basic cache operations"""
        # Set cache value
        frappe.cache().set_value("test_key", "test_value")
        
        # Get cache value
        value = frappe.cache().get_value("test_key")
        self.assertEqual(value, "test_value")
    
    def test_cache_expiry(self):
        """Test cache expiration"""
        # Set cache with expiry
        frappe.cache().set_value("test_key", "test_value", expires_in_sec=1)
        
        # Value should exist
        value = frappe.cache().get_value("test_key")
        self.assertEqual(value, "test_value")
        
        # Wait for expiry
        import time
        time.sleep(2)
        
        # Value should be expired
        value = frappe.cache().get_value("test_key")
        self.assertIsNone(value)
    
    def test_cache_delete(self):
        """Test cache deletion"""
        # Set cache value
        frappe.cache().set_value("test_key", "test_value")
        
        # Delete cache value
        frappe.cache().delete_value("test_key")
        
        # Value should be gone
        value = frappe.cache().get_value("test_key")
        self.assertIsNone(value)
```

### Testing Cache Invalidation

```python
class TestCacheInvalidation(FrappeTestCase):
    def test_clear_cache(self):
        """Test cache clearing"""
        # Set multiple cache values
        frappe.cache().set_value("key1", "value1")
        frappe.cache().set_value("key2", "value2")
        
        # Clear all cache
        frappe.clear_cache()
        
        # Values should be gone
        self.assertIsNone(frappe.cache().get_value("key1"))
        self.assertIsNone(frappe.cache().get_value("key2"))
    
    def test_clear_doctype_cache(self):
        """Test clearing cache for specific DocType"""
        # Set cache for DocType
        frappe.cache().set_value("doctype:MyDocType", "meta_data")
        
        # Clear DocType cache
        frappe.clear_cache(doctype="MyDocType")
        
        # DocType cache should be cleared
        self.assertIsNone(frappe.cache().get_value("doctype:MyDocType"))
```

---

## Testing Custom Methods

Test custom methods on DocTypes and other classes.

### Testing Document Methods

```python
class TestCustomMethods(FrappeTestCase):
    def test_custom_document_method(self):
        """Test custom method on document"""
        doc = frappe.get_doc({
            "doctype": "MyDocType",
            "field1": "value1"
        })
        doc.insert()
        
        # Test custom method
        result = doc.my_custom_method()
        self.assertEqual(result, expected_value)
    
    def test_method_with_parameters(self):
        """Test method with parameters"""
        doc = frappe.get_doc("MyDocType", "test-doc")
        
        result = doc.calculate_total(discount=10, tax=5)
        self.assertEqual(result, expected_total)
    
    def test_method_side_effects(self):
        """Test method that modifies document"""
        doc = frappe.get_doc({
            "doctype": "MyDocType",
            "field1": "value1"
        })
        doc.insert()
        
        # Method should update document
        doc.apply_discount(10)
        
        # Verify side effects
        self.assertEqual(doc.discount_percentage, 10)
        self.assertNotEqual(doc.total, doc.original_total)
```

### Testing Static Methods

```python
class TestStaticMethods(FrappeTestCase):
    def test_static_method(self):
        """Test static/class method"""
        result = MyDocType.get_total_for_items(items)
        self.assertEqual(result, expected_total)
    
    def test_utility_function(self):
        """Test utility function"""
        from my_app.utils import calculate_tax
        
        result = calculate_tax(amount=1000, rate=10)
        self.assertEqual(result, 100)
```

---

## Advanced Context Managers

Frappe provides several advanced context managers for testing.

### Testing with Settings Changes

```python
from frappe.tests.utils import change_settings

class TestSettings(FrappeTestCase):
    @change_settings("System Settings", {"enable_scheduler": 0})
    def test_with_settings_change(self):
        """Test with temporary settings change"""
        # Settings are automatically restored after test
        settings = frappe.get_doc("System Settings")
        self.assertEqual(settings.enable_scheduler, 0)
    
    @change_settings("Print Settings", send_print_as_pdf=1)
    def test_settings_as_kwargs(self):
        """Test settings change using kwargs"""
        settings = frappe.get_doc("Print Settings")
        self.assertEqual(settings.send_print_as_pdf, 1)
```

### Testing with Time Freeze

```python
class TestTimeFreeze(FrappeTestCase):
    def test_freeze_time(self):
        """Test with frozen time"""
        with self.freeze_time("2024-01-15 10:00:00"):
            # All datetime operations use frozen time
            doc = frappe.get_doc({
                "doctype": "MyDocType",
                "date_field": frappe.utils.nowdate()
            })
            doc.insert()
            
            # Date should be frozen
            self.assertEqual(str(doc.date_field), "2024-01-15")
    
    def test_time_based_calculations(self):
        """Test time-based calculations with frozen time"""
        with self.freeze_time("2024-01-15 10:00:00"):
            start_time = frappe.utils.now()
            
            # Simulate time passing
            with self.freeze_time("2024-01-16 10:00:00"):
                end_time = frappe.utils.now()
                duration = (end_time - start_time).days
                self.assertEqual(duration, 1)
```

### Testing with User Context

```python
class TestUserContext(FrappeTestCase):
    def test_user_switching(self):
        """Test switching between users"""
        # Create test users
        user1 = frappe.get_doc({
            "doctype": "User",
            "email": "user1@test.com",
            "first_name": "User 1"
        })
        if not frappe.db.exists("User", user1.email):
            user1.insert()
        
        user2 = frappe.get_doc({
            "doctype": "User",
            "email": "user2@test.com",
            "first_name": "User 2"
        })
        if not frappe.db.exists("User", user2.email):
            user2.insert()
        
        # Switch to user1
        with self.set_user(user1.email):
            doc1 = frappe.get_doc({
                "doctype": "MyDocType",
                "field1": "value1"
            })
            doc1.insert()
            self.assertEqual(doc1.owner, user1.email)
        
        # Switch to user2
        with self.set_user(user2.email):
            doc2 = frappe.get_doc({
                "doctype": "MyDocType",
                "field1": "value2"
            })
            doc2.insert()
            self.assertEqual(doc2.owner, user2.email)
```

### Testing with Site Switching

```python
class TestSiteSwitching(FrappeTestCase):
    def test_multi_site_operations(self):
        """Test operations across multiple sites"""
        with self.switch_site("site1"):
            doc1 = frappe.get_doc({
                "doctype": "MyDocType",
                "field1": "site1_value"
            })
            doc1.insert()
            doc1_name = doc1.name
        
        with self.switch_site("site2"):
            # Document from site1 should not exist in site2
            self.assertFalse(frappe.db.exists("MyDocType", doc1_name))
            
            doc2 = frappe.get_doc({
                "doctype": "MyDocType",
                "field1": "site2_value"
            })
            doc2.insert()
```

---

## Testing with Multiple Sites

Frappe supports multi-tenant setups. Test cross-site operations and site-specific behavior.

### Testing Site-Specific Data

```python
class TestMultiSite(FrappeTestCase):
    def test_site_isolation(self):
        """Test that sites are isolated"""
        site1_docs = []
        site2_docs = []
        
        # Create documents in site1
        with self.switch_site("site1"):
            for i in range(5):
                doc = frappe.get_doc({
                    "doctype": "MyDocType",
                    "field1": f"site1_doc_{i}"
                })
                doc.insert()
                site1_docs.append(doc.name)
        
        # Create documents in site2
        with self.switch_site("site2"):
            for i in range(5):
                doc = frappe.get_doc({
                    "doctype": "MyDocType",
                    "field1": f"site2_doc_{i}"
                })
                doc.insert()
                site2_docs.append(doc.name)
        
        # Verify isolation
        with self.switch_site("site1"):
            docs = frappe.get_all("MyDocType")
            doc_names = [d.name for d in docs]
            for name in site1_docs:
                self.assertIn(name, doc_names)
            for name in site2_docs:
                self.assertNotIn(name, doc_names)
        
        with self.switch_site("site2"):
            docs = frappe.get_all("MyDocType")
            doc_names = [d.name for d in docs]
            for name in site2_docs:
                self.assertIn(name, doc_names)
            for name in site1_docs:
                self.assertNotIn(name, doc_names)
```

### Testing Site-Specific Configuration

```python
class TestSiteConfig(FrappeTestCase):
    def test_site_config_isolation(self):
        """Test that site configurations are isolated"""
        with self.switch_site("site1"):
            frappe.db.set_value("System Settings", "System Settings", "enable_scheduler", 0)
            frappe.db.commit()
            
            settings = frappe.get_doc("System Settings")
            self.assertEqual(settings.enable_scheduler, 0)
        
        with self.switch_site("site2"):
            # Site2 should have default settings
            settings = frappe.get_doc("System Settings")
            # Default value (may be 1)
            self.assertIsNotNone(settings.enable_scheduler)
```

### Testing Cross-Site Operations

```python
class TestCrossSiteOperations(FrappeTestCase):
    def test_data_migration(self):
        """Test migrating data between sites"""
        # Create data in source site
        with self.switch_site("site1"):
            source_doc = frappe.get_doc({
                "doctype": "MyDocType",
                "field1": "migrate_me"
            })
            source_doc.insert()
            source_data = source_doc.as_dict()
        
        # Migrate to target site
        with self.switch_site("site2"):
            target_doc = frappe.get_doc(source_data)
            target_doc.insert()
            
            self.assertEqual(target_doc.field1, "migrate_me")
```

---

## Testing Async Operations

Test asynchronous operations, callbacks, and event-driven code.

### Testing Enqueued Operations

```python
import time
from frappe.utils.background_jobs import get_queue

class TestAsyncOperations(FrappeTestCase):
    def test_async_function_execution(self):
        """Test async function execution"""
        def async_function(value):
            return value * 2
        
        # Enqueue async function
        job = frappe.enqueue(
            method=async_function,
            queue="default",
            value=10
        )
        
        # Wait for completion
        while job.is_queued or job.is_started:
            time.sleep(0.1)
        
        # Verify result
        self.assertTrue(job.is_finished)
        self.assertEqual(job.result, 20)
    
    def test_async_with_callback(self):
        """Test async operation with callbacks"""
        callback_called = []
        
        def on_success(job, connection, result, *args, **kwargs):
            callback_called.append(("success", result))
        
        def on_failure(job, connection, type, value, traceback):
            callback_called.append(("failure", str(value)))
        
        job = frappe.enqueue(
            method="frappe.handler.ping",
            queue="short",
            on_success=on_success,
            on_failure=on_failure
        )
        
        # Wait for completion
        while job.is_queued or job.is_started:
            time.sleep(0.1)
        
        # Verify callback was called
        self.assertGreater(len(callback_called), 0)
        self.assertEqual(callback_called[0][0], "success")
```

### Testing Event-Driven Code

```python
class TestEventDriven(FrappeTestCase):
    def test_document_events(self):
        """Test document event handlers"""
        events_fired = []
        
        def before_insert_handler(doc, method):
            events_fired.append("before_insert")
        
        def after_insert_handler(doc, method):
            events_fired.append("after_insert")
        
        # Register event handlers (in real code, these would be hooks)
        with patch('frappe.get_doc_hooks', return_value={
            'MyDocType': {
                'before_insert': ['my_app.hooks.before_insert_handler'],
                'after_insert': ['my_app.hooks.after_insert_handler']
            }
        }):
            doc = frappe.get_doc({
                "doctype": "MyDocType",
                "field1": "value1"
            })
            doc.insert()
            
            # Verify events were fired
            self.assertIn("before_insert", events_fired)
            self.assertIn("after_insert", events_fired)
```

### Testing Webhooks

```python
from unittest.mock import patch
import requests

class TestWebhooks(FrappeTestCase):
    @patch('requests.post')
    def test_webhook_trigger(self, mock_post):
        """Test webhook triggering"""
        # Configure mock response
        mock_post.return_value.status_code = 200
        mock_post.return_value.json.return_value = {"status": "ok"}
        
        # Trigger webhook
        doc = frappe.get_doc({
            "doctype": "MyDocType",
            "field1": "value1"
        })
        doc.insert()
        
        # Webhook should be triggered (if configured)
        # Verify webhook was called
        # (Implementation depends on your webhook system)
        pass
    
    def test_webhook_retry(self):
        """Test webhook retry logic"""
        call_count = []
        
        def failing_webhook(*args, **kwargs):
            call_count.append(1)
            if len(call_count) < 3:
                raise Exception("Temporary failure")
            return {"status": "ok"}
        
        with patch('requests.post', side_effect=failing_webhook):
            # Trigger webhook with retry
            # Should retry on failure
            pass
```

### Testing Real-time Updates

```python
class TestRealtimeUpdates(FrappeTestCase):
    def test_realtime_notification(self):
        """Test realtime update notifications"""
        doc = frappe.get_doc({
            "doctype": "ToDo",
            "description": "test"
        })
        
        # Mock notify_update
        doc.notify_update = Mock()
        
        doc.insert()
        
        # Verify notification was sent
        self.assertEqual(doc.notify_update.call_count, 1)
    
    def test_realtime_with_flag(self):
        """Test disabling realtime updates"""
        doc = frappe.get_doc({
            "doctype": "ToDo",
            "description": "test"
        })
        doc.insert()
        
        doc.reload()
        doc.flags.notify_update = False
        doc.description = "updated"
        doc.save()
        
        # Should not trigger realtime update
        # (Implementation specific)
        pass
```

### Testing Scheduled Tasks

```python
from unittest.mock import patch
from frappe.utils import now_datetime

class TestScheduledTasks(FrappeTestCase):
    def test_scheduled_task_execution(self):
        """Test scheduled task execution"""
        with self.freeze_time("2024-01-15 10:00:00"):
            # Schedule task
            frappe.enqueue(
                method="my_app.tasks.scheduled_task",
                queue="long",
                job_id="scheduled-task-1"
            )
            
            # Advance time
            with self.freeze_time("2024-01-15 11:00:00"):
                # Task should execute
                # (Implementation depends on scheduler)
                pass
    
    @patch('frappe.utils.scheduler.is_scheduler_enabled', return_value=True)
    def test_scheduler_enabled(self, mock_scheduler):
        """Test scheduler state"""
        # Test with scheduler enabled
        self.assertTrue(frappe.utils.scheduler.is_scheduler_enabled())
```

---

## Advanced Testing Patterns

### Testing with Database Migrations

```python
class TestMigrations(FrappeTestCase):
    def test_migration_script(self):
        """Test database migration scripts"""
        # Create old structure
        # Run migration
        # Verify new structure
        pass
    
    def test_migration_rollback(self):
        """Test migration rollback"""
        # Run migration
        # Rollback
        # Verify original state
        pass
```

### Testing with Custom Fields

```python
from frappe.custom.doctype.custom_field.custom_field import create_custom_field

class TestCustomFields(FrappeTestCase):
    def setUp(self):
        super().setUp()
        # Create custom field
        self.custom_field = create_custom_field(
            "MyDocType",
            {
                "label": "Custom Field",
                "fieldname": "custom_field",
                "fieldtype": "Data"
            }
        )
    
    def tearDown(self):
        # Cleanup custom field
        if self.custom_field:
            self.custom_field.delete()
        super().tearDown()
    
    def test_custom_field_usage(self):
        """Test using custom field"""
        doc = frappe.get_doc({
            "doctype": "MyDocType",
            "field1": "value1",
            "custom_field": "custom_value"
        })
        doc.insert()
        
        self.assertEqual(doc.custom_field, "custom_value")
```

### Testing with Patches

```python
class TestPatches(FrappeTestCase):
    def test_patch_execution(self):
        """Test patch execution"""
        # Verify patch hasn't run
        # Run patch
        # Verify patch has run
        pass
    
    def test_patch_idempotency(self):
        """Test that patches are idempotent"""
        # Run patch multiple times
        # Should not cause errors
        pass
```

### Testing Error Recovery

```python
class TestErrorRecovery(FrappeTestCase):
    def test_retry_on_failure(self):
        """Test retry logic on failures"""
        attempt_count = []
        
        def failing_function():
            attempt_count.append(1)
            if len(attempt_count) < 3:
                raise Exception("Temporary failure")
            return "success"
        
        # Retry logic
        max_retries = 5
        for i in range(max_retries):
            try:
                result = failing_function()
                break
            except Exception:
                if i == max_retries - 1:
                    raise
                time.sleep(0.1)
        
        self.assertEqual(result, "success")
        self.assertEqual(len(attempt_count), 3)
```

---

## Summary

This guide has covered advanced testing techniques for Frappe:

### Key Advanced Techniques

1. **Mocking and Patching**: Isolate code under test and avoid side effects
2. **Background Jobs**: Test async operations and job queues
3. **Hooks**: Test Frappe's hook system and extensions
4. **External Services**: Mock HTTP requests and external APIs
5. **Transactions**: Test transaction behavior and isolation
6. **Concurrency**: Test race conditions and locking
7. **Performance**: Test query optimization and caching
8. **Caching**: Test cache behavior and invalidation
9. **Custom Methods**: Test custom business logic
10. **Context Managers**: Use advanced context managers for test setup
11. **Multiple Sites**: Test multi-tenant scenarios
12. **Async Operations**: Test asynchronous and event-driven code

### Best Practices for Advanced Testing

1. **Use Mocking Sparingly**: Only mock when necessary
2. **Test Real Behavior**: Prefer testing actual behavior over mocks
3. **Isolate Tests**: Each test should be independent
4. **Test Edge Cases**: Test error conditions and edge cases
5. **Performance Testing**: Monitor query counts and cache usage
6. **Document Complex Tests**: Explain complex test scenarios

### When to Use Advanced Techniques

- **Mocking**: External APIs, expensive operations, time-dependent code
- **Background Jobs**: Long-running operations, scheduled tasks
- **Hooks**: Testing app extensions and customizations
- **Transactions**: Testing data integrity and rollback scenarios
- **Concurrency**: Testing race conditions and locking
- **Performance**: Identifying bottlenecks and optimization opportunities

### Additional Resources

- [Frappe Testing Documentation](https://docs.frappe.io/framework/user/en/testing)
- [Python unittest Documentation](https://docs.python.org/3/library/unittest.html)
- [Frappe Source Code Tests](https://github.com/frappe/frappe/tree/develop/frappe/tests)

### Next Steps

Continue to:
- [Part 1: Fundamentals](./63-Frappe_Unit_Testing_Guide_Part_1_Fundamentals.md)
- [Part 2: Test Commands and Execution](./64-Frappe_Unit_Testing_Guide_Part_2_Test_Commands.md)
- [Part 3: Test Patterns and Best Practices](./65-Frappe_Unit_Testing_Guide_Part_3_Patterns.md)
- [Part 5: Test Data Management](./67-Frappe_Unit_Testing_Guide_Part_5_Test_Data.md)
- [Part 6: Test Utilities and Techniques](./68-Frappe_Unit_Testing_Guide_Part_6_Utilities.md)
- [Part 7: Assertions](./69-Frappe_Unit_Testing_Guide_Part_7_Assertions.md)
- [Part 8: Reports](./80-Frappe_Unit_Testing_Guide_Part_8_Reports.md)

---

**Remember**: Advanced testing techniques should be used judiciously. Start with simple tests and add complexity only when necessary. The goal is to write maintainable, reliable tests that provide confidence in your code.
