import { Worker } from "bullmq";
import IORedis from "ioredis";
import dotenv from 'dotenv';
dotenv.config();

const connection = new IORedis(process.env.REDIS_URL!, {
    maxRetriesPerRequest: null,
});

const worker = new Worker(
    "callbackQueue",
    async (job) => {
        const { callBack, plan, price, email, time } = job.data;

        console.log(`Processing callback for ${email} - Plan: ${plan}`);

        try {
            const response = await fetch(callBack, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email,
                    plan,
                    price,
                    status: "success",
                    timestamp: time,
                }),
            });

            if (!response.ok) {
                throw new Error(`Callback request failed with status ${response.status}`);
            }

            console.log(`✅ Callback sent successfully for ${email} - Plan: ${plan}`);
        } catch (error) {
            console.error(`❌ Failed to send callback for ${email}:`, error);
            throw error;
        }
    },
    { connection }
);

worker.on("failed", (job, err) => {
    console.error(`🚨 Callback job ${job!.id} failed with error: ${err.message}`);
});
