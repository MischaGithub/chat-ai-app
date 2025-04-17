import express, { Request, Response, urlencoded } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { StreamChat } from "stream-chat";
import OpenAI from "openai";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Initialize Stream Chat client
const chatClient = StreamChat.getInstance(
    process.env.STREAM_API_KEY!, 
    process.env.STREAM_API_SECRET!
);

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Register user with Stream Chat
app.post("/register-user", async (req: Request, res: Response): Promise<any> => {
    const { name, email } = req.body || {};

    // brad@gmail.com - brad_gmail_com

    if (!name || !email) {
        return res.status(400).json({ error: "Name and email are required" });
    }

    try {
        const userId = email.replace(/[^a-zA-Z0-9_-]/g, "_");

        // Check if user exists
        const userResponse = await chatClient.queryUsers({ id: {$eq: userId} });

        if (!userResponse.users.length) {

            // Add new user to stream 

            await chatClient.upsertUser({
                id: userId,
                name: name,
                email: email,
                role: "user",
            })
        }
        res.status(200).json({ userId, name, email });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
        
    }

});

// Send message to OpenAI
app.post("/send-message", async (req: Request, res: Response): Promise<any> => {
    const { userId, message } = req.body || {};

    if (!userId || !message) {
        return res.status(400).json({ error: "User and message are required" });
    }

    try {
        // Verify user exists
        const userResponse = await chatClient.queryUsers({ id: userId });

        if (!userResponse.users.length) {
            return res.status(404).json({ error: "User not found. Please register first" });
        }
        
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });       
        
    }
    // const userResponse = await chatClient.queryUsers({ id: {$eq: userId} });
    // if (!userResponse.users.length) {
    //     return res.status(404).json({ error: "User not found" });
    // }
    // const user = userResponse.users[0];
   
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}
);

