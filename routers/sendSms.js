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
  const { phone, code } = req.body;

  if (!code || !phone) {
    return res.status(404).json({ error: "비어있는 값이 있습니다." });
  }

  const hmac = CryptoJS.algo.HMAC.create(
    CryptoJS.algo.SHA256,
    process.env.NAVER_SECRET_KEY
  );
  const method = "POST";
  const space = " ";
  const url2 = `/sms/v2/services/${process.env.NAVER_SERVICE_KEY}/messages`;
  const newLine = "₩n";
  const date = Date.now().toString();
  const accessKey = process.env.NAVER_ACCESS_KEY;

  hmac.update(method);
  hmac.update(space);
  hmac.update(url2);
  hmac.update(newLine);
  hmac.update(date);
  hmac.update(newLine);
  hmac.update(accessKey);

  const hash = hmac.finalize();
  const signature = hash.toString(CryptoJS.enc.Base64);

  instance.post(
    `/sms/v2/services/${process.env.NAVER_SERVICE_KEY}/messages`,
    {
      tyle: "SMS",
      countryCode: "82",
      from: "01091562464",
      content: `[Piggy] 본인인증번호는 ${code}입니다.`,
      messages: [{ to: `${phone}` }],
    },
    {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "x-ncp-apigw-timestamp": date,
        "x-ncp-iam-access-key": accessKey,
        "x-ncp-apigw-signature-v2": signature,
      },
    }
  );
});
