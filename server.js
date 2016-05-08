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
var mongodbUri = 'mongodb://bot:cC7fAu8S@ds032319.mlab.com:32319/my-bot-db';

mongoose.connect(mongodbUri, options);
var conn = mongoose.connection;
conn.on('error', console.error.bind(console, 'connection error:'));

//支出額のスキーマを宣言
var OutgoSchema = new mongoose.Schema({
    date: { type: Date, default: Date.now },
    price: Number,
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
    .matches('[0-9]+',function (session,response) {
        session.userData.price = session.message.text.replace(/^[0-9]/g,"");
        session.beginDialog("/registration");
    })
    .onDefault(function (session) {
        session.send("ごめんなさい。何をいってるのかわかりません。");
    }));
// session.message.text
bot.add('/registration',[
    function(session){
        builder.Prompts.choice(session,"このまま登録する?", "はい|いいえ");
    },
    function(session,result){
        if(result.response.entity == "はい"){
            session.beginDialog("/choice_category");
        }else{
            session.send("わかりました。では終了します。");
        }
    }
]);
bot.add('/choice_category',[
    function(session){
        builder.Prompts.choice(session,"何のお金?", "服|交際費|食費|雑費");
    },
    function(session, results){
        session.send("じゃあ"+ results.response.entity +"として"+session.userData.price+"円で、登録するね");
        session.endDialog();
    }
]);


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
