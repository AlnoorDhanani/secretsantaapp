import twilio from "twilio";

const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = process.env;

if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
  console.error("❌ Twilio env vars not found");
  process.exit(1);
}

const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

const numbers = await client.incomingPhoneNumbers.list({ limit: 50 });

console.log("\n📞 Twilio numbers in THIS account:\n");

for (const n of numbers) {
  console.log({
    phoneNumber: n.phoneNumber,
    capabilities: n.capabilities,
    friendlyName: n.friendlyName,
  });
}