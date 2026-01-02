import swaggerJSDoc from 'swagger-jsdoc';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Design Tool Pro API Documentation',
            version: '1.0.0',
            description: "This API powers the Design Tool Pro Figma plugin, providing AI-powered design generation,task management, Trello integration, and design version control.",
        },
        servers: [
            {
                url: "http://localhost:5000/",
                description: 'Development Server',
            },
            {
                url: "https://task-creator-api.onrender.com/",
                description: 'Production Server',
            },
        ]
    },
    apis: ['src/**/*.swagger.yaml']
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;