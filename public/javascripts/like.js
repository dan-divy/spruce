$(".like-button-box").on("click",likeById);

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
    	show_notification('Liked!','success')

    })
    .fail(function(data){
      show_notification('Some error while liking the feed','danger')
      console.log(data)
    });


}
