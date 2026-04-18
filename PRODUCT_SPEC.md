# **OPEN SPEC: Next-Gen Calibre (Librarian) \- Domain Specification**

## **1\. The Ubiquitous Language (Glossary)**

To prevent AI hallucination and ensure strict architectural boundaries, all agents MUST use these exact terms. Synonyms are strictly forbidden.

### **1.1 Domain Concepts**

| Term | Strict Definition |
| :---- | :---- |
| **User** | A human entity authenticated within the system. Users have assigned Roles (Admin, User, Guest). |
| **Library** | The global boundary containing all Books. Represents a single physical Calibre database. |
| **Book** | The abstract, intellectual concept of a work. It holds Metadata but does NOT hold file bytes. |
| **Format** | A specific physical digital file belonging to a Book (e.g., EPUB, PDF, MOBI). |
| **Metadata** | Descriptive data belonging to a Book (Author, Publisher, Tags, Series, Identifiers). |
| **Custom Column** | User-defined metadata fields inherited from the legacy Calibre database (e.g., \#read\_status). |
| **Shelf** | A user-specific, ordered collection of Books. |
| **Device** | An external client requesting data (e.g., Kobo eReader, Kindle, OPDS client). |

### **1.2 DDD Primitives**

| Term | Strict Definition |
| :---- | :---- |
| **Aggregate Root** | The primary entity that controls access to its children. Child entities cannot be queried directly. |
| **Value Object** | An immutable object defined by its attributes, not its identity (e.g., an ISBN or an EmailAddress). |
| **Domain Event** | A historical record of something that happened in the domain (e.g., BookCreatedEvent). |
| **Anti-Corruption Layer (ACL)** | An adapter boundary that translates legacy Calibre concepts into clean Domain Aggregates. |

## **2\. Bounded Contexts & Aggregates**

The system is divided into five strictly isolated Bounded Contexts representing business sub-domains.

### **2.1 Identity & Access Management (IAM) Context**

* **Responsibility:** Authentication, session management, and RBAC.  
* **Aggregate Root:** User

### **2.2 Catalog Context**

* **Responsibility:** Manages the abstract data of the library and legacy Calibre schema translations.  
* **Aggregate Root:** Book  
* **Entities:** Author, Tag, Series, Shelf, CustomColumn

### **2.3 Storage & Asset Context**

* **Responsibility:** Handles physical file ingestion, extraction, and format conversions.  
* **Aggregate Root:** Asset (Represents a Format or a Cover)

### **2.4 Integration Context**

* **Responsibility:** Communication with external third-party metadata APIs (Google Books, Amazon, Goodreads).

### **2.5 Delivery Context**

* **Responsibility:** Specialized delivery mechanisms for external clients (OPDS, Kobo Sync, SendToKindle).

### 2.6 Reading Context
* **Responsibility:** Tracks and manages the state of a User's consumption of a specific Book.
* **Aggregate Root:** `ReadingProgress`
* **Entities/Value Objects:** `Locator` (Generic String representation of progress, e.g., EPUB CFI or PDF Page), `ProgressPercentage` (Float 0-100), `CompletionStatus`

## **3\. Core Domain Events (Choreography)**

Long-running business tasks MUST be decoupled using Domain Events:

* **AssetUploadedEvent**: Indicates a file was received. Triggers metadata extraction.  
* **MetadataExtractedEvent**: Indicates raw data was parsed from a file. Triggers Book creation.  
* **FormatConversionRequestedEvent**: Indicates a user requested a new file type. Triggers background conversion.  
* **SendToDeviceRequestedEvent**: Indicates a user dispatched a book. Triggers the email/sync delivery system.

## **4\. Core Business Scenarios**

### **Scenario 1: Book Ingestion**

1. **Actor:** User (Role: Admin) uploads an eBook file.  
2. **System:** System acknowledges the request immediately.  
3. **System (Async):** Storage Context temporarily saves the file, parses it, and extracts the cover and embedded metadata.  
4. **System (Async):** Catalog Context normalizes the extracted Authors/Tags/Series via the ACL, and persists the Book Aggregate.

### **Scenario 2: External Metadata Enrichment**

1. **Actor:** User requests metadata updates for an existing Book.  
2. **System:** Catalog Context delegates the search to the Integration Context.  
3. **System:** Integration Context queries external APIs and returns normalized data.  
4. **System:** Catalog Context merges the new data into the Book Aggregate and saves it.

### **Scenario 3: Kobo Device Sync**

1. **Actor:** Kobo Device polls the sync endpoint.  
2. **System:** IAM Context validates the device credentials.  
3. **System:** Delivery Context queries the Catalog Context for modified Books.  
4. **System:** Delivery Context formats the Book Aggregates into the specific payload required by the Kobo firmware.

### Scenario 4: Reading Progress Sync
1. **Actor:** User's client device updates the current reading position.
2. **System:** Reading Context validates the Book exists (via reference ID, not direct DB join) and the User is authorized.
3. **System:** Reading Context updates the `ReadingProgress` aggregate and returns the new state.