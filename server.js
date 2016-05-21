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
var mongodbUri = 'mongodb://bot:cC7fAu8S@ds055905.mlab.com:55905/minera-db';

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
var Outgo = mongoose.model('Outgo');
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
    .matches('[0-9]+', "/registration")
    .matches('みせて|show',"/show_items")
    .onDefault(function (session) {
        session.send("ごめんなさい。何をいってるのかわかりません。");
    }));
// session.message.text
bot.add('/registration',[
    function(session){
        session.userData.price = session.message.text.replace(/[^0-9]/g,"");
        builder.Prompts.choice(session,"カテゴリーを登録する?", "はい|カテゴリーなしで登録");
    },
    function(session,results){

        if(results.response.entity == "はい"){

            // 質問をして、次の処理へ
            builder.Prompts.choice(session,"何のお金?", "服|交際費|食費|雑費");

        }else{
            var item = new Outgo();
            // 価格あり,カテゴリーなし で、DBに登録
            item.price = parseInt(session.userData.price);
            item.date = new Date();
            item.save();
            session.endDialog("カテゴリーなしで登録しました。");
        }

    },
    function(session,results){

        // 「何のお金?」の回答が返ってきた後

        //価格あり,カテゴリーあり で、DBに登録
        var item = new Outgo();
        item.price = parseInt(session.userData.price);
        item.category = results.response.entity;
        item.date = new Date();
        item.save();
        session.endDialog("では"+ results.response.entity +"として"+session.userData.price+"円で登録します");
    }
]);


//アイテム一覧を表示する
bot.add('/show_items',[
    function(session){
        builder.Prompts.choice(session,"期間を指定してください","直近1週間|直近1ヶ月|1年");
    },
    function(session,results){
        var date;
        var list = "";
        if(results.response.entity == "直近1週間"){
            date = moment().subtract('1','weeks').toDate();
        }else if(results.response.entity == "直近1ヶ月"){
            date = moment().subtract('1','months').toDate();
        }else{
            date = moment().subtract('1','years').toDate();
        }
        Outgo.find({date:{$gt:date}},function(err,docs){
            docs.forEach(function(doc){
                list += "日付:"+
                    moment(doc.date).format("YYYY/MM/DD(ddd)")+
                    " カテゴリー:"+
                    doc.category+
                    " 値段"+
                    doc.price+"\n\n";
            });
            session.endDialog("アイテム一覧です\n\n"+list);
        });
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
