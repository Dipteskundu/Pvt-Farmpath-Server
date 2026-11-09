
const express = require("express");
const router = express.Router();
const authController = require("./auth.controller");
const auth = require("../../middleware/auth.middleware");

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User registration, login, social authentication, and profile access
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: Test Farmer
 *               email:
 *                 type: string
 *                 format: email
 *                 example: agrinova.test.2026@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: TestFarm@2026
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Missing or invalid registration data
 *       409:
 *         description: User already exists
 */
router.post("/register", authController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Log in to AgriNova
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: agrinova.test.2026@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: TestFarm@2026
 *     responses:
 *       200:
 *         description: Login successful; returns authentication data
 *       400:
 *         description: Missing or invalid login data
 *       401:
 *         description: Invalid credentials
 */
router.post("/login", authController.login);

/**
 * @swagger
 * /api/auth/social:
 *   post:
 *     summary: Authenticate using a social account
 *     description: Request fields depend on the social authentication implementation.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: true
 *             example:
 *               provider: google
 *               token: YOUR_SOCIAL_PROVIDER_TOKEN
 *     responses:
 *       200:
 *         description: Social authentication successful
 *       400:
 *         description: Invalid social authentication data
 *       401:
 *         description: Social authentication failed
 */
router.post("/social", authController.socialAuth);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get the current authenticated user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current authenticated user retrieved successfully
 *       401:
 *         description: Authentication required or token invalid
 */
router.get("/me", auth, authController.getMe);

module.exports = router;
