import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import bcrypt from "bcrypt";
import passport, { Passport } from "passport";
import { Strategy } from "passport-local";
import session from "express-session";
import env from "dotenv";
import GoogleStrategy from "passport-google-oauth2";


env.config();
const app = express();
const port = 3000;
const saltRounds = 10;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000
  }
}))

app.use(passport.initialize());
app.use(passport.session())

app.use((req, res, next) => {
  res.locals.isAuthenticated = req.isAuthenticated();
  next();
});

function requireAuthentication(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }

  res.redirect("/login");
}

const db = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

console.log("DATABASE URL loaded:", !!process.env.DATABASE_URL);
db.connect();

app.get("/register", (req, res) => {
  res.render("register.ejs");
});

app.get("/login", (req, res) => {
  res.render("login.ejs");
});

app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

// this is beacuse i used http://localhost:3000/auth/google/callback for the google oauth redirect url
app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login",
  }),
  (req, res) => {
    res.redirect("/");
  }
);

app.get("index.ejs", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("index.ejs")
  } else {
    res.redirect("login.ejs")
  }
})

app.post("/register", async (req, res) => {
  const email = req.body.username;
  const password = req.body.password;

  try {
    const checkResult = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (checkResult.rows.length > 0) {
      res.render("register.ejs", { errorMessage: "Email already exists. Try logging in." });
    } else {
      //hashing the password and saving it in the database
      bcrypt.hash(password, saltRounds, async (err, hash) => {
        if (err) {
          console.error("Error hashing password:", err);
        } else {
          console.log("Hashed Password:", hash);
          const result = await db.query(
            "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *",
            [email, hash]
          );
          const user = result.rows[0];
          req.login(user, (err) => {
            console.log(err)
            res.redirect("/");
          })
        }
      });
    }
  } catch (err) {
    console.log(err);
  }
});

app.post("/login", passport.authenticate("local", {
  successRedirect: "/",
  failureRedirect: "/login"
}));

passport.use(new Strategy(async function verify(username, password, cb) {
  try {
    const result = await db.query("SELECT * FROM users WHERE email = $1", [
      username,
    ]);
    if (result.rows.length > 0) {
      const user = result.rows[0];
      const storedHashedPassword = user.password;
      //verifying the password
      bcrypt.compare(password, storedHashedPassword, (err, result) => {
        if (err) {
          console.error("Error comparing passwords:", err);
        } else {
          if (result) {
            return cb(null, user)
          } else {
            return cb(null, false)
          }
        }
      });
    } else {
      // return cb(null, false, { message: "Incorrect username or password." });
      return cb("user not found")
    }
  } catch (err) {
    return cb(err)
  }
}))

passport.use(
  "google",
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/callback",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    async (accessToken, refreshToken, profile, cb) => {
      try {
        console.log(profile);
        const result = await db.query("SELECT * FROM users WHERE email = $1", [
          profile.email,
        ]);
        if (result.rows.length === 0) {
          const newUser = await db.query(
            "INSERT INTO users (email, password) VALUES ($1, $2)",
            [profile.email, "google"]
          );
          return cb(null, newUser.rows[0]);
        } else {
          return cb(null, result.rows[0]);
        }
      } catch (err) {
        return cb(err);
      }
    }
  )
);

passport.serializeUser((user, cb) => {
  cb(null, user)
})
passport.deserializeUser((user, cb) => {
  cb(null, user)
})

app.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);

    res.redirect("/");
  });
});

// app.get("/", (req, res) => {
//     db.query("SELECT * FROM products", (err, result) => {
//         if (err) {
//             console.error(err);
//             return;
//         }

//         const products = result.rows;

//         res.render("index.ejs", {
//             products: products
//         });
//     });
// });

app.get("/", (req, res) => {

  const orderConfirmation = req.session.orderConfirmation;
  delete req.session.orderConfirmation;

  db.query("SELECT * FROM products", (err, productResult) => {

    if (err) {
      console.error(err);
      return res.status(500).send("Error fetching products");
    }

    const products = productResult.rows;

    db.query(`
            SELECT
                cart_items.id,
                products.name,
                products.price,
                products.image_url,
                cart_items.size,
                cart_items.quantity
            FROM cart_items
            JOIN products
            ON cart_items.product_id = products.id
        `, (err, cartResult) => {

      if (err) {
        console.error(err);
        return res.status(500).send("Error fetching cart");
      }

      const cartItems = cartResult.rows;

      res.render("index.ejs", {
        products: products,
        cartItems: cartItems,
        orderConfirmation
      });
    });
  });
});

app.post("/cart", (req, res) => {
  const productId = req.body.product_id;
  const quantity = req.body.quantity;
  const size = req.body.size;

  db.query(
    "INSERT INTO cart_items (product_id, quantity, size) VALUES ($1, $2, $3) RETURNING id",
    [productId, quantity, size],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Error adding product to cart");
      }

      // res.redirect("/");
      res.status(201).json({
        cartItem: {
          id: result.rows[0]?.id,
          productId,
          quantity,
          size
        }
      });
    }
  );
});

app.post("/cart/delete", (req, res) => {

  const cartId = req.body.cart_id;

  db.query(
    "DELETE FROM cart_items WHERE id = $1",
    [cartId],
    (err, result) => {

      if (err) {
        console.error(err);
        return res.status(500).send("Error deleting cart item");
      }

      // res.redirect("/");
      res.json({ deletedCartId: cartId });
    }
  );
});
app.get("/checkout", requireAuthentication, (req, res) => {
  res.render("checkout.ejs");
});

app.post("/checkout", requireAuthentication, async (req, res) => {

  const { name, phone, address, city, state, paymentMethod } = req.body;

  try {

    // 1. Get cart items
    const cartResult = await db.query(`
            SELECT
                cart_items.product_id,
                cart_items.quantity,
                products.price
            FROM cart_items
            JOIN products
            ON cart_items.product_id = products.id
        `);

    const cartItems = cartResult.rows;

    // Make sure cart isn't empty
    if (cartItems.length === 0) {
      return res.status(400).send("Your cart is empty.");
    }

    // 2. Calculate total
    const totalPrice = cartItems.reduce((total, item) => {
      return total + Number(item.price) * item.quantity;
    }, 0);

    // 3. Create order
   const orderResult = await db.query(
    `INSERT INTO orders
    (name, phone, address, city, state, total_price, payment_method)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id`,
    [
        name,
        phone,
        address,
        city,
        state,
        totalPrice,
        paymentMethod
    ]
);

    const orderId = orderResult.rows[0].id;

    // 4. Add products to order_items
    for (const item of cartItems) {

      await db.query(
        `INSERT INTO order_items
                (order_id, product_id, quantity, price)
                VALUES ($1, $2, $3, $4)`,
        [
          orderId,
          item.product_id,
          item.quantity,
          item.price
        ]
      );

    }

    // 5. Clear cart
    await db.query("DELETE FROM cart_items");

    // 6. Show a one-time confirmation after returning to the homepage
    req.session.orderConfirmation = {
      orderId,
      message: "Your order has been placed successfully. Thank you for shopping with us."
    };
    req.session.save((sessionError) => {
      if (sessionError) {
        console.error(sessionError);
        return res.status(500).send("Something went wrong");
      }

      res.redirect("/");
    });

  } catch (err) {

    console.error(err);
    res.status(500).send("Something went wrong");

  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
