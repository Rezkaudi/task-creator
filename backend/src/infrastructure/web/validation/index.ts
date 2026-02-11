import { body, param } from 'express-validator';
import { AI_MODELS } from '../../config/ai-models.config';
import { DESIGN_SYSTEMS } from '../../config/design-systems.config';

// Design-related validations
export const generateFromTextValidation = [
    body('prompt')
        .notEmpty().withMessage('Prompt is required')
        .isString().withMessage('Prompt must be a string'),

    body('modelId')
        .isString().withMessage('Model ID must be a string')
        .isIn(AI_MODELS.map(model => model.id)).withMessage('Invalid model'),

    body('designSystemId')
        .isString().withMessage('Design System ID must be a string')
        .isIn(DESIGN_SYSTEMS.map(designSystem => designSystem.id)).withMessage('Invalid design system'),

];

export const generateFromConversationValidation = [
    body('message')
        .notEmpty().withMessage('Message is required')
        .isString().withMessage('Message must be a string'),

    body('history')
        .optional()
        .isArray().withMessage('History must be an array'),

    // body('history.*.role')
    //     .if(body('history').isArray())
    //     .isIn(['user', 'assistant', 'system']).withMessage('Invalid role'),

    // body('history.*.content')
    //     .if(body('history').isArray())
    //     .isString().withMessage('Content must be a string'),

    body('modelId')
        .isString().withMessage('Model ID must be a string')
        .isIn(AI_MODELS.map(model => model.id)).withMessage('Invalid model'),

    body('designSystemId')
        .isString().withMessage('Design System ID must be a string')
        .isIn(DESIGN_SYSTEMS.map(designSystem => designSystem.id)).withMessage('Invalid design system'),

];

export const editWithAIValidation = [
    body('message')
        .notEmpty().withMessage('Message is required')
        .isString().withMessage('Message must be a string'),

    body('currentDesign')
        .notEmpty().withMessage('Current design is required'),

    // body('history')
    //     .optional()
    //     .isArray().withMessage('History must be an array'),

    // body('history.*.role')
    //     .if(body('history').isArray())
    //     .isIn(['user', 'assistant', 'system']).withMessage('Invalid role'),

    // body('history.*.content')
    //     .if(body('history').isArray())
    //     .isString().withMessage('Content must be a string'),

    body('modelId')
        .isString().withMessage('Model ID must be a string')
        .isIn(AI_MODELS.map(model => model.id)).withMessage('Invalid model'),

    body('designSystemId')
        .isString().withMessage('Design System ID must be a string')
        .isIn(DESIGN_SYSTEMS.map(designSystem => designSystem.id)).withMessage('Invalid design system'),
];

// Task-related validations
export const extractTasksValidation = [
    body('text')
        .notEmpty().withMessage('Text is required')
        .isString().withMessage('Text must be a string'),

    body('selectedListId')
        .notEmpty().withMessage('Selected list ID is required')
        .isString().withMessage('Selected list ID must be a string'),

    body('generateDesign')
        .optional()
        .isBoolean().withMessage('generateDesign must be a boolean'),
];
export const generateBasedOnExistingValidation = [
    body('message')
        .notEmpty().withMessage('Message is required')
        .isString().withMessage('Message must be a string'),

    body('referenceDesign')
        .notEmpty().withMessage('Reference design is required'),

    body('history')
        .optional()
        .isArray().withMessage('History must be an array'),

    body('modelId')
        .isString().withMessage('Model ID must be a string')
        .isIn(AI_MODELS.map(model => model.id)).withMessage('Invalid model'),

    body('designSystemId')
        .optional()
        .isString().withMessage('Design System ID must be a string')
        .isIn(DESIGN_SYSTEMS.map(designSystem => designSystem.id)).withMessage('Invalid design system'),
];

// Design Version validations
export const saveDesignVersionValidation = [
    body('description')
        .notEmpty().withMessage('Description is required')
        .isString().withMessage('Description must be a string'),

    body('designJson')
        .notEmpty().withMessage('Design JSON is required'),
];

export const designVersionIdParamValidation = [
    param('id')
        .isString().withMessage('ID must be a string'),
];

// UI Library validations
export const createUILibraryProjectValidation = [
    body('name')
        .notEmpty().withMessage('Project name is required')
        .isString().withMessage('Project name must be a string')
        .isLength({ max: 255 }).withMessage('Project name must be less than 255 characters'),
];

export const createUILibraryComponentValidation = [
    body('projectId')
        .notEmpty().withMessage('Project ID is required')
        .isString().withMessage('Project ID must be a string'),

    body('name')
        .notEmpty().withMessage('Component name is required')
        .isString().withMessage('Component name must be a string')
        .isLength({ max: 255 }).withMessage('Component name must be less than 255 characters'),

    body('description')
        .notEmpty().withMessage('Component description is required')
        .isString().withMessage('Component description must be a string'),

    body('designJson')
        .notEmpty().withMessage('Design JSON is required'),

    body('previewImage')
        .optional({ nullable: true })
        .isString().withMessage('Preview image must be a string'),
];

export const uiLibraryIdParamValidation = [
    param('id')
        .isString().withMessage('ID must be a string'),
];

export const reportClientErrorValidation = [
    body('errorMessage')
        .notEmpty()
        .withMessage('Error message is required')
        .isString()
        .withMessage('Error message must be a string')
        .isLength({ max: 5000 })
        .withMessage('Error message must be less than 5000 characters'),

    body('errorCode')
        .optional()
        .isString()
        .withMessage('Error code must be a string')
        .isLength({ max: 100 })
        .withMessage('Error code must be less than 100 characters'),

    body('errorStack')
        .optional()
        .isString()
        .withMessage('Error stack must be a string')
        .isLength({ max: 10000 })
        .withMessage('Error stack must be less than 10000 characters'),

    body('errorDetails')
        .optional()
        .isObject()
        .withMessage('Error details must be an object'),

    body('pluginVersion')
        .optional()
        .isString()
        .withMessage('Plugin version must be a string')
        .isLength({ max: 50 })
        .withMessage('Plugin version must be less than 50 characters'),

    body('figmaVersion')
        .optional()
        .isString()
        .withMessage('Figma version must be a string')
        .isLength({ max: 50 })
        .withMessage('Figma version must be less than 50 characters'),

    body('platform')
        .optional()
        .isString()
        .withMessage('Platform must be a string')
        .isLength({ max: 100 })
        .withMessage('Platform must be less than 100 characters'),

    body('browserInfo')
        .optional()
        .isString()
        .withMessage('Browser info must be a string')
        .isLength({ max: 500 })
        .withMessage('Browser info must be less than 500 characters'),

    body('componentName')
        .optional()
        .isString()
        .withMessage('Component name must be a string')
        .isLength({ max: 255 })
        .withMessage('Component name must be less than 255 characters'),

    body('actionType')
        .optional()
        .isString()
        .withMessage('Action type must be a string')
        .isLength({ max: 255 })
        .withMessage('Action type must be less than 255 characters'),
];

export const generatePrototypeValidation = [
    body('frames')
        .notEmpty().withMessage('Frames array is required')
        .isArray({ min: 2 }).withMessage('At least 2 frames are required'),

    body('modelId')
        .isString().withMessage('Model ID must be a string')
        .isIn(AI_MODELS.map(model => model.id)).withMessage('Invalid model'),
];
