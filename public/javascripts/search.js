function updateList(query) {
  $.ajax({
        method: 'GET',
        url: '/api/v1/search',
        data: {
          q:query
           }
    })
    .done(function(data){
        //show_notification('','success');
        console.log(data);
        $("#user-list").text('');
        for (var i = 0; i < data.length; i++) {
          $("#user-list").append(`<li class="list-group-item">
             <img src="${data[i].profile_pic}" class="logo">
             <b><a href="/u/${data[i].username}" id="list-username">${data[i].username}</a></b>
          </li>`)
        }


    })
    .fail(function(data){
      show_notification('Oops! Some error out there.','danger')
    });
}
