const argon2 = require("argon2");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { sid, provider, hash } = req.body;
    if (!sid || !provider || !hash) {
      return res.status(400).json({ error: "옳바르지 않은 값입니다." });
    }
    const secretSaltKey = process.env.SALT;
    const password = `${provider}${sid}${secretSaltKey}`;
    const isMatch = await argon2.verify(hash, password);

    res.status(200).json({ data: isMatch });
  } catch (error) {
    console.error("Error occurred:", error);
    res.status(500).json({ error: "서버 요청 오류" });
  }
};
