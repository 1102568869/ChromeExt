initGame({
    feedback: '赞助洗澡狂魔',
    feedbackFunc: function () {
        //  window.open('http://blog.washmore.tech');
        notice();
    },
    parent: document.querySelector('#screen')
});

$('#stop').click(function () {

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
