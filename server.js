var restify = require('restify');
var builder = require('botbuilder');

// Get secrets from server environment
var botConnectorOptions = {
    appId: process.env.BOTFRAMEWORK_APPID,
    appSecret: process.env.BOTFRAMEWORK_APPSECRET
};

// Dialog
var dialog = new builder.CommandDialog();

// Create bot
var bot = new builder.BotConnectorBot(botConnectorOptions);

// シンプルな会話:Closure
//bot.add('/', function (session) {
//    //respond with user's message
//    session.send("You said " + session.message.text);
//});

// マッチした内容によって分岐する会話:CommandDialog
bot.add('/', new builder.CommandDialog()
    .matches('^こんにちは', function (session) {
        session.send("こんばんはでしょうがー！");
    })
    .onDefault(function (session) {
        session.send("まずは挨拶してね");
    }));


// Setup Restify Server
// Restifyをセットアップ。Restifyってなんだ・・・？
var server = restify.createServer();


// Handle Bot Framework messages
// /api/messages/が、Bot用のエンドポイントだよーん
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
