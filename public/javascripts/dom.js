$(document).on('click', '#sidebarToggle', function(){
        $('.row-offcanvas').toggleClass('active');
        $('#sidebar').toggleClass('hidden-xs');
        $('#sidebar').toggleClass('hidden-sm');
        $('#sidebar').toggleClass('hidden-md');
        $('#sidebar').toggleClass('hidden-lg');
        if($('.row-offcanvas').hasClass('active')){
            $('#main').removeClass('col-sm-9 col-lg-10');
            $('#main').addClass('col-sm-12 col-lg-12');
        }else{
            $('#main').removeClass('col-sm-12 col-lg-12');
            $('#main').addClass('col-sm-9 col-lg-10');
        }
    });

function show_notification(msg, type) {
        $('#notify_message').removeClass()
        $('#notify_message').addClass('notify_message-'+type)
        $('#notify_message').html('<center>'+msg+'</center>');
        $('#notify_message').slideDown(600).delay(3000).slideUp(600, function(){
                
        });
        
}
/** Incomplete pop-up image view feature [TODO]
function viewImage(id) {
    $("#modal_image_view")[0].src = $(`#${id}`)[0].src;
}
**/
