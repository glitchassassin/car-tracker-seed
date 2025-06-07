# Implementation Plan

Tackle these tasks, one at a time, and check them off when complete. Make sure
that each acceptance criteria has a test, or ask the user to update the task if
some of the criteria aren't testable.

## Phase 1: Foundation & Data Management

Set up the core application structure, database schema, and data management
capabilities. This phase establishes the foundation for all subsequent features.

### [x] Set up D1 database and schema

Configure Cloudflare D1 database with the car tracking schema.

No e2e test needed here

**Acceptance Criteria:**

- D1 database binding is configured in `wrangler.jsonc`
- Database schema includes `cars` table with all required fields
- Migration script exists to create the database schema
- Database connection works in both local development and deployed environments

### [x] Create data import/export utilities

Build scripts to manage car data for pre-event setup.

No e2e test needed here

**Acceptance Criteria:**

- Script exists to generate mock vehicle data in CSV format with realistic car
  details
- Script exists to import car data from CSV to D1 database
- CSV format includes: ID, Make, Model, Color, License Plate
- Import script validates data format and handles errors gracefully
- Export script can dump current database state to CSV for backup

### [x] Create global setup/teardown scripts for Playwright

Load and clear sample data into the local database with the previously-created
import/export utilities

**Acceptance Criteria:**

- Setup script imports a hard-coded set of test data into the local database
- Teardown script deletes test data from the local database
- existing e2e tests run without failing (no need to create a new one)

### [x] Implement basic car data operations

Create foundational data access layer for car management.

No e2e test needed here

**Acceptance Criteria:**

- Function to get car by ID from database
- Function to get all cars filtered by status
- Function to update car status with timestamp tracking
- All database operations handle errors appropriately
- Database operations work with both local development and deployed D1
- Worker context includes the data access layer, not direct access to the db.

## Phase 2: Core Status Tracking & Volunteer Interfaces

Implement the four-status workflow (Pre-Arrival → Registered → On Deck → Done)
with mobile-optimized volunteer interfaces. This combines the core business
logic with the user interfaces needed to test and validate the status tracking
system.

Create shared components that can be reused across multiple screens.

### [ ] Build Index

Create mobile-optimized interface for selecting volunteer role

**Acceptance Criteria:**

- Route `/` displays nav to each Volunteer landing page
- Large, touch-friendly buttons

### [ ] Build Registration Volunteer interface

Create mobile-optimized interface for car check-in.

**Acceptance Criteria:**

- Route `/registration` displays Registration Volunteer landing page
- Car lookup by ID with large, touch-friendly number input
- Queue view showing all cars with PRE_ARRIVAL status, links to verification
  route
- Route `/registration/$carId` displays car details including
  make/model/color/license plate for verification
- "Register Car" button transitions car from PRE_ARRIVAL to REGISTERED status
- "Not a Match" button provides pop-up instructions to escalate/report mismatch
- Success feedback confirms registration completion
- Mobile-optimized layout with large touch targets (44px minimum)

### [ ] Build Floor Volunteer interface

Create interface for managing cars in the service queue.

**Acceptance Criteria:**

- Route `/floor` displays Floor Volunteer landing page
- Car lookup by ID functionality
- Queue view showing all cars with REGISTERED status, links to verification
  route
- Route `/floor/$carId` displays car details including make/model/color/license
  plate for verification
- "Start Service" button transitions car from REGISTERED to ON_DECK status
- "Not a Match" button provides pop-up instructions to escalate/report mismatch
- Mobile-optimized layout with large touch targets
- Clear visual feedback for status changes

### [ ] Build Handoff Volunteer interface

Create interface for completing the service process.

**Acceptance Criteria:**

- Route `/handoff` displays Handoff Volunteer landing page
- Car lookup by ID functionality
- Queue view showing all cars with ON_DECK status, links to verification route
- Route `/handoff/$carId` displays car details including
  make/model/color/license plate for verification
- "Ready for Pickup" button transitions car from ON_DECK to DONE status
- Mobile-optimized layout with large touch targets
- Clear visual feedback for status changes

## Phase 3: Real-time Updates & Public Display

Implement real-time status updates and create the projector display interface
for car owners.

### [ ] Implement Server-Sent Events (SSE)

Add real-time status broadcasting.

**Acceptance Criteria:**

- SSE endpoint `/api/status-stream` broadcasts status changes
- SSE events include car ID, new status, and timestamp
- SSE connection handles reconnection on disconnect
- Multiple clients can subscribe to status updates simultaneously
- SSE works in both development and production Cloudflare environment

### [ ] Build Public Display interface

Create large screen interface for car owners to view status.

**Acceptance Criteria:**

- Route `/display` shows public status display optimized for projector
- Large, readable text (minimum 24px) for car information
- Color-coded status indicators (Gray: PRE_ARRIVAL, Blue: REGISTERED, Yellow:
  ON_DECK, Green: DONE)
- Auto-refresh functionality updates display when status changes
- Display shows car ID, make/model, and current status
- Professional appearance suitable for church ministry event
- Responsive design works on various screen sizes

### [ ] Integrate real-time updates across interfaces

Connect SSE to all volunteer interfaces + the projector interface for live
updates. Trigger loader revalidation when an SSE fires.

**Acceptance Criteria:**

- Volunteer interfaces & projector interface automatically update when other
  volunteers change car status
- Queue views refresh automatically when cars change status
- Car lookup results reflect real-time status changes
- No manual refresh required to see current data
- Real-time updates work reliably across multiple concurrent users

## Phase 4: Reporting & Production Polish

Add reporting capabilities, performance optimizations, and final testing for
production readiness.

### [ ] Implement service time tracking and reporting

Add analytics and reporting capabilities.

**Acceptance Criteria:**

- Report page shows total cars processed count
- Report shows average time spent in each status
- Report shows overall processing time per car
- Report identifies bottlenecks in the process flow
- Data export functionality for CSV and PDF formats
- Historical reporting preserves data after event completion

### [ ] Production deployment configuration

Finalize deployment setup for the live event.

**Acceptance Criteria:**

- Production Cloudflare Workers environment configured
- Production D1 database configured and secured
- Environment variables properly configured for production
- Deployment scripts work reliably
- Database backup and restore procedures documented
- Rollback plan documented in case of issues during event
