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
function show_new_notification(obj, type) {
       // domReady
  $(function() {
    var notification = new NotificationFx({
							message : `<div class="ns-thumb"></div><div class="ns-content" style="border:1px solid #f2f2f2;border-radius:5px;"><p>${obj.msg}</p></div>`,
							layout : 'other',
							ttl : 8000,
							effect : 'thumbslider',
							type : type, // notice, warning, error or success
							onClose : function() {
								//bttn.disabled = false;
							}
						});

						// show the notification
						notification.show();
    });
    // create the notification
}
/** Incomplete pop-up image view feature [TODO]
function viewImage(id) {
    $("#modal_image_view")[0].src = $(`#${id}`)[0].src;
}
**/
