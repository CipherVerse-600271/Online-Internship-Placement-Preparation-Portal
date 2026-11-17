# Local demo setup

Use this guide to run the portal locally with real verification and password-reset email.

## Requirements

- Node.js and npm
- MongoDB running on this computer
- The Gmail sender address and app password used for the demo

## Configure the backend

Create `backend/.env` from `backend/.env.example` and set:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/internship_portal_sprint2_test
JWT_SECRET=replace_with_at_least_32_random_characters
JWT_EXPIRES_IN=1h
EMAIL_MODE=gmail
EMAIL_USER=your_sender_gmail_address
EMAIL_APP_PASSWORD=your_sender_app_password
EMAIL_FROM=your_sender_gmail_address
API_BASE_URL=http://localhost:5000
```

Leave `SMTP_HOST` and `SMTP_PORT` unset to use Gmail's built-in transport. Keep the sender credentials in `.env`; never commit them or paste them into chat. Each student enters their own recipient address in the registration form.

## Start the portal

1. Start MongoDB.
2. From `backend`, run `npm install`, then `npm run dev`.
3. From `frontend`, run `npm install`, then `npm run dev`.
4. Open the frontend URL shown by Vite and register a new student.
5. Open the verification email and follow its link on the same computer running the API. The reset-password form sends its code to the account's registered email address.

The app uses the database named in `MONGODB_URI`. In MongoDB Compass, open that database and refresh its collections to see the registered account. Use a new email address and SRN for a fresh verification demonstration.
