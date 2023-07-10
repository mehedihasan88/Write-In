const models = require("./models");
const mongoose = require("mongoose");

function getConnection() {
    mongoose.connect('mongodb+srv://write-in:write-in88@cluster0.vchqj.mongodb.net/blogDB', {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });
}

function createPendingPostModel() {
    const PendingPost = mongoose.model("PendingPost", models.postSchema);
    return PendingPost;
}

function createPostModel() {
    const Post = mongoose.model("Post", models.postSchema);
    return Post;
}

function createUserModel() {
    const User = mongoose.model("User", models.userSchema);
    return User;
}
module.exports = {
    getConnection,
    createPendingPostModel,
    createPostModel,
    createUserModel
}
