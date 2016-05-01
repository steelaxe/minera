var restify = require('restify');
var builder = require('botbuilder');
var mongoose = require('mongoose');
var moment = require('moment');

// ************************************************

// Get secrets from server environment
var botConnectorOptions = {
    appId: process.env.BOTFRAMEWORK_APPID,
    appSecret: process.env.BOTFRAMEWORK_APPSECRET
};

// ************************************************

// MongoLabの設定
var options = {
    server: {
        socketOptions: {
            keepAlive: 300000,
            connectTimeoutMS: 30000
        }
    },
    replset: {
        socketOptions: {
            keepAlive: 300000,
            connectTimeoutMS: 30000
        }
    }
};
var mongodbUri = 'mongodb://okajax:avmomo92@ds032319.mlab.com:32319/my-bot-db';

mongoose.connect(mongodbUri, options);
var conn = mongoose.connection;
conn.on('error', console.error.bind(console, 'connection error:'));

//支出額のスキーマを宣言
var OutgoSchema = new mongoose.Schema({
    date: { type: Date, default: Date.now },
    amount: Number,
    category: String
});
//スキーマからモデルを生成。
mongoose.model('Outgo', OutgoSchema);

// ************************************************

// Dialog
var dialog = new builder.CommandDialog();

// Create bot
var bot = new builder.BotConnectorBot(botConnectorOptions);
//bot.add('/', function (session) {
//    //respond with user's message
//    session.send("You said " + session.message.text);
//});

bot.add('/', new builder.CommandDialog()
    .matches('\d+', function (session) {
        session.send("このまま登録する?\nはい? いいえ?");

        // MongoLabにデータを保存
//        var Outgo = mongoose.model('Outgo');
//        var data = new Outgo();
//            data.date = moment().toDate();
//        data.amount = 777;
//        data.save(function (err) {
//            if (err) {
//                console.log(err);
//            }
//        });
    })
    .onDefault(function (session) {
        session.send("まずは挨拶しろよ、ぼけ");
    }));


// Setup Restify Server
// Restifyをセットアップ。Restifyってなんだ・・・？
var server = restify.createServer();


// Handle Bot Framework messages
// Bot用のエンドポイントだよーん
server.post('/api/messages', bot.verifyBotFramework(), bot.listen());

// Serve a static web page
// Webブラウザでアクセスされた時には、静的HTMLを表示させる
server.get(/.*/, restify.serveStatic({
    'directory': '.',
    'default': 'index.html'
}));

// サーバ起動やねん
server.listen(process.env.port || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});
