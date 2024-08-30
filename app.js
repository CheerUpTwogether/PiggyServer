const express = require("express");
const path = require("path");
const argon2 = require("argon2");

const app = express();
const port = 3000;

app.use(express.json());

// 비밀번호 암호화
app.post("/hash", async (req, res) => {
  try {
    const { sid, nickname } = req.body;
    if (!sid || !nickname) {
      return res.status(400).json({ error: "옳바르지 않은 값입니다." });
    }
    const secretSaltKey = process.env.SALT;
    const password = `${nickname}${sid}${secretSaltKey}`;
    const hashPassword = await argon2.hash(password);

    res.status(200).json({ data: hashPassword });
  } catch (error) {
    console.error("Error occurred:", error); // 에러 로그 출력
    res.status(500).json({ error: "서버 요청 오류" });
  }
});

// 비밀번호 인증
app.post("/vertify", async (req, res) => {
  try {
    const { sid, nickname, hash } = req.body;
    if (!sid || !nickname) {
      return res.status(400).json({ error: "옳바르지 않은 값입니다." });
    }
    const secretSaltKey = process.env.SALT;
    const password = `${nickname}${sid}${secretSaltKey}`;
    const isMatch = await argon2.verify(hash, password);

    res.status(200).json({ data: isMatch });
  } catch (error) {
    console.error("Error occurred:", error);
    res.status(500).json({ error: "서버 요청 오류" });
  }
});

// 서버 시작
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
