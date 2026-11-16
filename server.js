const express = require('express'), session = require('express-session'), mysql = require('mysql2/promise');
const app = express(), E = process.env;
const db = mysql.createPool({ host: E.DB_HOST || 'localhost', user: E.DB_USER || 'root', password: E.DB_PASS || '', database: E.DB_NAME || 'fs_creations' });
const q = async (s, p) => (await db.query(s, p))[0];
app.set('view engine', 'ejs');
app.use(express.static('public'), express.urlencoded({ extended: false }), session({ secret: E.SESSION_SECRET || 'change-me', resave: false, saveUninitialized: true, cookie: { sameSite: 'lax', httpOnly: true } }));
app.use(async (req, res, next) => {
    const c = req.session.cart = req.session.cart || [];
    res.locals.cart = c; res.locals.user = req.session.user || null; res.locals.cartCount = c.reduce((a, i) => a + i.qty, 0); res.locals.cats = await q('SELECT * FROM categories');
    res.locals.fee = s => (!s || s >= (+E.FREE_OVER || 5000)) ? 0 : (+E.DELIVERY_FEE || 250); res.locals.bank = E.BANK_DETAILS || ''; res.locals.freeOver = +E.FREE_OVER || 5000; res.locals.wa = E.WHATSAPP || '923000000000'; res.locals.pkr = n => 'Rs. ' + Number(n).toLocaleString('en-PK'); next()
});
app.use((req,res,next)=>{res.locals.ico=s=>({'school-uniforms':'bi-mortarboard','gents-suits':'bi-person-standing','ladies-suits':'bi-person-standing-dress','bags':'bi-backpack2','water-bottles':'bi-droplet'})[s]||'bi-tag';next()});
app.get('/search',async(req,res)=>{const t=(req.query.q||'').trim().slice(0,60);
 res.render('list',{title:t?'Results for "'+t+'"':'Search',group:false,items:t?await q('SELECT * FROM products WHERE name LIKE ? OR description LIKE ? LIMIT 60',['%'+t+'%','%'+t+'%']):[]})});
app.post('/cart/update',(req,res)=>{const i=req.session.cart[+req.body.i];if(i)i.qty=Math.max(1,Math.min(99,parseInt(req.body.qty)||1));res.redirect('/cart')});
app.get('/', async (req, res) => res.render('index', { schools: await q('SELECT * FROM schools ORDER BY name'), items: await q('SELECT * FROM products WHERE school_id IS NULL LIMIT 8') }));
app.get('/school/:slug', async (req, res) => {
    const [s] = await q('SELECT * FROM schools WHERE slug=?', [req.params.slug]);
    if (!s) return res.status(404).send('School not found');
    res.render('list', { title: s.name + ' Uniform', items: await q('SELECT * FROM products WHERE school_id=? ORDER BY gender,name', [s.id]), group: true })
});
app.get('/category/:slug', async (req, res) => {
    const [c] = await q('SELECT * FROM categories WHERE slug=?', [req.params.slug]);
    if (!c) return res.status(404).send('Not found');
    if (c.slug === 'school-uniforms') return res.render('schools', { schools: await q('SELECT * FROM schools ORDER BY name') });
    res.render('list', { title: c.name, items: await q('SELECT * FROM products WHERE category_id=?', [c.id]), group: false })
});
app.get('/product/:id', async (req, res) => {
    const [p] = await q('SELECT * FROM products WHERE id=?', [req.params.id]);
    p ? res.render('product', { p, reviews: await q('SELECT * FROM reviews WHERE product_id=? AND approved=1 ORDER BY id DESC', [p.id]), sent: req.query.review === 'sent' }) : res.status(404).send('Not found')
});
app.post('/cart/add', async (req, res) => {
    const [p] = await q('SELECT * FROM products WHERE id=?', [req.body.id]); if (!p) return res.redirect('/');
    const size = req.body.size || '', qty = Math.max(1, parseInt(req.body.qty) || 1), c = req.session.cart,
        ex = c.find(i => i.id === p.id && i.size === size); ex ? ex.qty += qty : c.push({ id: p.id, name: p.name, price: p.price, size, qty }); res.redirect('/cart')
});
app.post('/cart/remove', (req, res) => { req.session.cart.splice(+req.body.i, 1); res.redirect('/cart') });
const total = c => c.reduce((a, i) => a + i.price * i.qty, 0);
app.get('/cart', (req, res) => res.render('cart', { cart: req.session.cart, total: total(req.session.cart) }));
app.get('/checkout', (req, res) => req.session.cart.length ? res.render('checkout', { total: total(req.session.cart), err: null, f: req.session.user || {} }) : res.redirect('/cart'));
app.post('/checkout', async (req, res) => {
    const c = req.session.cart, f = req.body;
    if (!c.length) return res.redirect('/cart');
    if (!f.name || !/^[0-9+\- ]{10,15}$/.test(f.phone || '') || !f.city || !f.address || !['COD', 'Bank Transfer', 'JazzCash', 'Easypaisa'].includes(f.payment))
        return res.render('checkout', { total: total(c), err: 'Please fill every field with a valid phone number.', f });
    const sub = total(c), dl = res.locals.fee(sub), r = await q('INSERT INTO orders(name,phone,city,address,payment,total,delivery,user_id) VALUES(?,?,?,?,?,?,?,?)', [f.name, f.phone, f.city, f.address, f.payment, sub + dl, dl, (req.session.user || {}).id || null]);
    for (const i of c) await q('INSERT INTO order_items(order_id,product_id,name,size,qty,price) VALUES(?,?,?,?,?,?)', [r.insertId, i.id, i.name, i.size, i.qty, i.price]);
    req.session.cart = []; res.redirect('/order/' + r.insertId)
});
app.get('/order/:id', async (req, res) => {
    const [o] = await q('SELECT * FROM orders WHERE id=?', [req.params.id]);
    o ? res.render('order', { o, items: await q('SELECT * FROM order_items WHERE order_id=?', [o.id]) }) : res.status(404).send('Not found')
});
require('./auth')(app, q); require('./admin')(app, q);
app.listen(E.PORT || 5000, () => console.log('FS Creations running on :' + (E.PORT || 5000)));
