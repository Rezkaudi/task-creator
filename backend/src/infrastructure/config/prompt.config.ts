import fs from 'fs';
import path from 'path';

// Instructions (reusable building blocks)
export const schemaInstructionsPrompt = fs.readFileSync(
    path.join(__dirname, '../../../public/prompt/schema-instructions.txt'),
    'utf-8'
).trim();

export const iconInstructionsPrompt = fs.readFileSync(
    path.join(__dirname, '../../../public/prompt/icon-instructions.txt'),
    'utf-8'
).trim();

export const responseInstructionsPrompt = fs.readFileSync(
    path.join(__dirname, '../../../public/prompt/response-instructions.txt'),
    'utf-8'
).trim();

// Design system prompts
export const material3Prompt = fs.readFileSync(
    path.join(__dirname, '../../../public/prompt/design-systems/material-3.txt'),
    'utf-8'
).trim();

export const shadcnUiPrompt = fs.readFileSync(
    path.join(__dirname, '../../../public/prompt/design-systems/shadcn-ui.txt'),
    'utf-8'
).trim();

export const antDesignPrompt = fs.readFileSync(
    path.join(__dirname, '../../../public/prompt/design-systems/ant-design.txt'),
    'utf-8'
).trim();

// Action prompts (create, edit, based-on-existing)
export const createDesignPrompt = fs.readFileSync(
    path.join(__dirname, '../../../public/prompt/create-design-prompt.txt'),
    'utf-8'
).trim();

export const editDesignPrompt = fs.readFileSync(
    path.join(__dirname, '../../../public/prompt/edit-design-prompt.txt'),
    'utf-8'
).trim();

export const basedOnExistingPrompt = fs.readFileSync(
    path.join(__dirname, '../../../public/prompt/based-on-existing-prompt.txt'),
    'utf-8'
).trim();

// Other prompts
export const tasksToDesignSystemPrompt = fs.readFileSync(
    path.join(__dirname, '../../../public/prompt/tasks-to-design-prompt.txt'),
    'utf-8'
).trim();

export const meetingToTasksPrompt = fs.readFileSync(
    path.join(__dirname, '../../../public/prompt/meeting-to-tasks-prompt.txt'),
    'utf-8'
).trim();

export const htmlPreviewPrompt = fs.readFileSync(
    path.join(__dirname, '../../../public/prompt/html-preview.txt'),
    'utf-8'
).trim();

export const prototypeConnectionsPrompt = fs.readFileSync(
    path.join(__dirname, '../../../public/prompt/prototype-connections-prompt.txt'),
    'utf-8'
).trim();
