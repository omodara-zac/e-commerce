# E-Commerce Website

A full-stack e-commerce web application built with Node.js, Express.js, EJS, PostgreSQL, and Bootstrap.

## 🚀 Live Demo

https://e-commerce-190k.onrender.com/

## ✨ Features

- User registration and login
- Google OAuth 2.0 authentication
- Session-based authentication
- Product catalogue
- Product descriptions, pricing, images, and stock
- Product size selection
- Add products to cart
- Remove products from cart
- Checkout form
- Payment method selection
- Order creation
- Order items stored in PostgreSQL
- Responsive design with Bootstrap

## 🛠️ Technologies Used

- HTML5
- CSS3
- JavaScript
- Bootstrap
- Node.js
- Express.js
- EJS
- PostgreSQL
- Passport.js
- Google OAuth 2.0
- bcrypt
- Express Session
- Supabase
- Render

## 📁 Project Structure

```text
e-commerce/
├── public/
│   ├── css/
│   │   └── style.css
│   └── images/
│
├── views/
│   ├── index.ejs
│   ├── login.ejs
│   ├── register.ejs
│   ├── checkout.ejs
│   ├── payment.ejs
│   └── partials/
│       ├── header.ejs
│       ├── footer.ejs
│       └── cart.ejs
│
├── index.js
├── package.json
├── package-lock.json
└── README.md

⚙️ Getting Started
1. Clone the repository
git clone https://github.com/omodara-zac/e-commerce.git
2. Navigate into the project
cd e-commerce
3. Install dependencies
npm install
4. Create a .env file

Create a .env file in the root directory and add:

DATABASE_URL=your_database_url
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
SESSION_SECRET=your_session_secret

Never commit your .env file or expose your credentials publicly.

5. Start the application
node index.js

The application will be available at:

http://localhost:3000
🔐 Authentication

The application supports:

Email and password authentication
Google OAuth 2.0 authentication
Session-based authentication using Passport.js
🗄️ Database

PostgreSQL is used to store:

Users
Products
Cart items
Orders
Order items

The production database is hosted using Supabase.

🛒 Shopping Cart

Users can:

Select a product
Choose a size and quantity
Add the product to the cart
Remove products from the cart
Proceed to checkout
📦 Orders

During checkout, the application collects:

Customer name
Phone number
Address
City
State
Payment method

Order information and associated products are stored in PostgreSQL.

💳 Payment

The payment section is currently a demo/portfolio implementation and does not process real payments.

🌐 Deployment

The application is deployed on Render and uses Supabase PostgreSQL for the production database.

🔒 Security

Sensitive credentials are stored using environment variables and are not included in the repository.

The .env file should never be committed to GitHub.

👨‍💻 Author

Zaccheaus Ayodeji Omodara

Full-Stack Web Developer

Skills

JavaScript, React, Node.js, Express.js, EJS, PostgreSQL, REST APIs, HTML, CSS, Bootstrap, Git, and GitHub.
