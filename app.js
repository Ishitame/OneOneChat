const express=require('express')
require('dotenv').config();
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const db=require('./config/mongooseConfig')
const userModel = require('./models/userModel');

const app=express();

app.set('view engine','ejs')

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/auth/google/callback'
},
    function (accessToken, refreshToken, profile, done) {
        // Here you can save the user profile to your database
        return done(null, profile);
    })
);

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

app.get('/',(req,res)=>{
    res.render('login')
})

app.get('/auth/google',
    passport.authenticate('google', { scope: [ 'profile', 'email' ] })
);

app.get('/auth/google/callback',
passport.authenticate('google', { failureRedirect: '/' }),
    async (req, res) => {

        const email = req.user.emails[ 0 ].value;

        const user = await userModel.findOne({ email: email });

        if (!user) {

            const newUser = new userModel({
                googleId: req.user.id,
                email: email,
                name: req.user.displayName,
                image: req.user.photos[ 0 ].value
            });

            await newUser.save();
            req.user = newUser;

        }


        res.redirect('/chat');
    }
);

app.get('/chat',async (req,res)=>{

    if (!req.user) {
        return res.redirect('/');
    }

    const loggedInUser = await userModel.findOne({ email: req.user.emails[ 0 ].value });

    const online = await userModel.find({
        socketId: {
            $ne: null
        },
        _id: {
            $ne: loggedInUser._id
        }
    })



    res.render('chat2', {
        user: loggedInUser,
        online
    });
})



const server = require('http').createServer(app);
const io = require('socket.io')(server);
io.on('connection', socket => {
    console.log(socket.id)

    console.log('User connected');

    socket.on('join', async userId => {

        await userModel.findOneAndUpdate({
            _id: userId
        }, {
            socketId: socket.id
        })
        
        socket.broadcast.emit('userUpdated', { userId, socketId: socket.id });

    })
    socket.on("chatMessage",messageObject => {
        io
        .to(messageObject.receiverId)
        .emit('chatMessage', messageObject);
    });

    socket.on('typing', (data) => {
        // Broadcast typing status to the receiver
        socket.to(data.receiverId).emit('typing', { senderName: data.senderName });
    });

    socket.on('stopTyping', (data) => {
        // Broadcast stopTyping event to the receiver
        socket.to(data.receiverId).emit('stopTyping');
    });

      socket.on('disconnect', async () => {

        await userModel.findOneAndUpdate({
            socketId: socket.id
        }, {
            socketId: null
        })

    })

});
server.listen(3000);
