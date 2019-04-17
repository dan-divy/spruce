function follow(){
	$.ajax({
        method: 'POST',
        url: '/api/v1/follow',
        data: {
        	"_id":_id
         	 }
    })
    .done(function(data){
      show_notification('Following user!','success')
      setTimeout(()=> {window.location.reload()}, 1000)

    })
    .fail(function(data){
      console.log(data)  
    });
};