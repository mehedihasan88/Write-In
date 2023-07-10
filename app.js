const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require("lodash");
//const mongoose = require("mongoose");
//const date = require("dateformat");
const validator = require("validator");
const db = require("./database/db");
const date = require("./utilities/date");
let loggedIn = "none";
const adminid = "admin@gmail.com",
    adminpass = "admin123321";


//-----------------//
//uses of includes//
//----------------//
const app = express();


app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(express.static("public"));

//mongoose.connect('mongodb+srv://write-in:write-in88@cluster0.vchqj.mongodb.net/blogDB', {
//    useNewUrlParser: true,
//    useUnifiedTopology: true
//});


//-------------------//
//Connecting and setting up the db
//-------------------//
db.getConnection();
PendingPost = db.createPendingPostModel();
Post = db.createPostModel();
User = db.createUserModel();




//---------------------//
//get and post methods//
//--------------------//
app.get("/", function (req, res) {
    Post.find({}, function (err, posts) {
        if (!err) {
            let login, logout, admin, writepanel;
            if (loggedIn == "none") login = "block", logout = "none";
            else login = "none", logout = "block";
            if (loggedIn == adminid) admin = "block", writepanel = "none";
            else admin = "none", writepanel = "block";
            console.log(login, logout);
            res.render("home", {
                posts: posts,
                current: date.setCur(),
                past: date.setPast(),
                login: login,
                logout: logout,
                admin: admin,
                writepanel: writepanel
            });
        }
    })
});
app.post("/search", function (req, res) {
    const key = req.body.searchTopic;
    console.log(key);
    Post.find({
        $or: [{
            content: new RegExp(key)
        }, {
            title: new RegExp(key)
        }]
    }, function (err, posts) {
        if (!err) {
            console.log(218, posts);
            let login, logout, admin, writepanel;
            if (loggedIn == "none") login = "block", logout = "none";
            else login = "none", logout = "block";
            if (loggedIn == adminid) admin = "block", writepanel = "none";
            else admin = "none", writepanel = "block";
            res.render("home", {
                posts: posts,
                current: date.setCur(),
                past: date.setPast(),
                login: login,
                logout: logout,
                admin: admin,
                writepanel: writepanel
            });
        } else {
            console.log("archive not found!! ", err);
        }
    });

});
app.post("/logout", function (req, res) {
    loggedIn = "none";
    res.redirect("/");

});

app.get("/compose", function (req, res) {
    if (loggedIn != "none") res.render("compose");
    else res.redirect("/login");
});
app.post("/compose", function (req, res) {
    if (loggedIn != "none") {
        let user;
        User.find({
            email: loggedIn
        }, function (err, users) {
            if (!err) {
                user = users[0];
                const post = new PendingPost({
                    title: req.body.title,
                    content: req.body.content,
                    tag: req.body.tag,
                    time: date.getDate(),
                    author: user.name
                });
                if (req.body.sendAdmin == "") {
                    post.save(function (err1) {
                        if (!err1) {
                            console.log(post);
                            console.log("sent to admin");
                            res.redirect("/compose");
                        }
                    });
                }
            } else {
                console.log(err);
            }
        })

    } else {
        res.redirect("/login");
    }

});

app.get("/admin", function (req, res) {
    if (loggedIn == adminid) res.redirect("/admin/PendingBlogs");
    else res.redirect("/login");
});
app.get("/login", function (req, res) {
    res.render("login", {
        alertNotRegister: "none"
    });
});
app.post("/login", function (req, res) {
    const email = req.body.email;
    const password = req.body.password;
    User.find({
        email: email,
        password: password
    }, function (err, users) {
        if (err) console.log(err);
        else {
            if (users.length > 0) {
                loggedIn = email;
                res.redirect("/");
            } else {
                res.render("login", {
                    alertNotRegister: "block"
                })
            }
        }
    });

});
app.get("/admin/:type", function (req, res) {
    const panel = req.params.type;
    if (loggedIn == adminid) {
        if (panel === "PendingBlogs") {
            PendingPost.find({}, function (err, posts) {
                if (!err) {
                    res.render("admin", {
                        selectedPanel: panel,
                        data: posts
                    });
                }
            });
        } else if (panel === "PostedBlogs") {
            Post.find({}, function (err, posts) {
                if (!err) {
                    res.render("admin", {
                        selectedPanel: panel,
                        data: posts
                    });
                }
            });
        } else if (panel === "Users") {
            User.find({
                email: {
                    $ne: "admin@gmail.com"
                }
            }, function (err, users) {
                if (!err) {
                    res.render("admin", {
                        selectedPanel: panel,
                        data: users
                    });
                }
            });
        }
    } else {
        res.redirect("/login");
    }
});
app.post("/admin/PendingBlogsPublish", function (req, res) {
    const id = req.body.publishBtn;
    console.log(123, id);
    PendingPost.find({
        _id: id
    }, function (err, posts) {
        if (!err) {
            const post = posts[0];
            console.log(129, posts, post);
            PendingPost.deleteOne({
                _id: post._id
            }, function (err) {
                if (err) {
                    console.log("not deleted!!", err);
                } else console.log("successful deletion");
            });
            Post.create({
                title: post.title,
                content: post.content,
                tag: post.tag,
                time: post.time,
                author: post.author
            }, function (err, data) {
                if (!err) {
                    console.log("saved to post", data);
                } else console.log("not saved!!", err);
            });
        } else console.log(err);
    });
    res.redirect("/admin");
});
app.post("/admin/PendingBlogsReject", function (req, res) {
    const id = req.body.rejectBtn;
    PendingPost.deleteOne({
        _id: id
    }, function (err) {
        if (!err) console.log("deleted");
        else console.log(err);
    });
    res.redirect("/admin");

});
app.post("/admin/PendingBlogsOpen", function (req, res) {
    const id = req.body.openBtn;
    PendingPost.find({
        _id: id
    }, function (err, posts) {
        if (!err) {
            const post = posts[0];
            res.render("open_pending_blog", {
                post: post
            });
        }
    });
});
app.post("/admin/PostedBlogsOpen", function (req, res) {
    const id = req.body.openBtn;
    Post.find({
        _id: id
    }, function (err, posts) {
        if (!err) {
            const post = posts[0];
            console.log(297, post);
            res.render("open_posted_blog", {
                post: post
            });
        }
    });
});
app.post("/admin/PostedBlogsDelete", function (req, res) {
    const id = req.body.deleteBtn;
    Post.deleteOne({
        _id: id
    }, function (err) {
        if (!err) {
            console.log("deleted");
            res.redirect("/admin/PostedBlogs");
        } else console.log(err);
    });
});
app.post("/admin/UsersBan", function (req, res) {
    const id = req.body.banBtn;
    User.deleteOne({
        _id: id
    }, function (err) {
        if (!err) {
            console.log("deleted");
            res.redirect("/admin/Users");
        } else {
            console.log(err);
        }
    })
})
app.get("/category/:name", function (req, res) {
    const type = req.params.name;
    Post.find({
        tag: type
    }, function (err, posts) {
        if (!err) {
            let login, logout, admin, writepanel;
            if (loggedIn == "none") login = "block", logout = "none";
            else login = "none", logout = "block";
            if (loggedIn == adminid) admin = "block", writepanel = "none";
            else admin = "none", writepanel = "block";
            res.render("home", {
                posts: posts,
                type: type,
                current: date.setCur(),
                past: date.setPast(),
                login: login,
                logout: logout,
                admin: admin,
                writepanel: writepanel
            });
        }
    });

});
app.get("/archive/:key", function (req, res) {
    const key = req.params.key;
    console.log(211, key);
    Post.find({
        time: new RegExp(key)
    }, function (err, posts) {
        if (!err) {
            console.log(218, posts);
            let login, logout, admin, writepanel;
            if (loggedIn == "none") login = "block", logout = "none";
            else login = "none", logout = "block";
            if (loggedIn == adminid) admin = "block", writepanel = "none";
            else admin = "none", writepanel = "block";
            res.render("home", {
                posts: posts,
                current: date.setCur(),
                past: date.setPast(),
                login: login,
                logout: logout,
                admin: admin,
                writepanel: writepanel
            });
        } else {
            console.log("archive not found!! ", err);
        }
    });
});
app.get("/register", function (req, res) {
    res.render("register", {
        alertInvalidEmail: "none",
        alertUsedEmail: "none",
        alertShortPassword: "none",
        alertUnmatchedPassword: "none",
        alertSuccessfullResgistration: "none"
    });

});
app.post("/register", function (req, res) {
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;
    const password2 = req.body.password2;
    let alertInvalidEmail = "none";
    let alertUsedEmail = "none";
    let alertShortPassword = "none";
    let alertUnmatchedPassword = "none";
    let alertSuccessfullResgistration = "none";
    let ok = true;
    async function validate() {
        if (!validator.isEmail(email)) alertInvalidEmail = "block", ok = false;
        if (password.length < 5) alertShortPassword = "block", ok = false;
        if (password != password2) alertUnmatchedPassword = "block", ok = false;
        await User.find({
            email: email
        }, function (err, users) {
            if (err) console.log(err);
            else {
                if (users.length > 0) alertUsedEmail = "block", ok = false;
            }
        });
        if (ok) {
            const creation = await User.create({
                name: name,
                email: email,
                password: password
            });
            alertSuccessfullResgistration = "block";
        }
        await res.render("register", {
            alertInvalidEmail: alertInvalidEmail,
            alertUsedEmail: alertUsedEmail,
            alertShortPassword: alertShortPassword,
            alertUnmatchedPassword: alertUnmatchedPassword,
            alertSuccessfullResgistration: alertSuccessfullResgistration
        });
    }
    validate();
});



let port = process.env.PORT;
if (port == null || port == "") {
    port = 80;
}
app.listen(port, function () {
    console.log("server started successfully");
});
