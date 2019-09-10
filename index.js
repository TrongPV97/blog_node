var express = require("express");
var app = express();
var var_dump = require('var_dump');
var mysql = require('mysql');
var multer = require('multer');
var bodyParser = require('body-parser');
var crypto = require('crypto');
var session = require('express-session')
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/img')
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
})

app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true
}));


/**
 *middleware
 **/
var islogin = function (req, res, next) {
    if (req.session.idlogin) {
        next()
    } else {
        res.redirect("/login");
    }
}

app.use("/blog", islogin);
/**
 *--------------
 **/


var upload = multer({storage: storage});

app.use(bodyParser.urlencoded({extended: false}));

var conn = mysql.createConnection({
    database: 'blog',
    host: "172.28.128.4",
    user: "root",
    password: ""
});
conn.connect(function (err) {
    if (err) throw err;
    console.log("Connected!");
});

/**
 **
 **/
io.sockets.on('connection', function (socket) {// WebSocket Connection
    socket.on('chat message', function (msg) {
        //socket.emit('chat message', msg); //1
        //io.sockets.emit('chat message', msg); //all
        socket.broadcast.emit('chat message', msg); //all-1

    });
});
app.get("/", function (req, res) {
    res.render("u1");
});
/**
 --------------
 **/


app.use(express.static("public"));
app.set("view engine", "ejs");
app.set("views", "./views");

server.listen("3000");

app.get("/blog/list", function (req, res) {
    var sql = "SELECT * FROM blogs ORDER BY timecreate DESC ";
    conn.query(sql, function (err, result) {

        if (err) throw err;
        //var_dump(result);
        res.render("data", {name: result});
    });
});

app.get("/blog/del/:id", function (req, res) {
    var sql = "DELETE FROM blogs WHERE id=" + req.params.id;
    conn.query(sql, function (err, result) {
        if (err) throw err;
        //var_dump(result);
        res.redirect("../list");
    });
});

app.get("/blog/add", function (req, res) {
    var sql = "SELECT * FROM typeblogs"
    conn.query(sql, function (err, result) {
        if (err) throw err;
        res.render("add", {name: result});
    });
});

app.post("/blog/edit/:id", upload.single('avatar'), function (req, res) {
    var today = new Date();
    var date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
    var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    var n = date + ' ' + time;
    if (req.file === undefined) {
        var sql = "UPDATE blogs set title='" + req.body.titleblog + "',typeblog_id='" + req.body.typeblog + "',dis='" + req.body.describe + "',content='" + req.body.content + "' WHERE id=" + req.params.id;
        conn.query(sql, function (err, result) {
            if (err) throw err;
            res.redirect("../list");
        });
    } else {
        var avater = req.file.originalname;
        var sql = "UPDATE blogs set title='" + req.body.titleblog + "',typeblog_id='" + req.body.typeblog + "',dis='" + req.body.describe + "',content='" + req.body.content + "',avatar='" + avater + "' WHERE id=" + req.params.id;
        conn.query(sql, function (err, result) {
            if (err) throw err;
            res.redirect("../list");
        });
    }

});

app.get("/blog/edit/:id", function (req, res) {
    var sql = "SELECT * FROM blogs WHERE id=" + req.params.id;
    var sql2 = "SELECT * FROM typeblogs";
    conn.query(sql, function (err, result) {
        if (err) throw err;
        //var_dump(result);
        conn.query(sql2, function (err1, result1) {
            res.render("edit", {name: result, name1: result1});

        });
    });
});

app.post("/blog/add", upload.single('avatar'), function (req, res) {
    var today = new Date();
    var date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
    var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    var n = date + ' ' + time;
    var avater = req.file.originalname;
    var sql = "INSERT INTO  blogs (title,user_id,typeblog_id,avatar,dis,content,timecreate) VALUES ('" + req.body.titleblog + "',1,'" + req.body.typeblog + "','" + avater + "','" + req.body.describe + "','" + req.body.content + "','" + n + "')";
    conn.query(sql, function (err, result) {
        if (err) throw err;
        res.redirect("list");
    });

});
/**
 *Login + logout
 **/
app.get("/login", function (req, res) {
    res.render("login");
});

app.post("/login", function (req, res) {
    var pass = req.body.password + "trongdz";
    var pass = crypto.createHash('md5').update(pass).digest("hex");
    var sql = "SELECT * FROM users WHERE mail='" + req.body.email + "' AND password='" + pass + "' LIMIT 1";
    conn.query(sql, function (err, result) {
        if (result.length == 0) {
            res.redirect("login");
        } else {
            req.session.idlogin = result[0].id;
            res.redirect("/blog/list");
        }

    });

});

app.get("/logout", function (req, res) {
    req.session.destroy(function (err) {
        res.render("login");
    })
});
/**
 *-------------
 *page
 **/

// app.get("/page", function (req, res) {
//     var sqlpick = "SELECT * FROM blogs,typeblogs,users WHERE blogs.typeblog_id=typeblogs.id AND blogs.user_id=users.id AND  pick=1 LIMIT 1";
//     conn.query(sqlpick, function (err, result) {
//         //console.log(result);
//         var sqlrelate = "SELECT * FROM blogs,typeblogs,users WHERE blogs.typeblog_id=typeblogs.id AND blogs.user_id=users.id AND blogs.typeblog_id='" + result[0].typeblog_id + "' AND blogs.id !='" + result[0].id + "'  LIMIT 2";
//         //console.log(sqlrelate);
//         conn.query(sqlrelate, function (err, result1) {
//             var sqlnew = "SELECT * FROM blogs,typeblogs,users WHERE blogs.typeblog_id=typeblogs.id AND blogs.user_id=users.id ORDER BY timecreate DESC LIMIT 5";
//             conn.query(sqlnew, function (err, result2) {
//                 res.render("page", {blogpick: result, blogrelate: result1, blognew: result2});
//             });
//         });
//     });
//
// });

/**
 * get blog
 **/
app.get("/getblog/:id", function (req, res) {
    var sql = "SELECT * FROM blogs,typeblogs,users WHERE blogs.typeblog_id=typeblogs.id AND blogs.user_id=users.id AND blogs.id=" + req.params.id;
    conn.query(sql, function (err, result) {
        res.render("getblog", {getblog: result});
    });
});

app.get("/page/:id", function (req, res) {
	var current_page = req.params.id;
	var limit = 5;
	var sqlpick = "SELECT * FROM blogs,typeblogs,users WHERE blogs.typeblog_id=typeblogs.id AND blogs.user_id=users.id AND  pick=1 LIMIT 1";
	conn.query(sqlpick, function (err, result) {
		//console.log(result);
		var sqlrelate = "SELECT * FROM blogs,typeblogs,users WHERE blogs.typeblog_id=typeblogs.id AND blogs.user_id=users.id AND blogs.typeblog_id='" + result[0].typeblog_id + "' AND blogs.id !='" + result[0].id + "'  LIMIT 2";
		//console.log(sqlrelate);
		conn.query(sqlrelate, function (err, result1) {
			var sqlnew = "SELECT * FROM blogs,typeblogs,users WHERE blogs.typeblog_id=typeblogs.id AND blogs.user_id=users.id ORDER BY timecreate DESC";
			conn.query(sqlnew, function (err, result2) {
				var total_page = Math.ceil(result2.length / limit);
				if (current_page > total_page){
					current_page = total_page;
				}
				else if (current_page < 1){
					current_page = 1;
				}
				var start = (current_page - 1) * limit;
				var sqlnew1 = "SELECT blogs.`id`,blogs.`title`,blogs.`content`,blogs.`avatar`,blogs.`timecreate`,blogs.`dis`,`typeblogs`.`nametypeblog`,users.`username` FROM blogs,typeblogs,users WHERE blogs.typeblog_id=typeblogs.id AND blogs.user_id=users.id ORDER BY timecreate DESC LIMIT "+start+","+limit;

				conn.query(sqlnew1, function (err, result3) {
                    res.render("page", {blogpick: result, blogrelate: result1, blognew: result3,current_page:current_page,total_page:total_page});
				});
			});
		});
	});
});
app.get("/search", function (req, res) {
	var page=req.query.search.split("?");
	var sql = "SELECT * FROM blogs,typeblogs,users WHERE blogs.typeblog_id=typeblogs.id AND blogs.user_id=users.id AND blogs.title like '%"+ page[0]+"%'";
	if (page[1]==undefined){
		var current_page=0;
	}else{
		var current_page = page[1];
	}
	var limit = 5;
	var search=page[0];

	conn.query(sql, function (err, result) {
		var total_page = Math.ceil(result.length / limit);
		if (current_page > total_page){
			current_page = total_page;
		}
		else if (current_page < 1){
			current_page = 1;
		}
		var start = (current_page - 1) * limit;
		var sqlnew1 = "SELECT blogs.`id`,blogs.`title`,blogs.`content`,blogs.`avatar`,blogs.`timecreate`,blogs.`dis`,`typeblogs`.`nametypeblog`,users.`username` FROM blogs,typeblogs,users WHERE blogs.typeblog_id=typeblogs.id AND blogs.user_id=users.id and blogs.title like '%"+ page[0]+"%' ORDER BY timecreate DESC LIMIT "+start+","+limit;
		conn.query(sqlnew1, function (err, result3) {

			res.render("searchblog", {getblog: result3,current_page:current_page,total_page:total_page,search:search});
		});
	});
});
