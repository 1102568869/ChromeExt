$('#help').click(function () {

    //window.top.location.href='http://blog.washmore.tech';
    notice();
    //$(this).hide();
})
var clearId = null;
$("#notice").click(function () {
    clearTimeout(clearId);
    clearId = setTimeout(function () {
        $("#notice").fadeOut(500);
    }, 2000);
});
$("#wx_toggle").click(function (event) {
    if ($("#wx_toggle").text() == "其他金额") {
        $("#wx_pay").attr("src", "images/wxpay.png");
        $("#wx_toggle").text("只续一元");
    } else {
        $("#wx_pay").attr("src", "images/wxone.png");
        $("#wx_toggle").text("其他金额");
    }
    clearTimeout(clearId);
    event.stopPropagation();
});
$("#wx_pay").click(function (event) {
    clearTimeout(clearId);
    event.stopPropagation();
});

function notice() {
    $("#notice").show();
    // clearId = setTimeout(function () {
    //     $("#notice").fadeOut(500);
    // }, 2000);
}

function formatDate(date, fmt) {
    var o = {
        "M+": date.getMonth() + 1,                 //月份
        "d+": date.getDate(),                    //日
        "h+": date.getHours(),                   //小时
        "m+": date.getMinutes(),                 //分
        "s+": date.getSeconds(),                 //秒
        "q+": Math.floor((date.getMonth() + 3) / 3), //季度
        "S": date.getMilliseconds()             //毫秒
    };
    if (/(y+)/.test(fmt)) {
        fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
    }
    for (var k in o) {
        if (new RegExp("(" + k + ")").test(fmt)) {
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
        }
    }
    return fmt;
}

$('#editor')
    .text(formatDate(new Date(), "yyyy年MM月dd日") + " 晴 今天出大太阳,工地上的砖头一如既往的烫手,还是没有人给我买雪糕,这个仇我先记下了!")
    .css({"height": 132, "overflow-y": "hidden"})
    .on('input', function () {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });
$("#save").click(function () {
    $("#editor").addClass("border-none");
    html2canvas($('#panel')[0]).then(function (canvas) {
        canvas.setAttribute('crossOrigin', 'anonymous');
        var data = canvas.toDataURL("image/png");
        $('#show').remove();
        $("#container").append('<img id="show" src="' + data + '"/>');
        $("#editor").removeClass("border-none");
    });
})
