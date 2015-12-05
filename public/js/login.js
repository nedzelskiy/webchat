$("#avatars").slick();
var avatars = $("#avatars").find('img');
var avatarInput = $("input[name='avatar']");
avatars.click(function(){
    var _this = $(this);
    var name = _this.attr('src').split('/').pop().split('.').shift();
    if (name === avatarInput.val()) {
        _this.removeClass('choosen');
        avatarInput.val('unknown');
    } else {
        avatars.removeClass('choosen');
        _this.addClass('choosen');
        avatarInput.val(name);
    }    
});
