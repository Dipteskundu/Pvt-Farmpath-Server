
/**
 * @swagger
 * tags:
 *   - name: Farms
 *     description: Farm management
 *   - name: Fields
 *     description: Field management
 *   - name: Crop Batches
 *     description: Crop production batches
 *   - name: Crop Logs
 *     description: Crop activity records
 *   - name: Harvests
 *     description: Harvest records
 *   - name: Expenses
 *     description: Farm expense records
 *   - name: Calendar
 *     description: Farm task calendar
 *   - name: Deliveries
 *     description: Delivery tracking
 *   - name: Payments
 *     description: Payment history
 *   - name: Notifications
 *     description: User notifications
 *   - name: Training
 *     description: Training courses and lesson progress
 *   - name: Wallet
 *     description: Seller wallet balances and withdrawal requests
 *   - name: Marketplace
 *     description: Produce listings, ratings, saved listings, and image uploads
 *   - name: Demands
 *     description: Buyer demand board and farmer responses
 *   - name: Orders
 *     description: Order checkout, fulfillment, disputes, and escrow management
 *   - name: Products
 *     description: Supplier product catalogue and ratings
 *   - name: Quality
 *     description: Quality inspections, reports, scheduling, and compliance
 *   - name: Admin
 *     description: Administrative dashboard, user management, moderation, and platform operations
 * 
 * 
 * 
 */

/**
 * @swagger
 * /api/farms:
 *   get:
 *     summary: List farms
 *     tags: [Farms]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Farm records retrieved
 *   post:
 *     summary: Create a farm
 *     tags: [Farms]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '201':
 *         description: Farm created
 *
 * /api/farms/{id}:
 *   get:
 *     summary: Get a farm
 *     tags: [Farms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Farm retrieved
 *   put:
 *     summary: Update a farm
 *     tags: [Farms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Farm updated
 *   delete:
 *     summary: Delete a farm
 *     tags: [Farms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Farm deleted
 */


/**
 * @swagger
 * /api/fields:
 *   get:
 *     summary: List fields
 *     tags: [Fields]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Field records retrieved
 *   post:
 *     summary: Create a field
 *     tags: [Fields]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '201':
 *         description: Field created
 *
 * /api/fields/{id}:
 *   get:
 *     summary: Get a field
 *     tags: [Fields]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Field retrieved
 *   put:
 *     summary: Update a field
 *     tags: [Fields]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Field updated
 *   delete:
 *     summary: Delete a field
 *     tags: [Fields]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Field deleted
 */

/**
 * @swagger
 * /api/crop-batches:
 *   get:
 *     summary: List crop batches
 *     tags: [Crop Batches]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Crop batches retrieved
 *   post:
 *     summary: Create a crop batch
 *     tags: [Crop Batches]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '201':
 *         description: Crop batch created
 *
 * /api/crop-batches/{id}:
 *   get:
 *     summary: Get a crop batch
 *     tags: [Crop Batches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Crop batch retrieved
 *   put:
 *     summary: Update a crop batch
 *     tags: [Crop Batches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Crop batch updated
 *   delete:
 *     summary: Delete a crop batch
 *     tags: [Crop Batches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Crop batch deleted
 */


/**
 * @swagger
 * /api/crop-logs:
 *   get:
 *     summary: List crop activity logs
 *     tags: [Crop Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: cropBatchId
 *         schema:
 *           type: string
 *         required: false
 *         description: Filter logs by crop batch ID
 *     responses:
 *       '200':
 *         description: Crop logs retrieved
 *   post:
 *     summary: Create a crop activity log
 *     tags: [Crop Logs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '201':
 *         description: Crop log created
 *
 * /api/crop-logs/{id}:
 *   get:
 *     summary: Get a crop log
 *     tags: [Crop Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Crop log retrieved
 *   put:
 *     summary: Update a crop log
 *     tags: [Crop Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Crop log updated
 *   delete:
 *     summary: Delete a crop log
 *     tags: [Crop Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Crop log deleted
 */



/**
 * @swagger
 * /api/harvests:
 *   get:
 *     summary: List harvest records
 *     tags: [Harvests]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Harvest records retrieved
 *   post:
 *     summary: Record a harvest
 *     tags: [Harvests]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '201':
 *         description: Harvest recorded
 *
 * /api/harvests/{id}:
 *   get:
 *     summary: Get a harvest record
 *     tags: [Harvests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Harvest record retrieved
 *   put:
 *     summary: Update a harvest record
 *     tags: [Harvests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Harvest record updated
 *   delete:
 *     summary: Delete a harvest record
 *     tags: [Harvests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Harvest record deleted
 */


/**
 * @swagger
 * /api/expenses:
 *   get:
 *     summary: List farm expenses
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Expense records retrieved
 *   post:
 *     summary: Create an expense record
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '201':
 *         description: Expense created
 *
 * /api/expenses/{id}:
 *   get:
 *     summary: Get an expense record
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Expense retrieved
 *   put:
 *     summary: Update an expense record
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Expense updated
 *   delete:
 *     summary: Delete an expense record
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Expense deleted
 */



/**
 * @swagger
 * /api/calendar:
 *   get:
 *     summary: List calendar tasks
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Calendar tasks retrieved
 *   post:
 *     summary: Create a calendar task
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '201':
 *         description: Calendar task created
 *
 * /api/calendar/{id}:
 *   get:
 *     summary: Get a calendar task
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Calendar task retrieved
 *   put:
 *     summary: Update a calendar task
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Calendar task updated
 *   delete:
 *     summary: Delete a calendar task
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Calendar task deleted
 *
 * /api/calendar/{id}/toggle:
 *   patch:
 *     summary: Toggle task completion
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Task completion status toggled
 *   post:
 *     summary: Toggle task completion
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Task completion status toggled
 */



/**
 * @swagger
 * /api/deliveries:
 *   get:
 *     summary: List delivery records
 *     description: View deliveries associated with the buyer, logistics, or admin account.
 *     tags: [Deliveries]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Delivery records retrieved
 *
 * /api/deliveries/{id}:
 *   get:
 *     summary: Get a delivery record
 *     tags: [Deliveries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Delivery record retrieved
 */



/**
 * @swagger
 * /api/payments:
 *   get:
 *     summary: List payment records
 *     description: Returns purchase payment records for buyers and suppliers. Admins can view all payment records.
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Payment records retrieved
 *
 * /api/payments/{id}:
 *   get:
 *     summary: Get a payment record
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Payment record retrieved
 */



/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: List notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Notifications retrieved
 *   post:
 *     summary: Create a notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '201':
 *         description: Notification created
 *
 * /api/notifications/{id}:
 *   put:
 *     summary: Update a notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Notification updated
 *   delete:
 *     summary: Delete a notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Notification deleted
 *
 * /api/notifications/mark-all-read:
 *   post:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: All notifications marked as read
 *
 * /api/notifications/{id}/read:
 *   patch:
 *     summary: Mark a notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Notification marked as read
 *   post:
 *     summary: Mark a notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Notification marked as read
 */


/**
 * @swagger
 * /api/training:
 *   get:
 *     summary: List training courses
 *     description: Farmers can view courses with their lesson progress. Admins can view course management data.
 *     tags: [Training]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Training courses retrieved
 * 
 *   post:
 *     summary: Create a training course
 *     description: Admin only.
 *     tags: [Training]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '201':
 *         description: Training course created
 *
 * /api/training/{id}:
 *   put:
 *     summary: Update a training course
 *     description: Admin only.
 *     tags: [Training]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Training course updated
 *   delete:
 *     summary: Delete a training course
 *     description: Admin only.
 *     tags: [Training]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Training course deleted
 *
 * /api/training/{id}/progress:
 *   patch:
 *     summary: Toggle lesson completion
 *     description: Toggle a lesson's completion status for the authenticated user. Requires lessonIndex in the request body.
 *     tags: [Training]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - lessonIndex
 *             properties:
 *               lessonIndex:
 *                 type: integer
 *                 minimum: 0
 *     responses:
 *       '200':
 *         description: Lesson progress updated
 *       '400':
 *         description: lessonIndex is missing or invalid
 *       '404':
 *         description: Training course not found
 */



/**
 * @swagger
 * /api/wallet:
 *   get:
 *     summary: Get wallet balance and ledger
 *     description: Returns the authenticated seller's balance, pending withdrawals, available balance, and ledger entries.
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Wallet summary retrieved
 *       '403':
 *         description: Insufficient permissions
 *
 * /api/wallet/withdraw:
 *   post:
 *     summary: Request a withdrawal
 *     description: Requests a withdrawal against the seller's available balance. Requires seller permissions.
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amountBdt
 *             properties:
 *               amountBdt:
 *                 type: number
 *                 exclusiveMinimum: 0
 *                 description: Withdrawal amount in Bangladeshi taka
 *               method:
 *                 type: string
 *                 default: bKash
 *                 description: Withdrawal method
 *     responses:
 *       '201':
 *         description: Withdrawal requested
 *       '400':
 *         description: Invalid amount or insufficient available balance
 *       '409':
 *         description: Available balance changed during the request
 *
 * /api/wallet/requests:
 *   get:
 *     summary: List withdrawal requests
 *     description: Admin-only queue of withdrawal requests.
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Withdrawal requests retrieved
 *       '403':
 *         description: Admin access required
 *
 * /api/wallet/{id}/approve:
 *   post:
 *     summary: Approve a withdrawal
 *     description: Admin-only action that marks a pending withdrawal as completed.
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Withdrawal approved
 *       '404':
 *         description: Withdrawal request not found
 *       '409':
 *         description: Withdrawal already processed
 *
 * /api/wallet/{id}/reject:
 *   post:
 *     summary: Reject a withdrawal
 *     description: Admin-only action that rejects a pending withdrawal.
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Withdrawal rejected
 *       '404':
 *         description: Withdrawal request not found
 *       '409':
 *         description: Withdrawal already processed
 */


/**
 * @swagger
 * /api/marketplace/upload:
 *   post:
 *     summary: Upload a produce photo
 *     tags: [Marketplace]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [image]
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       '200':
 *         description: Image uploaded
 *       '400':
 *         description: Invalid upload
 *       '413':
 *         description: File too large
 *
 * /api/marketplace/listings:
 *   get:
 *     summary: Browse approved produce listings
 *     tags: [Marketplace]
 *     responses:
 *       '200':
 *         description: Listings retrieved
 *   post:
 *     summary: Create a produce listing
 *     tags: [Marketplace]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '201':
 *         description: Listing created
 *
 * /api/marketplace/listings/stats:
 *   get:
 *     summary: Get listing moderation statistics
 *     description: Admin only.
 *     tags: [Marketplace]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Listing statistics retrieved
 *
 * /api/marketplace/listings/mine:
 *   get:
 *     summary: List my produce listings
 *     description: Returns the authenticated user's own listings, including unpublished listings.
 *     tags: [Marketplace]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Own listings retrieved
 *
 * /api/marketplace/listings/{id}:
 *   get:
 *     summary: Get a produce listing
 *     tags: [Marketplace]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Listing retrieved
 *       '404':
 *         description: Listing not found
 *   put:
 *     summary: Update a produce listing
 *     description: Listing owner or admin access.
 *     tags: [Marketplace]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Listing updated
 *   delete:
 *     summary: Delete a produce listing
 *     description: Listing owner or admin access.
 *     tags: [Marketplace]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Listing deleted
 *
 * /api/marketplace/listings/{id}/rating:
 *   post:
 *     summary: Rate a produce listing
 *     description: Any authenticated user can submit a rating.
 *     tags: [Marketplace]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Rating submitted
 *
 * /api/marketplace/listings/{id}/ratings:
 *   get:
 *     summary: List ratings for a produce listing
 *     tags: [Marketplace]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Listing ratings retrieved
 *
 * /api/marketplace/saved:
 *   get:
 *     summary: List my saved listings
 *     tags: [Marketplace]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Saved listings retrieved
 *
 * /api/marketplace/saved/{id}:
 *   post:
 *     summary: Save a listing
 *     tags: [Marketplace]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Listing saved
 *   delete:
 *     summary: Remove a saved listing
 *     tags: [Marketplace]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Saved listing removed
 */


/**
 * @swagger
 * /api/demands:
 *   get:
 *     summary: Browse demand board
 *     description: Public endpoint. Supports mine=1 for the authenticated user's demands and status filtering.
 *     tags: [Demands]
 *     parameters:
 *       - in: query
 *         name: mine
 *         schema:
 *           type: string
 *           enum: ["1"]
 *         description: Set to 1 to retrieve your own demands; requires authentication.
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Optional status filter.
 *     responses:
 *       '200':
 *         description: Demands retrieved
 *   post:
 *     summary: Create a demand
 *     description: Buyer or admin access.
 *     tags: [Demands]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [product, quantity]
 *             properties:
 *               product:
 *                 type: string
 *               quantity:
 *                 type: number
 *               unit:
 *                 type: string
 *                 default: kg
 *               variety:
 *                 type: string
 *               qualityGrade:
 *                 type: string
 *               maxPricePerKgBdt:
 *                 type: number
 *               preferredLocation:
 *                 type: string
 *               deliveryMethod:
 *                 type: string
 *                 enum: [pickup, delivery]
 *               description:
 *                 type: string
 *               qualityRequirements:
 *                 type: string
 *               deliveryRequirements:
 *                 type: string
 *               deadline:
 *                 type: string
 *                 format: date
 *     responses:
 *       '201':
 *         description: Demand created
 *       '400':
 *         description: Invalid demand data
 *
 * /api/demands/{id}:
 *   get:
 *     summary: Get a demand
 *     description: Public for open or matched demands. Restricted demands are visible to their buyer and admins.
 *     tags: [Demands]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Demand retrieved
 *       '404':
 *         description: Demand not found or not visible
 *   put:
 *     summary: Update a demand
 *     description: Buyer who owns the demand or an admin.
 *     tags: [Demands]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Partial demand update. Only supplied fields are changed.
 *             properties:
 *               product:
 *                 type: string
 *               quantity:
 *                 type: number
 *               status:
 *                 type: string
 *                 description: Admin-only status update.
 *     responses:
 *       '200':
 *         description: Demand updated
 *       '403':
 *         description: Permission denied
 *       '404':
 *         description: Demand not found
 *   delete:
 *     summary: Delete a demand
 *     description: Demand owner or admin.
 *     tags: [Demands]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Demand deleted
 *       '403':
 *         description: Permission denied
 *       '404':
 *         description: Demand not found
 *
 * /api/demands/{id}/respond:
 *   post:
 *     summary: Respond to a demand
 *     description: Farmer or admin indicates they can supply an open or matched demand.
 *     tags: [Demands]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Demand response recorded
 *       '409':
 *         description: Demand is no longer accepting responses
 */


/**
 * @swagger
 * tags:
 *   - name: Orders
 *     description: Order checkout, fulfillment, disputes, and escrow management
 *
 * /api/orders:
 *   get:
 *     tags: [Orders]
 *     summary: List orders
 *     description: Returns orders visible to the authenticated user. Results are scoped to the user's own orders unless the user is an admin.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of orders
 *
 * /api/orders/checkout:
 *   post:
 *     tags: [Orders]
 *     summary: Checkout an item
 *     description: Creates an order for one marketplace listing or one supplier product. Payment is simulated and inventory is reserved.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [quantityKg, deliveryAddress]
 *             properties:
 *               listingId:
 *                 type: string
 *                 description: Marketplace listing ID. Provide this or productId.
 *               productId:
 *                 type: string
 *                 description: Supplier input product ID. Provide this or listingId.
 *               quantityKg:
 *                 type: number
 *                 example: 10
 *               deliveryAddress:
 *                 type: string
 *                 example: Dhaka, Bangladesh
 *               paymentMethod:
 *                 type: string
 *                 example: bKash
 *               estimatedDelivery:
 *                 type: string
 *                 format: date
 *                 example: "2026-10-20"
 *     responses:
 *       201:
 *         description: Order created
 *       400:
 *         description: Invalid checkout details
 *       401:
 *         description: Authentication required
 *       409:
 *         description: Item unavailable or insufficient stock
 *
 * /api/orders/sales:
 *   get:
 *     tags: [Orders]
 *     summary: List seller orders
 *     description: Returns orders associated with the authenticated farmer or supplier's listings/products. Admins can see all orders.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Seller order list
 *
 * /api/orders/mine/disputes:
 *   get:
 *     tags: [Orders]
 *     summary: List my disputes
 *     description: Returns disputes owned by the authenticated buyer.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Buyer's disputes
 *
 * /api/orders/{id}:
 *   get:
 *     tags: [Orders]
 *     summary: Get an order
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order details
 *       404:
 *         description: Order not found
 *   put:
 *     tags: [Orders]
 *     summary: Update order lifecycle
 *     description: Admin-only update of order fulfillment, escrow, delivery, payment, and tracking fields.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fulfillmentStatus:
 *                 type: string
 *                 example: Delivered
 *               escrowStatus:
 *                 type: string
 *               logisticsPartner:
 *                 type: string
 *               estimatedDelivery:
 *                 type: string
 *                 format: date
 *               deliveredAt:
 *                 type: string
 *               paymentStatus:
 *                 type: string
 *               deliveryAddress:
 *                 type: string
 *               trackingSteps:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Order updated
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Order not found
 *
 * /api/orders/{id}/cancel:
 *   post:
 *     tags: [Orders]
 *     summary: Cancel an order
 *     description: Cancels an order, refunds its simulated payment, releases escrow to the buyer, and restores reserved inventory.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order cancelled
 *       403:
 *         description: Not permitted to cancel this order
 *       409:
 *         description: Order cannot be cancelled in its current state
 *
 * /api/orders/{id}/receipt:
 *   post:
 *     tags: [Orders]
 *     summary: Confirm order receipt
 *     description: Confirms delivery and releases held escrow to the seller. Only the order owner or an admin may perform this action.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Receipt confirmed
 *       403:
 *         description: Not permitted
 *       409:
 *         description: Order cannot be received in its current state
 *
 * /api/orders/{id}/dispute:
 *   post:
 *     tags: [Orders]
 *     summary: Open an order dispute
 *     description: Opens a dispute case and freezes held escrow for admin review.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 example: Order Not Received
 *               note:
 *                 type: string
 *                 example: The delivered quantity was lower than agreed.
 *     responses:
 *       201:
 *         description: Dispute opened
 *       403:
 *         description: Not permitted
 *       409:
 *         description: Order cannot be disputed in its current state
 *
 * /api/orders/escrow/release-due:
 *   post:
 *     tags: [Orders]
 *     summary: Release due escrow
 *     description: Admin-only manual trigger for processing escrow releases whose deadlines have passed.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Escrow release processing result
 *       403:
 *         description: Admin access required
 *
 * /api/orders/escrow/cron:
 *   get:
 *     tags: [Orders]
 *     summary: Run scheduled escrow release
 *     description: Cron-secret-protected endpoint for processing due escrow releases. Returns 404 if CRON_SECRET is missing or invalid.
 *     security:
 *       - {}
 *     responses:
 *       200:
 *         description: Escrow release processing result
 *       404:
 *         description: Not found
 */

/**
 * @swagger
 *
 * /api/products:
 *   get:
 *     tags: [Products]
 *     summary: List supplier products
 *     description: Public catalogue. Signed-in suppliers can also view their own inactive products.
 *     parameters:
 *       - in: query
 *         name: mine
 *         schema:
 *           type: string
 *           enum: ["1"]
 *         description: Return only the authenticated user's products.
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by product category.
 *       - in: query
 *         name: available
 *         schema:
 *           type: string
 *           enum: ["1"]
 *         description: Return active products only.
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search product names and descriptions.
 *     security:
 *       - bearerAuth: []
 *       - {}
 *     responses:
 *       200:
 *         description: Product catalogue
 *       401:
 *         description: Sign-in required when requesting your own products
 *   post:
 *     tags: [Products]
 *     summary: Create a supplier product
 *     description: Supplier or admin only. The supplier is assigned from the authenticated account.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Product fields accepted by the product validator.
 *             properties:
 *               name:
 *                 type: string
 *                 example: Organic Fertilizer
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *                 example: fertilizer
 *               price:
 *                 type: number
 *                 example: 850
 *               unit:
 *                 type: string
 *                 example: bag
 *               stock:
 *                 type: number
 *                 example: 50
 *               minimumOrderQuantity:
 *                 type: number
 *                 example: 1
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Product created
 *       400:
 *         description: Invalid product data
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Supplier or admin role required
 *
 * /api/products/{id}:
 *   get:
 *     tags: [Products]
 *     summary: Get a supplier product
 *     description: Public for active products; inactive products are visible to their owner or an admin.
 *     security:
 *       - bearerAuth: []
 *       - {}
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product details
 *       404:
 *         description: Product not found
 *   put:
 *     tags: [Products]
 *     summary: Update a supplier product
 *     description: Only the product owner or an admin may update it.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Fields to update. The supplier cannot be changed.
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               price:
 *                 type: number
 *               unit:
 *                 type: string
 *               stock:
 *                 type: number
 *               minimumOrderQuantity:
 *                 type: number
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Product updated
 *       403:
 *         description: Not permitted to update this product
 *       404:
 *         description: Product not found
 *   delete:
 *     tags: [Products]
 *     summary: Delete a supplier product
 *     description: Only the product owner or an admin may delete it.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product deleted
 *       403:
 *         description: Not permitted to delete this product
 *       404:
 *         description: Product not found
 *
 * /api/products/{id}/rating:
 *   post:
 *     tags: [Products]
 *     summary: Rate a product
 *     description: Any authenticated user can rate a visible product once.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [rating]
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 5
 *               comment:
 *                 type: string
 *                 example: Good quality product.
 *     responses:
 *       200:
 *         description: Rating submitted
 *       400:
 *         description: Invalid rating or product already rated by this user
 *       401:
 *         description: Authentication required
 *       404:
 *         description: Product not found
 *
 * /api/products/{id}/ratings:
 *   get:
 *     tags: [Products]
 *     summary: List product ratings
 *     description: Returns product reviews in newest-first order.
 *     security:
 *       - bearerAuth: []
 *       - {}
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product ratings
 *       404:
 *         description: Product not found
 */

/**
 * @swagger
 *
 * /api/quality:
 *   get:
 *     tags: [Quality]
 *     summary: List inspections
 *     description: Inspector-only work queue; admins can view all inspections. Supports filtering by status.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [assigned, in_progress, completed, cancelled]
 *     responses:
 *       200:
 *         description: Inspection list
 *       400:
 *         description: Invalid status filter
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Inspector or admin role required
 *   post:
 *     tags: [Quality]
 *     summary: Create an inspection assignment
 *     description: Inspectors can assign work to themselves; admins can assign an inspector or leave the inspection unassigned.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               batchCode:
 *                 type: string
 *               produceType:
 *                 type: string
 *               farmerName:
 *                 type: string
 *               farmerPhone:
 *                 type: string
 *               farmLocation:
 *                 type: string
 *               variety:
 *                 type: string
 *               quantityKg:
 *                 type: number
 *               requestedAt:
 *                 type: string
 *               scheduledDate:
 *                 type: string
 *               priority:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [assigned, in_progress, completed, cancelled]
 *               notes:
 *                 type: string
 *               testingLabLocation:
 *                 type: string
 *               owner:
 *                 type: string
 *                 description: Inspector user ID; admin only.
 *     responses:
 *       201:
 *         description: Inspection assignment created
 *       400:
 *         description: Invalid assignment data
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Inspector or admin role required
 *
 * /api/quality/reports:
 *   get:
 *     tags: [Quality]
 *     summary: List completed inspection reports
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Completed inspection reports
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Inspector or admin role required
 *
 * /api/quality/schedule:
 *   get:
 *     tags: [Quality]
 *     summary: List scheduled open inspections
 *     description: Returns inspections with a scheduled date and assigned or in-progress status.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Inspection schedule
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Inspector or admin role required
 *
 * /api/quality/listing/{listingId}:
 *   post:
 *     tags: [Quality]
 *     summary: Request inspection for a marketplace listing
 *     description: A listing owner or admin can request an inspection. A second request is rejected while an inspection is already open.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: listingId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Inspection request created
 *       403:
 *         description: Not permitted to request inspection
 *       404:
 *         description: Marketplace listing not found
 *       409:
 *         description: Inspection already queued
 *
 * /api/quality/{id}:
 *   get:
 *     tags: [Quality]
 *     summary: Get inspection details
 *     description: Inspectors can view their own assignments and unassigned inspections; admins can view any inspection.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Inspection details
 *       403:
 *         description: Not permitted to view inspection
 *       404:
 *         description: Inspection not found
 *   put:
 *     tags: [Quality]
 *     summary: Update an inspection assignment
 *     description: Updates assignment fields. Only admins can reassign the inspection owner.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               batchCode:
 *                 type: string
 *               produceType:
 *                 type: string
 *               farmerName:
 *                 type: string
 *               farmerPhone:
 *                 type: string
 *               farmLocation:
 *                 type: string
 *               variety:
 *                 type: string
 *               quantityKg:
 *                 type: number
 *               requestedAt:
 *                 type: string
 *               scheduledDate:
 *                 type: string
 *               priority:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [assigned, in_progress, completed, cancelled]
 *               notes:
 *                 type: string
 *               testingLabLocation:
 *                 type: string
 *               owner:
 *                 type: string
 *                 description: Admin-only reassignment.
 *     responses:
 *       200:
 *         description: Inspection updated
 *       400:
 *         description: Invalid assignment data
 *       403:
 *         description: Not permitted to update inspection
 *       404:
 *         description: Inspection not found
 *   delete:
 *     tags: [Quality]
 *     summary: Delete an inspection
 *     description: Admin-only deletion.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Inspection deleted
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Inspection not found
 *
 * /api/quality/{id}/start:
 *   post:
 *     tags: [Quality]
 *     summary: Start an inspection
 *     description: Claims an unassigned inspection for the inspector and changes its status to in_progress.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Inspection started
 *       403:
 *         description: Not permitted to start inspection
 *       404:
 *         description: Inspection not found
 *       409:
 *         description: Inspection cannot be started in its current state
 *
 * /api/quality/{id}/submit:
 *   post:
 *     tags: [Quality]
 *     summary: Submit inspection results
 *     description: Records quality measurements and compliance findings, completes the inspection, and updates the linked marketplace listing when applicable.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               assignedGrade:
 *                 type: string
 *               moistureContentPercent:
 *                 type: number
 *               foreignMatterPercent:
 *                 type: number
 *               aflatoxinPpm:
 *                 type: number
 *               complianceVerdict:
 *                 type: string
 *               visualCondition:
 *                 type: string
 *               recommendedAction:
 *                 type: string
 *               findings:
 *                 type: string
 *               certificateNumber:
 *                 type: string
 *               inspectionDate:
 *                 type: string
 *     responses:
 *       200:
 *         description: Inspection report submitted
 *       400:
 *         description: Invalid inspection results
 *       403:
 *         description: Not permitted to submit inspection
 *       404:
 *         description: Inspection not found
 *       409:
 *         description: Inspection already submitted
 */

/**
 * @swagger
 *
 * /api/admin/dashboard/summary:
 *   get:
 *     tags: [Admin]
 *     summary: Get admin dashboard summary
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard summary
 *
 * /api/admin/dashboard:
 *   get:
 *     tags: [Admin]
 *     summary: Get admin dashboard metrics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard metrics
 *
 * /api/admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: List users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *         description: Filter users by display role; omit or use All to return every role.
 *     responses:
 *       200:
 *         description: User list
 *   post:
 *     tags: [Admin]
 *     summary: Create a user account
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email]
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               role:
 *                 type: string
 *               region:
 *                 type: string
 *               nationalIdNumber:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Account created
 *       400:
 *         description: Name and email are required
 *       409:
 *         description: Email already exists
 *
 * /api/admin/users/{id}/status:
 *   patch:
 *     tags: [Admin]
 *     summary: Update user account status
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 example: Suspended
 *               verificationBadge:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User updated
 *       404:
 *         description: User not found
 *
 * /api/admin/marketplace/listings:
 *   get:
 *     tags: [Admin]
 *     summary: List marketplace listings for moderation
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Marketplace listings
 *
 * /api/admin/marketplace/listings/{id}:
 *   put:
 *     tags: [Admin]
 *     summary: Update or moderate a marketplace listing
 *     description: Approving a listing requires a valid quality report.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 example: Approved
 *     responses:
 *       200:
 *         description: Listing updated
 *       409:
 *         description: Listing cannot be approved yet
 *
 * /api/admin/orders:
 *   get:
 *     tags: [Admin]
 *     summary: List all orders
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Orders
 *
 * /api/admin/payments:
 *   get:
 *     tags: [Admin]
 *     summary: List payments
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payments
 *
 * /api/admin/payments/{id}/approve:
 *   post:
 *     tags: [Admin]
 *     summary: Approve a payment payout
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               approverName:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payout approved
 *       404:
 *         description: Payment not found
 *
 * /api/admin/quality/reports:
 *   get:
 *     tags: [Admin]
 *     summary: List completed quality reports
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Completed inspection reports
 *
 * /api/admin/logistics/fleet:
 *   get:
 *     tags: [Admin]
 *     summary: List logistics fleet records
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logistics records
 *
 * /api/admin/training:
 *   get:
 *     tags: [Admin]
 *     summary: List training courses for administration
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Training courses
 *   post:
 *     tags: [Admin]
 *     summary: Create a training course
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               courseTitle:
 *                 type: string
 *               title:
 *                 type: string
 *               instructorAssigned:
 *                 type: string
 *               instructor:
 *                 type: string
 *     responses:
 *       201:
 *         description: Training course created
 *
 * /api/admin/training/{id}:
 *   put:
 *     tags: [Admin]
 *     summary: Update a training course
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Training course updated
 *   delete:
 *     tags: [Admin]
 *     summary: Delete a training course
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Training course deleted
 *
 * /api/admin/reports:
 *   get:
 *     tags: [Admin]
 *     summary: List administrative reports
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Reports
 *
 * /api/admin/disputes:
 *   get:
 *     tags: [Admin]
 *     summary: List disputes
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Disputes
 *
 * /api/admin/disputes/{id}/resolve:
 *   post:
 *     tags: [Admin]
 *     summary: Resolve a dispute
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               caseStatus:
 *                 type: string
 *                 example: Resolved - Farmer Compensated
 *               resolutionNotes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Dispute resolved
 *       404:
 *         description: Dispute not found
 *
 * /api/admin/verifications:
 *   get:
 *     tags: [Admin]
 *     summary: List farm verification requests
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Verification requests
 *
 * /api/admin/verifications/{id}/review:
 *   post:
 *     tags: [Admin]
 *     summary: Review a farm verification request
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [verified, rejected]
 *               notes:
 *                 type: string
 *               officerName:
 *                 type: string
 *     responses:
 *       200:
 *         description: Verification reviewed
 *       404:
 *         description: Verification request not found
 *
 * /api/admin/master-crops:
 *   get:
 *     tags: [Admin]
 *     summary: List master crops
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Master crop list
 *   post:
 *     tags: [Admin]
 *     summary: Create a master crop
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Master crop created
 *
 * /api/admin/master-crops/{id}:
 *   put:
 *     tags: [Admin]
 *     summary: Update a master crop
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Master crop updated
 *   delete:
 *     tags: [Admin]
 *     summary: Delete a master crop
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Master crop deleted
 *
 * /api/admin/advisories:
 *   get:
 *     tags: [Admin]
 *     summary: List advisories
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Advisory list
 *   post:
 *     tags: [Admin]
 *     summary: Create an advisory
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Advisory created
 *
 * /api/admin/advisories/{id}:
 *   put:
 *     tags: [Admin]
 *     summary: Update an advisory
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Advisory updated
 *   delete:
 *     tags: [Admin]
 *     summary: Delete an advisory
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Advisory deleted
 *
 * /api/admin/market-prices:
 *   get:
 *     tags: [Admin]
 *     summary: List market prices
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Market price list
 *   post:
 *     tags: [Admin]
 *     summary: Create a market price
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Market price created
 *
 * /api/admin/market-prices/{id}:
 *   put:
 *     tags: [Admin]
 *     summary: Update a market price
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Market price updated
 *   delete:
 *     tags: [Admin]
 *     summary: Delete a market price
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Market price deleted
 *
 * /api/admin/audit-logs:
 *   get:
 *     tags: [Admin]
 *     summary: List audit logs
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Audit logs
 *
 * /api/admin/weather-alerts:
 *   get:
 *     tags: [Admin]
 *     summary: List weather alerts
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Weather alerts
 *   post:
 *     tags: [Admin]
 *     summary: Broadcast a weather alert
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Weather alert broadcast
 *
 * /api/admin/weather-alerts/{id}:
 *   delete:
 *     tags: [Admin]
 *     summary: Delete a weather alert
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Weather alert deleted
 */