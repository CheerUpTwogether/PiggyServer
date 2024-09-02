const express = require("express");
const path = require("path");
const argon2 = require("argon2");

const app = express();
const port = 3000;

app.use(express.json());

// 서버 시작
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
