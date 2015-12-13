var crypt = require('crypto');

function init(db_cnn) {
    var userSchema = new db_cnn.Schema({
        name: {
            type: String,
            require: true,
            unique: true
        },
        avatar: {
            type: String,
            default:'unknown'
        },
        email:{
            type: String,
            default:''
        },
        status: {
            type: String,
            default: 'user'
        },
        hash: {
            type: String,
            require: true
        },
        salt: {
            type: String,
            require: true
        },
        created: {
            type: Date,
            default: Date.now(),
            require: true
        },
        iteration: {
            type: Number,
            require: true
        }
    });

    userSchema.virtual('password').set(function(data) {
        this.salt = String(Math.random());
        this.iteration = parseInt(Math.random() * 10 + 1);
        this.hash = this.getHash(data);
    }).get(function () {
        return this.hash;
    });

    userSchema.methods.getHash = function (password) {
        var c = crypt.createHmac('sha1', this.salt);
        for (var i = 0; i < this.iteration; i++) {
            c = c.update(password);
        }
        return c.digest('hex');
    };

    userSchema.methods.checkPassword = function(data) {
        return this.getHash(data) === this.hash;
    };

    
    //userSchema.index({ created: 1 }, { expireAfterSeconds : 86400 });
    
    return db_cnn.model('User', userSchema);
};

exports.init = init;