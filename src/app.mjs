import './config.mjs';
import './db.mjs';
import mongoose from 'mongoose';
import sanitize from 'mongo-sanitize';

import express from 'express';
import session from 'express-session';
import path from 'path';
import url from 'url';
import * as auth from './auth.mjs';
import methodOverride from 'method-override';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const app = express();

app.set('view engine', 'hbs');

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: false }));
app.use(session({
    secret: process.env.SESSION_SECRET ?? 'fallback_secret', // use env var
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    }
}));

app.use(methodOverride('_method'));

const authRequiredPaths = ['/dashboard', '/products'];

const loginMessages = {"PASSWORDS DO NOT MATCH": 'Incorrect password', "USER NOT FOUND": 'User doesn\'t exist'};
const registrationMessages = {"USERNAME ALREADY EXISTS": "Username already exists", "USERNAME PASSWORD TOO SHORT": "Username or password is too short"};

app.use((req, res, next) => {
    if (!authRequiredPaths.includes(req.path)) return next();

    // Must be logged in
    if (!req.session.user) return res.redirect('/login');

    // Extra gatekeeper for the dashboard
    if (req.path === '/dashboard' && req.session.user.role !== 'Manager') {
        return res.status(403).render('accessDenied', { title: 'Access denied' });
    }

    next();
});

app.use((req, res, next) => {
    res.locals.user = req.session.user;
    next();
  });
  
  app.use((req, res, next) => {
    console.log(req.path.toUpperCase(), req.body);
    next();
});

app.get('/', (req, res) => {
    if (!req.session.user) {
        res.render('home', { user: null });
    } else {
        res.render('home', { user: req.session.user });
    }
});

app.get('/register', (req, res) => {
    res.render('register');
});
  
app.post('/register', async (req, res) => {
    try {
        const newUser = await auth.register(
        sanitize(req.body.username), 
        sanitize(req.body.email), 
        req.body.password,
        req.body.role === 'Manager' ? 'Manager' : 'Store Keeper'
        );
        await auth.startAuthenticatedSession(req, newUser);
        res.redirect('/'); 
    } catch(err) {
        console.log(err);
        res.render('register', {message: registrationMessages[err.message] ?? 'Registration error'}); 
    }
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/auth/login', async (req, res) => {
  try {
    const user = await auth.login(
      sanitize(req.body.username), 
      req.body.password
    );
    await auth.startAuthenticatedSession(req, user);
    res.redirect('/'); 
  } catch(err) {
    console.log(err)
    res.render('login', {message: loginMessages[err.message] ?? 'Login unsuccessful'}); 
  }
});

const Product = mongoose.model('Product');

// GET /products → list products
app.get('/products', async (req, res) => {
    const products = await Product.find();
    res.render('products', { products });
});
  
  // POST /products → add product
app.post('/products', async (req, res) => {
    try {
        const { name, price, description, inStock } = req.body;
        await Product.create({
        name,
        price,
        description,
        inStock: inStock === 'on'
        });
        res.redirect('/products');
    } catch (err) {
        res.status(500).send('Error adding product');
    }
});
  
  // PUT /products/:id → update product
app.put('/products/:id', async (req, res) => {
    try {
        const { name, price, description } = req.body;
        const inStock = req.body.inStock === 'on' || req.body.inStock === true;

        await Product.findByIdAndUpdate(
        req.params.id,
        { name, price, description, inStock },
        { new: true, runValidators: true }
        );

        // HTML workflow
        res.redirect('/products');

    } catch (err) {
        console.error(err);
        res.status(500).send('Error updating product');
    }
});

app.get('/logout', async (req, res) => {
    try {
        await auth.endAuthenticatedSession(req);
        res.redirect('/login');
    } catch (err) {
        console.error('Logout failed:', err);
        res.status(500).send('Logout failed');
    }
});

app.get('/dashboard', async (req, res) => {
    if (!req.session.user) return res.redirect('/login');
  
    const [
      totalProducts,
      totalInStock,
      priceStats,
      categoryBreakdown,
      latestUpdates
    ] = await Promise.all([
      Product.countDocuments({}),
      Product.aggregate([{ $match:{ inStock:true }},{ $group:{ _id:null, qty:{ $sum:"$quantity" }}}]),
      Product.aggregate([{ $group:{ _id:null,
          avgPrice:{ $avg:"$price" },
          maxPrice:{ $max:"$price" },
          minPrice:{ $min:"$price" }}}]),
      Product.aggregate([{ $group:{ _id:"$category", value:{ $sum:"$quantity" }}}]),
      Product.find().sort({ updatedAt:-1 }).limit(5)
    ]);
  
    res.render('dashboard', {
      totalProducts,
      totalInStock: totalInStock[0]?.qty ?? 0,
      avgPrice : priceStats[0]?.avgPrice?.toFixed(2) ?? 0,
      maxPrice : priceStats[0]?.maxPrice,
      minPrice : priceStats[0]?.minPrice,
      catData  : JSON.stringify(categoryBreakdown),
      updates  : latestUpdates
    });
});
  


app.listen(process.env.PORT ?? 3000);