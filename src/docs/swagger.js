const swaggerJsdoc = require("swagger-jsdoc");

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "AgriNova API Documentation",
            version: "1.0.0",
            description:
                "API reference for the AgriNova agricultural management platform.",
        },
        servers: [
            {
                url: "https://agrinova-backend1.onrender.com",
                description: "Production server",
            },
            {
                url: "http://localhost:5000",
                description: "Local development server",
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
        },
    },
    apis: [
        "./src/modules/**/*.js",
        "./src/app.js",
        "./src/docs/*.js",
    ],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;

