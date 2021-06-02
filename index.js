const express = require('express');
const mysql = require('mysql');
const session = require('express-session');
const cookieParser = require("cookie-parser");
const connectFlash = require("connect-flash");
const bcrypt = require('bcrypt');
const app = express();

app.use(express.static('public'));
app.use(express.urlencoded({extended: false}));

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Benjamin-070403',
  database: 'node_create_database'
});

connection.connect((err) => {
  if (err) {
    console.log('error connecting: ' + err.stack);
    return;
  }
  console.log('success');
});

app.use(cookieParser("secret_passcode"));

app.use(
  session({
    secret: 'my_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 4000000 }
  })
);

app.use(connectFlash());

app.use((req, res, next) => {
  res.locals.flashMessages = req.flash();
  next();
});

app.use((req, res, next) => {
  if (req.session.userId === undefined) {
    res.locals.isLoggedIn = false;
  } else {
    res.locals.username = req.session.username;
    res.locals.userid = req.session.userId;
    res.locals.isLoggedIn = true;
  }
  next();
});

app.get('/', (req, res) => {
  res.render('top.ejs');
});

app.get('/menu', (req, res) => {
  res.render('menu.ejs');
});

app.get('/body', (req, res) => {
  res.render('body.ejs');
});

app.get('/facial', (req, res) => {
  res.render('facial.ejs');
});

app.get('/bridal', (req, res) => {
  res.render('bridal.ejs');
});

app.get('/maternity', (req, res) => {
  res.render('maternity.ejs');
});

app.get('/list', (req, res) => {
  connection.query(
    'SELECT * FROM articles',
    (error, results) => {
      res.render('list.ejs', { articles: results });
    }
  );
});

app.get('/article/:id', (req, res) => {
  const id = req.params.id;
  connection.query(
    'SELECT * FROM articles WHERE id = ?',
    [id],
    (error, results) => {
      res.render('article.ejs', { article: results[0] });
    }
  );
});

app.get('/signup', (req, res) => {
  res.render('signup.ejs', { errors: [] });
});

app.post('/signup', 
  (req, res, next) => {
    console.log('入力値の空チェック');
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;
    const errors = [];

    if (username === '') {
      errors.push('！ユーザー名を入力してください');
    }

    if (email === '') {
      errors.push('！メールアドレスを入力してください');
    }

    if (password === '') {
      errors.push('！パスワードを入力してください');
    }

    if (errors.length > 0) {
      res.render('signup.ejs', { errors: errors });
    } else {
      next();
    }
  },
  (req, res, next) => {
    console.log('メールアドレスの重複チェック');
    const email = req.body.email;
    const errors = [];
    connection.query(
      'SELECT * FROM users WHERE email = ?',
      [email],
      (error, results) => {
        if (results.length > 0) {
          errors.push('！このアドレスは既に使用されています');
          res.render('signup.ejs', { errors: errors });
        } else {
          next();
        }
      }
    );
  },
  (req, res) => {
    console.log('ユーザー登録');
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;
    bcrypt.hash(password, 10, (error, hash) => {
      connection.query(
        'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
        [username, email, hash],
        (error, results) => {
          req.session.userId = results.insertId;
          req.session.username = username;
          req.flash('success', '登録完了しました');
          res.redirect('/');
        }
      );
    });
  }
);

app.get('/login', (req, res) => {
  res.render('login.ejs', { errors: [] });
});

app.post('/login', 
  (req, res, next) => {
    console.log('入力値の空チェック');
    const email = req.body.email;
    const password = req.body.password;
    const errors = [];

    if (email === '') {
      errors.push('！メールアドレスを入力してください');
    }

    if (password === '') {
      errors.push('！パスワードを入力してください');
    }

    if (errors.length > 0) {
      res.render('login.ejs', { errors: errors });
    } else {
      next();
    }
  },
  (req, res, next) => {
    console.log('アカウントチェック');
    const email = req.body.email;
    const errors = [];
    connection.query(
      'SELECT * FROM users WHERE email = ?',
      [email],
      (error, results) => {
        if (results.length > 0) {
          const plain = req.body.password;
          const hash = results[0].password;
          bcrypt.compare(plain, hash, (error, isEqual) => {
            if(!isEqual) {
              errors.push('！パスワードが違います');
              res.render('login.ejs', { errors: errors });
            } else {
              next();
            }
          });
        } else {
          errors.push('！アドレスまたはパスワードが違います');
          res.render('login.ejs', { errors: errors });
        }
      }
    );
  },
  (req, res) => {
    console.log('ユーザー認証');
    const email = req.body.email;
    connection.query(
      'SELECT * FROM users WHERE email = ?',
      [email],
      (error, results) => {
        if (results.length > 0) {
          const plain = req.body.password;
          const hash = results[0].password;
          bcrypt.compare(plain, hash, (error, isEqual) => {
            if(isEqual) {
              req.session.userId = results[0].id;
              req.session.username = results[0].username;
              req.flash('success', 'ログインしました');
              res.redirect('/');
            }
          });
        }
      }
    );
  }  
);

app.get('/logout', (req, res) => {
    res.redirect('/afterlogout');
    req.session.destroy();
});

app.get('/afterlogout', (req, res) => {
  res.render('afterlogout.ejs', { errors: [] });
});

app.post('/afterlogout', 
  (req, res, next) => {
    console.log('入力値の空チェック');
    const email = req.body.email;
    const password = req.body.password;
    const errors = [];

    if (email === '') {
      errors.push('！メールアドレスを入力してください');
    }

    if (password === '') {
      errors.push('！パスワードを入力してください');
    }

    if (errors.length > 0) {
      res.render('login.ejs', { errors: errors });
    } else {
      next();
    }
  },
  (req, res, next) => {
    console.log('アカウントチェック');
    const email = req.body.email;
    const errors = [];
    connection.query(
      'SELECT * FROM users WHERE email = ?',
      [email],
      (error, results) => {
        if (results.length > 0) {
          const plain = req.body.password;
          const hash = results[0].password;
          bcrypt.compare(plain, hash, (error, isEqual) => {
            if(!isEqual) {
              errors.push('！パスワードが違います');
              res.render('login.ejs', { errors: errors });
            } else {
              next();
            }
          });
        } else {
          errors.push('！アドレスまたはパスワードが違います');
          res.render('login.ejs', { errors: errors });
        }
      }
    );
  },
  (req, res) => {
    console.log('ユーザー認証');
    const email = req.body.email;
    connection.query(
      'SELECT * FROM users WHERE email = ?',
      [email],
      (error, results) => {
        if (results.length > 0) {
          const plain = req.body.password;
          const hash = results[0].password;
          bcrypt.compare(plain, hash, (error, isEqual) => {
            if(isEqual) {
              req.session.userId = results[0].id;
              req.session.username = results[0].username;
              req.flash('success', 'ログインしました');
              res.redirect('/');
            }
          });
        }
      }
    );
  }  
);

app.get('/about', (req, res) => {
  res.render('about.ejs');
});

app.get('/mypage/:id', (req, res) => {
  const id = req.session.userId;
  connection.query(
    'SELECT * FROM users WHERE id = ?',
    [id],
    (error, result) => {
      if (result.length > 0) {
        res.render('mypage.ejs',
        { name: result[0].username, email: result[0].email, point: result[0].point, lastdate: result[0].lastdate, reserve: result[0].reserve });
      }
    }
  );
});

app.get('/reserve', (req, res) => {
  res.render('reserve.ejs');
});

app.listen(process.env.PORT ||3000);