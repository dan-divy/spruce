$(".like-button-box").on("click",likeById);
$(".post").dblclick(likeById);

function likeById() {
	console.log(this.id)
	var author = $(`#${this.id}`).attr("author");
	$.ajax({
        method: 'POST',
        url: '/api/v1/like',
        data: {
        	"_id":this.id,
					"author":author
         	 }
    })
    .done(function(data){
			if(data.event) {
					show_notification(data.msg,'success');
					$(`#${this.id}`)[0].disabled = true;
			}
			else {
				show_notification(data.msg,'danger')
			}

    })
    .fail(function(data){
      show_notification('Some error while liking the feed','danger')
      console.log(data)
    });


}
