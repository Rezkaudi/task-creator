import express from "express";
import { flashcardRouter } from "./routers/flashcardRouter";
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Info Site</title>
    </head>
    <body>
        <h1>Info Site</h1>
        <p>Version: <strong>1.1</strong></p>
    </body>
    </html>
  `);
});

app.use("/api/flashcards", flashcardRouter);

export default app;