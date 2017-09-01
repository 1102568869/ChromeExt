$i = 0;
$('#start').click(function () {
    $i++;
    if ($i >= 6) {
        $('#start').hide();
        $('#stop').show();
    }
})
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
        $("#wx_toggle").text("只存一元");
    } else {
        $("#wx_pay").attr("src", "images/wxone.png");
        $("#wx_toggle").text("其他金额");
    }
    event.stopPropagation();
});
$("#wx_pay").click(function (event) {
    event.stopPropagation();
});
function notice() {
    $("#notice").show();
    // clearId = setTimeout(function () {
    //     $("#notice").fadeOut(500);
    // }, 2000);
}