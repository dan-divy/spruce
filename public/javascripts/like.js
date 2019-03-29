function likeById(arg) {
	console.log(arg)
	$.ajax({
        method: 'POST',
        url: '/api/v1/like',
        data: {
        	"_id":arg
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