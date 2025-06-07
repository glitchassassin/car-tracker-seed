# Phase 2 Test Plans: Core Status Tracking & Volunteer Interfaces

## Test Plan Overview

These test plans cover the main flows through the Car Tracker application,
focusing on the complete car journey from arrival to pickup, volunteer
workflows, and real-time updates. Tests are designed as end-to-end flows that
validate the natural user experience rather than individual components.

Each test creates its own test data using the helper functions in
`tests/helpers/cars.ts` to ensure test isolation and avoid dependencies on
pre-existing data.

## Test Plan 1: Car Journey Flow via Queues

**Description:** Tests the full journey of a car through all status phases with
different volunteers handling each transition. Cars are selected from the queues

**Test Flow:**

1. **Setup:**
   - Create a test car using `createCar()` with unique license plate
   - Store the created car ID for use throughout the test
2. **Registration Phase:**
   - Navigate to `/`
   - Select Registration mode
   - Verify the created car appears in PRE_ARRIVAL queue
   - Select the created car from queue to navigate to details page
   - Verify car details display correctly
   - Click "Register Car" button
   - Verify user is automatically redirected to `/registration`
3. **Floor Phase:**
   - Navigate to `/`
   - Select Floor mode
   - Verify the created car appears in REGISTERED queue
   - Select the created car from queue to navigate to details page
   - Verify car details display correctly
   - Click "Start Service" button
   - Verify user is automatically redirected to `/floor`
4. **Handoff Phase:**
   - Navigate to `/`
   - Select Handoff mode
   - Verify the created car appears in ON_DECK queue
   - Select the created car from queue to navigate to details page
   - Verify car details display correctly
   - Click "Ready for Pickup" button
   - Verify user is automatically redirected to `/handoff`
5. **Cleanup:**
   - Delete the test car using `deleteCar()` with the stored car ID

## Test Plan 2: Car Journey Flow via Search

**Description:** Tests the full journey of a car through all status phases with
different volunteers handling each transition. Cars are selected via search.

**Test Flow:**

1. **Setup:**
   - Create a test car using `createCar()` with unique license plate
   - Store the created car ID for use throughout the test
2. **Registration Phase:**
   - Navigate to `/`
   - Select Registration mode
   - Search for the created car by ID to navigate to details page
   - Verify car details display correctly
   - Click "Register Car" button
   - Verify user is automatically redirected to `/registration`
3. **Floor Phase:**
   - Navigate to `/`
   - Select Floor mode
   - Search for the created car by ID to navigate to details page
   - Verify car details display correctly
   - Click "Start Service" button
   - Verify user is automatically redirected to `/floor`
4. **Handoff Phase:**
   - Navigate to `/`
   - Select Handoff mode
   - Search for the created car by ID to navigate to details page
   - Verify car details display correctly
   - Click "Ready for Pickup" button
   - Verify user is automatically redirected to `/handoff`
5. **Cleanup:**
   - Delete the test car using `deleteCar()` with the stored car ID

## Test Plan 3: Out-Of-Order Statuses

**Description:** Tests the full journey of a car through all status phases with
different volunteers handling each transition. Cars are selected via search.

**Test Flow:**

1. **Setup:**
   - Create two test cars using `createCar()` with unique license plates, both
     in PRE_ARRIVAL status
   - Store the created car IDs for use throughout the test
2. **Floor Phase:**
   - Navigate to `/floor`
   - Search for the first created car by ID to navigate to details page
   - Verify car details display correctly
   - Click "Start Service" button
   - Verify user is automatically redirected to `/floor`
3. **Handoff Phase:**
   - Navigate to `/handoff`
   - Search for the second created car by ID to navigate to details page
   - Verify car details display correctly
   - Click "Ready for Pickup" button
   - Verify user is automatically redirected to `/handoff`
4. **Cleanup:**
   - Delete both test cars using `deleteCar()` with their respective car IDs

## Test Plan 4: Accessibility

**Description:** Tests accessibility on every screen.

**Test Flow:**

1. **Setup:**
   - Create a test car using `createCar()` with unique license plate
   - Store the created car ID for use throughout the test
2. **Home Screen**
   - Navigate to `/`
   - Check accessibility with Axe
3. **Registration Phase:**
   - Navigate to `/registration`
   - Check accessibility with Axe
   - Search for the created car by ID to navigate to details page
   - Check accessibility with Axe
4. **Floor Phase:**
   - Navigate to `/floor`
   - Check accessibility with Axe
   - Search for the created car by ID to navigate to details page
   - Check accessibility with Axe
5. **Handoff Phase:**
   - Navigate to `/handoff`
   - Check accessibility with Axe
   - Search for the created car by ID to navigate to details page
   - Check accessibility with Axe
6. **Cleanup:**
   - Delete the test car using `deleteCar()` with the stored car ID

## Implementation Notes

- Use `createCar()` from `tests/helpers/cars.ts` to create test data at the
  beginning of each test
- Use `deleteCar()` from `tests/helpers/cars.ts` to clean up test data at the
  end of each test
- Store car IDs in variables for easy reference throughout the test
- Example unique license plate generation:
  `TEST_${Math.random().toString(36).slice(2, 8)}`
