import express from "express";
import dotenv from "dotenv";
import axios from "axios";
import CryptoJS from "crypto-js";
import { supabase } from "../app.js";

const instance = axios.create({
  baseURL: "https://sens.apigw.ntruss.com",
});

dotenv.config();

const router = express.Router();

router.post("/sendSms", async (req, res) => {
  try{
  const { phone, content } = req.body;
  if (!content || !phone) {
    return res.status(404).json({ error: "비어있는 값이 있습니다." });
  }

  const hmac = CryptoJS.algo.HMAC.create(
    CryptoJS.algo.SHA256,
    process.env.NAVER_SECRET_KEY
  );
  const method = "POST";
  const space = " ";
  const url2 = `/sms/v2/services/${process.env.NAVER_SERVICE_KEY}/messages`;
  const newLine = "\n";
  const date = Date.now().toString();

  hmac.update(method);
  hmac.update(space);
  hmac.update(url2);
  hmac.update(newLine);
  hmac.update(date);
  hmac.update(newLine);
  hmac.update(process.env.NAVER_ACCESS_KEY);

  const hash = hmac.finalize();
  const signature = hash.toString(CryptoJS.enc.Base64);

  await instance.post(
    `/sms/v2/services/${process.env.NAVER_SERVICE_KEY}/messages`,
    {
      type: "SMS",
      countryCode: "82",
      from: process.env.NAVER_PHONE_NUMBER,
      content: content,
      messages: [{ to: phone, },],
    },
    {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "x-ncp-apigw-timestamp": date,
        "x-ncp-iam-access-key": process.env.NAVER_ACCESS_KEY,
        "x-ncp-apigw-signature-v2": signature,
      },
    }
  );
}catch(e){
	console.log(e.message);
}

});

export default router;
