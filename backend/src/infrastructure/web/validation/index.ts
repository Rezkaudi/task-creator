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
        .optional()
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