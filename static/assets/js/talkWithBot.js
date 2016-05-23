var talkWithBot = (function () {

    // トークンの指定
    var directLineToken = "bmajOXKAU1E.cwA.Ugw.ZuGX7ovAxYp2Uly77Xw7_BoRBqrTZhiX7OXwZnU6pIg";

    return {

        // **************************************
        //
        // メンバ
        //
        // **************************************
        convId: null,
        watermark: null,
        messages: null,
        // **************************************
        //
        // メソッド
        //
        // **************************************

        // =================================================================
        // カンバセーションIDの作成
        // =================================================================
        makeConvId: function () {

            return $.ajax({
                method: "POST",
                contentType: "application/json",
                headers: {
                    Authorization: "Botconnector " + directLineToken
                },
                url: "https://directline.botframework.com/api/conversations"
            });

        },
        // =================================================================
        // メッセージを送信する (そのまま、メッセージの取得も行う)
        // =================================================================
        sendMessage: function (convId, msg) {

            console.log("SEND MESSAGE");

            console.log(convId, msg);

            // ajax通信。Promiseオブジェクトを返す。
            return $.ajax({
                method: "POST",
                contentType: "application/json",
                headers: {
                    Authorization: "Botconnector " + directLineToken
                },
                url: 'https://directline.botframework.com/api/conversations/' + convId + '/messages',
                data: JSON.stringify({
                    "text": msg
                })
            });

        },
        // =================================================================
        // メッセージの取得
        // =================================================================
        getMessage: function (convId, watermark) {

            console.log("GET MESSAGE");
            var url;

            // ウォーターマークが空か調べる
//            if (watermark) {
//                // 既に指定があれば、ウォーターマーク付きのURLでGETする。
//                url = 'https://directline.botframework.com/api/conversations/' + convId + '/messages?watermark=' + watermark;
//            } else {
//                // なければそのまま。ウォーターマークがなければ、全てのメッセージを取得する。
//                url = 'https://directline.botframework.com/api/conversations/' + convId + '/messages';
//            }

            // ひとまず全部入りで<3
            url = 'https://directline.botframework.com/api/conversations/' + convId + '/messages';

            // ajax通信。Promiseオブジェクトを返す。
            return $.ajax({
                method: "GET",
                contentType: "application/json",
                headers: {
                    Authorization: "Botconnector " + directLineToken
                },
                url: url,
                success: function (obj) {
                    // DOM操作
                    //$("#textarea").val(
                    //    JSON.stringify(obj.messages[0]) + JSON.stringify(obj.messages[1]));

                    // watermarkの更新
                    talkWithBot.watermark = obj.watermark;
                    $.cookie("watermark", obj.watermark);

                    // 会話を格納したオブジェクトを保存
                    talkWithBot.messages = obj;
                }
            });
        },
        // =================================================================
        // 初期動作 (カンバセーションIDを用意する・Cookieのチェック)
        // =================================================================
        init: function () {

                var d = $.Deferred();
                // CookieにカンバセーションIDがすでにあるか調べる
                if ( $.cookie("conversationId") ) {

                    // ある場合は、保存されているカンバセーションIDを使用する
                    talkWithBot.convId = $.cookie("conversationId");

                    // ウォーターマークも、保存されているものを使用
                    talkWithBot.watermark = $.cookie("watermark");

                    // DOM操作
                    $("#convId").text(talkWithBot.convId);

                } else {

                    // Cookieをリセット
                    $.removeCookie("conversationId");
                    $.removeCookie("watermark");

                    // カンバセーションIDを作成
                    talkWithBot.makeConvId()
                        .then(function (result) {

                            //作成できたら値を保存
                            talkWithBot.convId = result.conversationId;

                            // Cookieにも保存する(30分間が期限)
                            var date = new Date();
                            date.setTime(date.getTime() + (30 * 60 * 1000));
                            $.cookie("conversationId", talkWithBot.convId, {
                                expires: date
                            });

                            // DOM操作
                            $("#convId").text(talkWithBot.convId);

                        });

                }
                d.resolve();
                return d.promise();
            }

    };

})();
