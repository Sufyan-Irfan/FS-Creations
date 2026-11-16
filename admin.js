const multer = require('multer'), path = require('path'), fs = require('fs');
module.exports = (app, q) => {
  fs.mkdirSync('public/uploads', { recursive: true }); fs.mkdirSync('public/gallery', { recursive: true });
  const E = process.env, slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const up = multer({
    storage: multer.diskStorage({ destination: 'public/uploads', filename: (r, f, cb) => cb(null, Date.now() + path.extname(f.originalname).toLowerCase()) }),
    limits: { fileSize: 3e6 }, fileFilter: (r, f, cb) => cb(null, /^image\/(jpeg|png|webp)$/.test(f.mimetype))
  });
  const auth = (req, res, next) => req.session.admin ? next() : res.redirect('/admin/login');
  app.get('/admin/login', (req, res) => res.render('admin/login', { err: null }));
  app.post('/admin/login', (req, res) => {
    if (E.ADMIN_PASS && req.body.password === E.ADMIN_PASS) { req.session.admin = true; return res.redirect('/admin') }
    res.render('admin/login', { err: E.ADMIN_PASS ? 'Wrong password.' : 'Set the ADMIN_PASS environment variable first.' })
  });
  app.get('/admin/logout', (req, res) => { req.session.admin = false; res.redirect('/') });
 app.get('/admin',auth,async(req,res)=>{const[st]=await q("SELECT COUNT(*) n,COALESCE(SUM(status='new'),0) nw,COALESCE(SUM(CASE WHEN status<>'cancelled' THEN total END),0) rev FROM orders");
  const[rv]=await q('SELECT COUNT(*) n FROM reviews WHERE approved=0');
  res.render('admin/orders',{st,pending:rv.n,orders:await q('SELECT * FROM orders ORDER BY id DESC LIMIT 200')})});
    app.post('/admin/orders/:id', auth, async (req, res) => { if (['new', 'confirmed', 'delivered', 'cancelled'].includes(req.body.status)) await q('UPDATE orders SET status=? WHERE id=?', [req.body.status, req.params.id]); res.redirect('/admin') });
  app.get('/admin/catalog', auth, async (req, res) => res.render('admin/catalog', {
    schools: await q('SELECT * FROM schools ORDER BY name'),
    products: await q('SELECT p.*,s.name school FROM products p LEFT JOIN schools s ON s.id=p.school_id ORDER BY p.id DESC'), cats: await q('SELECT * FROM categories')
  }));
  app.post('/admin/schools', auth, async (req, res) => { const n = (req.body.name || '').trim(); if (n) await q('INSERT IGNORE INTO schools(name,slug,city) VALUES(?,?,?)', [n, slug(n), req.body.city || '']); res.redirect('/admin/catalog') });
  app.post('/admin/schools/:id/delete', auth, async (req, res) => { await q('DELETE FROM products WHERE school_id=?', [req.params.id]); await q('DELETE FROM schools WHERE id=?', [req.params.id]); res.redirect('/admin/catalog') });
  app.post('/admin/products', auth, up.single('image'), async (req, res) => {
    const b = req.body; if (!b.name || !(+b.price > 0)) return res.redirect('/admin/catalog');
    await q('INSERT INTO products(name,price,school_id,category_id,gender,sizes,image,description) VALUES(?,?,?,?,?,?,?,?)',
      [b.name, +b.price, b.school_id || null, b.category_id, b.gender || 'all', b.sizes || '', req.file ? '/uploads/' + req.file.filename : '', b.description || '']); res.redirect('/admin/catalog')
  });
  app.post('/admin/products/:id/delete', auth, async (req, res) => { await q('DELETE FROM products WHERE id=?', [req.params.id]); res.redirect('/admin/catalog') });

  app.post('/product/:id/review', async (req, res) => {
    const b = req.body, id = +req.params.id, back = '/product/' + id;
    if (b.website || Date.now() - (req.session.lastReview || 0) < 30000) return res.redirect(back);
    const name = (b.name || '').trim().slice(0, 60), comment = (b.comment || '').trim().slice(0, 500), rating = Math.min(5, Math.max(1, parseInt(b.rating) || 0));
    if (!name || !comment || !rating) return res.redirect(back);
    if (!(await q('SELECT id FROM products WHERE id=?', [id])).length) return res.redirect('/');
    await q('INSERT INTO reviews(product_id,name,rating,comment) VALUES(?,?,?,?)', [id, name, rating, comment]); req.session.lastReview = Date.now(); res.redirect(back + '?review=sent#reviews')
  });
  app.get('/admin/reviews', auth, async (req, res) => res.render('admin/reviews', { rows: await q('SELECT r.*,p.name product FROM reviews r JOIN products p ON p.id=r.product_id ORDER BY r.approved,r.id DESC LIMIT 200') }));
  app.post('/admin/reviews/:id/approve', auth, async (req, res) => { await q('UPDATE reviews SET approved=1 WHERE id=?', [req.params.id]); res.redirect('/admin/reviews') });
  app.post('/admin/reviews/:id/delete', auth, async (req, res) => { await q('DELETE FROM reviews WHERE id=?', [req.params.id]); res.redirect('/admin/reviews') });
  app.get('/admin/products/:id/edit', auth, async (req, res) => {
    const [p] = await q('SELECT * FROM products WHERE id=?', [req.params.id]);
    p ? res.render('admin/edit', { p, schools: await q('SELECT * FROM schools ORDER BY name'), cats: await q('SELECT * FROM categories') }) : res.redirect('/admin/catalog')
  });
  app.post('/admin/products/:id', auth, up.single('image'), async (req, res) => {
    const b = req.body, [p] = await q('SELECT * FROM products WHERE id=?', [req.params.id]);
    if (!p || !b.name || !(+b.price > 0)) return res.redirect('/admin/catalog');
    let img = p.image; if (req.file) { if (img.startsWith('/uploads/')) fs.unlink('public' + img, () => { }); img = '/uploads/' + req.file.filename }
    await q('UPDATE products SET name=?,price=?,school_id=?,category_id=?,gender=?,sizes=?,image=?,description=? WHERE id=?',
      [b.name, +b.price, b.school_id || null, b.category_id, b.gender || 'all', b.sizes || '', img, b.description || '', p.id]); res.redirect('/admin/catalog')
  });
  app.get('/size-guide', (req, res) => res.render('pages/size', { title: 'Size guide' }));
  app.get('/contact', (req, res) => res.render('pages/contact', { title: 'Contact', addr: E.ADDRESS || 'Karachi, Pakistan', phone: E.PHONE || '' }));
  app.get('/gallery', (req, res) => res.render('pages/gallery', { title: 'Gallery', imgs: fs.readdirSync('public/gallery').filter(f => /\.(jpe?g|png|webp)$/i.test(f)) }));
};
