function follow(){
	$.ajax({
        method: 'POST',
        url: '/api/v1/follow',
        data: {
        	"_id":_id
         	 }
    })
    .done(function(data){
    	show_notification('Following','success')

    })
    .fail(function(data){
      console.log(data)  
    });
};