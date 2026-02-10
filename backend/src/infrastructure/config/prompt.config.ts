import fs from 'fs';
import path from 'path';

export const textToDesignSystemPrompt = fs.readFileSync(
    path.join(__dirname, '../../../public/prompt/text-to-design-prompt.txt'),
    'utf-8'
).trim();

export const tasksToDesignSystemPrompt = fs.readFileSync(
    path.join(__dirname, '../../../public/prompt/tasks-to-design-prompt.txt'),
    'utf-8'
).trim();

export const meetingToTasksPrompt = fs.readFileSync(
    path.join(__dirname, '../../../public/prompt/meeting-to-tasks-prompt.txt'),
    'utf-8'
).trim();

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

export const htmlPreviewPrompt = fs.readFileSync(
    path.join(__dirname, '../../../public/prompt/html-preview.txt'),
    'utf-8'
).trim();

export const editDesignSystemPrompt = fs.readFileSync(
    path.join(__dirname, '../../../public/prompt/edit-design-system-prompt.txt'),
    'utf-8'
).trim();

export const iconInstructionsPrompt = fs.readFileSync(
    path.join(__dirname, '../../../public/prompt/icon-instructions.txt'),
    'utf-8'
).trim();

export const basedOnExistingSystemPrompt = fs.readFileSync(
    path.join(__dirname, '../../../public/prompt/based-on-existing-system-prompt.txt'),
    'utf-8'
).trim();

export const prototypeConnectionsPrompt = fs.readFileSync(
    path.join(__dirname, '../../../public/prompt/prototype-connections-prompt.txt'),
    'utf-8'
).trim();

