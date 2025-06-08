// This is configuration file 

const swaggerJSDoc = require('swagger-jsdoc');


const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Personalised Todo Application',
      version: '1.0.0',
      description: 'API documentation for Auth and protected CRUD of Todos',
    },
    servers: [
      {
        url: 'http://localhost:3000',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./routes/*.js','./server.js'], // adjust path based on where your routes live
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;