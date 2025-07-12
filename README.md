# Ticket Bot

A simple Discord ticket bot designed as a task requested by Rollerite.  
This is **not a production-ready project**, but rather a simple and easy-to-use bot.

---

## ⚙️ Setup

### 1️⃣ Install dependencies

Make sure you have [Node.js](https://nodejs.org/) installed.

```bash
npm install
```

---

### 2️⃣ Configure bot

Add your bot token in either a `.env` file or in `config.ts`.  

#### Option 1 — Use `.env` file

Create a `.env` file in your project root and add:

```env
token=your_bot_token_here
```

#### Option 2 — Use `config.ts`

```ts
export default {
    token: process.env.token || "", // Bot token from https://discord.com/developers/applications
    ...
}
```

- Add the bot to your Discord server.

---

### 3️⃣ Configure database

The bot supports:

- **MySQL**
- **SQLite**
- **MongoDB**

To set up the database you want to use, go to `config.ts` and update:

```ts
// You can only use one database at a time
database: {
    mongoDB: {
        useMongoDB: true,
        mongoDB: "mongodb://127.0.0.1:27017/ticket",
    },
    mySQL: {
        useMySQL: false, // set to true if you want to use MySQL
        host: "localhost",
        port: 3306,
        user: "root",
        password: "",
        database: "ticket",
    },
    sqlite: {
        useSQLite: false,
        storage: path.join(findProjectRoot(), "database", "database.sqlite")
    }
}
```

✅ Set **true** for the database you want to use and update the connection details.  
⚠️ You can only use **one database type at a time**, and switching database types **will not transfer your data** automatically.

---

### 4️⃣ Run the bot

You have two options to start the bot:

- **Development mode:**

```bash
npm run dev
```

- **Production mode:**

```bash
npm run build
node dist/index.js
```

---

## 🟢 First-time configuration commands

Use the following commands to set up the bot:

- `/ticket config category category:`  
Set the category where tickets will be created.

- `/ticket config role role: type:add`  
Set the staff team for tickets. _(Optional, you can skip this step.)_

- `/ticket config transcripts channel:`  
Set the channel where ticket transcripts will be saved before deletion.

- `/ticket config send channel:`  
Set the channel where the "Open Ticket" message will be sent.

---

## 💬 Other commands

- `/ticket moderation add`  
Add a user or role to a specific ticket.

- `/ticket moderation remove`  
Remove a user or role from a specific ticket.

- `/ticket moderation delete`  
Delete a ticket.

- `/ticket moderation close`  
Close a ticket. You can also use the control panel button to close/open the ticket.

- `/ticket moderation open`  
Open a closed ticket.

- `/ticket moderation rename name:`  
Rename a ticket to a specific name.

---

## ⚠️ Notes

- Each user can open **only one ticket** at a time.
- I used my own custom database middleware to control the database (did not use TypeORM).
- I used a simple **map cache** for guild config and recent tickets to add some speed to the bot.
- My goal was to keep **everything simple**, easy to understand, and easy to use.
- This project was created as a simple task request and is not intended for production use.

---

⭐ **Feel free to star the repo if you like it!**
