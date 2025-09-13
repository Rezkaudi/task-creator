# vite-react-node-express-lowdb-json-fullstack

This is a fullstack React/Node/Express/lowdb-json application that runs in one directory. 

The lowdb database layer is read/write and uses one JSON file which is easy to read, search and edit with any editor, which makes this site particularly **useful for local development tools or other internal apps**.

The database layer is abstracted so that it can be swapped out with any other database, e.g. SQLite, MySQL or MongoDB.

In the frontend, easy-peasy Redux is used for straight-forward state management, which communicates with a dataModel that uses Zod to validate and cleanse all incoming data.

![410639506-10c50665-8ea6-482d-b0a2-3f3e68c71dbd](https://github.com/user-attachments/assets/84d8fe35-8aa7-44b9-a07a-f25c2de94b80)

## Video explaining how to set this site up and how the backend, easy-peasy Redux and Zod works

[![grafik](https://github.com/user-attachments/assets/7ec6ba8c-2e0c-43e3-b3a1-afb2b1a62db0)](https://www.youtube.com/watch?v=pnfAGFCX8_o)

## frontend

-   Vite React
-   TypeScript - _types shared between frontend and backend_
-   React Router 6.4 - _with createBrowserRouter_
-   easy-peasy Redux - _state management_
-   Zod - _validation_
-   Tailwind & Sass
-   nodemon - _hot reloading_
-   concurrently - _runs backend/frontend with one command_
-   ESLint/Prettier
-   responsive - _less than 768px = vertical smartphone_

## backend API

-   Node/Express
-   TypeScript
-   lowdb with db.json - _datasource_

## setup

-   `npm i`
-   `npm run dev` - _starts both backend and frontend_

## ports

- frontend: 3200
- backend: 3300
